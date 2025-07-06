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

// Get user activities
router.get('/activities', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('activities');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Sort activities by timestamp (newest first)
    const activities = (user.activities || [])
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 50); // Limit to 50 most recent

    res.json({
      success: true,
      activities
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Add new activity
router.post('/activity', auth, async (req, res) => {
  try {
    const { type, description, data } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Initialize activities array if it doesn't exist
    if (!user.activities) {
      user.activities = [];
    }

    // Add new activity
    const activity = {
      type,
      description,
      data,
      timestamp: new Date()
    };

    user.activities.unshift(activity);

    // Keep only the last 100 activities
    if (user.activities.length > 100) {
      user.activities = user.activities.slice(0, 100);
    }

    await user.save();

    res.json({
      success: true,
      activity
    });
  } catch (error) {
    console.error('Error saving activity:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;