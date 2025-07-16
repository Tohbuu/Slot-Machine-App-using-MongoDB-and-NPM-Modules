document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // DOM Elements
  // ==========================================================================
  const elements = {
    spinBtn: document.querySelector('.spin-btn'),
    betAmountDisplay: document.querySelector('.bet-amount'),
    balanceDisplay: document.querySelector('.balance-amount'),
    resultDisplay: document.querySelector('.result-display'),
    increaseBetBtn: document.querySelector('.bet-increase'),
    decreaseBetBtn: document.querySelector('.bet-decrease'),
    maxBetBtn: document.querySelector('.bet-max'),
    paylineCheckboxes: document.querySelectorAll('.payline-checkbox'),
    bankBalanceDisplay: document.querySelector('.bank-balance'),
    cashoutAmountInput: document.querySelector('.cashout-amount'),
    cashoutBtn: document.querySelector('.cashout-btn'),
    cashoutResult: document.querySelector('.cashout-result'),
    paylineDropdownBtn: document.querySelector('.payline-dropdown-btn'),
    paylineDropdownMenu: document.querySelector('.payline-dropdown-menu'),
    paylineSelectAllBtn: document.querySelector('.payline-select-all'),
    paylineDeselectAllBtn: document.querySelector('.payline-deselect-all'),
    paylineRecommendedBtn: document.querySelector('.payline-recommended'),
    slotGrid: document.querySelector('.slot-grid')
  };

  // ==========================================================================
  // Game State
  // ==========================================================================
  const state = {
    balance: 0,
    betPerLine: 10, // Start with a bet of 10 (middle ground between both versions)
    isSpinning: false,
    paylines: [0] // Default to Payline 1 (index 0)
  };

  // ==========================================================================
  // Core Game Configuration
  // ==========================================================================

  /**
   * Payline Patterns (3x3 Grid)
   * Defines the 10 possible winning lines on the 3x3 grid.
   * Each payline is an array of [row, column] coordinates.
   * Combined the best patterns from both versions.
   */
  const PAYLINE_PATTERNS = [
    [[1, 0], [1, 1], [1, 2]], // Payline 1: Middle Horizontal
    [[0, 0], [0, 1], [0, 2]], // Payline 2: Top Horizontal
    [[2, 0], [2, 1], [2, 2]], // Payline 3: Bottom Horizontal
    [[0, 0], [1, 1], [2, 2]], // Payline 4: Diagonal Top-Left to Bottom-Right
    [[0, 2], [1, 1], [2, 0]], // Payline 5: Diagonal Top-Right to Bottom-Left
    [[0, 0], [1, 1], [0, 2]], // Payline 6: V-Shape
    [[2, 0], [1, 1], [2, 2]], // Payline 7: Inverse V-Shape
    [[0, 0], [1, 1], [0, 2], [1, 2]], // Payline 8: Top Zigzag (4 positions)
    [[2, 0], [1, 1], [2, 2], [1, 2]], // Payline 9: Bottom Zigzag (4 positions)
    [[0, 1], [1, 1], [2, 1]]  // Payline 10: Middle Vertical
  ];

  /**
   * Symbol Paytable
   * Payouts are multiplied by betPerLine/10 (from second version)
   * This provides more exciting win potential while maintaining balance
   */
  const SYMBOL_PAYTABLE = {
    'seven': { 3: 40000, 2: 20000 },     // Highest paying symbol
    'diamond': { 3: 4000, 2: 1000 },     // High value symbol
    'wild': { 3: 4000 },                 // Matches highest paying symbol
    'bar': { 3: 10000, 2: 4000 },        // Standard high symbol
    'doublebar': { 3: 8000, 2: 2000 },   // Standard mid-high symbol
    'bell': { 3: 3000, 2: 400 },         // Standard mid symbol
    'horseshoe': { 3: 600, 2: 200 },     // Standard low symbol
    'cherry': { 3: 2000, 2: 200 },       // Standard low symbol with good 3-match
    'scatter': { 3: 'free_spins', 2: 'multiplier' } // Special outcomes
  };

  // Initialize the game
  initGame();

  // ==========================================================================
  // Event Listeners
  // ==========================================================================
  elements.spinBtn.addEventListener('click', spin);
  elements.increaseBetBtn.addEventListener('click', () => adjustBet(1));
  elements.decreaseBetBtn.addEventListener('click', () => adjustBet(-1));
  elements.maxBetBtn.addEventListener('click', setMaxBet);
  elements.paylineCheckboxes.forEach(cb => cb.addEventListener('change', updatePaylines));

  if (elements.cashoutBtn) {
    elements.cashoutBtn.addEventListener('click', handleCashout);
  }

  if (elements.paylineDropdownBtn && elements.paylineDropdownMenu) {
    elements.paylineDropdownBtn.addEventListener('click', toggleDropdown);
    document.addEventListener('click', closeDropdownOnClickOutside);
    elements.paylineSelectAllBtn?.addEventListener('click', selectAllPaylines);
    elements.paylineDeselectAllBtn?.addEventListener('click', deselectAllPaylines);
    elements.paylineRecommendedBtn?.addEventListener('click', setRecommendedPaylines);
  }

  // ==========================================================================
  // Core Game Functions
  // ==========================================================================

  /**
   * Initializes the game state from the server.
   */
  async function initGame() {
    try {
      const response = await fetch('/api/users/me', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();

      if (data.success) {
        state.balance = data.user.balance;
        updateBalanceDisplay();
        updateBetDisplay();
        createReels();
        updateHeaderUserInfo();
        fetchBankBalance();
      } else {
        // Redirect to login if user data can't be fetched
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error initializing game:', error);
      elements.resultDisplay.textContent = "Error connecting to the game server.";
    }
  }

  /**
   * Creates the initial 3x3 grid structure in the DOM.
   */
  function createReels() {
    elements.slotGrid.innerHTML = '';
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const cell = document.createElement('div');
        cell.className = 'slot-cell';
        cell.dataset.row = row;
        cell.dataset.col = col;
        const img = document.createElement('img');
        // Start with a default symbol
        img.src = '/images/symbols/cherry.png';
        img.alt = 'cherry';
        cell.appendChild(img);
        elements.slotGrid.appendChild(cell);
      }
    }
  }

  /**
   * Main spin logic. Communicates with the server to get spin results.
   */
  async function spin() {
    const totalBet = state.betPerLine * state.paylines.length;
    if (state.isSpinning) {
        showResult('Already spinning!', false);
        return;
    }
    if (state.balance < totalBet) {
        showResult('Insufficient balance for this bet!', false);
        return;
    }

    state.isSpinning = true;
    disableControls();

    try {
      const response = await fetch('/api/slot/spin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          betPerLine: state.betPerLine,
          paylines: state.paylines
        })
      });
      const data = await response.json();

      if (data.success) {
        // Animate the reels to the result from the server
        await animateReels(data.grid);
        state.balance = data.newBalance;
        updateBalanceDisplay();
        // Process results locally for display purposes
        processSpinResults(data, data.grid);
      } else {
        showResult(data.error || 'Spin failed. Please try again.', false);
      }
    } catch (error) {
      console.error('Spin error:', error);
      showResult('Connection error. Please check your network.', false);
    } finally {
      state.isSpinning = false;
      enableControls();
    }
  }

  /**
   * Displays the results of the spin.
   * Uses the authoritative results from the server response.
   */
  function processSpinResults(data, grid) {
    // Calculate wins locally for immediate feedback (but use server results for display)
    const localResults = checkWinnings(grid, state.paylines, state.betPerLine);
    const displayResults = data.paylineResults || localResults.paylineResults;
    
    if (displayResults.length > 0) {
      const resultMessages = displayResults.map(r => {
        if (r.payline === -1) { // Scatter win
          return `Scatter Bonus: ${r.count}x Scatter!`;
        }
        // Convert 0-based index to 1-based display number for UI
        return `Payline ${r.payline + 1}: ${r.count}x ${capitalize(r.symbol)} wins ${r.payout} credits!`;
      });
      showResult(resultMessages.join('\n'), true);
    } else {
      showResult('No win this time. Good luck next spin!', false);
    }

    // Handle special server-driven features
    if (data.jackpotWin) {
      showResult(`MAJOR JACKPOT! You won ${data.jackpotAmount} credits!`, true);
    }
    if (data.bonusRound) {
      showBonusModal(data.bonusData, state.betPerLine, state.paylines);
    }
    if (data.leveledUp || (data.user && data.user.leveledUp)) {
      window.rewardNotification?.onLevelUp();
    }
  }

  /**
   * Win checking logic that matches what the server should be doing.
   * This provides immediate feedback while waiting for server response.
   */
  function checkWinnings(grid, activePaylines, betPerLine) {
    const results = [];
    let totalWin = 0;
    let scatterCount = 0;

    // Validate payline inputs (0-9 only)
    activePaylines = activePaylines.filter(p => p >= 0 && p <= 9);

    // Count scatters (pay anywhere)
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (grid[row][col] === 'scatter') scatterCount++;
      }
    }

    // Check each active payline
    activePaylines.forEach(paylineIdx => {
      const pattern = PAYLINE_PATTERNS[paylineIdx];
      const symbols = pattern.map(pos => grid[pos[0]][pos[1]]);
      
      // Check for left-aligned matches with wild substitution
      let count = 1;
      let currentSymbol = symbols[0];
      
      // Initial wild substitution (skip if scatter)
      if (currentSymbol === 'wild') {
        currentSymbol = symbols.find(s => !['wild','scatter'].includes(s)) || 'wild';
      }
      if (currentSymbol === 'scatter') return;

      // Check consecutive symbols left-aligned
      for (let i = 1; i < symbols.length; i++) {
        let symbol = symbols[i];
        
        // Handle wild substitution
        if (symbol === 'wild') {
          symbol = currentSymbol; // Wild acts as current symbol
        } else if (symbol === 'scatter') {
          break; // Scatter breaks the payline
        }

        if (symbol === currentSymbol) {
          count++;
        } else {
          break; // Stop at first non-matching symbol
        }
      }

      // Check if we have a valid win
      if (count >= 2 && SYMBOL_PAYTABLE[currentSymbol]) {
        const payouts = SYMBOL_PAYTABLE[currentSymbol];
        const payoutKey = count >= 3 ? 3 : 2;
        
        if (payouts[payoutKey]) {
          const winAmount = Math.floor(payouts[payoutKey] * (betPerLine / 10));
          if (winAmount > 0) {
            results.push({
              payline: paylineIdx,
              symbol: currentSymbol,
              count: count,
              payout: winAmount
            });
            totalWin += winAmount;
          }
        }
      }
    });

    // Process scatter wins (minimum 2 scatters)
    if (scatterCount >= 2) {
      results.push({
        payline: -1,
        symbol: 'scatter',
        count: scatterCount,
        payout: scatterCount >= 3 ? 'free_spins' : 'multiplier'
      });
    }

    return {
      totalWin,
      paylineResults: results,
      scatterCount
    };
  }

  /**
   * Animates the reels stopping at the final grid positions.
   */
  async function animateReels(grid) {
    const slotCells = document.querySelectorAll('.slot-cell');
    const animations = [];

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const idx = row * 3 + col;
        const cell = slotCells[idx];
        const img = cell.querySelector('img');

        const animation = new Promise(resolve => {
          // Add a spinning class for blur/animation effect
          img.classList.add('spinning');

          // Stagger the stop time for each reel
          setTimeout(() => {
            img.classList.remove('spinning');
            img.src = `/images/symbols/${grid[row][col]}.png`;
            img.alt = grid[row][col];
            // Add a small bounce effect on land
            cell.classList.add('landed');
            setTimeout(() => cell.classList.remove('landed'), 300);
            resolve();
          }, 100 + 80 * col + 40 * row); // Reels stop with staggered timing
        });
        animations.push(animation);
      }
    }
    await Promise.all(animations);
  }

  // ==========================================================================
  // Control and UI Functions
  // ==========================================================================

  function adjustBet(amount) {
    // Bets are in increments of 1, between 1 and 100
    let newBet = state.betPerLine + amount;
    if (newBet < 1) newBet = 1;
    if (newBet > 100) newBet = 100;
    state.betPerLine = newBet;
    updateBetDisplay();
  }

  function setMaxBet() {
    state.betPerLine = Math.min(100, Math.floor(state.balance / state.paylines.length));
    updateBetDisplay();
  }

  function updatePaylines() {
    state.paylines = Array.from(elements.paylineCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => parseInt(cb.value));

    // Ensure at least one payline is always selected
    if (state.paylines.length === 0) {
      elements.paylineCheckboxes[0].checked = true;
      state.paylines = [0];
    }
    // Update total bet display when paylines change
    updateBetDisplay();
  }
  
  function updateBalanceDisplay() {
    elements.balanceDisplay.textContent = state.balance;
  }

  function updateBetDisplay() {
    elements.betAmountDisplay.textContent = state.betPerLine;
    // Also update total bet
    const totalBet = state.betPerLine * state.paylines.length;
    elements.spinBtn.textContent = `SPIN (${totalBet} total)`;
  }

  function showResult(message, isWin) {
    elements.resultDisplay.textContent = message;
    elements.resultDisplay.className = 'result-display'; // Reset class
    void elements.resultDisplay.offsetWidth; // Trigger reflow
    elements.resultDisplay.className = 'result-display' + (isWin ? ' win-animation' : '');
  }
  
  function disableControls() {
    elements.spinBtn.disabled = true;
    elements.increaseBetBtn.disabled = true;
    elements.decreaseBetBtn.disabled = true;
    elements.maxBetBtn.disabled = true;
    elements.paylineDropdownBtn.disabled = true;
  }

  function enableControls() {
    elements.spinBtn.disabled = false;
    elements.increaseBetBtn.disabled = false;
    elements.decreaseBetBtn.disabled = false;
    elements.maxBetBtn.disabled = false;
    elements.paylineDropdownBtn.disabled = false;
  }

  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function toggleDropdown(e) {
    e.stopPropagation();
    const isVisible = elements.paylineDropdownMenu.style.display === 'block';
    elements.paylineDropdownMenu.style.display = isVisible ? 'none' : 'block';
  }

  function closeDropdownOnClickOutside(e) {
    if (!elements.paylineDropdownBtn.contains(e.target) && !elements.paylineDropdownMenu.contains(e.target)) {
      elements.paylineDropdownMenu.style.display = 'none';
    }
  }

  function selectAllPaylines() {
    elements.paylineCheckboxes.forEach(cb => cb.checked = true);
    updatePaylines();
    elements.paylineDropdownMenu.style.display = 'none';
  }

  function deselectAllPaylines() {
    elements.paylineCheckboxes.forEach(cb => cb.checked = false);
    // Keep at least one selected
    elements.paylineCheckboxes[0].checked = true;
    updatePaylines();
    elements.paylineDropdownMenu.style.display = 'none';
  }
  
  function setRecommendedPaylines() {
    // Recommended is often just the first line or all lines
    selectAllPaylines();
  }

  async function handleCashout() {
    const amount = parseInt(elements.cashoutAmountInput.value, 10);
    if (!amount || amount <= 0) {
      elements.cashoutResult.textContent = 'Enter a valid amount.';
      return;
    }

    try {
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
        state.balance = data.newBalance;
        updateBalanceDisplay();
        document.querySelector('.bank-amount').textContent = data.bankBalance;
        elements.bankBalanceDisplay.textContent = data.bankBalance;
        elements.cashoutResult.textContent = `Cashed out ${amount} credits to bank!`;
      } else {
        elements.cashoutResult.textContent = data.error || 'Cashout failed.';
      }
    } catch (error) {
      console.error('Cashout error:', error);
      elements.cashoutResult.textContent = 'Cashout failed.';
    }
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
        if (bonusCardsContainer.querySelector('.revealed')) return;
        
        // Reveal all cards
        bonusData.forEach((c, i) => {
          const cardEl = bonusCardsContainer.children[i];
          cardEl.textContent = `${c.label}\n+${c.amount} credits`;
          cardEl.classList.add('revealed');
          if (i === idx) cardEl.style.boxShadow = '0 0 40px #4caf50';
        });

        // Claim bonus
        try {
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
            state.balance = result.newBalance;
            updateBalanceDisplay();
            showResult(`Bonus: ${result.bonusResult.label} (+${result.bonusResult.amount} credits)`, true);
          }
        } catch (error) {
          console.error('Bonus error:', error);
        }
        
        closeBonusBtn.style.display = 'inline-block';
      });
      
      bonusCardsContainer.appendChild(cardDiv);
    });

    closeBonusBtn.onclick = () => {
      bonusModal.style.display = 'none';
    };
  }

  async function updateHeaderUserInfo() {
    try {
      const response = await fetch('/api/users/me', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      
      if (data.success) {
        document.querySelector('.balance-amount').textContent = data.user.balance;
        document.querySelector('.bank-amount').textContent = data.user.bankBalance || 0;
        const avatar = document.querySelector('.user-avatar');
        if (avatar) {
          avatar.src = `/images/avatars/${data.user.profilePicture || 'default.png'}`;
        }
        elements.bankBalanceDisplay.textContent = data.user.bankBalance || 0;
      }
    } catch (error) {
      console.error('Error updating user info:', error);
    }
  }

  async function fetchBankBalance() {
    try {
      const res = await fetch('/api/users/bank', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      
      if (data.success) {
        elements.bankBalanceDisplay.textContent = data.bankBalance;
        document.querySelector('.bank-amount').textContent = data.bankBalance;
      }
    } catch (error) {
      console.error('Error fetching bank balance:', error);
    }
  }
});

// Add this after successful spin
if (window.ActivityTracker) {
  window.ActivityTracker.track('slot_spin', `Spun slot machine (Bet: ${bet} credits)`, {
    bet: bet,
    win: winAmount,
    isJackpot: isJackpot,
    symbols: symbols
  });
}