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

    // Ensure defaults for legacy users
    const players = topPlayers.map(player => ({
      ...player.toObject(),
      totalWins: typeof player.totalWins === 'number' ? player.totalWins : 0,
      jackpotsWon: typeof player.jackpotsWon === 'number' ? player.jackpotsWon : 0,
      level: typeof player.level === 'number' ? player.level : 1
    }));

    res.json({ success: true, topPlayers: players });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;