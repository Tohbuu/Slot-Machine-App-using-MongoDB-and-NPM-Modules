require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const { connectDB } = require('./config/database');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'futuristic-slot-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
app.use(express.static(path.join(__dirname, 'public')));

// API Routes (Modular route files)
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const slotRoutes = require('./routes/slots');
const userSingleRoutes = require('./routes/user');
const slotController = require('./controllers/slotController');
const authMiddleware = require('./middleware/auth');

const rewardsRoutes = require('./routes/rewards');
const boostersRoutes = require('./routes/boosters');

app.use('/api/auth', authRoutes);  // Authentication routes (login, register)
app.use('/api/users', userRoutes); // User profile routes
app.use('/api/slots', slotRoutes); // Slot game routes
app.use('/api/user', userSingleRoutes);

app.use('/api/rewards', rewardsRoutes);
app.use('/api/boosters', boostersRoutes);
// Add slot spin endpoint
app.post('/api/slot/spin', authMiddleware, slotController.spin);
app.post('/api/slot/bonus', authMiddleware, slotController.claimBonus);

// Serve frontend HTML files for each main page (no SPA fallback)
const staticRoutes = [
  { route: '/', file: 'index.html' },
  { route: '/login', file: 'login.html' },
  { route: '/register', file: 'register.html' },
  { route: '/profile', file: 'profile.html' },
  { route: '/leaderboard', file: 'leaderboard.html' },
  { route: '/boosters', file: 'boosters.html' },
  { route: '/rewards', file: 'rewards.html' }
];

staticRoutes.forEach(({ route, file }) => {
  app.get(route, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', file));
  });
  // Also handle trailing slash
  app.get(route + '/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', file));
  });
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Session destruction error:', err);
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    res.redirect('/login');
  });
});

// Error handling for undefined routes (keep this last)
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Serve static files from React/Vue in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});