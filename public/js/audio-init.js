// Audio system initialization
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎵 Initializing audio system...');
  
  // Create global audio manager instance
  window.audioManager = new EnhancedAudioManager();
  
  // Wait for audio manager to be fully initialized
  const checkAudioReady = setInterval(() => {
    if (window.audioManager && window.audioManager.isInitialized) {
      clearInterval(checkAudioReady);
      
      // Dispatch audio system ready event
      document.dispatchEvent(new CustomEvent('audioSystemReady', {
        detail: {
          audioManager: window.audioManager
        }
      }));
      
      console.log('✅ Audio system ready');
    }
  }, 100);
  
  // Handle Spotify authentication callback
  if (window.location.hash.includes('access_token')) {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    
    if (accessToken) {
      localStorage.setItem('spotify_access_token', accessToken);
      console.log('🎵 Spotify access token saved');
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Reinitialize audio manager with Spotify
      if (window.audioManager) {
        window.audioManager.spotifyToken = accessToken;
        window.audioManager.loadSpotifySDK();
      }
    }
  }
});

// Global audio control functions
window.playGlobalSound = function(soundName, options = {}) {
  if (window.audioManager && !window.audioManager.getMuted()) {
    window.audioManager.playSound(soundName, options);
  }
};

window.toggleGlobalMute = function() {
  if (window.audioManager) {
    window.audioManager.toggleMute();
  }
};

window.setGlobalMusicVolume = function(volume) {
  if (window.audioManager) {
    window.audioManager.setMusicVolume(volume);
  }
};

window.setGlobalSFXVolume = function(volume) {
  if (window.audioManager) {
    window.audioManager.setSFXVolume(volume);
  }
};

// Cross-page audio continuity
window.addEventListener('beforeunload', () => {
  if (window.audioManager && window.audioManager.isSpotifyReady) {
    window.audioManager.syncPlaybackState();
  }
});

// Handle page focus/blur for audio continuity
window.addEventListener('focus', () => {
  if (window.audioManager && !window.audioManager.getMuted()) {
    window.audioManager.startBackgroundMusic();
  }
});

window.addEventListener('blur', () => {
  // Don't stop music on blur - let it continue playing
  // This allows music to continue when switching tabs
});

// Global function to play button sounds
window.playButtonSound = function(soundName = 'button-click') {
  if (window.audioManager && !window.audioManager.getMuted()) {
    window.audioManager.playSound(soundName);
  }
};

// Global function to ensure music continuity
window.ensureMusicContinuity = function() {
  if (window.audioManager) {
    window.audioManager.ensureMusicContinuity();
  }
};

// Auto-start background music on page load
document.addEventListener('DOMContentLoaded', () => {
  // Wait for audio manager to be ready
  const startMusic = () => {
    if (window.audioManager && window.audioManager.isInitialized) {
      if (!window.audioManager.getMuted()) {
        setTimeout(() => {
          window.audioManager.startBackgroundMusic();
        }, 1500); // Delay to ensure everything is loaded
      }
    } else {
      setTimeout(startMusic, 100);
    }
  };
  
  startMusic();
});