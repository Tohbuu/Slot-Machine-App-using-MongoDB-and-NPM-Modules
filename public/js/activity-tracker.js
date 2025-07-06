class ActivityTracker {
  constructor() {
    this.activities = [];
    this.maxActivities = 50;
    this.isInitialized = false;
    this.currentUser = null;
    this.activityTypes = {
      navigation: { icon: 'fas fa-mouse-pointer', color: '#4CAF50' },
      slot_spin: { icon: 'fas fa-dice', color: '#FF9800' },
      booster_purchase: { icon: 'fas fa-rocket', color: '#9C27B0' },
      reward_claim: { icon: 'fas fa-gift', color: '#2196F3' },
      profile_update: { icon: 'fas fa-user-edit', color: '#607D8B' },
      theme_change: { icon: 'fas fa-palette', color: '#E91E63' },
      level_up: { icon: 'fas fa-level-up-alt', color: '#FFC107' },
      achievement: { icon: 'fas fa-trophy', color: '#FF5722' },
      jackpot_win: { icon: 'fas fa-crown', color: '#FFD700' },
      login: { icon: 'fas fa-sign-in-alt', color: '#4CAF50' },
      logout: { icon: 'fas fa-sign-out-alt', color: '#F44336' },
      bet_change: { icon: 'fas fa-coins', color: '#FFC107' },
      booster_view: { icon: 'fas fa-eye', color: '#2196F3' },
      reward_view: { icon: 'fas fa-search', color: '#9C27B0' },
      filter_change: { icon: 'fas fa-filter', color: '#607D8B' },
      tab_switch: { icon: 'fas fa-tabs', color: '#4CAF50' },
      theme_preview: { icon: 'fas fa-paint-brush', color: '#E91E63' },
      item_equip: { icon: 'fas fa-check-circle', color: '#4CAF50' },
      page_time: { icon: 'fas fa-clock', color: '#607D8B' }
    };
    this.init();
  }

  async init() {
    try {
      await this.loadCurrentUser();
      await this.loadRecentActivities();
      this.setupGlobalEventListeners();
      this.setupPageSpecificTracking();
      this.trackPageVisit();
      this.isInitialized = true;
      console.log('🎯 Activity tracker initialized globally');
    } catch (error) {
      console.error('Failed to initialize activity tracker:', error);
    }
  }

  async loadCurrentUser() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/users/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          this.currentUser = data.user;
        }
      }
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  }

  setupGlobalEventListeners() {
    // Track navigation clicks globally
    document.addEventListener('click', (e) => {
      const navLink = e.target.closest('.nav-link');
      if (navLink && !navLink.href.includes('logout')) {
        const pageName = navLink.textContent.trim();
        this.trackNavigation(pageName, navLink.href);
      }
    });

    // Track custom events from all components
    document.addEventListener('slotSpin', (e) => {
      this.trackSlotSpin(e.detail);
    });

    document.addEventListener('boosterPurchased', (e) => {
      this.trackBoosterPurchase(e.detail);
    });

    document.addEventListener('rewardClaimed', (e) => {
      this.trackRewardClaim(e.detail);
    });

    document.addEventListener('profileUpdated', (e) => {
      this.trackProfileUpdate(e.detail);
    });

    document.addEventListener('themeChanged', (e) => {
      this.trackThemeChange(e.detail);
    });

    document.addEventListener('levelUp', (e) => {
      this.trackLevelUp(e.detail);
    });

    document.addEventListener('achievementUnlocked', (e) => {
      this.trackAchievement(e.detail);
    });

    document.addEventListener('userLogin', (e) => {
      this.trackLogin(e.detail);
    });

    document.addEventListener('userLogout', (e) => {
      this.trackLogout(e.detail);
    });

    // Track page unload for time tracking
    this.startTime = Date.now();
    window.addEventListener('beforeunload', () => {
      this.trackPageTime();
    });

    // Track visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackPageTime();
      } else {
        this.startTime = Date.now();
      }
    });
  }

  setupPageSpecificTracking() {
    const currentPage = window.location.pathname;

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.initPageTracking(currentPage);
      });
    } else {
      this.initPageTracking(currentPage);
    }
  }

  initPageTracking(currentPage) {
    switch (currentPage) {
      case '/':
        this.setupSlotMachineTracking();
        break;
      case '/boosters':
        this.setupBoosterTracking();
        break;
      case '/rewards':
        this.setupRewardTracking();
        break;
      case '/profile':
        this.setupProfileTracking();
        break;
      case '/leaderboard':
        this.setupLeaderboardTracking();
        break;
    }
  }

  setupSlotMachineTracking() {
    // Track bet changes
    setTimeout(() => {
      const betButtons = document.querySelectorAll('.bet-btn, .bet-control, [data-bet]');
      betButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const betAmount = e.target.dataset.bet || e.target.textContent.match(/\d+/)?.[0] || 'Unknown';
          this.trackActivity('bet_change', `Changed bet amount to ${betAmount} credits`, {
            betAmount,
            page: 'slot_machine'
          });
        });
      });

      // Track auto-spin toggles
      const autoSpinBtn = document.querySelector('.auto-spin-btn, #auto-spin');
      if (autoSpinBtn) {
        autoSpinBtn.addEventListener('click', () => {
          const isActive = autoSpinBtn.classList.contains('active');
          this.trackActivity('auto_spin', `${isActive ? 'Disabled' : 'Enabled'} auto-spin`, {
            enabled: !isActive,
            page: 'slot_machine'
          });
        });
      }
    }, 1000);
  }

  setupBoosterTracking() {
    setTimeout(() => {
      const boosterPacks = document.querySelectorAll('.pack-card, .booster-pack');
      boosterPacks.forEach(pack => {
        pack.addEventListener('click', (e) => {
          if (!e.target.classList.contains('purchase-btn')) {
            const packName = pack.querySelector('.pack-name, .booster-name, h3')?.textContent || 'Unknown Pack';
            this.trackActivity('booster_view', `Viewed ${packName} details`, {
              packName,
              page: 'boosters'
            });
          }
        });
      });
    }, 1000);
  }

  setupRewardTracking() {
    setTimeout(() => {
      // Track reward item views
      const rewardItems = document.querySelectorAll('.reward-item, .battlepass-item, [data-level]');
      rewardItems.forEach(item => {
        item.addEventListener('click', (e) => {
          if (e.target.classList.contains('claim-btn')) return;
          
          const rewardLevel = item.dataset.level || item.querySelector('[data-level]')?.dataset.level || 'Unknown';
          this.trackActivity('reward_view', `Viewed reward at level ${rewardLevel}`, {
            level: rewardLevel,
            page: 'rewards'
          });
        });
      });

      // Track filter changes
      const filterButtons = document.querySelectorAll('.control-btn, .filter-btn, [data-filter]');
      filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const filterType = e.target.textContent.trim() || e.target.dataset.filter || 'Unknown';
          this.trackActivity('filter_change', `Changed rewards filter to ${filterType}`, {
            filterType,
            page: 'rewards'
          });
        });
      });
    }, 1000);
  }

  setupProfileTracking() {
    setTimeout(() => {
      // Track collection tab switches
      const tabButtons = document.querySelectorAll('.tab-btn, [data-tab]');
      tabButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const tabName = e.target.dataset.tab || e.target.textContent.trim();
          this.trackActivity('tab_switch', `Switched to ${tabName} collection`, {
            tabName,
            page: 'profile'
          });
        });
      });

      // Track theme previews
      const themeOptions = document.querySelectorAll('.theme-option, [data-theme]');
      themeOptions.forEach(option => {
        option.addEventListener('mouseenter', (e) => {
          const themeName = e.target.dataset.theme || 'Unknown';
          this.trackActivity('theme_preview', `Previewed ${themeName} theme`, {
            themeName,
            page: 'profile'
          });
        });
      });
    }, 1000);
  }

  setupLeaderboardTracking() {
    setTimeout(() => {
      const leaderboardTabs = document.querySelectorAll('.leaderboard-tab, .tab-button, [data-leaderboard]');
      leaderboardTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
          const tabType = e.target.textContent.trim() || e.target.dataset.leaderboard || 'Unknown';
          this.trackActivity('leaderboard_view', `Viewed ${tabType} leaderboard`, {
            tabType,
            page: 'leaderboard'
          });
        });
      });
    }, 1000);
  }

  async trackActivity(type, description, data = {}) {
    const activity = {
      type,
      description,
      data: {
        ...data,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        page: window.location.pathname,
        userId: this.currentUser?.id || 'anonymous'
      },
      timestamp: new Date().toISOString()
    };

    try {
      // Send to backend
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch('/api/users/activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(activity)
        });

        if (!response.ok) {
          console.warn('Failed to save activity to backend:', response.status);
        }
      }

      // Add to local activities for immediate display
      this.activities.unshift(activity);
      if (this.activities.length > this.maxActivities) {
        this.activities = this.activities.slice(0, this.maxActivities);
      }

      // Update display if activity list exists on current page
      this.updateActivityDisplay();
      
      // Broadcast activity to other tabs/windows
      this.broadcastActivity(activity);

    } catch (error) {
      console.error('Failed to track activity:', error);
    }
  }

  broadcastActivity(activity) {
    // Use localStorage to communicate between tabs
    localStorage.setItem('latest_activity', JSON.stringify({
      activity,
      timestamp: Date.now()
    }));
  }

  trackPageVisit() {
    const pageName = this.getCurrentPageName();
    const referrer = document.referrer ? new URL(document.referrer).pathname : 'direct';
    
    this.trackActivity('navigation', `Visited ${pageName} page`, {
      url: window.location.href,
      referrer,
      userAgent: navigator.userAgent
    });
  }

  trackPageTime() {
    const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);
    if (timeSpent > 10) { // Only track if spent more than 10 seconds
      const pageName = this.getCurrentPageName();
      this.trackActivity('page_time', `Spent ${this.formatTime(timeSpent)} on ${pageName}`, {
        timeSpent,
        page: window.location.pathname
      });
    }
  }

  trackNavigation(pageName, url) {
    const cleanPageName = pageName.replace(/\s+/g, ' ').trim();
    this.trackActivity('navigation', `Navigated to ${cleanPageName}`, { 
      url,
      from: window.location.pathname 
    });
  }

  trackSlotSpin(data) {
    const { bet, win, isJackpot, symbols } = data;
    let description = `Spun slot machine (Bet: ${bet} credits)`;
    
    if (isJackpot) {
      description += ` - 🎉 JACKPOT WON! (${win} credits)`;
      this.trackActivity('jackpot_win', `Won jackpot of ${win} credits!`, data);
    } else if (win > 0) {
      description += ` - Won ${win} credits`;
    } else {
      description += ` - No win`;
    }

    this.trackActivity('slot_spin', description, data);
  }

  trackBoosterPurchase(data) {
    const { boosterName, price, type } = data;
    this.trackActivity('booster_purchase', `Purchased ${boosterName} booster for ${price} credits`, data);
  }

  trackRewardClaim(data) {
    const { rewardType, rewardValue, level } = data;
    this.trackActivity('reward_claim', `Claimed ${rewardType} reward: ${rewardValue} (Level ${level})`, data);
  }

  trackProfileUpdate(data) {
    const { field, oldValue, newValue } = data;
    this.trackActivity('profile_update', `Updated ${field}`, data);
  }

  trackThemeChange(data) {
    const { oldTheme, newTheme } = data;
    this.trackActivity('theme_change', `Changed theme from ${oldTheme} to ${newTheme}`, data);
  }

  trackLevelUp(data) {
    const { newLevel, experience } = data;
    this.trackActivity('level_up', `🎉 Leveled up to Level ${newLevel}!`, data);
  }

  trackAchievement(data) {
    const { achievementName, description } = data;
    this.trackActivity('achievement', `🏆 Unlocked achievement: ${achievementName}`, data);
  }

  trackLogin(data) {
    const { username } = data;
    this.trackActivity('login', `${username} logged in`, data);
  }

  trackLogout(data) {
    const { username } = data;
    this.trackActivity('logout', `${username} logged out`, data);
  }

  async loadRecentActivities() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/users/activities', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          this.activities = data.activities || [];
          this.updateActivityDisplay();
        }
      }
    } catch (error) {
      console.error('Failed to load recent activities:', error);
    }
  }

  updateActivityDisplay() {
    const activityList = document.getElementById('recent-activity');
    if (!activityList) return;

    if (this.activities.length === 0) {
      activityList.innerHTML = `
        <div class="no-activity">
          <i class="fas fa-clock"></i>
          <p>No recent activity to display</p>
          <small>Start playing to see your activity here!</small>
        </div>
      `;
      return;
    }

    activityList.innerHTML = this.activities.slice(0, 20).map(activity => {
      const timeAgo = this.getTimeAgo(new Date(activity.timestamp));
      const activityInfo = this.activityTypes[activity.type] || { icon: 'fas fa-circle', color: '#666' };
      
      return `
        <div class="activity-item" data-type="${activity.type}">
          <div class="activity-icon" style="color: ${activityInfo.color}">
            <i class="${activityInfo.icon}"></i>
          </div>
          <div class="activity-content">
            <div class="activity-description">${activity.description}</div>
            <div class="activity-time">${timeAgo}</div>
            ${activity.data.page ? `<div class="activity-page">on ${this.formatPageName(activity.data.page)}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  getCurrentPageName() {
    const path = window.location.pathname;
    const pageNames = {
      '/': 'Slot Machine',
      '/boosters': 'Boosters',
      '/rewards': 'Rewards',
      '/profile': 'Profile',
      '/leaderboard': 'Leaderboard'
    };
    return pageNames[path] || 'Unknown Page';
  }

  formatPageName(path) {
    const pageNames = {
      '/': 'Slot Machine',
      '/boosters': 'Boosters',
      '/rewards': 'Rewards',
      '/profile': 'Profile',
      '/leaderboard': 'Leaderboard'
    };
    return pageNames[path] || 'Unknown Page';
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  }

  getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  track(type, description, data = {}) {
    this.trackActivity(type, description, data);
  }
}

const activityTracker = new ActivityTracker();
window.ActivityTracker = activityTracker;