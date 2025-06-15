const express = require('express');
const router = express.Router();
const boosterController = require('../controllers/boosterController');
const auth = require('../middleware/auth');

// Get available boosters
router.get('/', auth, boosterController.getAvailableBoosters);

// Purchase booster
router.post('/purchase', auth, boosterController.purchaseBooster);

// Get active boosters
router.get('/active', auth, boosterController.getActiveBoosters);

// Buy coins (flexible amount)
router.post('/buy-coins', auth, async (req, res) => {
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
  try {
    req.user.balance += coins;
    req.user.buyCoinsCount += 1;
    await req.user.save();
    res.json({
      success: true,
      newBalance: req.user.balance,
      buysLeft: MAX_BUYS_PER_DAY - req.user.buyCoinsCount,
      nextBuy: req.user.buyCoinsReset
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to add coins' });
  }
});

module.exports = router;