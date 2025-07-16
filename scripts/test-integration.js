const fs = require('fs');
const path = require('path');

console.log('🧪 NEON SPIN - Asset Integration Test\n');

// Test 1: Check if all required directories exist
console.log('📁 Testing Directory Structure...');
const requiredDirs = [
  'public/images/symbols',
  'public/images/frames', 
  'public/images/badges',
  'public/images/avatars',
  'public/sounds',
  'public/css/components',
  'public/js'
];

requiredDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`✅ ${dir}`);
  } else {
    console.log(`❌ ${dir} - MISSING`);
  }
});

// Test 2: Check if all symbol files exist
console.log('\n🎰 Testing Slot Machine Symbols...');
const symbolFiles = [
  'cherry.svg', 'lemon.svg', 'orange.svg', 'bell.svg',
  'bar.svg', 'seven.svg', 'diamond.svg', 'plum.svg'
];

symbolFiles.forEach(file => {
  const filePath = path.join('public/images/symbols', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
  }
});

// Test 3: Check if all frame files exist
console.log('\n🖼️ Testing Avatar Frames...');
const frameFiles = [
  'bronze.svg', 'silver.svg', 'gold.svg', 'platinum.svg', 'diamond.svg'
];

frameFiles.forEach(file => {
  const filePath = path.join('public/images/frames', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
  }
});

// Test 4: Check if all badge files exist
console.log('\n🏆 Testing Badges...');
const badgeFiles = [
  'winner.svg', 'jackpot.svg', 'streak.svg', 'high-roller.svg'
];

badgeFiles.forEach(file => {
  const filePath = path.join('public/images/badges', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
  }
});

// Test 5: Check favicon files
console.log('\n🌐 Testing Favicon Files...');
const faviconFiles = [
  'favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png', 
  'apple-touch-icon.png', 'site.webmanifest'
];

faviconFiles.forEach(file => {
  const filePath = path.join('public', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`⚠️ ${file} - MISSING (run favicon generator)`);
  }
});

// Test 6: Check JavaScript files
console.log('\n📜 Testing JavaScript Files...');
const jsFiles = [
  'audio-manager.js', 'slot-machine.js', 'rewards.js', 
  'profile.js', 'leaderboard.js', 'boosters.js'
];

jsFiles.forEach(file => {
  const filePath = path.join('public/js', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
  }
});

// Test 7: Check CSS files
console.log('\n🎨 Testing CSS Files...');
const cssFiles = [
  'style.css', 'mobile.css', 'themes.css',
  'components/audio-controls.css', 'components/rewards.css'
];

cssFiles.forEach(file => {
  const filePath = path.join('public/css', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
  }
});

// Test 8: Check HTML files for favicon links
console.log('\n📄 Testing HTML Files for Favicon Links...');
const htmlFiles = [
  'index.html', 'login.html', 'register.html', 
  'profile.html', 'leaderboard.html', 'rewards.html', 'boosters.html'
];

htmlFiles.forEach(file => {
  const filePath = path.join('views', file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasFavicon = content.includes('favicon.ico');
    const hasManifest = content.includes('site.webmanifest');
    const hasAudioManager = content.includes('audio-manager.js');
    
    console.log(`📄 ${file}:`);
    console.log(`  ${hasFavicon ? '✅' : '❌'} Favicon links`);
    console.log(`  ${hasManifest ? '✅' : '❌'} Web manifest`);
    console.log(`  ${hasAudioManager ? '✅' : '❌'} Audio manager`);
  } else {
    console.log(`❌ ${file} - FILE NOT FOUND`);
  }
});

// Test 9: Check sound files
console.log('\n🔊 Testing Sound Files...');
const soundFiles = [
  'spin.mp3', 'reel-stop.mp3', 'win-small.mp3', 'win-big.mp3',
  'jackpot.mp3', 'bonus.mp3', 'button-click.mp3', 'coin-drop.mp3',
  'level-up.mp3', 'notification.mp3', 'background-music.mp3'
];

let soundsFound = 0;
soundFiles.forEach(file => {
  const filePath = path.join('public/sounds', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
    soundsFound++;
  } else {
    console.log(`⚠️ ${file} - MISSING (add sound file)`);
  }
});

console.log(`\n🔊 Sound Files Status: ${soundsFound}/${soundFiles.length} found`);

// Test 10: Check slot machine integration
console.log('\n🎰 Testing Slot Machine Integration...');
const slotMachineFile = path.join('public/js', 'slot-machine.js');
if (fs.existsSync(slotMachineFile)) {
  const slotContent = fs.readFileSync(slotMachineFile, 'utf8');
  
  // Check if slot machine references the new symbols
  const symbolsReferenced = symbolFiles.some(symbol => 
    slotContent.includes(symbol.replace('.svg', ''))
  );
  
  console.log(`${symbolsReferenced ? '✅' : '⚠️'} Slot machine references new symbols`);
  console.log(`${slotContent.includes('AudioManager') ? '✅' : '⚠️'} Audio manager integration`);
} else {
  console.log('❌ slot-machine.js not found');
}

// Test 11: Check rewards system integration
console.log('\n🏆 Testing Rewards System Integration...');
const rewardsFile = path.join('public/js', 'rewards.js');
if (fs.existsSync(rewardsFile)) {
  const rewardsContent = fs.readFileSync(rewardsFile, 'utf8');
  
  console.log(`${rewardsContent.includes('frames') ? '✅' : '⚠️'} Frame system integration`);
  console.log(`${rewardsContent.includes('badges') ? '✅' : '⚠️'} Badge system integration`);
  console.log(`${rewardsContent.includes('MAX_LEVEL') ? '✅' : '⚠️'} Level system configured`);
} else {
  console.log('❌ rewards.js not found');
}

// Test 12: Check server configuration
console.log('\n🖥️ Testing Server Configuration...');
const serverFile = path.join('server.js');
if (fs.existsSync(serverFile)) {
  const serverContent = fs.readFileSync(serverFile, 'utf8');
  
  console.log(`${serverContent.includes('static') ? '✅' : '⚠️'} Static file serving`);
  console.log(`${serverContent.includes('/rewards') ? '✅' : '⚠️'} Rewards route configured`);
  console.log(`${serverContent.includes('/boosters') ? '✅' : '⚠️'} Boosters route configured`);
} else {
  console.log('❌ server.js not found');
}

// Test 13: Generate summary report
console.log('\n📊 INTEGRATION SUMMARY');
console.log('='.repeat(50));

const totalAssets = symbolFiles.length + frameFiles.length + badgeFiles.length + faviconFiles.length;
let assetsFound = 0;

// Count existing assets
symbolFiles.forEach(file => {
  if (fs.existsSync(path.join('public/images/symbols', file))) assetsFound++;
});
frameFiles.forEach(file => {
  if (fs.existsSync(path.join('public/images/frames', file))) assetsFound++;
});
badgeFiles.forEach(file => {
  if (fs.existsSync(path.join('public/images/badges', file))) assetsFound++;
});
faviconFiles.forEach(file => {
  if (fs.existsSync(path.join('public', file))) assetsFound++;
});

const assetPercentage = Math.round((assetsFound / totalAssets) * 100);
const soundPercentage = Math.round((soundsFound / soundFiles.length) * 100);

console.log(`🎨 Visual Assets: ${assetsFound}/${totalAssets} (${assetPercentage}%)`);
console.log(`🔊 Audio Assets: ${soundsFound}/${soundFiles.length} (${soundPercentage}%)`);

if (assetPercentage >= 80) {
  console.log('✅ Asset integration: GOOD');
} else if (assetPercentage >= 60) {
  console.log('⚠️ Asset integration: NEEDS WORK');
} else {
  console.log('❌ Asset integration: CRITICAL');
}

// Final recommendations
console.log('\n🚀 NEXT STEPS:');
if (soundsFound === 0) {
  console.log('1. Add sound files to public/sounds/ directory');
}
if (assetsFound < totalAssets) {
  console.log('2. Ensure all visual assets are properly placed');
}
console.log('3. Test the application in browser');
console.log('4. Verify favicon appears in browser tab');
console.log('5. Test audio controls functionality');
console.log('6. Check slot machine symbol display');
console.log('7. Verify reward system shows frames/badges');

console.log('\n🎰 Ready to spin! Run: npm start');