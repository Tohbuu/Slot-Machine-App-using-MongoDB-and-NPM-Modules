const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  balance: {
    type: Number,
    default: 1000
  },
  bankBalance: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1,
    min: 1
  },
  experience: {
    type: Number,
    default: 0,
    min: 0
  },
  profilePicture: {
    type: String,
    default: 'default.png'
  },
  theme: {
    type: String,
    default: 'default'
  },
  achievements: [{
    name: String,
    date: Date
  }],
  lastLogin: Date,
  freeSpins: {
    type: Number,
    default: 0
  },
  totalWins: {
    type: Number,
    default: 0
  },
  totalSpins: {
    type: Number,
    default: 0
  },
  jackpotsWon: {
    type: Number,
    default: 0
  },
  claimedRewards: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reward'
  }],
  unlocks: [{
    type: String,
    enum: [
      'golden_spinner', 'vip_badge', 'exclusive_theme', 'animated_avatar',
      'bronze_frame', 'silver_frame', 'gold_frame', 'legendary_frame',
      'neon_trail', 'particle_effects', 'custom_sounds', 'premium_themes',
      'bronze_badge', 'silver_badge', 'gold_badge', 'legendary_badge'
    ]
  }],
  activeBoosters: [{
    pack: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BoosterPack',
      required: true
    },
    effects: {
      winMultiplier: { type: Number, default: 1.0 },
      freeSpins: { type: Number, default: 0 },
      jackpotBoost: { type: Number, default: 0 }
    },
    expiresAt: {
      type: Date,
      required: true
    }
  }],
  buyCoinsCount: {
    type: Number,
    default: 0
  },
  buyCoinsReset: {
    type: Date,
    default: () => new Date()
  },
  recentActivity: [{
    type: {
      type: String,
      enum: ['spin', 'win', 'loss', 'jackpot', 'level', 'reward', 'achievement', 'bonus']
    },
    description: String,
    amount: Number,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
