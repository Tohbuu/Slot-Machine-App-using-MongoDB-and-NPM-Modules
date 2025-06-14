const mongoose = require('mongoose');

const JackpotSchema = new mongoose.Schema({
  currentAmount: {
    type: Number,
    default: 10000
  },
  lastWinner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastWinAmount: Number,
  lastWinDate: Date,
  contributionRate: {
    type: Number,
    default: 0.01 // 1% of each bet goes to jackpot
  }
});

// Static method to get current jackpot
JackpotSchema.statics.getCurrent = async function() {
  let jackpot = await this.findOne();
  if (!jackpot) {
    jackpot = await this.create({});
  }
  return jackpot;
};

module.exports = mongoose.model('Jackpot', JackpotSchema);