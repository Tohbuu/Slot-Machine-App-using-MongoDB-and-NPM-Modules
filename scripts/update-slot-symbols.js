const fs = require('fs');
const path = require('path');

console.log('🎰 Updating Slot Machine to use new SVG symbols...\n');

const slotMachineFile = path.join('public/js', 'slot-machine.js');

if (!fs.existsSync(slotMachineFile)) {
  console.log('❌ slot-machine.js not found!');
  console.log('Please ensure the file exists before running this script.');
  process.exit(1);
}

// Read the current slot machine file
let slotContent = fs.readFileSync(slotMachineFile, 'utf8');

// Define the new symbols configuration
const newSymbolsConfig = `
// Updated symbols configuration with SVG files
const SYMBOLS = [
  { 
    name: 'cherry', 
    file: '/images/symbols/cherry.svg',
    value: 2,
    rarity: 'common'
  },
  { 
    name: 'lemon', 
    file: '/images/symbols/lemon.svg',
    value: 3,
    rarity: 'common'
  },
  { 
    name: 'orange', 
    file: '/images/symbols/orange.svg',
    value: 4,
    rarity: 'common'
  },
  { 
    name: 'plum', 
    file: '/images/symbols/plum.svg',
    value: 5,
    rarity: 'uncommon'
  },
  { 
    name: 'bell', 
    file: '/images/symbols/bell.svg',
    value: 8,
    rarity: 'uncommon'
  },
  { 
    name: 'bar', 
    file: '/images/symbols/bar.svg',
    value: 10,
    rarity: 'rare'
  },
  { 
    name: 'seven', 
    file: '/images/symbols/seven.svg',
    value: 15,
    rarity: 'rare'
  },
  { 
    name: 'diamond', 
    file: '/images/symbols/diamond.svg',
    value: 25,
    rarity: 'legendary'
  }
];
`;

// Instructions for manual update
console.log('📝 MANUAL UPDATE INSTRUCTIONS:');
console.log('='.repeat(50));
console.log('1. Open public/js/slot-machine.js in your editor');
console.log('2. Find the SYMBOLS array or symbol configuration');
console.log('3. Replace it with the following configuration:');
console.log('\n' + newSymbolsConfig);

console.log('\n🎨 SYMBOL RENDERING UPDATE:');
console.log('='.repeat(50));
console.log('Update your symbol rendering function to use SVG files:');

const renderingCode = `
// Example symbol rendering function
function renderSymbol(symbol, container) {
  const img = document.createElement('img');
  img.src = symbol.file;
  img.alt = symbol.name;
  img.className = 'slot-symbol';
  img.style.width = '60px';
  img.style.height = '60px';
  container.appendChild(img);
}

// Or if using innerHTML:
function getSymbolHTML(symbol) {
  return \`<img src="\${symbol.file}" alt="\${symbol.name}" class="slot-symbol" />\`;
}
`;

console.log(renderingCode);

console.log('\n🔧 CSS STYLING:');
console.log('='.repeat(50));
console.log('Add this CSS to your stylesheet:');

const cssCode = `
.slot-symbol {
  width: 60px;
  height: 60px;
  object-fit: contain;
  filter: drop-shadow(0 0 10px rgba(0, 255, 255, 0.5));
  transition: all 0.3s ease;
}

.slot-symbol:hover {
  filter: drop-shadow(0 0 15px rgba(0, 255, 255, 0.8));
  transform: scale(1.05);
}

/* Rarity-based glow effects */
.slot-symbol.common {
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.4));
}

.slot-symbol.uncommon {
  filter: drop-shadow(0 0 10px rgba(0, 255, 0, 0.5));
}

.slot-symbol.rare {
  filter: drop-shadow(0 0 12px rgba(255, 0, 255, 0.6));
}

.slot-symbol.legendary {
  filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.8));
  animation: legendaryGlow 2s ease-in-out infinite alternate;
}

@keyframes legendaryGlow {
  from {
    filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.8));
  }
  to {
    filter: drop-shadow(0 0 25px rgba(255, 215, 0, 1));
  }
}

/* Spinning animation */
.slot-reel.spinning .slot-symbol {
  animation: spin 0.1s linear infinite;
}

@keyframes spin {
  from { transform: translateY(0); }
  to { transform: translateY(-100%); }
}
`;

console.log(cssCode);

console.log('\n🎯 INTEGRATION CHECKLIST:');
console.log('='.repeat(50));
console.log('✅ 1. Update SYMBOLS array in slot-machine.js');
console.log('✅ 2. Update symbol rendering functions');
console.log('✅ 3. Add CSS styling for symbols');
console.log('⚠️ 4. Test symbol display in browser');
console.log('⚠️ 5. Verify symbol animations work');
console.log('⚠️ 6. Check win detection with new symbols');

console.log('\n🔄 AUTOMATIC BACKUP & UPDATE:');
console.log('='.repeat(50));

// Create backup of original file
const backupFile = slotMachineFile + '.backup.' + Date.now();
try {
  fs.copyFileSync(slotMachineFile, backupFile);
  console.log(`✅ Backup created: ${backupFile}`);
} catch (err) {
  console.log(`❌ Could not create backup: ${err.message}`);
}

// Try to automatically update the file
console.log('\n🤖 ATTEMPTING AUTOMATIC UPDATE...');

// Look for existing SYMBOLS array and replace it
const symbolsRegex = /const\s+SYMBOLS\s*=\s*\[[\s\S]*?\];/;
const symbolsMatch = slotContent.match(symbolsRegex);

if (symbolsMatch) {
  console.log('✅ Found existing SYMBOLS array');
  
  // Replace the symbols array
  const updatedContent = slotContent.replace(symbolsRegex, newSymbolsConfig.trim());
  
  try {
    fs.writeFileSync(slotMachineFile, updatedContent);
    console.log('✅ Successfully updated slot-machine.js with new symbols!');
    console.log('✅ Original file backed up');
  } catch (err) {
    console.log(`❌ Could not write updated file: ${err.message}`);
    console.log('Please update manually using the instructions above.');
  }
} else {
  console.log('⚠️ Could not find existing SYMBOLS array');
  console.log('Please add the symbols configuration manually.');
}

console.log('\n🎮 TESTING RECOMMENDATIONS:');
console.log('='.repeat(50));
console.log('1. Start your server: npm start');
console.log('2. Open browser and navigate to your slot machine');
console.log('3. Check that symbols display correctly');
console.log('4. Test spinning animation');
console.log('5. Verify win detection works');
console.log('6. Check symbol hover effects');

console.log('\n🐛 TROUBLESHOOTING:');
console.log('='.repeat(50));
console.log('If symbols don\'t display:');
console.log('• Check browser console for 404 errors');
console.log('• Verify SVG files exist in public/images/symbols/');
console.log('• Check file permissions');
console.log('• Clear browser cache');

console.log('\n🔧 ADVANCED CONFIGURATION:');
console.log('='.repeat(50));

const advancedConfig = `
// Advanced symbol configuration with weights
const SYMBOL_WEIGHTS = {
  'cherry': 30,    // Most common
  'lemon': 25,
  'orange': 20,
  'plum': 15,
  'bell': 8,       // Uncommon
  'bar': 5,        // Rare
  'seven': 3,      // Very rare
  'diamond': 1     // Legendary
};

// Function to get weighted random symbol
function getWeightedRandomSymbol() {
  const totalWeight = Object.values(SYMBOL_WEIGHTS).reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  
  for (const symbol of SYMBOLS) {
    random -= SYMBOL_WEIGHTS[symbol.name];
    if (random <= 0) {
      return symbol;
    }
  }
  
  return SYMBOLS[0]; // Fallback
}
`;

console.log('Optional: Add weighted symbol selection:');
console.log(advancedConfig);

console.log('\n🎰 Symbol update script completed!');
console.log('Your slot machine is ready for the new neon symbols! ✨');