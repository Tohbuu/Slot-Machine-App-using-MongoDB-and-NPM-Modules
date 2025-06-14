const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const User = require('../models/User');

// Configure Multer for avatar uploads with centralized config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../public/images/avatars');
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

const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 2 * 1024 * 1024, // 2MB limit
    files: 1 // Only allow single file upload
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, GIF) are allowed!'), false);
    }
  }
});

// Avatar upload endpoint with proper middleware chain
router.post(
  '/avatar',
  auth, // Authentication middleware first
  upload.single('avatar'), // File upload handling
  async (req, res) => {
    try {
      // Validate file exists
      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          error: 'No file uploaded or invalid file type' 
        });
      }

      const user = await User.findById(req.user._id);
      const oldAvatar = user.profilePicture;

      // Clean up old avatar if it exists and isn't default
      if (oldAvatar && oldAvatar !== 'default.png') {
        const oldAvatarPath = path.join(__dirname, '../../public/images/avatars', oldAvatar);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlink(oldAvatarPath, (err) => {
            if (err) console.error('Error deleting old avatar:', err);
          });
        }
      }

      // Update user with new avatar filename
      user.profilePicture = req.file.filename;
      await user.save();

      res.status(200).json({ 
        success: true, 
        profilePicture: user.profilePicture,
        message: 'Avatar updated successfully'
      });

    } catch (err) {
      console.error('Avatar upload error:', err);
      
      // Clean up uploaded file if error occurred
      if (req.file) {
        fs.unlink(req.file.path, () => {});
      }

      res.status(500).json({ 
        success: false,
        error: err.message || 'Server error during avatar upload' 
      });
    }
  }
);

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