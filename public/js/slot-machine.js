document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const reelsContainer = document.querySelector('.reels-container');
  const spinBtn = document.querySelector('.spin-btn');
  const betAmountDisplay = document.querySelector('.bet-amount');
  const balanceDisplay = document.querySelector('.balance-amount');
  const resultDisplay = document.querySelector('.result-display');
  const increaseBetBtn = document.querySelector('.bet-increase');
  const decreaseBetBtn = document.querySelector('.bet-decrease');
  const maxBetBtn = document.querySelector('.bet-max');
  
  // Game State
  let balance = 0;
  let betAmount = 10;
  let isSpinning = false;
  const SYMBOLS = [
    { name: 'seven' }, 
    { name: 'bar' }, 
    { name: 'cherry' }, 
    { name: 'bell' }, 
    { name: 'diamond' }, 
    { name: 'horseshoe' }
  ];
  
  // Initialize game
  initGame();
  
  // Event Listeners
  spinBtn.addEventListener('click', spin);
  increaseBetBtn.addEventListener('click', () => adjustBet(10));
  decreaseBetBtn.addEventListener('click', () => adjustBet(-10));
  maxBetBtn.addEventListener('click', setMaxBet);
  
  // Initialize the game
  function initGame() {
    // Fetch user data
    fetch('/api/user', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          balance = data.user.balance;
          updateBalanceDisplay();
          updateBetDisplay();
          createReels();
        } else {
          window.location.href = '/login';
        }
      })
      .catch(error => {
        console.error('Error fetching user data:', error);
      });
  }
  
  // Create 3D reel elements with multiple faces
  function createReels() {
    reelsContainer.innerHTML = '';

    for (let i = 0; i < 3; i++) {
      const reel = document.createElement('div');
      reel.className = 'reel';
      reel.dataset.reelIndex = i;
      reel.style.transformStyle = 'preserve-3d';
      reel.style.width = '120px';
      reel.style.height = '160px';
      reel.style.position = 'relative';
      reel.style.margin = '0 10px';

      // Create 6 faces (for 6 symbols)
      for (let j = 0; j < 6; j++) {
        const face = document.createElement('div');
        face.className = 'reel-face';
        face.style.position = 'absolute';
        face.style.width = '100%';
        face.style.height = '100%';
        face.style.display = 'flex';
        face.style.justifyContent = 'center';
        face.style.alignItems = 'center';
        face.style.backfaceVisibility = 'hidden';
        face.style.borderRadius = '10px';
        face.style.background = 'rgba(0, 0, 0, 0.3)';
        face.style.transform = `rotateX(${j * 60}deg) translateZ(100px)`;

        const symbolImg = document.createElement('img');
        symbolImg.className = 'reel-symbol';
        symbolImg.src = `/images/symbols/${SYMBOLS[j].name}.png`;
        symbolImg.alt = SYMBOLS[j].name;
        symbolImg.style.maxWidth = '80%';
        symbolImg.style.maxHeight = '80%';

        face.appendChild(symbolImg);
        reel.appendChild(face);
      }

      reelsContainer.appendChild(reel);
    }
  }
  
  // Spin the reels
  async function spin() {
    if (isSpinning) return;
    
    if (balance < betAmount) {
      showResult('Insufficient balance!', false);
      return;
    }
    
    isSpinning = true;
    spinBtn.disabled = true;
    resultDisplay.textContent = '';
    resultDisplay.className = 'result-display';
    
    // Disable bet buttons during spin
    [increaseBetBtn, decreaseBetBtn, maxBetBtn].forEach(btn => {
      btn.disabled = true;
    });
    
    try {
      const response = await fetch('/api/slot/spin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ betAmount })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Animate reels with 3D rotation
        await animateReels(data.result);
        
        // Update game state
        balance = data.newBalance;
        updateBalanceDisplay();
        
        // Handle results
        if (data.winnings > 0) {
          showResult(`You won ${data.winnings} credits!`, true);
          playWinAnimation();
        } else {
          showResult('No win this time. Try again!', false);
        }
      } else {
        showResult(data.message || 'Spin failed', false);
      }
    } catch (error) {
      console.error('Error:', error);
      showResult('Connection error', false);
    } finally {
      isSpinning = false;
      spinBtn.disabled = false;
      
      // Re-enable bet buttons
      [increaseBetBtn, decreaseBetBtn, maxBetBtn].forEach(btn => {
        btn.disabled = false;
      });
    }
  }
  
  // Animate reels with 3D rotation
  async function animateReels(finalSymbols) {
    const reels = document.querySelectorAll('.reel');
    const spinDuration = 2000; // 2 seconds
    const frames = 60; // FPS
    const totalFrames = (spinDuration / 1000) * frames;
    
    const animations = Array.from(reels).map((reel, index) => {
      return new Promise((resolve) => {
        let frame = 0;
        const startRotation = 0;
        const endRotation = 1080 + (index * 120); // 3 full rotations + stagger

        const animate = () => {
          frame++;
          const progress = frame / totalFrames;
          const easeProgress = easeOutCubic(progress);
          const rotation = startRotation + (endRotation * easeProgress);
          
          reel.style.transform = `rotateX(${rotation}deg)`;

          if (frame < totalFrames) {
            requestAnimationFrame(animate);
          } else {
            // Snap to final symbol
            const symbolIndex = SYMBOLS.findIndex(s => s.name === finalSymbols[index]);
            const finalRotation = 360 - (symbolIndex * 60);
            reel.style.transform = `rotateX(${finalRotation}deg)`;
            resolve();
          }
        };

        animate();
      });
    });

    await Promise.all(animations);
  }

  // Easing function for smooth animation
  function easeOutCubic(t) {
    return (--t) * t * t + 1;
  }
  
  // Show spin result
  function showResult(message, isWin) {
    resultDisplay.textContent = message;
    if (isWin) {
      resultDisplay.classList.add('win-animation');
    }
  }
  
  // Play win animation
  function playWinAnimation() {
    const reels = document.querySelectorAll('.reel');
    reels.forEach(reel => {
      reel.style.animation = 'none';
      void reel.offsetWidth; // Trigger reflow
      reel.style.animation = 'winPulse 0.5s 3';
    });
  }
  
  // Adjust bet amount
  function adjustBet(amount) {
    const newBet = betAmount + amount;
    if (newBet >= 10 && newBet <= balance) {
      betAmount = newBet;
      updateBetDisplay();
    }
  }
  
  // Set bet to maximum
  function setMaxBet() {
    betAmount = Math.min(100, balance);
    updateBetDisplay();
  }
  
  // Update displays
  function updateBetDisplay() {
    betAmountDisplay.textContent = betAmount;
  }
  
  function updateBalanceDisplay() {
    balanceDisplay.textContent = balance;
  }
});