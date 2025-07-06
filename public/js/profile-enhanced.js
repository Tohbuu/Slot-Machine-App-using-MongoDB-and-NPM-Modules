class ProfileManager {
  constructor() {
    this.XP_PER_LEVEL = 100; // Consistent with other files
    this.uploadInProgress = false;
    this.currentUser = null;
    this.collections = {
      frames: [],
      badges: [],
      themes: []
    };
    this.init();
  }

  calculateXPRequirement(level) {
    // Use consistent formula across the app
    if (level <= 1) return 100;
    return Math.floor(this.XP_PER_LEVEL * Math.pow(1.15, level - 1));
  }

  async init() {
    try {
      await this.loadUserData();
      this.setupEventListeners();
      this.loadCollections();
      this.loadRecentActivity();
      
      // Fix the display issues
      await this.updateBalanceDisplay();
      await this.updateActiveBoostersDisplay();
      
      if (this.currentUser) {
        this.updateProgressDisplay(this.currentUser);
      }
      
      console.log('Profile manager initialized');
    } catch (error) {
      console.error('Failed to initialize profile manager:', error);
    }
  }

  setupEventListeners() {
    // Theme selector
    document.querySelectorAll('.theme-option').forEach(option => {
      option.addEventListener('click', (e) => {
        const newTheme = e.target.closest('.theme-option').dataset.theme;
        const oldTheme = document.querySelector('.theme-option.active')?.dataset.theme || 'default';
        this.changeTheme(newTheme, oldTheme);
      });
    });

    // Profile form submission
    const profileForm = document.querySelector('.profile-form');
    if (profileForm) {
      profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.updateProfile();
      });
    }

    // Avatar upload
    const avatarUpload = document.getElementById('avatar-upload');
    if (avatarUpload) {
      avatarUpload.addEventListener('change', (e) => {
        if (e.target.files[0]) {
          this.handleAvatarUpload(e.target.files[0]);
        }
      });
    }

    // Collection tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tabName = e.target.closest('.tab-btn').dataset.tab;
        this.switchTab(tabName);
      });
    });
  }

  async changeTheme(newTheme, oldTheme) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/theme', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ theme: newTheme })
      });

      if (response.ok) {
        document.querySelectorAll('.theme-option').forEach(opt => opt.classList.remove('active'));
        document.querySelector(`[data-theme="${newTheme}"]`).classList.add('active');
        document.body.className = document.body.className.replace(/theme-\w+/g, '') + ` theme-${newTheme}`;
        
        if (window.ActivityTracker) {
          window.ActivityTracker.track('theme_change', `Changed theme from ${oldTheme} to ${newTheme}`, {
            oldTheme,
            newTheme
          });
        }

        this.showNotification('Theme updated successfully!', 'success');
      }
    } catch (error) {
      console.error('Failed to update theme:', error);
      this.showNotification('Failed to update theme', 'error');
    }
  }

  async updateProfile() {
    try {
      const formData = new FormData(document.querySelector('.profile-form'));
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        
        if (window.ActivityTracker) {
          window.ActivityTracker.track('profile_update', 'Updated profile information', {
            fields: Array.from(formData.keys())
          });
        }

        this.showNotification('Profile updated successfully!', 'success');
        await this.loadUserData();
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      this.showNotification('Failed to update profile', 'error');
    }
  }

  async handleAvatarUpload(file) {
    if (this.uploadInProgress) {
      console.log('Upload already in progress');
      return;
    }

    // Validate file
    if (!file) {
      this.showMessage('Please select a file', false);
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      this.showMessage('Please select a valid image file (JPEG, PNG, or GIF)', false);
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      this.showMessage('File size must be less than 2MB', false);
      return;
    }

    this.uploadInProgress = true;
    const formData = new FormData();
    formData.append('avatar', file);

    const uploadBtn = document.querySelector('.upload-btn');
    if (uploadBtn) {
      uploadBtn.disabled = true;
      uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    }

    try {
      const response = await fetch('/api/users/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        this.showMessage('Avatar updated successfully!', true);
        
        // Update all avatar instances
        const avatarUrl = `/images/avatars/${data.profilePicture || 'default.png'}?t=${Date.now()}`;
        document.querySelectorAll('.profile-avatar, .user-avatar, .dropdown-avatar, .mini-avatar').forEach(img => {
          img.src = avatarUrl;
        });
      } else {
        this.showMessage(data.error || 'Failed to upload avatar', false);
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      this.showMessage('Error uploading avatar', false);
    } finally {
      this.uploadInProgress = false;
      if (uploadBtn) {
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = '<i class="fas fa-camera"></i> Change Avatar';
      }
    }
  }

  async loadUserData() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch('/api/users/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          this.currentUser = data.user;
          this.updateUserDisplay(data.user);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  updateUserDisplay(user) {
    // Update username
    const usernameEl = document.querySelector('.profile-username');
    if (usernameEl) usernameEl.textContent = user.username || 'Username';
    
    // Update level
    const levelEl = document.querySelector('.stat-value.level');
    if (levelEl) levelEl.textContent = user.level || 1;
    
    // Update experience
    const experienceEl = document.querySelector('.stat-value.experience');
    if (experienceEl) experienceEl.textContent = user.experience || 0;
    
    // Update other stats
    const totalSpinsEl = document.querySelector('.stat-number.total-spins');
    if (totalSpinsEl) totalSpinsEl.textContent = user.totalSpins || 0;
    
    const totalWinsEl = document.querySelector('.stat-number.total-wins');
    if (totalWinsEl) totalWinsEl.textContent = user.totalWins || 0;
    
    const jackpotsWonEl = document.querySelector('.stat-number.jackpots-won');
    if (jackpotsWonEl) jackpotsWonEl.textContent = user.jackpotsWon || 0;
    
    const winRateEl = document.querySelector('.stat-number.win-rate');
    if (winRateEl) {
      const winRate = user.totalSpins > 0 ? ((user.totalWins / user.totalSpins) * 100).toFixed(1) : 0;
      winRateEl.textContent = `${winRate}%`;
    }
  }

  async loadCollections() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/users/collections', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          this.collections = data.collections;
          this.renderCollections();
        }
      }
    } catch (error) {
      console.error('Failed to load collections:', error);
    }
  }

  renderCollections() {
    const framesContainer = document.getElementById('frames-collection');
    if (framesContainer) {
      framesContainer.innerHTML = this.renderCollectionItems(this.collections.frames, 'frame');
    }

    const badgesContainer = document.getElementById('badges-collection');
    if (badgesContainer) {
      badgesContainer.innerHTML = this.renderCollectionItems(this.collections.badges, 'badge');
    }

    const themesContainer = document.getElementById('themes-collection');
    if (themesContainer) {
      themesContainer.innerHTML = this.renderCollectionItems(this.collections.themes, 'theme');
    }
  }

  renderCollectionItems(items, type) {
    if (!items || items.length === 0) {
      return `
        <div class="collection-empty">
          <i class="fas fa-inbox"></i>
          <p>No ${type}s collected yet</p>
        </div>
      `;
    }

    return items.map(item => `
      <div class="collection-item ${item.equipped ? 'equipped' : ''}" data-id="${item.id}">
        <div class="item-preview">
          ${type === 'frame' ? `<div class="frame-preview" style="background-image: url('/images/frames/${item.image}')"></div>` : ''}
          ${type === 'badge' ? `<div class="badge-preview"><i class="${item.icon}"></i></div>` : ''}
          ${type === 'theme' ? `<div class="theme-preview" style="background: ${item.gradient}"></div>` : ''}
        </div>
        <div class="item-info">
          <div class="item-name">${item.name}</div>
          <div class="item-rarity ${item.rarity}">${item.rarity}</div>
        </div>
        ${item.equipped ? '<div class="equipped-badge">Equipped</div>' : `<button class="equip-btn" onclick="profileManager.equipItem('${type}', '${item.id}')">Equip</button>`}
      </div>
    `).join('');
  }

  async equipItem(type, itemId) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/equip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type, itemId })
      });

      if (response.ok) {
        if (window.ActivityTracker) {
          window.ActivityTracker.track('item_equip', `Equipped ${type}: ${itemId}`, {
            type,
            itemId
          });
        }

        this.showNotification(`${type} equipped successfully!`, 'success');
        await this.loadCollections();
      }
    } catch (error) {
      console.error('Failed to equip item:', error);
      this.showNotification('Failed to equip item', 'error');
    }
  }

  loadRecentActivity() {
    const checkActivityTracker = () => {
      if (window.ActivityTracker && window.ActivityTracker.isInitialized) {
        window.ActivityTracker.updateActivityDisplay();
      } else {
        setTimeout(checkActivityTracker, 100);
      }
    };
    checkActivityTracker();
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}-circle"></i>
      <span>${message}</span>
    `;
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }, 3000);
  }

  switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
    
    document.querySelectorAll('.collection-tab').forEach(tab => tab.classList.remove('active'));
    const activeTab = document.getElementById(`${tabName}-tab`);
    if (activeTab) {
      activeTab.classList.add('active');
    }
  }

  async updateBalanceDisplay() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          // Update header balance
          const headerBalance = document.querySelector('.balance-amount');
          if (headerBalance) {
            headerBalance.textContent = data.user.balance || 0;
          }
          
          // Update profile balance with proper formatting
          const profileBalance = document.querySelector('.stat-value.balance');
          if (profileBalance) {
            profileBalance.textContent = data.user.balance || 0;
            profileBalance.setAttribute('title', `Current Balance: ${data.user.balance || 0}`);
          }
        }
      }
    } catch (error) {
      console.error('Error updating balance:', error);
    }
  }

  // Add this method to properly display active boosters
  async updateActiveBoostersDisplay() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/boosters/active', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const activeBoostersEl = document.querySelector('.stat-number.active-boosters');
        
        if (activeBoostersEl) {
          if (data.success && Array.isArray(data.boosters)) {
            // Count active boosters
            const activeCount = data.boosters.length;
            activeBoostersEl.textContent = activeCount;
            activeBoostersEl.setAttribute('title', `Active Boosters: ${activeCount}`);
            
            // Optionally show booster names in tooltip
            if (activeCount > 0) {
              const boosterNames = data.boosters.map(b => b.name || b.type).join(', ');
              activeBoostersEl.setAttribute('title', `Active Boosters: ${boosterNames}`);
            }
          } else {
            activeBoostersEl.textContent = '0';
            activeBoostersEl.setAttribute('title', 'No active boosters');
          }
        }
      }
    } catch (error) {
      console.error('Error loading active boosters:', error);
      const activeBoostersEl = document.querySelector('.stat-number.active-boosters');
      if (activeBoostersEl) {
        activeBoostersEl.textContent = '0';
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.profileManager = new ProfileManager();
});

window.ProfileManager = ProfileManager;