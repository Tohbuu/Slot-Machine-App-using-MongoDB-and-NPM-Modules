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
router.post('/buy-coins', auth, boosterController.buyCoins);

module.exports = router;