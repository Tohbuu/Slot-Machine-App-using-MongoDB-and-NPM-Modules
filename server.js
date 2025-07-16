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
const boosterRoutes = require('./routes/boosters');

app.use('/api/auth', authRoutes);  // Authentication routes (login, register)
app.use('/api/users', userRoutes); // userRoutes from routes/users.js
app.use('/api/slots', slotRoutes); // Slot game routes
app.use('/api/user', userSingleRoutes);

// Make sure these routes are registered
app.use('/api/rewards', rewardsRoutes);
app.use('/api/boosters', boosterRoutes);
// Add slot spin endpoint
app.post('/api/slot/spin', authMiddleware, slotController.spin);
app.post('/api/slot/bonus', authMiddleware, slotController.claimBonus);

// Spotify authentication callback route (add this before your static routes)
app.get('/spotify-callback', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Spotify Authentication - Neon Spin</title>
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Orbitron', monospace;
          background: linear-gradient(135deg, #1a1a2e, #16213e);
          color: #fff;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          text-align: center;
        }
        .auth-container {
          background: rgba(255, 255, 255, 0.1);
          padding: 2rem;
          border-radius: 15px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        .spinner {
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid #1db954;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .success {
          color: #1db954;
        }
        .error {
          color: #ff4444;
        }
        .spotify-logo {
          color: #1db954;
          font-size: 2rem;
          margin-bottom: 1rem;
        }
      </style>
    </head>
    <body>
      <div class="auth-container">
        <div class="spotify-logo">🎵</div>
        <div class="spinner"></div>
        <h2>Connecting to Spotify...</h2>
        <p id="status">Processing authentication...</p>
      </div>
      
      <script>
        const statusEl = document.getElementById('status');
        
        try {
          // Extract access token from URL fragment
          const hash = window.location.hash.substring(1);
          const params = new URLSearchParams(hash);
          const accessToken = params.get('access_token');
          const error = params.get('error');
          
          console.log('Spotify callback - Hash:', hash);
          console.log('Spotify callback - Access token:', accessToken ? 'Present' : 'Missing');
          
          if (error) {
            statusEl.textContent = 'Authentication failed: ' + error;
            statusEl.className = 'error';
            
            if (window.opener) {
              window.opener.postMessage({
                type: 'spotify-auth-error',
                error: error
              }, '*');
            }
            
            setTimeout(() => window.close(), 3000);
            return;
          }
          
          if (accessToken) {
            // Save token to localStorage
            localStorage.setItem('spotify_access_token', accessToken);
            
            statusEl.textContent = 'Successfully connected to Spotify!';
            statusEl.className = 'success';
            
            console.log('Spotify token saved successfully');
            
            // Notify parent window
            if (window.opener) {
              window.opener.postMessage({
                type: 'spotify-auth-success',
                token: accessToken
              }, '*');
            }
            
            // Close popup after short delay
            setTimeout(() => {
              window.close();
            }, 2000);
            
          } else {
            throw new Error('No access token received');
          }
          
        } catch (err) {
          console.error('Spotify auth error:', err);
          statusEl.textContent = 'Authentication failed: ' + err.message;
          statusEl.className = 'error';
          
          if (window.opener) {
            window.opener.postMessage({
              type: 'spotify-auth-error',
              error: err.message
            }, '*');
          }
          
          setTimeout(() => window.close(), 3000);
        }
      </script>
    </body>
    </html>
  `);
});

// Add this route to provide client-side configuration
app.get('/api/config', (req, res) => {
  res.json({
    spotifyClientId: process.env.SPOTIFY_CLIENT_ID || null,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve frontend HTML files for each main page (no SPA fallback)
const staticRoutes = [
  { route: '/', file: 'index.html' },
  { route: '/login', file: 'login.html' },
  { route: '/register', file: 'register.html' },
  { route: '/profile', file: 'profile.html' },
  { route: '/leaderboard', file: 'leaderboard.html' },
  { route: '/boosters', file: 'boosters.html' },
  { route: '/rewards', file: 'rewards.html' },
  { route: '/landingpage', file: 'landingpage.html' } // Add this line
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