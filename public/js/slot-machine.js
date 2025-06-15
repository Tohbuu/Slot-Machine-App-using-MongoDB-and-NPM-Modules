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
    fetch('/api/users/me', {
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
        
        if (data.notification && data.notification.type === 'level-up') {
          showLevelUpNotification(data.notification);
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
  
  // Animate reels with requestAnimationFrame and dynamic image updates
  async function animateReels(finalSymbols) {
    const reels = document.querySelectorAll('.reel');
    const symbolCount = SYMBOLS.length;
    const spinDuration = 1200; // ms
    const extraSpins = 3; // Number of extra full spins before stopping

    // Helper to animate a single reel
    function animateReel(reel, finalSymbol, delay = 0) {
      return new Promise(resolve => {
        const symbolIndex = SYMBOLS.findIndex(s => s.name === finalSymbol);
        const faceAngle = 360 / SYMBOLS.length;
        const finalRotation = 0; // Always end at 0deg for upright
        const totalRotation = (3 * 360) + (symbolIndex * faceAngle); // Extra spins + offset to result
        const start = performance.now() + delay;
        let lastFrameSymbol = null;

        function frame(now) {
          const elapsed = Math.max(0, now - start);
          let t = Math.min(1, elapsed / 1200);
          const eased = (--t) * t * t + 1;
          const currentRotation = totalRotation - eased * totalRotation;

          reel.style.transform = `rotateX(${currentRotation}deg)`;

          // Calculate which symbol should be visible at this rotation
          const normalizedRotation = (currentRotation % 360 + 360) % 360;
          const visibleFace = Math.round(normalizedRotation / faceAngle) % SYMBOLS.length;
          if (lastFrameSymbol !== visibleFace) {
            updateReelFaceImage(reel, visibleFace);
            lastFrameSymbol = visibleFace;
          }

          if (elapsed < 1200) {
            requestAnimationFrame(frame);
          } else {
            // Snap to upright and update faces so the result is at the front
            reel.style.transform = `rotateX(0deg)`;
            updateReelFaces(reel, symbolIndex);
            resolve();
          }
        }
        requestAnimationFrame(frame);
      });
    }

    // Animate all reels in parallel (or stagger with delay if desired)
    await Promise.all(Array.from(reels).map((reel, i) =>
      animateReel(reel, finalSymbols[i], i * 120)
    ));
  }

  // Update all faces so the front face (0deg) is the result symbol
  function updateReelFaces(reel, resultIndex) {
    const faces = reel.querySelectorAll('.reel-face');
    const symbolCount = SYMBOLS.length;
    for (let j = 0; j < symbolCount; j++) {
      // The result symbol is at the front, the rest follow in order
      const symbolIdx = (resultIndex + j) % symbolCount;
      const symbol = SYMBOLS[symbolIdx];
      const img = faces[j].querySelector('img');
      img.src = `/images/symbols/${symbol.name}.png`;
      img.alt = symbol.name;
    }
  }

  // Update only the visible face's image for smoother animation
  function updateReelFaceImage(reel, visibleFaceIndex) {
    const faces = reel.querySelectorAll('.reel-face');
    const symbolCount = SYMBOLS.length;
    // For a spinning effect, cycle through symbols
    for (let j = 0; j < symbolCount; j++) {
      const symbolIdx = (visibleFaceIndex + j) % symbolCount;
      const symbol = SYMBOLS[symbolIdx];
      const img = faces[j].querySelector('img');
      img.src = `/images/symbols/${symbol.name}.png`;
      img.alt = symbol.name;
    }
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
  
  function showLevelUpNotification(notification) {
    // You can use a modal, or for demo, use alert:
    let msg = notification.message + '\n';
    notification.rewards.forEach(r => {
      msg += `Level ${r.level} Rewards:\n`;
      if (r.rewards.credits) msg += `+${r.rewards.credits * r.multiplier} Credits\n`;
      if (r.rewards.boosterPacks && r.rewards.boosterPacks.length > 0) {
        msg += `+${r.rewards.boosterPacks.map(bp => (bp.quantity * r.multiplier) + 'x Booster Pack').join(', ')}\n`;
      }
      if (r.rewards.unlocks && r.rewards.unlocks.length > 0) {
        msg += `Unlocks: ${r.rewards.unlocks.join(', ')}\n`;
      }
    });
    alert(msg);
  }
});