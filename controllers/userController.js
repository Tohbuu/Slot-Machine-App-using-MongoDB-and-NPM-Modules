const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { username, email } = req.body;
    const updates = {};

    if (username) updates.username = username;
    if (email) updates.email = email;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password -__v');

    res.json({
      success: true,
      user
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update user theme
exports.updateTheme = async (req, res) => {
  try {
    const { theme } = req.body;

    if (!['default', 'cyber', 'neon', 'dark'].includes(theme)) {
      return res.status(400).json({ error: 'Invalid theme' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { theme },
      { new: true }
    ).select('-password -__v');

    res.json({
      success: true,
      user
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Handle avatar upload (complements the avatar route)
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const user = await User.findById(req.user._id);
    const oldAvatar = user.profilePicture;

    // Delete old avatar if not default
    if (oldAvatar !== 'default.png') {
      const oldPath = path.join(__dirname, '../../public/images/avatars', oldAvatar);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Update user with new avatar
    user.profilePicture = req.file.filename;
    await user.save();

    res.json({
      success: true,
      profilePicture: user.profilePicture
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Cash out to bank
exports.cashoutToBank = async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.user.id);

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid amount' });
    }
    if (user.balance < amount) {
      return res.status(400).json({ success: false, error: 'Insufficient balance' });
    }

    user.balance -= amount;
    user.bankBalance = (user.bankBalance || 0) + amount;
    await user.save();

    res.json({ success: true, newBalance: user.balance, bankBalance: user.bankBalance });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Cashout failed' });
  }
};

// Get bank balance
exports.getBankBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, bankBalance: user.bankBalance || 0 });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch bank balance' });
  }
};

// Get current user data
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -__v');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({
      success: true,
      user: {
        username: user.username,
        email: user.email,
        balance: user.balance,
        bankBalance: user.bankBalance,
        profilePicture: user.profilePicture,
        level: user.level,
        experience: user.experience,
        // ...other fields
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};