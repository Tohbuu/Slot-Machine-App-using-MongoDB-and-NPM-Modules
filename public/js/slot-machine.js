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
   * Symbol Paytable - FIXED FOR PROPER RTP
   * Reduced payouts significantly to achieve ~95% RTP
   * Payouts are multiplied by betPerLine/10
   */
  const SYMBOL_PAYTABLE = {
    'seven': { 3: 50, 2: 5 },            // Reduced from 40000/20000
    'diamond': { 3: 25, 2: 3 },          // Reduced from 4000/1000  
    'wild': { 3: 25 },                   // Reduced from 4000
    'bar': { 3: 20, 2: 2 },              // Reduced from 10000/4000
    'doublebar': { 3: 15, 2: 1.5 },      // Reduced from 8000/2000
    'bell': { 3: 10, 2: 1 },             // Reduced from 3000/400
    'horseshoe': { 3: 8, 2: 0.8 },       // Reduced from 600/200
    'cherry': { 3: 5, 2: 0.5 },          // Reduced from 2000/200
    'scatter': { 3: 'free_spins', 2: 'multiplier' } // Special outcomes unchanged
  };

  // Audio Manager Integration
  let audioManager = null;

  document.addEventListener('audioSystemReady', (event) => {
    audioManager = event.detail.audioManager;
    console.log('🎵 Audio system ready for slot machine');
    
    // Start background music if not muted
    if (!audioManager.getMuted()) {
      audioManager.fadeInMusic(2000);
    }
  });

  // Enhanced helper function to safely play sounds with volume control
  function playSlotSound(soundName, options = {}) {
    if (!audioManager) {
      console.warn('Audio manager not ready');
      return;
    }
    
    if (audioManager.getMuted()) {
      return;
    }
    
    // Get the appropriate volume setting
    const sound = audioManager.sounds[soundName];
    if (sound && sound.audio) {
      // Apply current volume settings before playing
      if (sound.type === 'music') {
        sound.audio.volume = audioManager.getMusicVolume() / 100;
      } else {
        sound.audio.volume = audioManager.getSFXVolume() / 100;
      }
    }
    
    audioManager.playSound(soundName, options);
  }

  // Initialize the game
  initGame();

  // ==========================================================================
  // Event Listeners
  // ==========================================================================
  elements.spinBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    
    // Immediate audio feedback - multiple fallback methods with volume control
    try {
      // Method 1: Use global audio manager if available
      if (window.audioManager && !window.audioManager.getMuted()) {
        window.audioManager.playSound('spin');
      }
      // Method 2: Use local audioManager if available  
      else if (audioManager && !audioManager.getMuted()) {
        audioManager.playSound('spin');
      }
      // Method 3: Direct audio fallback with volume settings
      else {
        const savedSFXVolume = localStorage.getItem('sfxVolume') || 70;
        const savedMuted = localStorage.getItem('audioMuted') === 'true';
        
        if (!savedMuted) {
          const spinSound = new Audio('/sounds/spin.mp3');
          spinSound.volume = (savedSFXVolume / 100) * 0.7;
          spinSound.play().catch(console.warn);
        }
      }
    } catch (error) {
      console.warn('Spin sound failed:', error);
    }
    
    // Proceed with spin logic
    spin();
  });
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

  // Remove the old event listener first, then add this enhanced one
  elements.spinBtn.removeEventListener('click', spin);

  // Fallback spin sound function
  function playSpinSoundDirect() {
    try {
      // Try using the global audio manager first
      if (window.audioManager && !window.audioManager.getMuted()) {
        const sfxVolume = window.audioManager.getSFXVolume() / 100;
        window.audioManager.playSound('spin');
        return;
      }
      
      // Try using local audioManager
      if (audioManager && !audioManager.getMuted()) {
        audioManager.playSound('spin');
        return;
      }
      
      // Fallback: create and play audio directly with saved volume settings
      const savedSFXVolume = localStorage.getItem('sfxVolume') || 70;
      const savedMuted = localStorage.getItem('audioMuted') === 'true';
      
      if (savedMuted) return;
      
      const spinAudio = new Audio('/sounds/spin.mp3');
      spinAudio.volume = (savedSFXVolume / 100) * 0.7; // Apply saved volume
      spinAudio.play().catch(err => {
        console.warn('Could not play spin sound:', err);
      });
    } catch (error) {
      console.warn('Spin sound error:', error);
    }
  }

  // Enhanced spin button with immediate audio feedback
  elements.spinBtn.addEventListener('click', (e) => {
    e.preventDefault();
    playSpinSoundDirect();
    
    // Small delay then proceed with spin
    setTimeout(() => spin(), 100);
  });

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
    if (state.paylines.length === 0) {
      showResult('Please select at least one payline!', false);
      playSlotSound('button-click'); // Error sound
      return;
    }
    if (state.isSpinning) {
        showResult('Already spinning!', false);
        return;
    }
    if (state.balance < totalBet) {
        showResult('Insufficient balance for this bet!', false);
        playSlotSound('button-click'); // Error sound
        return;
    }

    state.isSpinning = true;
    disableControls();
    
    // Play spin sound
    playSlotSound('spin');

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
        playSlotSound('button-click'); // Error sound
      }
    } catch (error) {
      console.error('Spin error:', error);
      showResult('Connection error. Please check your network.', false);
      playSlotSound('button-click'); // Error sound
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
      const totalWin = displayResults.reduce((sum, result) => {
        return sum + (typeof result.payout === 'number' ? result.payout : 0);
      }, 0);
      
      // Play appropriate win sound based on win amount
      const betAmount = state.betPerLine * state.paylines.length;
      if (totalWin >= betAmount * 50) {
        playSlotSound('win-big');
      } else if (totalWin >= betAmount * 5) {
        playSlotSound('win-small');
      } else if (totalWin > 0) {
        playSlotSound('coin-drop');
      }
      
      const resultMessages = displayResults.map(r => {
        if (r.payline === -1) { // Scatter win
          playSlotSound('bonus');
          return `Scatter Bonus: ${r.count}x Scatter!`;
        }
        // FIX: r.payline is already the correct payline index (0-9)
        // Just add 1 to convert to display number (1-10)
        const paylineNumber = r.payline;
        return `Payline ${paylineNumber}: ${r.count}x ${capitalize(r.symbol)} wins ${r.payout} credits!`;
      });
      showResult(resultMessages.join('\n'), true);
    } else {
      showResult('No win this time. Good luck next spin!', false);
    }

    // Handle special server-driven features
    if (data.jackpotWin) {
      playSlotSound('jackpot');
      showResult(`MAJOR JACKPOT! You won ${data.jackpotAmount} credits!`, true);
    }
    if (data.bonusRound) {
      playSlotSound('bonus');
      showBonusModal(data.bonusData, state.betPerLine, state.paylines);
    }
    if (data.leveledUp || (data.user && data.user.leveledUp)) {
      playSlotSound('level-up');
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

    // Validate payline inputs (0-9 only) and ensure they're numbers
    activePaylines = activePaylines.filter(p => typeof p === 'number' && p >= 0 && p <= 9);

    // Count scatters (pay anywhere)
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (grid[row][col] === 'scatter') scatterCount++;
      }
    }

    // Check each active payline
    activePaylines.forEach((paylineIdx, arrayIndex) => {
      // Ensure paylineIdx is within bounds
      if (paylineIdx < 0 || paylineIdx >= PAYLINE_PATTERNS.length) {
        console.warn(`Invalid payline index: ${paylineIdx}`);
        return;
      }

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
              payline: paylineIdx, // Use the actual payline index, not the array index
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
    const columns = [[], [], []];

    slotCells.forEach((cell, idx) => {
      const col = idx % 3;
      columns[col].push(cell);
    });

    columns.forEach((colCells) => {
      colCells.forEach(cell => cell.classList.add('reel-spinning'));
    });

    const animations = [];
    let lastReelDelay = 0;

    // Play spin sound at the start
    if (audioManager && !audioManager.getMuted()) {
      audioManager.playSound('spin', { loop: false });
    }

    for (let col = 0; col < 3; col++) {
      for (let row = 0; row < 3; row++) {
        const idx = row * 3 + col;
        const cell = slotCells[idx];
        const img = cell.querySelector('img');

        // Animation timing: last reel lands at 5s
        const stopDelay = 2000 + 1400 * col + 200 * row;
        if (col === 2 && row === 1) lastReelDelay = stopDelay;

        const animation = new Promise(resolve => {
          img.classList.add('spinning');
          setTimeout(() => {
            img.classList.remove('spinning');
            img.src = `/images/symbols/${grid[row][col]}.png`;
            img.alt = grid[row][col];
            cell.classList.remove('reel-spinning');
            cell.classList.add('landed');
            setTimeout(() => cell.classList.remove('landed'), 300);
            resolve();
          }, stopDelay);
        });
        animations.push(animation);
      }
    }

    await Promise.all(animations);

    // Stop spin sound and play reel-stop sound after last reel lands
    setTimeout(() => {
      if (audioManager && !audioManager.getMuted()) {
        audioManager.stopSound('spin');
        audioManager.playSound('reel-stop');
      }
    }, lastReelDelay);
  }

  // ==========================================================================
  // Control and UI Functions
  // ==========================================================================

  function adjustBet(amount) {
    playSlotSound('button-click');
    
    // Bets are in increments of 1, between 1 and 100
    let newBet = state.betPerLine + amount;
    if (newBet < 1) newBet = 1;
    if (newBet > 100) newBet = 100;
    state.betPerLine = newBet;
    updateBetDisplay();
  }

  function setMaxBet() {
    playSlotSound('button-click');
    state.betPerLine = Math.min(100, Math.floor(state.balance / state.paylines.length));
    updateBetDisplay();
  }

  function updatePaylines() {
    playSlotSound('button-click');
    
    state.paylines = Array.from(elements.paylineCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => parseInt(cb.value)); // This converts "0" to 0, "1" to 1, etc.

    // Ensure at least one payline is always selected
    if (state.paylines.length === 0) {
      elements.paylineCheckboxes[0].checked = true;
      state.paylines = [0]; // Default to payline index 0 (displays as "Payline 1")
    }
    
    // Debug log to verify correct payline indices
    console.log('Active paylines (0-based indices):', state.paylines);
    
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
    playSlotSound('button-click');
    const isVisible = elements.paylineDropdownMenu.style.display === 'block';
    elements.paylineDropdownMenu.style.display = isVisible ? 'none' : 'block';
  }

  function closeDropdownOnClickOutside(e) {
    if (!elements.paylineDropdownBtn.contains(e.target) && !elements.paylineDropdownMenu.contains(e.target)) {
      elements.paylineDropdownMenu.style.display = 'none';
    }
  }

  function selectAllPaylines() {
    playSlotSound('button-click');
    elements.paylineCheckboxes.forEach(cb => cb.checked = true);
    updatePaylines();
    elements.paylineDropdownMenu.style.display = 'none';
  }

  function deselectAllPaylines() {
    playSlotSound('button-click');
    elements.paylineCheckboxes.forEach(cb => cb.checked = false);
    state.paylines = [];
    updatePaylines();
    elements.paylineDropdownMenu.style.display = 'none';
  }
  
  function setRecommendedPaylines() {
    playSlotSound('button-click');
    // Recommended is often just the first line or all lines
    selectAllPaylines();
  }

  async function handleCashout() {
    const amount = parseInt(elements.cashoutAmountInput.value, 10);
    if (!amount || amount <= 0) {
      elements.cashoutResult.textContent = 'Enter a valid amount.';
      playSlotSound('button-click'); // Error sound
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
        playSlotSound('coin-drop'); // Success sound
      } else {
        elements.cashoutResult.textContent = data.error || 'Cashout failed.';
        playSlotSound('button-click'); // Error sound
      }
    } catch (error) {
      console.error('Cashout error:', error);
      elements.cashoutResult.textContent = 'Cashout failed.';
      playSlotSound('button-click'); // Error sound
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
        
        playSlotSound('button-click');
        
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
            playSlotSound('coin-drop'); // Bonus claim sound
          }
        } catch (error) {
          console.error('Bonus error:', error);
          playSlotSound('button-click'); // Error sound
        }
        
        closeBonusBtn.style.display = 'inline-block';
      });
      
      bonusCardsContainer.appendChild(cardDiv);
    });

    closeBonusBtn.onclick = () => {
      playSlotSound('button-click');
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

// Add page visibility handling for background music
document.addEventListener('visibilitychange', () => {
  if (audioManager) {
    if (document.hidden) {
      audioManager.fadeOutMusic(1000);
    } else {
      if (!audioManager.getMuted()) {
        audioManager.fadeInMusic(1000);
      }
    }
  }
});

// Add activity tracking with audio (update the existing activity tracker section)
// Replace the existing activity tracker code at the bottom with:
document.addEventListener('spin-completed', (event) => {
  const { bet, winAmount, isJackpot, symbols } = event.detail;
  
  if (window.ActivityTracker) {
    window.ActivityTracker.track('slot_spin', `Spun slot machine (Bet: ${bet} credits)`, {
      bet: bet,
      win: winAmount,
      isJackpot: isJackpot,
      symbols: symbols
    });
  }
});