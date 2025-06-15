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
  try {
    const { packId } = req.body;
    const user = await User.findById(req.user.id);
    const pack = await BoosterPack.findById(packId);

    // Validations
    if (!pack) {
      return res.status(404).json({ 
        success: false, 
        error: 'Booster pack not found' 
      });
    }

    if (user.level < pack.levelRequired) {
      return res.status(403).json({
        success: false,
        error: `Requires level ${pack.levelRequired}`
      });
    }

    if (user.balance < pack.price) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient credits'
      });
    }

    // Process purchase
    user.balance -= pack.price;
    user.activeBoosters.push({
      pack: pack._id,
      effects: pack.effects,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    await user.save();

    res.json({
      success: true,
      newBalance: user.balance,
      activeBoosters: user.activeBoosters
    });

  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: 'Purchase failed' 
    });
  }
};

// Get user's active boosters
exports.getActiveBoosters = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('activeBoosters.pack');

    // Filter out expired boosters
    const validBoosters = user.activeBoosters.filter(b => 
      new Date(b.expiresAt) > new Date()
    );

    res.json({ success: true, boosters: validBoosters });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load boosters' 
    });
  }
};