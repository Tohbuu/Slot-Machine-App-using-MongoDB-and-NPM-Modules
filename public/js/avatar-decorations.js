// Create a new file for global avatar decorations
class AvatarDecorations {
  constructor() {
    this.userLevel = 1;
    this.userUnlocks = [];
    this.userXp = 0;
    this.userData = null;
    this.currentStatus = 'online';
    this.XP_PER_LEVEL = 100;
    this.isInitialized = false;
    this.init();
  }

  async init() {
    try {
      await this.loadUserData();
      this.setupEventListeners();
      this.applyDecorations();
      this.loadSavedStatus();
      this.isInitialized = true;
      
      // Update decorations periodically
      setInterval(() => this.refreshDecorations(), 30000);
      
      console.log('Avatar decorations initialized successfully');
    } catch (error) {
      console.error('Failed to initialize avatar decorations:', error);
    }
  }

  async loadUserData() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token found for avatar decorations');
        return;
      }

      const response = await fetch('/api/users/me', {
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          this.userData = data.user;
          this.userLevel = data.user.level || 1;
          this.userUnlocks = data.user.unlocks || [];
          this.userXp = data.user.experience || 0;
          
          console.log('User data loaded for decorations:', {
            level: this.userLevel,
            unlocks: this.userUnlocks.length,
            xp: this.userXp
          });
        }
      } else {
        console.error('Failed to fetch user data:', response.status);
      }
    } catch (err) {
      console.error('Error loading user data for decorations:', err);
    }
  }

  async refreshDecorations() {
    await this.loadUserData();
    this.applyDecorations();
  }

  applyDecorations() {
    if (!this.isInitialized && !this.userData) {
      console.warn('Cannot apply decorations: not initialized or no user data');
      return;
    }

    // Find all user avatars and decorate them
    const avatars = document.querySelectorAll('.user-avatar');
    console.log(`Applying decorations to ${avatars.length} avatars`);
    
    avatars.forEach(avatar => {
      this.decorateAvatar(avatar);
    });

    // Update dropdown content if open
    if (document.querySelector('.user-dropdown-menu.show')) {
      this.updateDropdownContent();
    }
  }

  decorateAvatar(userAvatar) {
    if (!userAvatar) return;

    // Get or create avatar container
    let avatarContainer = userAvatar.closest('.avatar-container');
    if (!avatarContainer) {
      avatarContainer = document.createElement('div');
      avatarContainer.className = 'avatar-container';
      userAvatar.parentNode.insertBefore(avatarContainer, userAvatar);
      avatarContainer.appendChild(userAvatar);
    }

    // Remove existing decorations
    avatarContainer.querySelectorAll('.user-frame, .user-badge, .user-glow, .user-status-indicator').forEach(el => el.remove());

    // Add frame
    const currentFrame = this.getCurrentFrame();
    if (currentFrame) {
      const frameEl = document.createElement('div');
      frameEl.className = `user-frame ${currentFrame}`;
      avatarContainer.appendChild(frameEl);
      
      // Add glow effect
      const glowEl = document.createElement('div');
      glowEl.className = `user-glow ${this.getFrameRarity(currentFrame)}`;
      avatarContainer.appendChild(glowEl);
    }

    // Add badge
    const currentBadge = this.getCurrentBadge();
    if (currentBadge) {
      const badgeEl = document.createElement('div');
      badgeEl.className = `user-badge ${currentBadge}`;
      badgeEl.innerHTML = `<i class="fas ${this.getBadgeIcon(currentBadge)}"></i>`;
      badgeEl.title = this.getBadgeDescription(currentBadge);
      avatarContainer.appendChild(badgeEl);
    }

    // Add status indicator
    const statusEl = document.createElement('div');
    statusEl.className = `user-status-indicator ${this.currentStatus}`;
    avatarContainer.appendChild(statusEl);

    // Add level indicator for milestone levels
    if ([25, 50, 75, 100].includes(this.userLevel)) {
      userAvatar.setAttribute('data-level', this.userLevel);
    }

    console.log(`Decorated avatar with frame: ${currentFrame}, badge: ${currentBadge}, status: ${this.currentStatus}`);
  }

  getCurrentFrame() {
    if (this.userLevel >= 100) return 'legendary_frame';
    if (this.userLevel >= 75) return 'gold_frame';
    if (this.userLevel >= 50) return 'silver_frame';
    if (this.userLevel >= 25) return 'bronze_frame';
    return null;
  }

  getCurrentBadge() {
    if (this.userLevel >= 100) return 'legendary_badge';
    if (this.userLevel >= 75) return 'gold_badge';
    if (this.userLevel >= 50) return 'silver_badge';
    if (this.userLevel >= 25) return 'bronze_badge';
    return null;
  }

  getFrameRarity(frame) {
    const rarityMap = {
      'bronze_frame': 'common',
      'silver_frame': 'rare',
      'gold_frame': 'epic',
      'legendary_frame': 'legendary'
    };
    return rarityMap[frame] || 'common';
  }

  getBadgeIcon(badge) {
    const iconMap = {
      'legendary_badge': 'fa-crown',
      'gold_badge': 'fa-trophy',
      'silver_badge': 'fa-medal',
      'bronze_badge': 'fa-award',
      'vip_badge': 'fa-star'
    };
    return iconMap[badge] || 'fa-shield-alt';
  }

  getBadgeDescription(badge) {
    const descriptions = {
      'bronze_badge': 'Reached Level 25',
      'silver_badge': 'Reached Level 50',
      'gold_badge': 'Reached Level 75',
      'legendary_badge': 'Reached Level 100',
      'vip_badge': 'VIP Status'
    };
    return descriptions[badge] || 'Special Achievement';
  }

  setupEventListeners() {
    // Setup dropdown functionality
    this.initDropdown();
    
    // Setup avatar hover effects
    this.setupAvatarHovers();
    
    // Setup status change handlers
    this.setupStatusHandlers();
    
    // Listen for user data updates
    document.addEventListener('userDataUpdated', (e) => {
      if (e.detail) {
        this.userData = e.detail;
        this.userLevel = e.detail.level || 1;
        this.userUnlocks = e.detail.unlocks || [];
        this.userXp = e.detail.experience || 0;
        this.applyDecorations();
      }
    });
  }

  initDropdown() {
    const avatarTrigger = document.querySelector('.user-avatar-dropdown .avatar-container');
    const dropdownMenu = document.querySelector('.user-dropdown-menu');
    
    if (!avatarTrigger || !dropdownMenu) {
      console.warn('Dropdown elements not found');
      return;
    }

    // Remove existing listeners
    avatarTrigger.removeEventListener('click', this.handleDropdownClick);
    
    // Add click handler
    this.handleDropdownClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleDropdown();
    };
    
    avatarTrigger.addEventListener('click', this.handleDropdownClick);

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!dropdownMenu.contains(e.target) && !avatarTrigger.contains(e.target)) {
        this.closeDropdown();
      }
    });

    console.log('Dropdown initialized');
  }

  setupAvatarHovers() {
    document.querySelectorAll('.user-avatar').forEach(avatar => {
      avatar.addEventListener('mouseenter', () => {
        if (!avatar.classList.contains('hovering')) {
          avatar.classList.add('hovering');
          avatar.style.transform = 'scale(1.05)';
        }
      });
      
      avatar.addEventListener('mouseleave', () => {
        avatar.classList.remove('hovering');
        avatar.style.transform = 'scale(1)';
      });
    });
  }

  setupStatusHandlers() {
    document.querySelectorAll('.status-option').forEach(option => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        const status = e.target.closest('.status-option').dataset.status;
        if (status) {
          this.changeStatus(status);
        }
      });
    });
  }

  toggleDropdown() {
    const dropdownMenu = document.querySelector('.user-dropdown-menu');
    if (!dropdownMenu) return;

    const isVisible = dropdownMenu.classList.contains('show');
    
    if (isVisible) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  openDropdown() {
    const dropdownMenu = document.querySelector('.user-dropdown-menu');
    if (dropdownMenu) {
      dropdownMenu.classList.add('show');
      this.updateDropdownContent();
      console.log('Dropdown opened');
    }
  }

  closeDropdown() {
    const dropdownMenu = document.querySelector('.user-dropdown-menu');
    if (dropdownMenu) {
      dropdownMenu.classList.remove('show');
      console.log('Dropdown closed');
    }
  }

  updateDropdownContent() {
    if (!this.userData) return;

    // Update username
    const usernameEl = document.querySelector('.dropdown-username');
    if (usernameEl) {
      usernameEl.textContent = this.userData.username || 'Username';
    }

    // Update level
    const levelEl = document.querySelector('.user-level-display');
    if (levelEl) {
      levelEl.textContent = this.userLevel;
    }

    // Update dropdown avatar
    const dropdownAvatar = document.querySelector('.dropdown-avatar');
    if (dropdownAvatar) {
      dropdownAvatar.src = `/images/avatars/${this.userData.profilePicture || 'default.png'}`;
    }

    // Update frame and badge displays
    this.updateFrameDisplay();
    this.updateBadgeDisplay();
    this.updateMilestoneDisplay();
  }

  updateFrameDisplay() {
    const frameNameEl = document.querySelector('.frame-name-display');
    const miniFrameSvg = document.querySelector('.mini-frame-svg');
    const currentFrame = this.getCurrentFrame();

    if (frameNameEl) {
      frameNameEl.textContent = currentFrame ? this.formatFrameName(currentFrame) : 'No Frame';
    }
    if (miniFrameSvg) {
      if (currentFrame) {
        miniFrameSvg.src = `/images/frames/${currentFrame}.svg`;
        miniFrameSvg.alt = this.formatFrameName(currentFrame) + ' Frame';
        miniFrameSvg.style.display = '';
      } else {
        miniFrameSvg.style.display = 'none';
      }
    }
  }

  updateBadgeDisplay() {
    const badgeNameEl = document.querySelector('.badge-name-display');
    const miniBadgeSvg = document.querySelector('.mini-badge-svg');
    const currentBadge = this.getCurrentBadge();

    if (badgeNameEl) {
      badgeNameEl.textContent = currentBadge ? this.formatBadgeName(currentBadge) : 'No Badge';
    }
    if (miniBadgeSvg) {
      if (currentBadge) {
        miniBadgeSvg.src = `/images/badges/${currentBadge}.svg`;
        miniBadgeSvg.alt = this.formatBadgeName(currentBadge) + ' Badge';
        miniBadgeSvg.style.display = '';
      } else {
        miniBadgeSvg.style.display = 'none';
      }
    }
  }

  updateMilestoneDisplay() {
    // Implementation for milestone display updates
    const nextMilestone = this.getNextMilestone();
    const milestoneLevel = document.querySelector('.milestone-level');
    const milestoneReward = document.querySelector('.milestone-reward');
    
    if (milestoneLevel && nextMilestone) {
      milestoneLevel.textContent = `Level ${nextMilestone.level}`;
    }
    
    if (milestoneReward && nextMilestone) {
      milestoneReward.textContent = nextMilestone.reward;
    }
  }

  changeStatus(status) {
    if (!['online', 'away', 'busy'].includes(status)) return;

    // Update active status option
    document.querySelectorAll('.status-option').forEach(option => {
      option.classList.remove('active');
    });
    
    const activeOption = document.querySelector(`[data-status="${status}"]`);
    if (activeOption) {
      activeOption.classList.add('active');
    }
    
    // Update all status indicators
    document.querySelectorAll('.user-status-indicator').forEach(indicator => {
      indicator.className = `user-status-indicator ${status}`;
    });
    
    // Save status
    localStorage.setItem('userStatus', status);
    this.currentStatus = status;
    
    console.log(`Status changed to: ${status}`);
  }

  loadSavedStatus() {
    const savedStatus = localStorage.getItem('userStatus') || 'online';
    this.changeStatus(savedStatus);
  }

  formatFrameName(frame) {
    return frame.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  formatBadgeName(badge) {
    return badge.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  getBadgeBackground(badge) {
    const backgrounds = {
      'bronze_badge': 'linear-gradient(45deg, #cd7f32, #b8860b)',
      'silver_badge': 'linear-gradient(45deg, #c0c0c0, #a8a8a8)',
      'gold_badge': 'linear-gradient(45deg, #ffd700, #ffb300)',
      'legendary_badge': 'linear-gradient(45deg, #9c27b0, #673ab7)',
      'vip_badge': 'linear-gradient(45deg, #ff6b35, #f7931e)'
    };
    return backgrounds[badge] || 'linear-gradient(45deg, #666, #888)';
  }

  getNextMilestone() {
    const milestones = [
      { level: 25, reward: 'Bronze Frame + 25K Credits' },
      { level: 50, reward: 'Silver Frame + 100K Credits' },
      { level: 75, reward: 'Gold Frame + 300K Credits' },
      { level: 100, reward: 'Legendary Frame + 2.5M Credits' }
    ];
    
    return milestones.find(milestone => milestone.level > this.userLevel) || 
           { level: 100, reward: 'Max Level Reached!' };
  }

  updateGlobalUserFrame() {
    const frameSvg = document.querySelector('.user-frame-svg');
    let frame = 'bronze_frame';
    if (this.userLevel >= 100) frame = 'legendary_frame';
    else if (this.userLevel >= 75) frame = 'gold_frame';
    else if (this.userLevel >= 50) frame = 'silver_frame';
    else if (this.userLevel >= 25) frame = 'bronze_frame';
    else frame = null;

    if (frameSvg) {
      if (frame) {
        frameSvg.src = `/images/frames/${frame}.svg`;
        frameSvg.alt = frame.replace('_', ' ').replace('frame', 'Frame');
        frameSvg.style.display = '';
      } else {
        frameSvg.style.display = 'none';
      }
    }
  }
}

// Global instance
let globalAvatarDecorations;

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  // Only initialize if user is authenticated
  if (localStorage.getItem('token')) {
    globalAvatarDecorations = new AvatarDecorations();
  }
});

// Export for use in other files
window.AvatarDecorations = AvatarDecorations;