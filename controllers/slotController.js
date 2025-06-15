const User = require('../models/User');
const Jackpot = require('../models/Jackpot');
const jwt = require('jsonwebtoken');
const Reward = require('../models/Reward');

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

    let leveledUp = false;
    let levelUpRewards = [];
    let notification = null;

    // Check for level up (support multiple levels at once)
    while (user.experience >= 100) {
      user.level += 1;
      user.experience -= 100;
      leveledUp = true;

      // Grant level-up rewards
      const rewardsForLevel = await Reward.findOne({ level: user.level });
      if (rewardsForLevel && !user.claimedRewards.includes(rewardsForLevel._id)) {
        // Booster effect: double rewards if user has an active booster
        let multiplier = 1;
        if (user.activeBoosters && user.activeBoosters.length > 0) {
          // Example: double credits, double booster packs, etc.
          multiplier = 2;
        }

        // Apply credits
        if (rewardsForLevel.rewards.credits) {
          user.balance += rewardsForLevel.rewards.credits * multiplier;
        }

        // Apply booster packs
        if (rewardsForLevel.rewards.boosterPacks && rewardsForLevel.rewards.boosterPacks.length > 0) {
          rewardsForLevel.rewards.boosterPacks.forEach(pack => {
            for (let i = 0; i < (pack.quantity * multiplier); i++) {
              user.activeBoosters.push({
                pack: pack.pack,
                effects: {}, // You can populate effects if needed
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
              });
            }
          });
        }

        // Apply unlocks
        if (rewardsForLevel.rewards.unlocks && rewardsForLevel.rewards.unlocks.length > 0) {
          if (!user.unlocks) user.unlocks = [];
          user.unlocks.push(...rewardsForLevel.rewards.unlocks);
        }

        // Mark reward as claimed
        user.claimedRewards.push(rewardsForLevel._id);

        // Collect for notification
        levelUpRewards.push({
          level: user.level,
          rewards: rewardsForLevel.rewards,
          multiplier
        });
      }
    }
    
    await user.save();

    if (leveledUp && levelUpRewards.length > 0) {
      notification = {
        type: 'level-up',
        message: `Congratulations! You reached level ${user.level} and received rewards!`,
        rewards: levelUpRewards
      };
    }

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
      usingFreeSpin,
      notification // <-- send notification to frontend
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