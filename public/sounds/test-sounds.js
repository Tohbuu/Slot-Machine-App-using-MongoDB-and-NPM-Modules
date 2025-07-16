// Enhanced test script to verify all sounds with better error handling
const requiredSounds = [
  'spin.mp3',
  'reel-stop.mp3', 
  'win-small.mp3',
  'win-big.mp3',
  'jackpot.mp3',
  'bonus.mp3',
  'button-click.mp3',
  'coin-drop.mp3',
  'level-up.mp3',
  'notification.mp3',
  'background-music.mp3'
];

let testResults = [];

function testSounds() {
  console.log('🔊 Testing Audio System...\n');
  
  requiredSounds.forEach((sound, index) => {
    const audio = new Audio(`/sounds/${sound}`);
    
    // Set up promise-based testing
    const testPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout'));
      }, 5000);

      audio.addEventListener('canplaythrough', () => {
        clearTimeout(timeout);
        console.log(`✅ ${sound} - Loaded successfully`);
        resolve({ sound, status: 'success', duration: audio.duration });
      });

      audio.addEventListener('error', (e) => {
        clearTimeout(timeout);
        console.log(`❌ ${sound} - Failed to load:`, e);
        reject({ sound, status: 'error', error: e });
      });

      // Try to load the audio
      audio.load();
    });

    testPromise
      .then(result => {
        testResults.push(result);
        // Try to play a short test
        if (sound === 'spin.mp3') {
          playTestSound(audio, sound);
        }
      })
      .catch(error => {
        testResults.push(error);
        console.log(`⚠️ ${sound} - Check if file exists and is accessible`);
      });
  });

  // Summary after 6 seconds
  setTimeout(showTestSummary, 6000);
}

function playTestSound(audio, soundName) {
  console.log(`🎵 Testing playback for ${soundName}...`);
  
  // Enable user interaction first
  document.addEventListener('click', () => {
    audio.play()
      .then(() => {
        console.log(`✅ ${soundName} - Playback successful`);
        setTimeout(() => audio.pause(), 1000); // Stop after 1 second
      })
      .catch(error => {
        console.log(`❌ ${soundName} - Playback failed:`, error);
        console.log('💡 Try clicking anywhere on the page first (browser autoplay policy)');
      });
  }, { once: true });
  
  console.log('👆 Click anywhere on the page to test sound playback');
}

function showTestSummary() {
  console.log('\n📊 Test Summary:');
  console.log('='.repeat(50));
  
  const successful = testResults.filter(r => r.status === 'success').length;
  const failed = testResults.filter(r => r.status === 'error').length;
  
  console.log(`✅ Successful: ${successful}/${requiredSounds.length}`);
  console.log(`❌ Failed: ${failed}/${requiredSounds.length}`);
  
  if (failed > 0) {
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if sound files exist in /public/sounds/');
    console.log('2. Verify file names match exactly (case-sensitive)');
    console.log('3. Ensure files are valid MP3 format');
    console.log('4. Check browser console for network errors');
  }
}

// Auto-run test when script loads
if (typeof window !== 'undefined') {
  testSounds();
} else {
  console.log('Run this script in a browser environment');
}