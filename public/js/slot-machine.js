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
  const bankBalanceDisplay = document.querySelector('.bank-balance');
  const cashoutAmountInput = document.querySelector('.cashout-amount');
  const cashoutBtn = document.querySelector('.cashout-btn');
  const cashoutResult = document.querySelector('.cashout-result');

  // Payline dropdown
  const paylineDropdownBtn = document.querySelector('.payline-dropdown-btn');
  const paylineDropdownMenu = document.querySelector('.payline-dropdown-menu');
  const paylineSelectAllBtn = document.querySelector('.payline-select-all');
  const paylineDeselectAllBtn = document.querySelector('.payline-deselect-all');
  const paylineRecommendedBtn = document.querySelector('.payline-recommended');

  // Game State
  let balance = 0;
  let betPerLine = 10;
  let isSpinning = false;
  let paylines = [0, 1, 2, 3, 4]; // Default selected paylines

  // --- Initialization ---
  initGame();

  // --- Event Listeners ---
  spinBtn.addEventListener('click', spin);
  increaseBetBtn.addEventListener('click', () => adjustBet(1));
  decreaseBetBtn.addEventListener('click', () => adjustBet(-1));
  maxBetBtn.addEventListener('click', setMaxBet);
  paylineCheckboxes.forEach(cb => cb.addEventListener('change', updatePaylines));

  if (cashoutBtn) {
    cashoutBtn.addEventListener('click', async () => {
      const amount = parseInt(cashoutAmountInput.value, 10);
      if (!amount || amount <= 0) {
        cashoutResult.textContent = 'Enter a valid amount.';
        return;
      }
      const res = await fetch('/api/users/cashout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      if (data.success) {
        balance = data.newBalance;
        updateBalanceDisplay();
        bankBalanceDisplay.textContent = data.bankBalance;
        // Also update header
        const headerBank = document.querySelector('.bank-amount');
        if (headerBank) headerBank.textContent = data.bankBalance;
        cashoutResult.textContent = `Cashed out ${amount} credits to bank!`;
      } else {
        cashoutResult.textContent = data.error || 'Cashout failed.';
      }
    });
  }

  // --- Payline Dropdown Logic ---
  if (paylineDropdownBtn && paylineDropdownMenu) {
    paylineDropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      paylineDropdownMenu.style.display = paylineDropdownMenu.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', (e) => {
      if (!paylineDropdownBtn.contains(e.target) && !paylineDropdownMenu.contains(e.target)) {
        paylineDropdownMenu.style.display = 'none';
      }
    });

    if (paylineSelectAllBtn) {
      paylineSelectAllBtn.addEventListener('click', () => {
        paylineCheckboxes.forEach(cb => cb.checked = true);
        updatePaylines();
        paylineDropdownMenu.style.display = 'none';
      });
    }

    if (paylineDeselectAllBtn) {
      paylineDeselectAllBtn.addEventListener('click', () => {
        paylineCheckboxes.forEach(cb => cb.checked = false);
        paylineCheckboxes[0].checked = true;
        updatePaylines();
        paylineDropdownMenu.style.display = 'none';
      });
    }

    if (paylineRecommendedBtn) {
      paylineRecommendedBtn.addEventListener('click', () => {
        paylineCheckboxes.forEach((cb, idx) => cb.checked = (idx === 0));
        updatePaylines();
        paylineDropdownMenu.style.display = 'none';
      });
    }
  }

  // --- Functions ---

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
          updateHeaderUserInfo();
          fetchBankBalance();
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

        // Look for level-up indicators in your API response
        // This might be result.leveledUp, result.newLevel, or similar
        
        console.log('🎰 Spin result:', data); // Debug the full response
        
        // Check if user leveled up (adjust based on your API response structure)
        if (data.leveledUp || (data.user && data.user.leveledUp)) {
          console.log('🎰 User leveled up in slot machine!');
          
          // Show rewards notification
          if (window.rewardNotification) {
            window.rewardNotification.onLevelUp();
          } else {
            console.error('🎰 RewardNotification not available!');
          }
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

  async function animateReels(grid) {
    const reels = document.querySelectorAll('.reel');
    const symbolNames = [
      'seven', 'bar', 'cherry', 'bell', 'diamond', 'horseshoe', 'wild', 'scatter'
    ];
    const spinTimes = [900, 1200, 1500];

    let intervals = [];
    for (let col = 0; col < 3; col++) {
      intervals[col] = setInterval(() => {
        for (let row = 0; row < 3; row++) {
          const face = reels[col].children[row];
          const img = face.querySelector('img');
          img.src = `/images/symbols/${symbolNames[Math.floor(Math.random() * symbolNames.length)]}.png`;
          face.classList.add('spinning');
          face.offsetWidth;
          face.classList.remove('spinning');
        }
      }, 50);
    }

    for (let col = 0; col < 3; col++) {
      await new Promise(res => setTimeout(res, spinTimes[col]));
      clearInterval(intervals[col]);
      for (let row = 0; row < 3; row++) {
        const face = reels[col].children[row];
        const symbol = grid[row][col];
        const img = face.querySelector('img');
        img.src = `/images/symbols/${symbol}.png`;
        img.alt = symbol;
        face.classList.remove('spinning');
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
    const bonusModal = document.getElementById('bonus-modal');
    const bonusCardsContainer = bonusModal.querySelector('.bonus-cards');
    const closeBonusBtn = bonusModal.querySelector('.close-bonus');

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

  function updateHeaderUserInfo() {
    fetch('/api/users/me', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          document.querySelector('.balance-amount').textContent = data.user.balance;
          document.querySelector('.bank-amount').textContent = data.user.bankBalance || 0;
          const avatar = document.querySelector('.user-avatar');
          if (avatar) {
            avatar.src = `/images/avatars/${data.user.profilePicture || 'default.png'}`;
          }
          // Also update the bank section if present
          const bankBalanceDisplay = document.querySelector('.bank-balance');
          if (bankBalanceDisplay) bankBalanceDisplay.textContent = data.user.bankBalance || 0;
        }
      });
  }

  async function fetchBankBalance() {
    const res = await fetch('/api/users/bank', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    if (data.success) {
      const bankBalanceDisplay = document.querySelector('.bank-balance');
      if (bankBalanceDisplay) bankBalanceDisplay.textContent = data.bankBalance;
      const headerBank = document.querySelector('.bank-amount');
      if (headerBank) headerBank.textContent = data.bankBalance;
    }
  }
});