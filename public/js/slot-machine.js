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
  const paylineCheckboxes = document.querySelectorAll('.payline-checkbox');

  // Game State
  let balance = 0;
  let betPerLine = 10;
  let isSpinning = false;
  let paylines = [0, 1, 2, 3, 4]; // All 5 by default
  const SYMBOLS = [
    { name: 'seven' }, 
    { name: 'bar' }, 
    { name: 'cherry' }, 
    { name: 'bell' }, 
    { name: 'diamond' }, 
    { name: 'horseshoe' },
    { name: 'wild' },
    { name: 'scatter' }
  ];

  // Initialize game
  initGame();

  // Event Listeners
  spinBtn.addEventListener('click', spin);
  increaseBetBtn.addEventListener('click', () => adjustBet(1));
  decreaseBetBtn.addEventListener('click', () => adjustBet(-1));
  maxBetBtn.addEventListener('click', setMaxBet);
  paylineCheckboxes.forEach(cb => cb.addEventListener('change', updatePaylines));

  // Bonus modal elements
  const bonusModal = document.getElementById('bonus-modal');
  const bonusCardsContainer = bonusModal.querySelector('.bonus-cards');
  const closeBonusBtn = bonusModal.querySelector('.close-bonus');

  function initGame() {
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

  function createReels() {
    reelsContainer.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const reel = document.createElement('div');
      reel.className = 'reel';
      reel.dataset.reelIndex = i;
      for (let j = 0; j < 3; j++) {
        const face = document.createElement('div');
        face.className = 'reel-face';
        const symbolImg = document.createElement('img');
        symbolImg.className = 'reel-symbol';
        symbolImg.src = `/images/symbols/cherry.png`;
        symbolImg.alt = 'cherry';
        face.appendChild(symbolImg);
        reel.appendChild(face);
      }
      reelsContainer.appendChild(reel);
    }
  }

  async function spin() {
    if (isSpinning) return;
    if (balance < betPerLine * paylines.length) {
      showResult('Insufficient balance!', false);
      return;
    }
    isSpinning = true;
    spinBtn.disabled = true;
    resultDisplay.textContent = '';
    resultDisplay.className = 'result-display';
    [increaseBetBtn, decreaseBetBtn, maxBetBtn].forEach(btn => btn.disabled = true);

    try {
      const response = await fetch('/api/slot/spin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ betPerLine, paylines })
      });
      const data = await response.json();

      if (data.success) {
        await animateReels(data.grid);
        balance = data.newBalance;
        updateBalanceDisplay();

        // Show payline results
        if (data.paylineResults && data.paylineResults.length > 0) {
          let msg = data.paylineResults.map(r =>
            `Payline ${r.payline}: ${r.count}x ${capitalize(r.symbol)} (${r.payout} credits)`
          ).join('\n');
          showResult(msg, true);
        } else {
          showResult('No win this time. Try again!', false);
        }

        // Show scatter/free spin/jackpot info
        if (data.scatterCount >= 3) {
          showResult(`Scatters: ${data.scatterCount} (+${data.scatterWin} credits, +${data.freeSpinsAwarded} free spins)`, true);
        }
        if (data.jackpotWin) {
          showResult(`JACKPOT! You won ${data.jackpotAmount} credits!`, true);
        }
        // Bonus round
        if (data.bonusRound && data.bonusData) {
          showBonusModal(data.bonusData, betPerLine, paylines);
        }
      } else {
        showResult(data.error || 'Spin failed', false);
      }
    } catch (error) {
      console.error('Error:', error);
      showResult('Connection error', false);
    } finally {
      isSpinning = false;
      spinBtn.disabled = false;
      [increaseBetBtn, decreaseBetBtn, maxBetBtn].forEach(btn => btn.disabled = false);
    }
  }

  // Animate reels to show the 3x3 grid result with classic spinning effect and card spin
  async function animateReels(grid) {
    const reels = document.querySelectorAll('.reel');
    const symbolNames = SYMBOLS.map(s => s.name);
    const spinTimes = [900, 1200, 1500]; // ms for each reel to spin

    // Start spinning all reels (show random symbols and spin cards)
    let intervals = [];
    for (let col = 0; col < 3; col++) {
      intervals[col] = setInterval(() => {
        for (let row = 0; row < 3; row++) {
          const face = reels[col].children[row];
          const img = face.querySelector('img');
          img.src = `/images/symbols/${symbolNames[Math.floor(Math.random() * symbolNames.length)]}.png`;
          face.classList.add('spinning'); // Add spinning class
          // Remove and re-add to restart animation
          face.offsetWidth; // force reflow
          face.classList.remove('spinning');
          void face.offsetWidth; // force reflow again
          face.classList.add('spinning');
        }
      }, 50);
    }

    // Stop each reel in sequence, revealing the final symbols
    for (let col = 0; col < 3; col++) {
      await new Promise(res => setTimeout(res, spinTimes[col]));
      clearInterval(intervals[col]);
      for (let row = 0; row < 3; row++) {
        const face = reels[col].children[row];
        const symbol = grid[row][col];
        const img = face.querySelector('img');
        img.src = `/images/symbols/${symbol}.png`;
        img.alt = symbol;
        face.classList.remove('spinning'); // Remove spinning class
      }
    }
  }

  function adjustBet(amount) {
    const newBet = betPerLine + amount;
    if (newBet >= 1 && newBet <= 100) {
      betPerLine = newBet;
      updateBetDisplay();
    }
  }

  function setMaxBet() {
    betPerLine = Math.min(100, Math.floor(balance / paylines.length));
    updateBetDisplay();
  }

  function updateBetDisplay() {
    betAmountDisplay.textContent = betPerLine;
  }

  function updateBalanceDisplay() {
    balanceDisplay.textContent = balance;
  }

  function updatePaylines() {
    paylines = Array.from(paylineCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => parseInt(cb.value));
    if (paylines.length === 0) {
      paylineCheckboxes[0].checked = true;
      paylines = [0];
    }
    setMaxBet();
  }

  function showResult(message, isWin) {
    resultDisplay.textContent = message;
    resultDisplay.className = 'result-display' + (isWin ? ' win-animation' : '');
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function showBonusModal(bonusData, betPerLine, paylines) {
    bonusModal.style.display = 'flex';
    bonusCardsContainer.innerHTML = '';
    closeBonusBtn.style.display = 'none';

    bonusData.forEach((card, idx) => {
      const cardDiv = document.createElement('div');
      cardDiv.className = 'bonus-card';
      cardDiv.textContent = '?';
      cardDiv.addEventListener('click', async function handlePick() {
        // Prevent multiple picks
        if (bonusCardsContainer.querySelector('.revealed')) return;
        // Reveal all cards
        bonusData.forEach((c, i) => {
          const cardEl = bonusCardsContainer.children[i];
          cardEl.textContent = `${c.label}\n+${c.amount} credits`;
          cardEl.classList.add('revealed');
          if (i === idx) cardEl.style.boxShadow = '0 0 40px #4caf50';
        });
        // Claim bonus from backend
        const res = await fetch('/api/slot/bonus', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ pickIndex: idx, betPerLine, paylines })
        });
        const result = await res.json();
        if (result.success) {
          balance = result.newBalance;
          updateBalanceDisplay();
          showResult(`Bonus: ${result.bonusResult.label} (+${result.bonusResult.amount} credits)`, true);
        }
        closeBonusBtn.style.display = 'inline-block';
      });
      bonusCardsContainer.appendChild(cardDiv);
    });

    closeBonusBtn.onclick = () => {
      bonusModal.style.display = 'none';
    };
  }
});