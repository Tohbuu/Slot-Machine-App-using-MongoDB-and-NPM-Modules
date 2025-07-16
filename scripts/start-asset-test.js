const express = require('express');
const path = require('path');
const fs = require('fs');

console.log('🧪 Starting Asset Test Server...\n');

const app = express();
const PORT = 3001; // Different port to avoid conflicts

// Serve static files
app.use(express.static('public'));

// Serve the test page
app.get('/test-assets', (req, res) => {
  res.sendFile(path.join(__dirname, '../test-assets.html'));
});

// API endpoint to check asset status
app.get('/api/asset-status', (req, res) => {
  const assetStatus = {
    symbols: [],
    frames: [],
    badges: [],
    sounds: [],
    favicon: []
  };
  
  // Check symbols
  const symbolFiles = ['cherry.svg', 'lemon.svg', 'orange.svg', 'bell.svg', 'bar.svg', 'seven.svg', 'diamond.svg', 'plum.svg'];
  symbolFiles.forEach(file => {
    const exists = fs.existsSync(path.join('public/images/symbols', file));
    assetStatus.symbols.push({ file, exists });
  });
  
  // Check frames
  const frameFiles = ['bronze.svg', 'silver.svg', 'gold.svg', 'platinum.svg', 'diamond.svg'];
  frameFiles.forEach(file => {
    const exists = fs.existsSync(path.join('public/images/frames', file));
    assetStatus.frames.push({ file, exists });
  });
  
  // Check badges
  const badgeFiles = ['winner.svg', 'jackpot.svg', 'streak.svg', 'high-roller.svg'];
  badgeFiles.forEach(file => {
    const exists = fs.existsSync(path.join('public/images/badges', file));
    assetStatus.badges.push({ file, exists });
  });
  
  // Check sounds
  const soundFiles = ['spin.mp3', 'reel-stop.mp3', 'win-small.mp3', 'win-big.mp3', 'jackpot.mp3', 'bonus.mp3', 'button-click.mp3', 'coin-drop.mp3', 'level-up.mp3', 'notification.mp3', 'background-music.mp3'];
  soundFiles.forEach(file => {
    const exists = fs.existsSync(path.join('public/sounds', file));
    assetStatus.sounds.push({ file, exists });
  });
  
  // Check favicon files
  const faviconFiles = ['favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png', 'site.webmanifest'];
  faviconFiles.forEach(file => {
    const exists = fs.existsSync(path.join('public', file));
    assetStatus.favicon.push({ file, exists });
  });
  
  res.json(assetStatus);
});

// Root route
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Neon Spin Asset Test Server</title>
        <style>
          body { 
            background: #000; 
            color: #00ffff; 
            font-family: 'Orbitron', monospace; 
            padding: 40px;
            text-align: center;
          }
          .logo { 
            font-size: 3em; 
            margin-bottom: 30px;
            text-shadow: 0 0 20px #00ffff;
          }
          .link { 
            display: inline-block;
            background: #00ffff; 
            color: #000; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 5px;
            margin: 10px;
            font-weight: bold;
            transition: all 0.3s ease;
          }
          .link:hover {
            background: #ffffff;
            transform: scale(1.05);
          }
          .info {
            margin: 30px 0;
            padding: 20px;
            border: 1px solid #00ffff;
            border-radius: 10px;
            max-width: 600px;
            margin: 30px auto;
          }
        </style>
      </head>
      <body>
        <div class="logo">🎰 NEON SPIN</div>
        <div class="info">
          <h2>Asset Test Server</h2>
          <p>This server helps you test all the assets for your slot machine app.</p>
        </div>
        <a href="/test-assets" class="link">🧪 Run Asset Tests</a>
        <a href="/api/asset-status" class="link">📊 API Status</a>
      </body>
    </html>
  `);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Asset Test Server running on http://localhost:${PORT}`);
  console.log(`🧪 Test your assets at: http://localhost:${PORT}/test-assets`);
  console.log(`📊 Check API status at: http://localhost:${PORT}/api/asset-status`);
  console.log('\n📋 TESTING CHECKLIST:');
  console.log('='.repeat(50));
  console.log('1. ✅ Server started successfully');
  console.log('2. 🌐 Open http://localhost:3001/test-assets in browser');
  console.log('3. 🎯 Check if all symbols display correctly');
  console.log('4. 🖼️ Verify avatar frames are visible');
  console.log('5. 🏆 Test badge icons');
  console.log('6. 🔊 Try audio test buttons');
  console.log('7. 🌐 Check favicon in browser tab');
  console.log('8. 📊 Review test summary at bottom');
  console.log('\n🚀 When ready, start main app with: npm start');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Asset Test Server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down Asset Test Server...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});