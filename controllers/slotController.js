const User = require('../models/User');
const Jackpot = require('../models/Jackpot');

// Symbol definitions with multipliers and types
const SYMBOLS = [
  { name: 'seven', type: 'normal', multiplier: 100 },
  { name: 'bar', type: 'normal', multiplier: 20 },
  { name: 'bell', type: 'normal', multiplier: 10 },
  { name: 'diamond', type: 'normal', multiplier: 5 },
  { name: 'horseshoe', type: 'normal', multiplier: 3 },
  { name: 'cherry', type: 'normal', multiplier: 2 },
  { name: 'wild', type: 'wild', multiplier: 0 },
  { name: 'scatter', type: 'scatter', multiplier: 0 }
];

// Reel strips for each reel (classic slot style)
const REEL_STRIPS = [
  ['seven','bar','cherry','bell','diamond','horseshoe','wild','scatter','bar','cherry','bell','diamond','horseshoe','wild','scatter'],
  ['bar','cherry','seven','bell','diamond','horseshoe','wild','scatter','bar','cherry','bell','diamond','horseshoe','wild','scatter'],
  ['cherry','bar','bell','seven','diamond','horseshoe','wild','scatter','bar','cherry','bell','diamond','horseshoe','wild','scatter']
];

// 10 paylines (add more as needed)
const PAYLINES = [
  [ [0,0], [0,1], [0,2] ], // 1: Top row
  [ [1,0], [1,1], [1,2] ], // 2: Middle row
  [ [2,0], [2,1], [2,2] ], // 3: Bottom row
  [ [0,0], [1,1], [2,2] ], // 4: Diagonal TL-BR
  [ [2,0], [1,1], [0,2] ], // 5: Diagonal BL-TR
  [ [0,0], [0,1], [1,2] ], // 6: V shape top left
  [ [2,0], [2,1], [1,2] ], // 7: V shape bottom left
  [ [1,0], [0,1], [1,2] ], // 8: Up arrow
  [ [1,0], [2,1], [1,2] ], // 9: Down arrow
  [ [0,0], [1,1], [0,2] ]  // 10: Zigzag top
];

// Spin using reel strips
function spinReels() {
  const grid = [[],[],[]];
  for (let col = 0; col < 3; col++) {
    const strip = REEL_STRIPS[col];
    const stop = Math.floor(Math.random() * strip.length);
    for (let row = 0; row < 3; row++) {
      grid[row][col] = strip[(stop + row) % strip.length];
    }
  }
  return grid;
}

// Check paylines for wins (left to right, wilds substitute)
function checkPaylines(grid, betPerLine, activePaylines) {
  let totalWin = 0;
  let jackpotWin = false;
  let paylineResults = [];

  for (let i = 0; i < activePaylines.length; i++) {
    const paylineIdx = activePaylines[i];
    const payline = PAYLINES[paylineIdx];
    let symbols = payline.map(([r, c]) => grid[r][c]);
    let matchSymbol = null;
    let matchCount = 0;
    let wildCount = 0;

    // Find first non-wild, non-scatter symbol as base
    for (const sym of symbols) {
      if (sym !== 'wild' && sym !== 'scatter') {
        matchSymbol = sym;
        break;
      }
    }
    if (!matchSymbol) continue;

    // Count matches (wilds substitute)
    for (const sym of symbols) {
      if (sym === matchSymbol || sym === 'wild') {
        matchCount++;
        if (sym === 'wild') wildCount++;
      } else break;
    }

    // Payout for 2+ matches
    if (matchCount >= 2) {
      const symbolObj = SYMBOLS.find(s => s.name === matchSymbol);
      let payout = betPerLine * (symbolObj ? symbolObj.multiplier : 0) * (matchCount - 1);
      // Wild multiplier: 2x for each wild in the win
      if (wildCount > 0) payout *= Math.pow(2, wildCount);
      totalWin += payout;
      paylineResults.push({ payline: paylineIdx + 1, symbol: matchSymbol, count: matchCount, payout });

      // Progressive jackpot: 3x seven on payline 1 (top row, no wilds)
      if (paylineIdx === 0 && matchSymbol === 'seven' && matchCount === 3 && wildCount === 0) {
        jackpotWin = true;
      }
    }
  }
  return { totalWin, paylineResults, jackpotWin };
}

// Count scatters anywhere
function countScatters(grid) {
  return grid.flat().filter(sym => sym === 'scatter').length;
}

// Main spin endpoint
exports.spin = async (req, res) => {
  try {
    let { betPerLine, paylines } = req.body;
    betPerLine = Math.max(1, Math.min(100, betPerLine || 1));
    paylines = Array.isArray(paylines) && paylines.length ? paylines : Array.from({length: PAYLINES.length}, (_, i) => i);
    paylines = paylines.filter(i => i >= 0 && i < PAYLINES.length);

    const user = req.user;
    const totalBet = betPerLine * paylines.length;

    // Check balance
    if (user.balance < totalBet && user.freeSpins <= 0) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Deduct bet (unless free spin)
    let usingFreeSpin = user.freeSpins > 0;
    if (!usingFreeSpin) user.balance -= totalBet;
    else user.freeSpins--;

    // Jackpot contribution
    const jackpot = await Jackpot.getCurrent();
    const contribution = Math.floor(totalBet * (jackpot.contributionRate || 0.01));
    jackpot.currentAmount += contribution;

    // Spin reels
    const grid = spinReels();

    // Check paylines
    const { totalWin, paylineResults, jackpotWin } = checkPaylines(grid, betPerLine, paylines);

    let bonusRound = false;
    let bonusData = null;

    // Handle scatters and trigger bonus
    const scatterCount = countScatters(grid);
    let scatterWin = 0, freeSpinsAwarded = 0;
    if (scatterCount >= 3) {
      scatterWin = totalBet * 5;
      freeSpinsAwarded = 5;
      user.freeSpins += freeSpinsAwarded;
      // Trigger bonus round
      bonusRound = true;
      // Example: 3 cards, one is a big win, others are small wins
      bonusData = [
        { label: "Big Win", amount: totalBet * 20 },
        { label: "Medium Win", amount: totalBet * 10 },
        { label: "Small Win", amount: totalBet * 5 }
      ];
      // Shuffle bonusData for fairness
      bonusData = bonusData.sort(() => Math.random() - 0.5);
    }

    // Add winnings
    user.balance += totalWin + scatterWin;

    // Handle jackpot
    let jackpotAmount = 0;
    if (jackpotWin) {
      jackpotAmount = jackpot.currentAmount;
      user.balance += jackpotAmount;
      jackpot.currentAmount = 10000;
      jackpot.lastWinner = user._id;
      jackpot.lastWinAmount = jackpotAmount;
      jackpot.lastWinDate = new Date();
      user.jackpotsWon = (user.jackpotsWon || 0) + 1;
    }

    // Award experience for each spin (e.g., 10 XP per spin)
    const XP_PER_SPIN = 10;
    user.experience += XP_PER_SPIN;

    // Level up logic: e.g., 100 XP per level
    const XP_PER_LEVEL = 100;
    while (user.experience >= XP_PER_LEVEL) {
      user.experience -= XP_PER_LEVEL;
      user.level += 1;
    }

    // Count a win if any payline pays out or scatterWin > 0 or jackpotWin
    if ((totalWin > 0 || scatterWin > 0) && !jackpotWin) {
      user.totalWins = (user.totalWins || 0) + 1;
    }
    if (jackpotWin) {
      user.jackpotsWon = (user.jackpotsWon || 0) + 1;
      user.totalWins = (user.totalWins || 0) + 1; // Optionally count jackpot as a win too
    }

    await jackpot.save();
    await user.save();

    res.json({
      success: true,
      grid,
      paylineResults,
      scatterCount,
      scatterWin,
      freeSpinsAwarded,
      jackpotWin,
      jackpotAmount,
      newBalance: user.balance,
      freeSpins: user.freeSpins,
      level: user.level,
      experience: user.experience
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Bonus claim endpoint
exports.claimBonus = async (req, res) => {
  try {
    const { pickIndex, betPerLine, paylines } = req.body;
    const user = req.user;
    const totalBet = betPerLine * paylines.length;

    // Define the same bonusData as above
    let bonusData = [
      { label: "Big Win", amount: totalBet * 20 },
      { label: "Medium Win", amount: totalBet * 10 },
      { label: "Small Win", amount: totalBet * 5 }
    ];
    bonusData = bonusData.sort(() => Math.random() - 0.5);

    const picked = bonusData[pickIndex];
    user.balance += picked.amount;
    await user.save();

    res.json({
      success: true,
      bonusResult: picked,
      newBalance: user.balance
    });
  } catch (err) {
    res.status(500).json({ error: 'Bonus claim failed' });
  }
};

// RTP Simulation
async function simulateRTP(spins = 1000000, betPerLine = 10, paylines = Array.from({length: PAYLINES.length}, (_, i) => i)) {
  let totalBet = 0;
  let totalPayout = 0;
  let jackpotHits = 0;
  let jackpotAmount = 10000;
  let jackpotPool = jackpotAmount;
  let jackpotContributionRate = 0.01;

  for (let i = 0; i < spins; i++) {
    const bet = betPerLine * paylines.length;
    totalBet += bet;
    jackpotPool += Math.floor(bet * jackpotContributionRate);

    const grid = spinReels();
    const { totalWin, jackpotWin } = checkPaylines(grid, betPerLine, paylines);

    let scatterCount = countScatters(grid);
    let scatterWin = 0;
    if (scatterCount >= 3) {
      scatterWin = bet * 5;
    }

    let payout = totalWin + scatterWin;

    if (jackpotWin) {
      payout += jackpotPool;
      jackpotHits++;
      jackpotPool = jackpotAmount;
    }

    totalPayout += payout;
  }

  console.log(`Simulated Spins: ${spins}`);
  console.log(`Total Bet: ${totalBet}`);
  console.log(`Total Payout: ${totalPayout}`);
  console.log(`RTP: ${(totalPayout / totalBet * 100).toFixed(2)}%`);
  console.log(`Jackpot Hits: ${jackpotHits}`);
}

simulateRTP();