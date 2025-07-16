class EnhancedAudioManager {
  constructor() {
    this.sounds = {};
    this.musicVolume = 50;
    this.sfxVolume = 70;
    this.isMuted = false;
    this.isDropdownOpen = false;
    this.isInitialized = false;
    
    // Spotify integration properties (separate from local audio)
    this.spotifyPlayer = null;
    this.spotifyToken = null;
    this.spotifyDeviceId = null;
    this.isSpotifyReady = false;
    this.isSpotifyPlaying = false;
    this.currentTrack = null;
    this.spotifyVolume = 50;
    this.useSpotifyForBackground = false;
    
    this.init();
    this.setupGlobalButtonSounds();
  }

  async init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupAudioControls());
    } else {
      this.setupAudioControls();
    }
    
    this.loadSounds();
    this.bindEvents();
    
    // Initialize Spotify if user is logged in
    await this.initializeSpotify();
    
    // Initialize cross-page playback after Spotify is ready
    if (this.isSpotifyReady) {
      this.initializeCrossPagePlayback();
    }
    
    // Restore music continuity from previous page
    this.restoreMusicContinuity();
    
    // Start background music if not muted
    if (!this.isMuted) {
      setTimeout(() => {
        this.startBackgroundMusic();
      }, 1000);
    }

    // Ensure background music always plays unless muted
    setInterval(() => {
      if (!this.isMuted && !this.useSpotifyForBackground) {
        const musicTrack = this.getPageSpecificMusic();
        if (musicTrack && this.sounds[musicTrack] && this.sounds[musicTrack].audio) {
          const audio = this.sounds[musicTrack].audio;
          if (audio.paused) {
            this.playSound(musicTrack, { loop: true, volume: this.musicVolume / 100 });
          }
        }
      }
      // If using Spotify, ensure it's playing if not muted
      if (!this.isMuted && this.useSpotifyForBackground && this.isSpotifyReady && !this.isSpotifyPlaying) {
        this.playSpotify();
      }
    }, 2000); // Check every 2 seconds
  }

  async initializeSpotify() {
    // Check if user has Spotify token
    const spotifyToken = localStorage.getItem('spotify_access_token');
    if (spotifyToken) {
      this.spotifyToken = spotifyToken;
      await this.loadSpotifySDK();
    }
  }

  async loadSpotifySDK() {
    return new Promise((resolve, reject) => {
      if (window.Spotify) {
        this.setupSpotifyPlayer();
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      
      window.onSpotifyWebPlaybackSDKReady = () => {
        this.setupSpotifyPlayer();
        resolve();
      };
      
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  setupSpotifyPlayer() {
    if (!this.spotifyToken) return;

    this.spotifyPlayer = new Spotify.Player({
      name: 'Neon Spin Slot Machine',
      getOAuthToken: cb => { cb(this.spotifyToken); },
      volume: this.spotifyVolume / 100
    });

    // Error handling
    this.spotifyPlayer.addListener('initialization_error', ({ message }) => {
      console.error('Spotify initialization error:', message);
    });

    this.spotifyPlayer.addListener('authentication_error', ({ message }) => {
      console.error('Spotify authentication error:', message);
      this.handleSpotifyAuthError();
    });

    this.spotifyPlayer.addListener('account_error', ({ message }) => {
      console.error('Spotify account error:', message);
    });

    this.spotifyPlayer.addListener('playback_error', ({ message }) => {
      console.error('Spotify playback error:', message);
    });

    // Playback status updates
    this.spotifyPlayer.addListener('player_state_changed', (state) => {
      if (!state) return;
      
      this.isSpotifyPlaying = !state.paused;
      this.currentTrack = state.track_window.current_track;
      this.updateSpotifyControls();
    });

    // Ready
    this.spotifyPlayer.addListener('ready', ({ device_id }) => {
      console.log('🎵 Spotify player ready with Device ID:', device_id);
      this.spotifyDeviceId = device_id;
      this.isSpotifyReady = true;
      this.updateSpotifyUI();
    });

    // Not Ready
    this.spotifyPlayer.addListener('not_ready', ({ device_id }) => {
      console.log('Spotify player not ready with Device ID:', device_id);
      this.isSpotifyReady = false;
    });

    // Connect to the player
    this.spotifyPlayer.connect();
  }

  setupAudioControls() {
    const toggleBtn = document.getElementById('audio-toggle-btn');
    const dropdown = document.getElementById('audio-dropdown');
    
    if (!toggleBtn || !dropdown) {
      console.warn('Audio controls not found in DOM');
      return;
    }

    console.log('🔊 Setting up audio controls...');

    // Toggle dropdown with proper event handling
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Audio button clicked, dropdown open:', this.isDropdownOpen);
      this.toggleDropdown();
    });

    // Prevent dropdown from closing when clicking inside it
    dropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.audio-control-panel')) {
        this.closeDropdown();
      }
    });

    // Setup volume sliders
    this.setupVolumeControls();
    
    // Setup action buttons
    this.setupActionButtons();
    
    // Setup Spotify controls
    this.setupSpotifyControls();
    
    // Load saved settings
    this.loadSettings();
    
    // Update initial state
    this.updateAudioState();
    
    this.isInitialized = true;
    console.log('✅ Audio controls initialized');
  }

  setupSpotifyControls() {
    // Add Spotify login button
    const spotifyLoginBtn = document.getElementById('spotify-login-btn');
    if (spotifyLoginBtn) {
      spotifyLoginBtn.addEventListener('click', () => this.loginToSpotify());
    }

    // Add Spotify control buttons
    const spotifyPlayBtn = document.getElementById('spotify-play');
    const spotifyPauseBtn = document.getElementById('spotify-pause');
    const spotifyPrevBtn = document.getElementById('spotify-prev');
    const spotifyNextBtn = document.getElementById('spotify-next');
    const spotifyToggleBtn = document.getElementById('spotify-toggle');

    if (spotifyPlayBtn) {
      spotifyPlayBtn.addEventListener('click', () => this.playSpotify());
    }
    if (spotifyPauseBtn) {
      spotifyPauseBtn.addEventListener('click', () => this.pauseSpotify());
    }
    if (spotifyPrevBtn) {
      spotifyPrevBtn.addEventListener('click', () => this.previousTrack());
    }
    if (spotifyNextBtn) {
      spotifyNextBtn.addEventListener('click', () => this.nextTrack());
    }
    if (spotifyToggleBtn) {
      spotifyToggleBtn.addEventListener('click', () => this.toggleSpotifyBackground());
    }

    // Spotify volume control
    const spotifyVolumeSlider = document.getElementById('spotify-volume');
    if (spotifyVolumeSlider) {
      spotifyVolumeSlider.addEventListener('input', (e) => {
        this.spotifyVolume = parseInt(e.target.value);
        this.updateSpotifyVolume();
      });
    }
  }

  async loginToSpotify() {
    try {
      // Fetch client ID from server
      const configResponse = await fetch('/api/config');
      const config = await configResponse.json();
      const clientId = config.spotifyClientId;
      
      if (!clientId) {
        alert('Spotify integration not configured on server. Please contact administrator.');
        return;
      }
      
      const redirectUri = window.location.origin + '/spotify-callback';
      const scopes = [
        'streaming',
        'user-read-email',
        'user-read-private',
        'user-read-playback-state',
        'user-modify-playback-state',
        'user-read-currently-playing'
      ].join(' ');

      const authUrl = `https://accounts.spotify.com/authorize?` +
        `client_id=${clientId}&` +
        `response_type=token&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `show_dialog=true`;

      // Open Spotify auth in popup
      const popup = window.open(
        authUrl, 
        'spotify-auth', 
        'width=500,height=700,scrollbars=yes,resizable=yes'
      );
      
      // Listen for messages from popup
      const messageHandler = (event) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'spotify-auth-success') {
          this.spotifyToken = event.data.token;
          this.loadSpotifySDK().then(() => {
            console.log('🎵 Spotify SDK loaded successfully');
            this.updateSpotifyUI();
          });
          window.removeEventListener('message', messageHandler);
        } else if (event.data.type === 'spotify-auth-error') {
          console.error('Spotify auth error:', event.data.error);
          alert('Spotify authentication failed: ' + event.data.error);
          window.removeEventListener('message', messageHandler);
        }
      };
      
      window.addEventListener('message', messageHandler);
      
      // Check if popup was closed manually
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          
          // Check if token was saved anyway
          const token = localStorage.getItem('spotify_access_token');
          if (token && token !== this.spotifyToken) {
            this.spotifyToken = token;
            this.loadSpotifySDK();
          }
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error fetching Spotify config:', error);
      alert('Failed to load Spotify configuration');
    }
  }

  handleSpotifyAuthError() {
    localStorage.removeItem('spotify_access_token');
    this.spotifyToken = null;
    this.isSpotifyReady = false;
    this.updateSpotifyUI();
  }

  async playSpotify() {
    if (!this.spotifyPlayer || !this.isSpotifyReady) return;
    
    try {
      await this.spotifyPlayer.resume();
      this.isSpotifyPlaying = true;
      this.updateSpotifyControls();
    } catch (error) {
      console.error('Error playing Spotify:', error);
    }
  }

  async pauseSpotify() {
    if (!this.spotifyPlayer || !this.isSpotifyReady) return;
    
    try {
      await this.spotifyPlayer.pause();
      this.isSpotifyPlaying = false;
      this.updateSpotifyControls();
    } catch (error) {
      console.error('Error pausing Spotify:', error);
    }
  }

  async previousTrack() {
    if (!this.spotifyPlayer || !this.isSpotifyReady) return;
    
    try {
      await this.spotifyPlayer.previousTrack();
    } catch (error) {
      console.error('Error going to previous track:', error);
    }
  }

  async nextTrack() {
    if (!this.spotifyPlayer || !this.isSpotifyReady) return;
    
    try {
      await this.spotifyPlayer.nextTrack();
    } catch (error) {
      console.error('Error going to next track:', error);
    }
  }

  toggleSpotifyBackground() {
    this.useSpotifyForBackground = !this.useSpotifyForBackground;
    localStorage.setItem('useSpotifyForBackground', this.useSpotifyForBackground);
    
    if (this.useSpotifyForBackground) {
      // Stop local background music
      this.stopSound('background-music');
      // Start Spotify if not playing
      if (!this.isSpotifyPlaying) {
        this.playSpotify();
      }
    } else {
      // Pause Spotify
      this.pauseSpotify();
      // Start local background music
      if (!this.isMuted) {
        this.startBackgroundMusic();
      }
    }
    
    this.updateSpotifyControls();
  }

  updateSpotifyVolume() {
    if (!this.spotifyPlayer || !this.isSpotifyReady) return;
    
    const volume = this.isMuted ? 0 : (this.spotifyVolume * this.musicVolume) / 10000;
    this.spotifyPlayer.setVolume(volume);
    
    const volumeDisplay = document.getElementById('spotify-volume-value');
    if (volumeDisplay) {
      volumeDisplay.textContent = `${this.spotifyVolume}%`;
    }
  }

  updateSpotifyControls() {
    const playBtn = document.getElementById('spotify-play');
    const pauseBtn = document.getElementById('spotify-pause');
    const trackInfo = document.getElementById('spotify-track-info');
    const toggleBtn = document.getElementById('spotify-toggle');

    if (playBtn && pauseBtn) {
      if (this.isSpotifyPlaying) {
        playBtn.style.display = 'none';
        pauseBtn.style.display = 'inline-block';
      } else {
        playBtn.style.display = 'inline-block';
        pauseBtn.style.display = 'none';
      }
    }

    if (trackInfo && this.currentTrack) {
      trackInfo.innerHTML = `
        <div class="track-name">${this.currentTrack.name}</div>
        <div class="track-artist">${this.currentTrack.artists[0].name}</div>
      `;
    }

    if (toggleBtn) {
      toggleBtn.classList.toggle('active', this.useSpotifyForBackground);
      toggleBtn.innerHTML = this.useSpotifyForBackground ? 
        '<i class="fab fa-spotify"></i> Using Spotify' : 
        '<i class="fab fa-spotify"></i> Use Spotify';
    }
  }

  updateSpotifyUI() {
    const spotifySection = document.getElementById('spotify-section');
    const spotifyLogin = document.getElementById('spotify-login');
    const spotifyControls = document.getElementById('spotify-controls');

    if (spotifySection) {
      if (this.isSpotifyReady) {
        spotifyLogin.style.display = 'none';
        spotifyControls.style.display = 'block';
        this.updateSpotifyControls();
      } else {
        spotifyLogin.style.display = 'block';
        spotifyControls.style.display = 'none';
      }
    }
  }

  setupVolumeControls() {
    const musicSlider = document.getElementById('music-volume');
    const sfxSlider = document.getElementById('sfx-volume');
    const musicValue = document.getElementById('music-value');
    const sfxValue = document.getElementById('sfx-value');

    if (musicSlider && musicValue) {
      musicSlider.addEventListener('input', (e) => {
        this.musicVolume = parseInt(e.target.value);
        musicValue.textContent = `${this.musicVolume}%`;
        this.updateMusicVolume();
        
        // Update Spotify volume if it's being used for background music
        if (this.useSpotifyForBackground && this.spotifyPlayer && this.isSpotifyReady) {
          this.updateSpotifyVolume();
        }
        
        // Dispatch settings change event
        document.dispatchEvent(new CustomEvent('audioSettingsChanged', {
          detail: {
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume,
            isMuted: this.isMuted
          }
        }));
        
        console.log('Music volume:', this.musicVolume);
      });
    }

    if (sfxSlider && sfxValue) {
      sfxSlider.addEventListener('input', (e) => {
        this.sfxVolume = parseInt(e.target.value);
        sfxValue.textContent = `${this.sfxVolume}%`;
        this.updateSFXVolume();
        
        // Dispatch settings change event
        document.dispatchEvent(new CustomEvent('audioSettingsChanged', {
          detail: {
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume,
            isMuted: this.isMuted
          }
        }));
        
        console.log('SFX volume:', this.sfxVolume);
      });
    }
  }

  setupActionButtons() {
    const testBtn = document.getElementById('test-audio');
    const muteBtn = document.getElementById('mute-all');

    if (testBtn) {
      testBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.testAudio();
      });
    }

    if (muteBtn) {
      muteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleMute();
      });
    }
  }

  toggleDropdown() {
    const dropdown = document.getElementById('audio-dropdown');
    if (!dropdown) return;

    this.isDropdownOpen = !this.isDropdownOpen;
    
    if (this.isDropdownOpen) {
      dropdown.classList.add('show');
      console.log('Dropdown opened');
    } else {
      dropdown.classList.remove('show');
      console.log('Dropdown closed');
    }
  }

  closeDropdown() {
    const dropdown = document.getElementById('audio-dropdown');
    if (dropdown && this.isDropdownOpen) {
      dropdown.classList.remove('show');
      this.isDropdownOpen = false;
      console.log('Dropdown closed');
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    this.updateAudioState();
    localStorage.setItem('audioMuted', this.isMuted);
    
    // Handle Spotify mute/unmute separately
    if (this.useSpotifyForBackground && this.spotifyPlayer && this.isSpotifyReady) {
      if (this.isMuted) {
        this.spotifyPlayer.setVolume(0);
      } else {
        this.updateSpotifyVolume();
      }
    }
    
    // Dispatch settings change event
    document.dispatchEvent(new CustomEvent('audioSettingsChanged', {
      detail: {
        musicVolume: this.musicVolume,
        sfxVolume: this.sfxVolume,
        isMuted: this.isMuted
      }
    }));
    
    console.log('Audio muted:', this.isMuted);
  }

  updateAudioState() {
    const toggleBtn = document.getElementById('audio-toggle-btn');
    const audioIcon = document.getElementById('audio-icon');
    const statusText = document.getElementById('audio-status-text');
    const muteBtn = document.getElementById('mute-all');

    if (!toggleBtn) return;

    if (this.isMuted) {
      toggleBtn.classList.add('muted');
      if (audioIcon) audioIcon.className = 'fas fa-volume-mute';
      if (statusText) statusText.textContent = 'OFF';
      if (muteBtn) muteBtn.innerHTML = '<i class="fas fa-volume-up"></i> Unmute All';
      
      // Mute all local sounds
      Object.values(this.sounds).forEach(sound => {
        if (sound.audio) sound.audio.muted = true;
      });
      
      // Mute Spotify separately if it's being used
      if (this.spotifyPlayer && this.isSpotifyReady) {
        this.spotifyPlayer.setVolume(0);
      }
    } else {
      toggleBtn.classList.remove('muted');
      if (audioIcon) audioIcon.className = 'fas fa-volume-up';
      if (statusText) statusText.textContent = 'ON';
      if (muteBtn) muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i> Mute All';
      
      // Unmute all local sounds
      Object.values(this.sounds).forEach(sound => {
        if (sound.audio) sound.audio.muted = false;
      });
      
      // Unmute Spotify and restore volume if it's being used
      if (this.spotifyPlayer && this.isSpotifyReady) {
        this.updateSpotifyVolume();
      }
    }

    // Update wave animation
    const waves = document.querySelectorAll('.wave');
    waves.forEach(wave => {
      if (this.isMuted) {
        wave.style.animationPlayState = 'paused';
        wave.style.opacity = '0.3';
      } else {
        wave.style.animationPlayState = 'running';
        wave.style.opacity = '1';
      }
    });
  }

  // LOCAL SOUND MANAGEMENT (separate from Spotify)
  stopSound(name) {
    const sound = this.sounds[name];
    if (sound && sound.audio) {
      sound.audio.pause();
      sound.audio.currentTime = 0;
    }
  }

  getPageSpecificMusic() {
    const currentPage = window.location.pathname;
    const musicMap = {
      '/': 'background-music',           // index.html - default music
      '/boosters': 'boosters-music',     // boosters.html
      '/rewards': 'rewards-music',       // rewards.html  
      '/profile': 'profile-music',       // profile.html
      '/leaderboard': 'leaderboard-music' // leaderboard.html
    };
    
    return musicMap[currentPage]; // No fallback - return undefined if page not found
  }

  startBackgroundMusic() {
    if (this.isMuted) return;

    const musicTrack = this.getPageSpecificMusic();
    if (!musicTrack) {
      console.log(`🎵 No specific music defined for page: ${window.location.pathname}`);
      return;
    }

    // Only start if not already playing
    if (
      this.sounds[musicTrack] &&
      this.sounds[musicTrack].audio &&
      !this.sounds[musicTrack].audio.paused
    ) {
      // Already playing correct music, do nothing
      return;
    }

    if (this.useSpotifyForBackground && this.isSpotifyReady) {
      this.playSpotify();
    } else if (this.sounds[musicTrack]) {
      this.stopAllMusic();
      if (this.sounds[musicTrack].loaded) {
        this.playSound(musicTrack, { loop: true, volume: this.musicVolume / 100 });
        console.log(`🎵 Playing: ${musicTrack}`);
      } else {
        console.log(`🎵 Waiting for ${musicTrack} to load...`);
        this.sounds[musicTrack].audio.addEventListener(
          'canplaythrough',
          () => {
            this.sounds[musicTrack].loaded = true;
            this.playSound(musicTrack, { loop: true, volume: this.musicVolume / 100 });
            console.log(`🎵 Playing: ${musicTrack} (after loading)`);
          },
          { once: true }
        );
        this.sounds[musicTrack].audio.load();
      }
    } else {
      console.error(`🎵 Music track not found: ${musicTrack}`);
    }
  }

  stopBackgroundMusic() {
    if (this.useSpotifyForBackground && this.isSpotifyReady) {
      this.pauseSpotify();
    } else {
      // Use page-specific music
      const musicTrack = this.getPageSpecificMusic();
      if (musicTrack) {
        this.stopSound(musicTrack);
      }
    }
  }

  bindEvents() {
    // Load saved settings
    this.loadSettings();
    
    // Update initial state
    this.updateAudioState();
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // M key to toggle mute
      if (e.key.toLowerCase() === 'm' && e.ctrlKey) {
        e.preventDefault();
        this.toggleMute();
      }
      
      // Spotify controls (only when Spotify is active)
      if (this.isSpotifyReady && this.useSpotifyForBackground) {
        // Space to play/pause
        if (e.code === 'Space' && e.ctrlKey) {
          e.preventDefault();
          if (this.isSpotifyPlaying) {
            this.pauseSpotify();
          } else {
            this.playSpotify();
          }
        }
        // Arrow keys for next/previous
        if (e.key === 'ArrowRight' && e.ctrlKey) {
          e.preventDefault();
          this.nextTrack();
        }
        if (e.key === 'ArrowLeft' && e.ctrlKey) {
          e.preventDefault();
          this.previousTrack();
        }
      }
    });

    // Page visibility change - handle both local and Spotify music
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !this.isMuted) {
        // Only start music if not already playing
        const musicTrack = this.getPageSpecificMusic();
        if (
          musicTrack &&
          this.sounds[musicTrack] &&
          this.sounds[musicTrack].audio &&
          this.sounds[musicTrack].audio.paused
        ) {
          this.startBackgroundMusic();
        }
      }
    });

    // Enable audio context on first user interaction
    document.addEventListener('click', this.enableAudioContext.bind(this), { once: true });
    document.addEventListener('touchstart', this.enableAudioContext.bind(this), { once: true });
    
    // Save settings periodically
    setInterval(() => {
      this.saveSpotifySettings();
    }, 30000); // Save every 30 seconds
    
    // Save music state when leaving page
    window.addEventListener('beforeunload', () => {
      this.ensureMusicContinuity();
    });
  }

  enableAudioContext() {
    console.log('🎵 Audio context enabled by user interaction');
    
    // Try to play a silent sound to unlock audio context for local sounds
    Object.values(this.sounds).forEach(sound => {
      if (sound.audio && sound.loaded) {
        const originalVolume = sound.audio.volume;
        sound.audio.volume = 0;
        sound.audio.play().then(() => {
          sound.audio.pause();
          sound.audio.currentTime = 0;
          sound.audio.volume = originalVolume;
        }).catch(() => {
          // Ignore errors for silent unlock attempt
        });
      }
    });
  }

  loadSettings() {
    const savedMusicVolume = localStorage.getItem('musicVolume');
    const savedSFXVolume = localStorage.getItem('sfxVolume');
    const savedMuted = localStorage.getItem('audioMuted');
    const savedSpotifyVolume = localStorage.getItem('spotifyVolume');
    const savedUseSpotify = localStorage.getItem('useSpotifyForBackground');

    if (savedMusicVolume !== null) {
      this.musicVolume = parseInt(savedMusicVolume);
      const musicSlider = document.getElementById('music-volume');
      const musicValue = document.getElementById('music-value');
      if (musicSlider) musicSlider.value = this.musicVolume;
      if (musicValue) musicValue.textContent = `${this.musicVolume}%`;
    }

    if (savedSFXVolume !== null) {
      this.sfxVolume = parseInt(savedSFXVolume);
      const sfxSlider = document.getElementById('sfx-volume');
      const sfxValue = document.getElementById('sfx-value');
      if (sfxSlider) sfxSlider.value = this.sfxVolume;
      if (sfxValue) sfxValue.textContent = `${this.sfxVolume}%`;
    }

    if (savedMuted !== null) {
      this.isMuted = savedMuted === 'true';
    }

    if (savedSpotifyVolume !== null) {
      this.spotifyVolume = parseInt(savedSpotifyVolume);
      const spotifySlider = document.getElementById('spotify-volume');
      const spotifyValue = document.getElementById('spotify-volume-value');
      if (spotifySlider) spotifySlider.value = this.spotifyVolume;
      if (spotifyValue) spotifyValue.textContent = `${this.spotifyVolume}%`;
    }

    if (savedUseSpotify !== null) {
      this.useSpotifyForBackground = savedUseSpotify === 'true';
    }
  }

  // PUBLIC API METHODS (for external use)
  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(100, volume));
    this.updateMusicVolume();
    
    const musicSlider = document.getElementById('music-volume');
    const musicValue = document.getElementById('music-value');
    if (musicSlider) musicSlider.value = this.musicVolume;
    if (musicValue) musicValue.textContent = `${this.musicVolume}%`;
  }

  setSFXVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(100, volume));
    this.updateSFXVolume();
    
    const sfxSlider = document.getElementById('sfx-volume');
    const sfxValue = document.getElementById('sfx-value');
    if (sfxSlider) sfxSlider.value = this.sfxVolume;
    if (sfxValue) sfxValue.textContent = `${this.sfxVolume}%`;
  }

  getMuted() {
    return this.isMuted;
  }

  getMusicVolume() {
    return this.musicVolume;
  }

  getSFXVolume() {
    return this.sfxVolume;
  }

  getSoundStatus() {
    const status = {};
    Object.keys(this.sounds).forEach(name => {
      const sound = this.sounds[name];
      status[name] = {
        loaded: sound.loaded,
        type: sound.type,
        duration: sound.audio.duration || 0,
        volume: sound.audio.volume,
        muted: sound.audio.muted
      };
    });
    return status;
  }

  reloadSounds() {
    console.log('🔄 Reloading sounds...');
    this.sounds = {};
    this.loadSounds();
  }

  // LOCAL SOUND LOADING AND PLAYING
  loadSounds() {
    console.log('🎵 Loading local sounds...');
    
    const soundFiles = {
      'spin': '/sounds/spin.mp3',
      'reel-stop': '/sounds/reel-stop.mp3',
      'win-small': '/sounds/win-small.mp3',
      'win-big': '/sounds/win-big.mp3',
      'jackpot': '/sounds/jackpot.mp3',
      'bonus': '/sounds/bonus.mp3',
      'button-click': '/sounds/button-click.mp3',
      'coin-drop': '/sounds/coin-drop.mp3',
      'level-up': '/sounds/level-up.mp3',
      'notification': '/sounds/notification.mp3',
      
      // Page-specific background music
      'background-music': '/sounds/background-music.mp3',     // index.html
      'boosters-music': '/sounds/boosters-music.mp3',        // boosters.html
      'rewards-music': '/sounds/rewards-music.mp3',          // rewards.html
      'profile-music': '/sounds/profile-music.mp3',          // profile.html
      'leaderboard-music': '/sounds/leaderboard-music.mp3'   // leaderboard.html
    };

    Object.entries(soundFiles).forEach(([name, src]) => {
      this.sounds[name] = {
        audio: new Audio(src),
        type: name.includes('music') ? 'music' : 'sfx',
        loaded: false
      };
      
      // Set loop for background music
      if (name.includes('music')) {
        this.sounds[name].audio.loop = true;
      }
      
      // Add load event listener
      this.sounds[name].audio.addEventListener('canplaythrough', () => {
        this.sounds[name].loaded = true;
        console.log(`✅ Sound loaded: ${name}`);
      });
      
      // Add error event listener
      this.sounds[name].audio.addEventListener('error', (e) => {
        console.warn(`Could not load sound: ${name}`, e);
        this.sounds[name].loaded = false;
      });
    });
  }

  playSound(name, options = {}) {
    if (this.isMuted) return;
    
    const sound = this.sounds[name];
    if (!sound || !sound.loaded) {
      console.warn(`Sound not available: ${name}`);
      return;
    }

    const audio = sound.audio;
    
    try {
      // Reset audio if not looping
      if (!options.loop && !sound.loop) {
        audio.currentTime = 0;
      }
      
      // Set loop if specified
      if (options.loop !== undefined) {
        audio.loop = options.loop;
      }
      
      // Play the sound
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn(`Failed to play sound ${name}:`, error);
        });
      }
      
      console.log(`🔊 Playing sound: ${name}`);
    } catch (error) {
      console.warn(`Error playing sound ${name}:`, error);
    }
  }

  updateMusicVolume() {
    Object.keys(this.sounds).forEach(name => {
      const sound = this.sounds[name];
      if (sound.type === 'music' && sound.audio) {
        sound.audio.volume = this.isMuted ? 0 : this.musicVolume / 100;
      }
    });
    
    // Save to localStorage
    localStorage.setItem('musicVolume', this.musicVolume);
  }

  updateSFXVolume() {
    Object.keys(this.sounds).forEach(name => {
      const sound = this.sounds[name];
      if (sound.type === 'sfx' && sound.audio) {
        sound.audio.volume = this.isMuted ? 0 : this.sfxVolume / 100;
      }
    });
    
    // Save to localStorage
    localStorage.setItem('sfxVolume', this.sfxVolume);
  }

  testAudio() {
    console.log('🧪 Testing audio...');
    
    // Test SFX
    this.playSound('button-click');
    
    // Test music briefly
    setTimeout(() => {
      if (this.sounds['background-music'] && this.sounds['background-music'].loaded) {
        const music = this.sounds['background-music'].audio;
        const originalVolume = music.volume;
        music.volume = Math.min(0.3, originalVolume); // Lower volume for test
        music.play().then(() => {
          setTimeout(() => {
            music.pause();
            music.volume = originalVolume;
            console.log('✅ Audio test completed');
          }, 1000);
        }).catch(err => {
          console.warn('Music test failed:', err);
        });
      }
    }, 500);
  }

  // Add method to check if sounds are ready
  areSoundsReady() {
    const totalSounds = Object.keys(this.sounds).length;
    const loadedSounds = Object.values(this.sounds).filter(sound => sound.loaded).length;
    return totalSounds > 0 && loadedSounds === totalSounds;
  }

  // Add method to get loading progress
  getLoadingProgress() {
    const totalSounds = Object.keys(this.sounds).length;
    const loadedSounds = Object.values(this.sounds).filter(sound => sound.loaded).length;
    return totalSounds > 0 ? Math.round((loadedSounds / totalSounds) * 100) : 0;
  }

  // Add method to stop all sounds
  stopAllSounds() {
    Object.values(this.sounds).forEach(sound => {
      if (sound.audio) {
        sound.audio.pause();
        sound.audio.currentTime = 0;
      }
    });
  }

  // Add method to fade out music
  fadeOutMusic(duration = 1000) {
    const musicTrack = this.getPageSpecificMusic();
    const music = this.sounds[musicTrack];
    if (!music || !music.audio) return;

    const audio = music.audio;
    const originalVolume = audio.volume;
    const fadeStep = originalVolume / (duration / 50);

    const fadeInterval = setInterval(() => {
      if (audio.volume > fadeStep) {
        audio.volume -= fadeStep;
      } else {
        audio.volume = 0;
        audio.pause();
        audio.volume = originalVolume;
        clearInterval(fadeInterval);
      }
    }, 50);
  }

  // Add method to fade in music
  fadeInMusic(duration = 1000) {
    const musicTrack = this.getPageSpecificMusic();
    const music = this.sounds[musicTrack];
    if (!music || !music.audio || this.isMuted) return;

    const audio = music.audio;
    const targetVolume = this.musicVolume / 100;
    const fadeStep = targetVolume / (duration / 50);

    audio.volume = 0;
    audio.play().then(() => {
      const fadeInterval = setInterval(() => {
        if (audio.volume < targetVolume - fadeStep) {
          audio.volume += fadeStep;
        } else {
          audio.volume = targetVolume;
          clearInterval(fadeInterval);
        }
      }, 50);
    }).catch(err => {
      console.warn('Failed to fade in music:', err);
    });
  }

  // Add method to save Spotify settings
  saveSpotifySettings() {
    localStorage.setItem('spotifyVolume', this.spotifyVolume);
    localStorage.setItem('useSpotifyForBackground', this.useSpotifyForBackground);
    if (this.spotifyToken) {
      localStorage.setItem('spotify_access_token', this.spotifyToken);
    }
  }

  // Add method to get current playback state
  getCurrentPlaybackState() {
    return {
      isSpotifyReady: this.isSpotifyReady,
      isSpotifyPlaying: this.isSpotifyPlaying,
      useSpotifyForBackground: this.useSpotifyForBackground,
      currentTrack: this.currentTrack,
      spotifyVolume: this.spotifyVolume,
      musicVolume: this.musicVolume,
      isMuted: this.isMuted
    };
  }

  // Add method to sync playback across pages
  syncPlaybackState() {
    const state = this.getCurrentPlaybackState();
    localStorage.setItem('audioPlaybackState', JSON.stringify(state));
    
    // Broadcast to other tabs/windows
    if (window.BroadcastChannel) {
      const channel = new BroadcastChannel('audio-sync');
      channel.postMessage({
        type: 'playback-state-update',
        state: state
      });
    }
  }

  // Add method to listen for playback state changes from other tabs
  listenForPlaybackSync() {
    if (window.BroadcastChannel) {
      const channel = new BroadcastChannel('audio-sync');
      channel.addEventListener('message', (event) => {
        if (event.data.type === 'playback-state-update') {
          const state = event.data.state;
          
          // Update local state to match
          if (state.useSpotifyForBackground !== this.useSpotifyForBackground) {
            this.useSpotifyForBackground = state.useSpotifyForBackground;
            this.updateSpotifyControls();
          }
          
          if (state.isSpotifyPlaying !== this.isSpotifyPlaying) {
            this.isSpotifyPlaying = state.isSpotifyPlaying;
            this.updateSpotifyControls();
          }
        }
      });
    }
  }

  // Add method to handle cross-page music continuity
  initializeCrossPagePlayback() {
    // Load saved playback state
    const savedState = localStorage.getItem('audioPlaybackState');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state.useSpotifyForBackground && this.isSpotifyReady) {
          this.useSpotifyForBackground = true;
          if (state.isSpotifyPlaying && !this.isMuted) {
            // Resume playback if it was playing
            setTimeout(() => this.playSpotify(), 1000);
          }
        }
      } catch (error) {
        console.warn('Error loading playback state:', error);
      }
    }
    
    // Start listening for sync messages
    this.listenForPlaybackSync();
    
    // Sync state periodically
    setInterval(() => {
      if (this.isSpotifyReady) {
        this.syncPlaybackState();
      }
    }, 5000);
  }

  // Enhanced sound playing methods for slot machine integration
  playSpinSound() {
    this.playSound('spin');
  }

  playReelStopSound() {
    this.playSound('reel-stop');
  }

  playWinSound(winAmount, betAmount) {
    if (winAmount >= betAmount * 50) {
      this.playSound('jackpot');
    } else if (winAmount >= betAmount * 10) {
      this.playSound('win-big');
    } else if (winAmount >= betAmount * 2) {
      this.playSound('win-small');
    } else if (winAmount > 0) {
      this.playSound('coin-drop');
    }
  }

  playBonusSound() {
    this.playSound('bonus');
  }

  playLevelUpSound() {
    this.playSound('level-up');
  }

  playButtonClickSound() {
    this.playSound('button-click');
  }

  playNotificationSound() {
    this.playSound('notification');
  }

  // Method to play multiple sounds in sequence
  playSoundSequence(sounds, delay = 500) {
    sounds.forEach((soundName, index) => {
      setTimeout(() => {
        this.playSound(soundName);
      }, index * delay);
    });
  }

  // Method to play random sound from array
  playRandomSound(soundArray) {
    if (soundArray.length === 0) return;
    const randomIndex = Math.floor(Math.random() * soundArray.length);
    this.playSound(soundArray[randomIndex]);
  }

  // Method to check if specific sound is loaded
  isSoundLoaded(soundName) {
    return this.sounds[soundName] && this.sounds[soundName].loaded;
  }

  // Method to preload specific sounds
  preloadSound(soundName) {
    if (this.sounds[soundName] && this.sounds[soundName].audio) {
      this.sounds[soundName].audio.load();
    }
  }

  // Method to get sound duration
  getSoundDuration(soundName) {
    if (this.sounds[soundName] && this.sounds[soundName].audio) {
      return this.sounds[soundName].audio.duration || 0;
    }
    return 0;
  }

  // Method to set individual sound volume
  setSoundVolume(soundName, volume) {
    if (this.sounds[soundName] && this.sounds[soundName].audio) {
      this.sounds[soundName].audio.volume = Math.max(0, Math.min(1, volume / 100));
    }
  }

  // Method to check if sound is currently playing
  isSoundPlaying(soundName) {
    if (this.sounds[soundName] && this.sounds[soundName].audio) {
      return !this.sounds[soundName].audio.paused;
    }
    return false;
  }

  // Setup global button sounds for all interactive elements
  setupGlobalButtonSounds() {
    console.log('🔊 Setting up global button sounds...');
    
    // Wait for DOM to be ready
    const setupSounds = () => {
      // Add click sounds to all buttons
      this.addButtonSounds('button', 'button-click');
      this.addButtonSounds('.btn', 'button-click');
      this.addButtonSounds('.submit-btn', 'button-click');
      this.addButtonSounds('.purchase-btn', 'button-click');
      this.addButtonSounds('.claim-btn', 'button-click');
      this.addButtonSounds('.nav-link', 'button-click');
      this.addButtonSounds('.control-btn', 'button-click');
      this.addButtonSounds('.tab-btn', 'button-click');
      this.addButtonSounds('.theme-option', 'button-click');
      this.addButtonSounds('.status-option', 'button-click');
      this.addButtonSounds('.dropdown-action', 'button-click');
      this.addButtonSounds('.audio-action-btn', 'button-click');
      this.addButtonSounds('.spotify-control-btn', 'button-click');
      
      // Add special sounds for specific actions
      this.addButtonSounds('.spin-btn', 'spin');
      this.addButtonSounds('.cashout-btn', 'coin-drop');
      this.addButtonSounds('.bet-btn', 'button-click');
      
      console.log('✅ Global button sounds setup complete');
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupSounds);
    } else {
      setupSounds();
    }

    // Also setup sounds for dynamically added elements
    this.setupMutationObserver();
  }

  // Add button sounds to specific selectors
  addButtonSounds(selector, soundName) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      // Remove existing listeners to prevent duplicates
      element.removeEventListener('click', element._audioClickHandler);
      
      // Create new handler
      element._audioClickHandler = (e) => {
        // Don't play sound if element is disabled
        if (element.disabled || element.classList.contains('disabled')) {
          return;
        }
        
        // Play the sound
        this.playSound(soundName);
      };
      
      // Add the listener
      element.addEventListener('click', element._audioClickHandler);
    });
    
    if (elements.length > 0) {
      console.log(`🔊 Added ${soundName} sound to ${elements.length} ${selector} elements`);
    }
  }

  // Setup mutation observer to handle dynamically added elements
  setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the added node or its children are buttons
            const buttons = node.matches ? 
              (node.matches('button, .btn, .submit-btn, .purchase-btn, .claim-btn') ? [node] : []) :
              [];
            
            const childButtons = node.querySelectorAll ? 
              node.querySelectorAll('button, .btn, .submit-btn, .purchase-btn, .claim-btn, .nav-link, .control-btn, .tab-btn') : 
              [];
            
            [...buttons, ...childButtons].forEach(button => {
              if (!button._audioClickHandler) {
                button._audioClickHandler = () => {
                  if (!button.disabled && !button.classList.contains('disabled')) {
                    this.playSound('button-click');
                  }
                };
                button.addEventListener('click', button._audioClickHandler);
              }
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Enhanced background music management for cross-page continuity
  // startBackgroundMusic() {
  //   // Check if we should use Spotify or local music
  //   if (this.useSpotifyForBackground && this.isSpotifyReady) {
  //     // Use Spotify for background music
  //     if (!this.isSpotifyPlaying && !this.isMuted) {
  //       this.playSpotify();
  //     }
  //   } else if (!this.isMuted) {
  //     // Use local background music
  //     const music = this.sounds['background-music'];
  //     if (music && music.loaded && music.audio.paused) {
  //       this.playSound('background-music', { loop: true });
  //     }
  //   }
  // }

  // Enhanced method to ensure music continues across page loads
  ensureMusicContinuity() {
    // Save current playback state
    const musicState = {
      isPlaying: this.useSpotifyForBackground ? this.isSpotifyPlaying : !this.sounds['background-music']?.audio?.paused,
      useSpotify: this.useSpotifyForBackground,
      volume: this.musicVolume,
      isMuted: this.isMuted,
      timestamp: Date.now()
    };
    
    localStorage.setItem('musicContinuityState', JSON.stringify(musicState));
  }

  // Restore music state from previous page
  restoreMusicContinuity() {
    const savedState = localStorage.getItem('musicContinuityState');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        
        // Only restore if the state is recent (within 5 seconds)
        if (Date.now() - state.timestamp < 5000) {
          this.useSpotifyForBackground = state.useSpotify;
          this.musicVolume = state.volume;
          this.isMuted = state.isMuted;
          
          // Start page-specific music if it was playing
          if (state.isPlaying && !this.isMuted) {
            setTimeout(() => {
              this.startBackgroundMusic(); // This will now use page-specific music
            }, 500);
          }
        }
      } catch (error) {
        console.warn('Error restoring music continuity:', error);
      }
    }
  }

  stopAllMusic() {
    Object.entries(this.sounds).forEach(([name, sound]) => {
      if (sound.type === 'music' && sound.audio) {
        sound.audio.pause();
        sound.audio.currentTime = 0;
      }
    });
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnhancedAudioManager;
}