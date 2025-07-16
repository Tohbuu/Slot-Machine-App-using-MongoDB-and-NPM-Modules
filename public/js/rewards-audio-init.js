// Rewards page audio initialization
document.addEventListener('DOMContentLoaded', () => {
  // Wait for audio manager to be ready
  const initRewardsAudio = () => {
    if (window.audioManager && window.audioManager.isInitialized) {
      // Stop any existing music
      window.audioManager.stopAllMusic();
      
      // Start rewards-specific music
      if (!window.audioManager.getMuted()) {
        setTimeout(() => {
          window.audioManager.startBackgroundMusic();
        }, 500);
      }
      
      console.log('🎵 Rewards page audio initialized');
    } else {
      setTimeout(initRewardsAudio, 100);
    }
  };
  
  initRewardsAudio();
});