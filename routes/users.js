const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Get current user info
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Update user profile
router.put('/', auth, async (req, res) => {
  try {
    const { username, email } = req.body;
    const user = await User.findById(req.user.id);

    if (username) user.username = username;
    if (email) user.email = email;

    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Update failed' });
  }
});

// Update theme
router.put('/theme', auth, async (req, res) => {
  try {
    const { theme } = req.body;
    const user = await User.findById(req.user.id);
    user.theme = theme;
    await user.save();
    res.json({ success: true, theme });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Theme update failed' });
  }
});

module.exports = router;