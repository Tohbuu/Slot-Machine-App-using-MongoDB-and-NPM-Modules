const Reward = require('../models/Reward');
const User = require('../models/User');

// Get available rewards
exports.getRewards = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const allRewards = await Reward.find().sort({ level: 1 });

    // Mark claimable and claimed
    const rewardsWithStatus = allRewards.map(reward => ({
      ...reward.toObject(),
      isClaimed: user.claimedRewards.includes(reward._id),
      isClaimable: user.level >= reward.level
    }));

    res.json({ success: true, rewards: rewardsWithStatus });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load rewards' 
    });
  }
};

// Claim reward
exports.claimReward = async (req, res) => {
  try {
    const { rewardId } = req.body;
    const user = await User.findById(req.user.id);
    const reward = await Reward.findById(rewardId);

    if (!reward) {
      return res.status(404).json({ 
        success: false, 
        error: 'Reward not found' 
      });
    }

    if (user.level < reward.level) {
      return res.status(403).json({
        success: false,
        error: `Requires level ${reward.level}`
      });
    }

    if (user.claimedRewards.includes(reward._id)) {
      return res.status(400).json({
        success: false,
        error: 'Reward already claimed'
      });
    }

    // Prepare updates
    const updates = {
      $inc: { balance: reward.rewards.credits || 0 },
      $push: { claimedRewards: reward._id }
    };

    // Add booster packs if any
    if (reward.rewards.boosterPacks?.length > 0) {
      updates.$push = {
        ...updates.$push,
        activeBoosters: reward.rewards.boosterPacks.map(pack => ({
          pack: pack.pack,
          quantity: pack.quantity,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week
        }))
      };
    }

    // Add unlocks if any
    if (reward.rewards.unlocks?.length > 0) {
      updates.$addToSet = { 
        unlocks: { $each: reward.rewards.unlocks } 
      };
    }

    await User.findByIdAndUpdate(user._id, updates);

    res.json({ 
      success: true,
      message: 'Reward claimed successfully'
    });

  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to claim reward' 
    });
  }
};