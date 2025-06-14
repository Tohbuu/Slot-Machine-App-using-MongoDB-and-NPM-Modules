const User = require('../models/User');
const Jackpot = require('../models/Jackpot');
const jwt = require('jsonwebtoken');

// Symbols and their multipliers
const SYMBOLS = [
  { name: 'seven', multiplier: 10 },
  { name: 'bar', multiplier: 8 },
  { name: 'bell', multiplier: 6 },
  { name: 'diamond', multiplier: 5 },
  { name: 'horseshoe', multiplier: 4 },
  { name: 'cherry', multiplier: 3 }
];

// Check for bonus rounds
const checkBonus = (reels) => {
  // Bonus if two sevens appear
  const sevenCount = reels.filter(symbol => symbol === 'seven').length;
  if (sevenCount >= 2) {
    return { type: 'free_spins', amount: 3 };
  }
  
  // Other bonus conditions can be added here
  return null;
};

// Calculate winnings
const calculateWinnings = (reels, betAmount) => {
  let multiplier = 0;
  
  // All three symbols match
  if (reels[0] === reels[1] && reels[1] === reels[2]) {
    const symbol = SYMBOLS.find(s => s.name === reels[0]);
    multiplier = symbol ? symbol.multiplier : 0;
  } 
  // At least one cherry
  else if (reels.some(symbol => symbol === 'cherry')) {
    multiplier = 1;
  }
  
  return betAmount * multiplier;
};

// Check for jackpot win (0.1% chance)
const checkJackpot = async (userId, betAmount) => {
  if (Math.random() < 0.001) { // 0.1% chance
    const jackpot = await Jackpot.getCurrent();
    const winAmount = jackpot.currentAmount;
    
    // Update user balance
    await User.findByIdAndUpdate(userId, {
      $inc: { balance: winAmount, jackpotsWon: 1 },
      $push: { achievements: { name: 'Jackpot Winner', date: new Date() } }
    });
    
    // Reset jackpot
    jackpot.currentAmount = 10000;
    jackpot.lastWinner = userId;
    jackpot.lastWinAmount = winAmount;
    jackpot.lastWinDate = new Date();
    await jackpot.save();
    
    return winAmount;
  }
  return 0;
};

// Main spin function
exports.spin = async (req, res) => {
  try {
    const { betAmount } = req.body;
    const user = req.user;
    
    // Check balance
    if (user.balance < betAmount && user.freeSpins <= 0) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // Deduct bet amount (unless free spin)
    let usingFreeSpin = user.freeSpins > 0;
    if (!usingFreeSpin) {
      user.balance -= betAmount;
      
      // Add to jackpot
      const jackpot = await Jackpot.getCurrent();
      const contribution = betAmount * jackpot.contributionRate;
      jackpot.currentAmount += contribution;
      await jackpot.save();
    } else {
      user.freeSpins -= 1;
    }
    
    // Generate random result
    const result = [
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].name,
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].name,
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].name
    ];
    
    // Calculate winnings
    const winnings = calculateWinnings(result, betAmount);
    user.balance += winnings;
    
    // Check for jackpot
    const jackpotWin = await checkJackpot(user._id, betAmount);
    
    // Check for bonus
    const bonus = checkBonus(result);
    if (bonus && bonus.type === 'free_spins') {
      user.freeSpins += bonus.amount;
    }
    
    // Add experience
    user.experience += 10;
    
    // Check for level up
    if (user.experience >= 100) {
      user.level += 1;
      user.experience = 0;
    }
    
    // Update total wins
    if (winnings > 0 || jackpotWin > 0) {
      user.totalWins += (winnings + jackpotWin);
    }
    
    await user.save();
    
    res.json({
      success: true,
      result,
      winnings,
      jackpotWin,
      bonus,
      newBalance: user.balance,
      freeSpins: user.freeSpins,
      level: user.level,
      experience: user.experience,
      usingFreeSpin
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get jackpot info
exports.getJackpot = async (req, res) => {
  try {
    const jackpot = await Jackpot.getCurrent();
    res.json({ success: true, jackpot });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const topPlayers = await User.find()
      .sort({ totalWins: -1 })
      .limit(10)
      .select('username profilePicture totalWins jackpotsWon level');
      
    res.json({ success: true, topPlayers });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};