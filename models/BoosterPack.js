const mongoose = require('mongoose');

const BoosterPackSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    unique: true
  },
  levelRequired: { 
    type: Number, 
    required: true,
    min: 1,
    max: 20
  },
  price: { 
    type: Number, 
    required: true,
    min: 100
  },
  effects: {
    winMultiplier: { 
      type: Number, 
      default: 1.0,
      min: 1.0,
      max: 3.0
    },
    freeSpins: { 
      type: Number, 
      default: 0,
      min: 0
    },
    jackpotBoost: {
      type: Number,
      default: 0,
      min: 0,
      max: 2.0
    }
  },
  icon: {
    type: String,
    default: 'default-booster.png'
  },
  description: {
    type: String,
    required: true
  }
}, { timestamps: true });

// Static method to initialize default boosters
BoosterPackSchema.statics.initBoosters = async function() {
  const defaultBoosters = [
    {
      name: "Beginner's Luck",
      levelRequired: 1,
      price: 100000, // 100k
      effects: { winMultiplier: 1.2, freeSpins: 3 },
      description: "20% win boost + 3 free spins"
    },
    {
      name: "Jackpot Hunter",
      levelRequired: 5,
      price: 500000, // 500k
      effects: { jackpotBoost: 0.5, freeSpins: 5 },
      description: "50% better jackpot odds + 5 free spins"
    },
    {
      name: "High Roller",
      levelRequired: 10,
      price: 1000000, // 1M
      effects: { winMultiplier: 1.5, jackpotBoost: 1.0 },
      description: "50% win boost + double jackpot chance"
    },
    {
      name: "Platinum Package",
      levelRequired: 15,
      price: 5000000, // 5M
      effects: { winMultiplier: 2.0, freeSpins: 10, jackpotBoost: 1.5 },
      description: "Double wins + 10 spins + massive jackpot boost"
    },
    {
      name: "VIP Legend",
      levelRequired: 20,
      price: 20000000, // 20M
      effects: { winMultiplier: 3.0, freeSpins: 15, jackpotBoost: 2.0 },
      description: "Triple wins + 15 spins + maximum jackpot boost"
    }
  ];

  const existingCount = await this.countDocuments();
  if (existingCount === 0) {
    await this.insertMany(defaultBoosters);
    console.log('Default booster packs created');
  }
};

module.exports = mongoose.model('BoosterPack', BoosterPackSchema);