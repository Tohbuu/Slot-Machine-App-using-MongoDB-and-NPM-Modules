// Boosters page audio initialization
document.addEventListener('DOMContentLoaded', () => {
  // Wait for audio manager to be ready
  const initBoostersAudio = () => {
    if (window.audioManager && window.audioManager.isInitialized) {
      // Stop any existing music
      window.audioManager.stopAllMusic();
      
      // Start boosters-specific music
      if (!window.audioManager.getMuted()) {
        setTimeout(() => {
          window.audioManager.startBackgroundMusic();
        }, 500);
      }
      
      console.log('🎵 Boosters page audio initialized');
    } else {
      setTimeout(initBoostersAudio, 100);
    }
  };
  
  initBoostersAudio();
});