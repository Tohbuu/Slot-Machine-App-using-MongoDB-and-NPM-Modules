// Leaderboard page audio initialization
document.addEventListener('DOMContentLoaded', () => {
  // Wait for audio manager to be ready
  const initLeaderboardAudio = () => {
    if (window.audioManager && window.audioManager.isInitialized) {
      // Stop any existing music
      window.audioManager.stopAllMusic();
      
      // Start leaderboard-specific music
      if (!window.audioManager.getMuted()) {
        setTimeout(() => {
          window.audioManager.startBackgroundMusic();
        }, 500);
      }
      
      console.log('🎵 Leaderboard page audio initialized');
    } else {
      setTimeout(initLeaderboardAudio, 100);
    }
  };
  
  initLeaderboardAudio();
});