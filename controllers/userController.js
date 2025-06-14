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