const express = require('express');
const router = express.Router();
const rewardController = require('../controllers/rewardController');
const auth = require('../middleware/auth');

// Get available rewards
router.get('/', auth, rewardController.getRewards);

// Claim reward
router.post('/claim', auth, rewardController.claimReward);

module.exports = router;