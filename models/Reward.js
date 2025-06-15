const mongoose = require('mongoose');

const RewardSchema = new mongoose.Schema({
  level: {
    type: Number,
    required: true,
    unique: true,
    min: 1,
    max: 20
  },
  rewards: {
    credits: {
      type: Number,
      default: 0
    },
    boosterPacks: [{
      pack: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BoosterPack'
      },
      quantity: {
        type: Number,
        default: 1
      }
    }],
    unlocks: [{
      type: String,
      enum: ['golden_spinner', 'vip_badge', 'exclusive_theme', 'animated_avatar']
    }]
  },
  isPremium: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Initialize default rewards
RewardSchema.statics.initRewards = async function() {
  const defaultRewards = [
    {
      level: 1,
      rewards: { credits: 200 }
    },
    {
      level: 3,
      rewards: { 
        credits: 500,
        unlocks: ['bronze_frame']
      }
    },
    {
      level: 5,
      rewards: {
        credits: 1000,
        boosterPacks: [] // Will be populated after boosters exist
      }
    },
    // ... up to level 20
  ];

  await this.deleteMany({});
  await this.insertMany(defaultRewards);
};

module.exports = mongoose.model('Reward', RewardSchema);