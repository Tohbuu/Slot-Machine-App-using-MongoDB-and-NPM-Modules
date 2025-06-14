const express = require('express');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const upload = require('../config/multer'); // Multer config for avatar uploads

const router = express.Router();

// @route   PUT /api/users
// @desc    Update user profile
router.put('/', auth, userController.updateProfile);

// @route   PUT /api/users/theme
// @desc    Update user theme
router.put('/theme', auth, userController.updateTheme);

// @route   POST /api/users/avatar
// @desc    Upload user avatar
router.post('/avatar', auth, upload.single('avatar'), userController.uploadAvatar);

// @route   GET /api/users/me
// @desc    Get current user info
router.get('/me', auth, (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;