const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const userController = require('../controllers/userController');
const multer = require('multer');
const path = require('path');

// Set up multer for file uploading
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Set the destination folder for uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Append the file extension to the timestamp
  },
});

const upload = multer({ storage: storage });

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

// Add this route for cashout
router.post('/cashout', auth, userController.cashoutToBank);

// Upload avatar route
router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.avatar = req.file.path; // Save the file path to the user's avatar field
    await user.save();
    res.json({ success: true, avatar: req.file.path });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Avatar upload failed' });
  }
});

module.exports = router;