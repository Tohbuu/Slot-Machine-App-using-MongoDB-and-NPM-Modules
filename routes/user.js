const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const User = require('../models/User');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/images/avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${req.user._id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, or GIF images are allowed!'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter
});

// Avatar upload route
router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const user = await User.findById(req.user.id);

    // Delete old avatar if it's not default
    if (user.profilePicture && user.profilePicture !== 'default.png') {
      const oldPath = path.join(__dirname, '../public/images/avatars', user.profilePicture);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    user.profilePicture = req.file.filename;
    await user.save();

    res.json({
      success: true,
      profilePicture: user.profilePicture,
      message: 'Avatar updated successfully'
    });
  } catch (err) {
    console.error('Avatar upload error:', err);
    res.status(500).json({ success: false, error: 'Failed to upload avatar' });
  }
});

// Get current user profile
router.get('/', auth, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// Update user profile (for /api/user/update)
router.post('/update', auth, async (req, res) => {
  const { username, email, theme } = req.body;
  if (username) req.user.username = username;
  if (email) req.user.email = email;
  if (theme) req.user.theme = theme;
  await req.user.save();
  res.json({ success: true, user: req.user });
});

module.exports = router;