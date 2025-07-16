// Profile page audio initialization
document.addEventListener('DOMContentLoaded', () => {
  // Wait for audio manager to be ready
  const initProfileAudio = () => {
    if (window.audioManager && window.audioManager.isInitialized) {
      // Stop any existing music
      window.audioManager.stopAllMusic();
      
      // Start profile-specific music
      if (!window.audioManager.getMuted()) {
        setTimeout(() => {
          window.audioManager.startBackgroundMusic();
        }, 500);
      }
      
      console.log('🎵 Profile page audio initialized');
    } else {
      setTimeout(initProfileAudio, 100);
    }
  };
  
  initProfileAudio();
});