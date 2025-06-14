const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Get top 10 players by total wins
router.get('/leaderboard', async (req, res) => {
  try {
    const topPlayers = await User.find()
      .sort({ totalWins: -1 })
      .limit(10)
      .select('username profilePicture totalWins jackpotsWon level');

    res.json({ success: true, topPlayers });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;