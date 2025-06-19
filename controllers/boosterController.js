const BoosterPack = require('../models/BoosterPack');
const User = require('../models/User');

// Get available boosters for user's level
exports.getAvailableBoosters = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const boosters = await BoosterPack.find({ 
      levelRequired: { $lte: user.level } 
    }).sort({ levelRequired: 1 });

    res.json({ success: true, boosters });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load boosters' 
    });
  }
};

// Purchase and activate booster
exports.purchaseBooster = async (req, res) => {
  console.log('Purchase request received:', req.body);
  console.log('User ID:', req.user.id);
  
  try {
    const { packId } = req.body;
    console.log('Looking for pack:', packId);
    
    // Validate packId
    if (!packId) {
      return res.status(400).json({ success: false, error: 'Pack ID is required' });
    }

    // Find user and pack separately for better error handling
    const user = await User.findById(req.user.id);
    console.log('User found:', user ? 'Yes' : 'No');
    console.log('User bank balance:', user?.bankBalance);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const pack = await BoosterPack.findById(packId);
    console.log('Pack found:', pack ? pack.name : 'No');
    if (!pack) {
      return res.status(404).json({ success: false, error: 'Booster pack not found' });
    }

    // Populate active boosters separately
    try {
      await user.populate('activeBoosters.pack');
      console.log('Population successful');
    } catch (populateErr) {
      console.log('Population failed:', populateErr.message);
      // Continue without population for now
    }

    // Check if booster is already active
    const alreadyActive = user.activeBoosters.some(
      b => b.pack && b.pack._id.toString() === packId && new Date(b.expiresAt) > new Date()
    );
    
    if (alreadyActive) {
      return res.status(400).json({ success: false, error: 'This booster is already active.' });
    }

    // Level requirement check
    if (user.level < pack.levelRequired) {
      return res.status(403).json({ success: false, error: `Requires level ${pack.levelRequired}` });
    }

    // Balance check
    if (user.bankBalance < pack.price) {
      return res.status(400).json({ success: false, error: 'Insufficient bank balance (cash out more from slot winnings)' });
    }

    // Process purchase
    user.bankBalance -= pack.price;
    user.activeBoosters.push({
      pack: pack._id,
      effects: pack.effects,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    await user.save();

    // Return success response
    res.json({
      success: true,
      message: 'Booster purchased successfully!',
      newBankBalance: user.bankBalance,
      activeBoosters: user.activeBoosters
    });

  } catch (err) {
    console.error('Detailed error:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    res.status(500).json({ 
      success: false, 
      error: 'Purchase failed: ' + err.message 
    });
  }
};

// Get user's active boosters
exports.getActiveBoosters = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('activeBoosters.pack');
    
    // Filter out expired boosters
    const activeBoosters = user.activeBoosters.filter(
      booster => new Date(booster.expiresAt) > new Date()
    );

    res.json({ success: true, boosters: activeBoosters });
  } catch (err) {
    console.error('Error getting active boosters:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load active boosters' 
    });
  }
};

// Buy coins (from bank balance)
exports.buyCoins = async (req, res) => {
  const { amount } = req.body;
  const coins = parseInt(amount, 10);
  const MAX_BUYS_PER_DAY = 5;

  // Reset counter if 24 hours have passed
  const now = new Date();
  if (!req.user.buyCoinsReset || now > req.user.buyCoinsReset) {
    req.user.buyCoinsCount = 0;
    req.user.buyCoinsReset = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }

  if (req.user.buyCoinsCount >= MAX_BUYS_PER_DAY) {
    const waitMs = req.user.buyCoinsReset - now;
    const waitHours = Math.ceil(waitMs / (60 * 60 * 1000));
    return res.status(429).json({
      success: false,
      error: `Daily buy limit reached. Try again in ${waitHours} hour(s).`,
      nextBuy: req.user.buyCoinsReset
    });
  }

  if (!coins || coins < 1 || coins > 100000) {
    return res.status(400).json({ success: false, error: 'Invalid amount' });
  }

  // Check bank balance
  if (req.user.bankBalance < coins) {
    return res.status(400).json({ success: false, error: 'Insufficient bank balance' });
  }

  try {
    req.user.bankBalance -= coins; // Deduct from bank
    req.user.balance += coins;     // Add to in-game balance
    req.user.buyCoinsCount += 1;
    await req.user.save();
    res.json({
      success: true,
      newBalance: req.user.balance,
      newBankBalance: req.user.bankBalance,
      buysLeft: MAX_BUYS_PER_DAY - req.user.buyCoinsCount,
      nextBuy: req.user.buyCoinsReset
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to add coins' });
  }
};