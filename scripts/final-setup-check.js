const fs = require('fs');
const path = require('path');

console.log('🎰 NEON SPIN - Final Setup Check\n');
console.log('='.repeat(60));

// Check all required files and directories
const checks = [
  {
    name: '📁 Directory Structure',
    items: [
      'public/images/symbols',
      'public/images/frames',
      'public/images/badges',
      'public/images/avatars',
      'public/sounds',
      'public/css/components',
      'views'
    ]
  },
  {
    name: '🎯 Slot Machine Symbols',
    items: [
      'public/images/symbols/cherry.svg',
      'public/images/symbols/lemon.svg',
      'public/images/symbols/orange.svg',
      'public/images/symbols/bell.svg',
      'public/images/symbols/bar.svg',
      'public/images/symbols/seven.svg',
      'public/images/symbols/diamond.svg',
      'public/images/symbols/plum.svg'
    ]
  },
  {
    name: '🖼️ Avatar Frames',
    items: [
      'public/images/frames/bronze.svg',
      'public/images/frames/silver.svg',
      'public/images/frames/gold.svg',
      'public/images/frames/platinum.svg',
      'public/images/frames/diamond.svg'
    ]
  },
  {
    name: '🏆 Achievement Badges',
    items: [
      'public/images/badges/winner.svg',
      'public/images/badges/jackpot.svg',
      'public/images/badges/streak.svg',
      'public/images/badges/high-roller.svg'
    ]
  },
  {
    name: '🌐 Favicon Files',
    items: [
      'public/favicon.ico',
      'public/favicon-16x16.png',
      'public/favicon-32x32.png',
      'public/apple-touch-icon.png',
      'public/site.webmanifest'
    ]
  },
  {
    name: '📜 JavaScript Files',
    items: [
      'public/js/audio-manager.js',
      'public/js/slot-machine.js',
      'public/js/rewards.js',
      'public/js/profile.js',
      'public/js/boosters.js'
    ]
  },
  {
    name: '🎨 CSS Files',
    items: [
      'public/css/style.css',
      'public/css/components/audio-controls.css',
      'public/css/components/rewards.css',
      'public/css/mobile.css'
    ]
  },
  {
    name: '📄 HTML Views',
    items: [
      'views/index.html',
      'views/rewards.html',
      'views/profile.html',
      'views/boosters.html',
      'views/leaderboard.html'
    ]
  }
];

let totalItems = 0;
let foundItems = 0;

checks.forEach(check => {
  console.log(`\n${check.name}:`);
  
  check.items.forEach(item => {
    totalItems++;
    const exists = fs.existsSync(item);
    if (exists) {
      foundItems++;
      console.log(`  ✅ ${item}`);
    } else {
      console.log(`  ❌ ${item} - MISSING`);
    }
  });
});

// Calculate completion percentage
const completionPercentage = Math.round((foundItems / totalItems) * 100);

console.log('\n' + '='.repeat(60));
console.log('📊 SETUP SUMMARY');
console.log('='.repeat(60));
console.log(`Total Files: ${foundItems}/${totalItems} (${completionPercentage}%)`);

if (completionPercentage >= 90) {
  console.log('🎉 EXCELLENT! Your setup is nearly complete!');
} else if (completionPercentage >= 70) {
  console.log('👍 GOOD! Most files are in place.');
} else if (completionPercentage >= 50) {
  console.log('⚠️ NEEDS WORK! Several files are missing.');
} else {
  console.log('❌ CRITICAL! Many required files are missing.');
}

console.log('\n🚀 NEXT STEPS:');
console.log('1. Run asset test server: node scripts/start-asset-test.js');
console.log('2. Open http://localhost:3001/test-assets in browser');
console.log('3. Fix any missing assets');
console.log('4. Start main application: npm start');
console.log('5. Test slot machine functionality');

console.log('\n📝 QUICK COMMANDS:');
console.log('• Test assets: node scripts/start-asset-test.js');
console.log('• Update symbols: node scripts/update-slot-symbols.js');
console.log('• Integration test: node scripts/test-integration.js');
console.log('• Start app: npm start');

console.log('\n🎰 Your Neon Spin slot machine is ready to roll! ✨');