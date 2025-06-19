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
  jackpotsWon: {
    type: Number,
    default: 0
  },
  claimedRewards: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reward'
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
  }
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

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);