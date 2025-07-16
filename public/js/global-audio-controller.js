// Global Audio Controller - Manages audio across all pages
class GlobalAudioController {
  constructor() {
    this.audioManager = null;
    this.isInitialized = false;
    this.buttonSoundSelectors = [
      'button',
      '.btn',
      '.submit-btn',
      '.purchase-btn',
      '.claim-btn',
      '.nav-link',
      '.control-btn',
      '.tab-btn',
      '.theme-option',
      '.status-option',
      '.dropdown-action',
      '.audio-action-btn',
      '.spotify-control-btn',
      '.bet-btn',
      '.payline-dropdown-btn',
      '.upload-btn',
      '.close-bonus',
      '.cashout-btn'
    ];
    
    this.specialSounds = {
      '.spin-btn': 'spin',
      '.cashout-btn': 'coin-drop',
      '.claim-btn': 'coin-drop',
      '.purchase-btn': 'coin-drop'
    };
    
    this.init();
  }

  async init() {
    console.log('🎮 Initializing Global Audio Controller...');
    
    // Wait for audio manager to be available
    await this.waitForAudioManager();
    
    // Setup global button sounds
    this.setupGlobalButtonSounds();
    
    // Setup page transition handling
    this.setupPageTransitions();
    
    // Setup music continuity
    this.setupMusicContinuity();
    
    // Setup dynamic element handling
    this.setupDynamicElementHandling();
    
    this.isInitialized = true;
    console.log('✅ Global Audio Controller initialized');
  }

  async waitForAudioManager() {
    return new Promise((resolve) => {
      const checkManager = () => {
        if (window.audioManager && window.audioManager.isInitialized) {
          this.audioManager = window.audioManager;
          resolve();
        } else {
          setTimeout(checkManager, 100);
        }
      };
      checkManager();
    });
  }

  setupGlobalButtonSounds() {
    console.log('🔊 Setting up global button sounds...');
    
    // Add sounds to regular buttons
    this.buttonSoundSelectors.forEach(selector => {
      this.addSoundToElements(selector, 'button-click');
    });
    
    // Add special sounds
    Object.entries(this.specialSounds).forEach(([selector, sound]) => {
      this.addSoundToElements(selector, sound);
    });
    
    // Add form submission sounds
    this.setupFormSounds();
    
    console.log('✅ Global button sounds setup complete');
  }

  addSoundToElements(selector, soundName) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      // Skip if already has sound handler
      if (element._hasAudioHandler) return;
      
      const soundHandler = (e) => {
        // Don't play sound if element is disabled
        if (element.disabled || element.classList.contains('disabled')) {
          return;
        }
        
        // Don't play sound if audio is muted
        if (this.audioManager && !this.audioManager.getMuted()) {
          this.audioManager.playSound(soundName);
        }
      };
      
      element.addEventListener('click', soundHandler);
      element._hasAudioHandler = true;
      element._audioHandler = soundHandler;
    });
    
    if (elements.length > 0) {
      console.log(`🔊 Added ${soundName} to ${elements.length} ${selector} elements`);
    }
  }

  setupFormSounds() {
    // Add sounds to form submissions
    document.querySelectorAll('form').forEach(form => {
      if (form._hasAudioHandler) return;
      
      form.addEventListener('submit', () => {
        if (this.audioManager && !this.audioManager.getMuted()) {
          this.audioManager.playSound('button-click');
        }
      });
      
      form._hasAudioHandler = true;
    });
  }

  setupPageTransitions() {
    // Save audio state before page unload
    window.addEventListener('beforeunload', () => {
      this.saveAudioState();
    });
    
    // Handle navigation clicks
    document.querySelectorAll('a[href]').forEach(link => {
      if (link._hasTransitionHandler) return;
      
      link.addEventListener('click', (e) => {
        // Only handle internal links
        if (link.hostname === window.location.hostname) {
          this.saveAudioState();
          
          // Play navigation sound
          if (this.audioManager && !this.audioManager.getMuted()) {
            this.audioManager.playSound('button-click');
          }
        }
      });
      
      link._hasTransitionHandler = true;
    });
  }

  setupMusicContinuity() {
    // Start background music if not already playing
    if (this.audioManager && !this.audioManager.getMuted()) {
      setTimeout(() => {
        this.startBackgroundMusic();
      }, 1000);
    }
    
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.audioManager && !this.audioManager.getMuted()) {
        // Resume music when page becomes visible
        setTimeout(() => {
          this.startBackgroundMusic();
        }, 500);
      }
    });
  }

  setupDynamicElementHandling() {
    // Use MutationObserver to handle dynamically added elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.addSoundsToNewElements(node);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  addSoundsToNewElements(element) {
    // Check if the element itself matches any selector
    this.buttonSoundSelectors.forEach(selector => {
      if (element.matches && element.matches(selector) && !element._hasAudioHandler) {
        this.addSoundToElements(selector, 'button-click');
      }
    });
    
    // Check special sounds
    Object.entries(this.specialSounds).forEach(([selector, sound]) => {
      if (element.matches && element.matches(selector) && !element._hasAudioHandler) {
        this.addSoundToElements(selector, sound);
      }
    });
    
    // Check children
    this.buttonSoundSelectors.forEach(selector => {
      const children = element.querySelectorAll ? element.querySelectorAll(selector) : [];
      children.forEach(child => {
        if (!child._hasAudioHandler) {
          this.addSoundToElements(selector, 'button-click');
        }
      });
    });
  }

  startBackgroundMusic() {
    if (!this.audioManager) return;
    
    // Check if music is already playing
    const isLocalMusicPlaying = this.audioManager.sounds['background-music'] && 
                               !this.audioManager.sounds['background-music'].audio.paused;
    const isSpotifyPlaying = this.audioManager.useSpotifyForBackground && 
                            this.audioManager.isSpotifyPlaying;
    
    if (!isLocalMusicPlaying && !isSpotifyPlaying) {
      this.audioManager.startBackgroundMusic();
    }
  }

  saveAudioState() {
    if (!this.audioManager) return;
    
    const audioState = {
      musicVolume: this.audioManager.musicVolume,
      sfxVolume: this.audioManager.sfxVolume,
      isMuted: this.audioManager.isMuted,
      useSpotifyForBackground: this.audioManager.useSpotifyForBackground,
      isSpotifyPlaying: this.audioManager.isSpotifyPlaying,
      timestamp: Date.now()
    };
    
    localStorage.setItem('globalAudioState', JSON.stringify(audioState));
  }

  restoreAudioState() {
    const savedState = localStorage.getItem('globalAudioState');
    if (!savedState || !this.audioManager) return;
    
    try {
      const state = JSON.parse(savedState);
      
      // Only restore if recent (within 10 seconds)
      if (Date.now() - state.timestamp < 10000) {
        this.audioManager.setMusicVolume(state.musicVolume);
        this.audioManager.setSFXVolume(state.sfxVolume);
        
        if (state.isMuted !== this.audioManager.isMuted) {
          this.audioManager.toggleMute();
        }
        
        // Restore Spotify settings
        if (state.useSpotifyForBackground !== this.audioManager.useSpotifyForBackground) {
          this.audioManager.useSpotifyForBackground = state.useSpotifyForBackground;
        }
      }
    } catch (error) {
      console.warn('Error restoring audio state:', error);
    }
  }

  // Public methods for external use
  playSound(soundName) {
    if (this.audioManager && !this.audioManager.getMuted()) {
      this.audioManager.playSound(soundName);
    }
  }

  playButtonSound() {
    this.playSound('button-click');
  }

  playNotificationSound() {
    this.playSound('notification');
  }

  playSuccessSound() {
    this.playSound('coin-drop');
  }

  playErrorSound() {
    this.playSound('notification');
  }
}

// Initialize global audio controller
let globalAudioController;

document.addEventListener('DOMContentLoaded', () => {
  // Wait a bit for other scripts to load
  setTimeout(() => {
    globalAudioController = new GlobalAudioController();
    window.globalAudioController = globalAudioController;
  }, 500);
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GlobalAudioController;
}
