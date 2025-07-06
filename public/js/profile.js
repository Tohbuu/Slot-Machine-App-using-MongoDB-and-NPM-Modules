// Complete the profile form handler
function handleProfileUpdate(e) {
  e.preventDefault();
  const form = e.target;
  const formData = {
    email: form.email.value,
    username: form.username.value
  };
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving...';
  updateProfile(formData)
    .then(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    })
    .catch(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    });
}

// Complete the fetchProfile function
async function fetchProfile() {
  const token = localStorage.getItem('token');
  const res = await fetch('/api/users/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return;
  const user = await res.json();
  updateProfileDisplay(user);
}

// Add missing CSS animations for messages
const messageStyles = `
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOutRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}
`;

// Inject styles if not already present
if (!document.querySelector('#profile-message-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'profile-message-styles';
  styleSheet.textContent = messageStyles;
  document.head.appendChild(styleSheet);
}

// Add missing collection tab HTML structure check and creation
function ensureCollectionStructure() {
  const collectionsSection = document.querySelector('.collections-section');
  if (!collectionsSection) {
    const profileSection = document.querySelector('.profile-section');
    if (profileSection) {
      const collectionsHTML = `
        <div class="collections-section">
          <h3><i class="fas fa-star"></i> Collections</h3>
          <div class="collection-tabs">
            <button class="tab-btn active" data-tab="frames">
              <i class="fas fa-picture-o"></i> Frames
            </button>
            <button class="tab-btn" data-tab="badges">
              <i class="fas fa-shield-alt"></i> Badges
            </button>
            <button class="tab-btn" data-tab="themes">
              <i class="fas fa-palette"></i> Themes
            </button>
          </div>
          <div class="collection-content">
            <div class="collection-tab active" id="frames-tab">
              <div class="collection-grid" id="frames-collection"></div>
            </div>
            <div class="collection-tab" id="badges-tab">
              <div class="collection-grid" id="badges-collection"></div>
            </div>
            <div class="collection-tab" id="themes-tab">
              <div class="collection-grid" id="themes-collection"></div>
            </div>
          </div>
        </div>
      `;
      profileSection.insertAdjacentHTML('beforeend', collectionsHTML);
    }
  }
}

// Add missing activity section structure
function ensureActivityStructure() {
  const activitySection = document.querySelector('.activity-section');
  if (!activitySection) {
    const profileSection = document.querySelector('.profile-section');
    if (profileSection) {
      const activityHTML = `
        <div class="activity-section">
          <h3><i class="fas fa-history"></i> Recent Activity</h3>
          <div class="activity-list" id="recent-activity"></div>
        </div>
      `;
      profileSection.insertAdjacentHTML('beforeend', activityHTML);
    }
  }
}

// Add missing stats section structure
function ensureStatsStructure() {
  const statsSection = document.querySelector('.stats-section');
  if (!statsSection) {
    const profileSection = document.querySelector('.profile-section');
    if (profileSection) {
      const statsHTML = `
        <div class="stats-section">
          <h3><i class="fas fa-chart-bar"></i> Game Statistics</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-icon games"><i class="fas fa-gamepad"></i></div>
              <div class="stat-info">
                <div class="stat-number total-spins">0</div>
                <div class="stat-name">Total Spins</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon wins"><i class="fas fa-trophy"></i></div>
              <div class="stat-info">
                <div class="stat-number total-wins">0</div>
                <div class="stat-name">Total Wins</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon jackpots"><i class="fas fa-crown"></i></div>
              <div class="stat-info">
                <div class="stat-number jackpots-won">0</div>
                <div class="stat-name">Jackpots Won</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon winrate"><i class="fas fa-percentage"></i></div>
              <div class="stat-info">
                <div class="stat-number win-rate">0%</div>
                <div class="stat-name">Win Rate</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon bank"><i class="fas fa-piggy-bank"></i></div>
              <div class="stat-info">
                <div class="stat-number bank-balance">0</div>
                <div class="stat-name">Bank Balance</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon boosters"><i class="fas fa-rocket"></i></div>
              <div class="stat-info">
                <div class="stat-number active-boosters">0</div>
                <div class="stat-name">Active Boosters</div>
              </div>
            </div>
          </div>
        </div>
      `;
      profileSection.insertAdjacentHTML('beforeend', statsHTML);
    }
  }
}

// Update the DOMContentLoaded event to ensure structures exist
document.addEventListener('DOMContentLoaded', () => {
  // Initialize avatar decorations first
  if (localStorage.getItem('token')) {
    window.avatarDecorations = new AvatarDecorations();
  }

  // Then initialize profile functionality
  if (document.querySelector('.profile-form')) {
    loadProfile();
    setupProfileForm();
    setupThemeSelector();
    setupAvatarUpload();
    setupCollectionTabs();
    loadUserStats();
    loadCollections();
    loadRecentActivity();
    loadLeaderboardRank();
  }
  updateHeaderUserInfo();
  applySavedTheme();
});

// Update profile
async function updateProfile(data) {
  const token = localStorage.getItem('token');
  const res = await fetch('/api/users', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  const result = await res.json();
  if (result.success) {
    showMessage('Profile updated successfully!', true);
    updateProfileDisplay(result.user);
  } else {
    showMessage(result.message || 'Update failed', false);
  }
}

// Update theme (save to server and localStorage, apply globally)
async function updateTheme(theme) {
  const token = localStorage.getItem('token');
  const res = await fetch('/api/users/theme', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ theme })
  });
  const result = await res.json();
  if (result.success) {
    // Save to localStorage and apply globally
    localStorage.setItem('theme', theme);
    applyTheme(theme);
    // Update active theme indicator
    document.querySelectorAll('.theme-option').forEach(option => {
      option.classList.remove('active');
    });
    document.querySelector(`.theme-option[data-theme="${theme}"]`).classList.add('active');
  }
}

// Apply theme globally
function applyTheme(theme) {
  // Remove all theme classes
  document.body.className = document.body.className.replace(/\btheme-\S+/g, '');
  // Add new theme class
  document.body.classList.add(`theme-${theme}`);
  // Update background color instantly
  document.body.style.backgroundColor = getComputedStyle(document.body).getPropertyValue('--background');
}

// Apply saved theme on page load
function applySavedTheme() {
  const savedTheme = localStorage.getItem('theme') || 'default';
  applyTheme(savedTheme);
  // Set active state on theme options if present
  document.querySelectorAll('.theme-option').forEach(option => {
    option.classList.toggle('active', option.dataset.theme === savedTheme);
  });
}

// Load user profile and stats
async function loadProfile() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) return;
    
    const { user } = await response.json();
    updateProfileDisplay(user);
    updateProfileStats(user);
  } catch (err) {
    console.error('Failed to load profile:', err);
  }
}

// Enhanced error handling for missing elements
function safeQuerySelector(selector, fallback = null) {
  const element = document.querySelector(selector);
  if (!element && fallback) {
    console.warn(`Element not found: ${selector}, using fallback`);
    return fallback;
  }
  return element;
}

// Enhanced updateProfileDisplay with null checks
function updateProfileDisplay(user) {
  // Update basic info with null checks
  const profileUsername = safeQuerySelector('.profile-username');
  if (profileUsername) profileUsername.textContent = user.username;
  
  const profileAvatar = safeQuerySelector('.profile-avatar');
  if (profileAvatar) profileAvatar.src = `/images/avatars/${user.profilePicture}`;
  
  const dropdownAvatar = safeQuerySelector('.dropdown-avatar');
  if (dropdownAvatar) dropdownAvatar.src = `/images/avatars/${user.profilePicture}`;
  
  // Update form fields
  const usernameInput = safeQuerySelector('#username');
  if (usernameInput) usernameInput.value = user.username;
  
  const emailInput = safeQuerySelector('#email');
  if (emailInput) emailInput.value = user.email;
  
  // Update header info
  const balanceAmount = safeQuerySelector('.balance-amount');
  if (balanceAmount) balanceAmount.textContent = user.balance;
  
  const userAvatar = safeQuerySelector('.user-avatar');
  if (userAvatar) userAvatar.src = `/images/avatars/${user.profilePicture}`;
}

// Enhanced updateProfileStats with null checks
function updateProfileStats(user) {
  // Basic stats with null checks
  const balanceStat = safeQuerySelector('.stat-value.balance');
  if (balanceStat) balanceStat.textContent = user.balance.toLocaleString();
  
  const levelStat = safeQuerySelector('.stat-value.level');
  if (levelStat) levelStat.textContent = user.level;
  
  const experienceStat = safeQuerySelector('.stat-value.experience');
  if (experienceStat) experienceStat.textContent = user.experience;
  
  const rewardsStat = safeQuerySelector('.stat-value.rewards-claimed');
  if (rewardsStat) rewardsStat.textContent = user.claimedRewards?.length || 0;
  
  // Game stats with null checks
  const totalSpinsStat = safeQuerySelector('.stat-number.total-spins');
  if (totalSpinsStat) totalSpinsStat.textContent = user.totalSpins || 0;
  
  const totalWinsStat = safeQuerySelector('.stat-number.total-wins');
  if (totalWinsStat) totalWinsStat.textContent = user.totalWins || 0;
  
  const jackpotsStat = safeQuerySelector('.stat-number.jackpots-won');
  if (jackpotsStat) jackpotsStat.textContent = user.jackpotsWon || 0;
  
  const bankBalanceStat = safeQuerySelector('.stat-number.bank-balance');
  if (bankBalanceStat) bankBalanceStat.textContent = user.bankBalance?.toLocaleString() || 0;
  
  const boostersStat = safeQuerySelector('.stat-number.active-boosters');
  if (boostersStat) boostersStat.textContent = user.activeBoosters?.length || 0;
  
  // Calculate win rate
  const winRate = user.totalSpins > 0 ? ((user.totalWins / user.totalSpins) * 100).toFixed(1) : 0;
  const winRateStat = safeQuerySelector('.stat-number.win-rate');
  if (winRateStat) winRateStat.textContent = `${winRate}%`;

  // Update progress bar
  const requiredXp = getXpForLevel(user.level);
  const currentLevelXp = user.experience;
  const progressPercent = (currentLevelXp / requiredXp) * 100;
  
  const progressFill = safeQuerySelector('.progress-fill');
  if (progressFill) progressFill.style.width = `${progressPercent}%`;
  
  const nextLevel = safeQuerySelector('.next-level');
  if (nextLevel) nextLevel.textContent = user.level + 1;
  
  const currentXp = safeQuerySelector('.current-xp');
  if (currentXp) currentXp.textContent = currentLevelXp;
  
  const requiredXpEl = safeQuerySelector('.required-xp');
  if (requiredXpEl) requiredXpEl.textContent = requiredXp;
  
  const maxLevelEl = safeQuerySelector('.max-level');
  if (maxLevelEl) maxLevelEl.textContent = MAX_LEVEL;
}

// Profile form logic
function setupProfileForm() {
  const form = document.querySelector('.profile-form');
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(form);
    const data = {
      username: formData.get('username'),
      email: formData.get('email')
    };
    
    // Basic validation
    if (!data.username || data.username.length < 3) {
      showMessage('Username must be at least 3 characters', false);
      return;
    }
    
    if (!data.email || !isValidEmail(data.email)) {
      showMessage('Please enter a valid email address', false);
      return;
    }
    
    const submitBtn = form.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    
    try {
      await updateProfile(data);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}

function handleProfileUpdate(e) {
  e.preventDefault();
  const form = e.target;
  const formData = {
    email: form.email.value,
    username: form.username.value
  };
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving...';
  updateProfile(formData)
    .then(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    })
    .catch(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    });
}

// Theme selector logic
function setupThemeSelector() {
  const themeOptions = document.querySelectorAll('.theme-option');
  themeOptions.forEach(option => {
    option.addEventListener('click', () => {
      const theme = option.dataset.theme;
      updateTheme(theme);
    });
  });
}

// Avatar upload logic
function setupAvatarUpload() {
  const avatarUpload = document.getElementById('avatar-upload');
  const profileAvatar = document.querySelector('.profile-avatar');
  
  if (!avatarUpload) return;
  
  avatarUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      showMessage('Please select an image file', false);
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      showMessage('Image must be less than 2MB', false);
      return;
    }
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
      profileAvatar.src = event.target.result;
    };
    reader.readAsDataURL(file);
    
    // Upload file
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        showMessage('Avatar updated successfully!', true);
        // Update all avatar instances
        document.querySelectorAll('.user-avatar, .dropdown-avatar').forEach(img => {
          img.src = `/images/avatars/${result.profilePicture}?t=${Date.now()}`;
        });
      } else {
        showMessage(result.error || 'Failed to upload avatar', false);
        // Revert preview
        loadProfile();
      }
    } catch (err) {
      showMessage('Error uploading avatar', false);
      loadProfile();
    }
  });
}

// Improved message display function to prevent duplicates
let messageTimeout;
function showMessage(message, isSuccess = true) {
  // Clear any existing message timeout
  if (messageTimeout) {
    clearTimeout(messageTimeout);
  }
  
  // Remove any existing messages
  const existingMessages = document.querySelectorAll('.profile-message');
  existingMessages.forEach(msg => msg.remove());
  
  const messageEl = document.createElement('div');
  messageEl.className = `profile-message ${isSuccess ? 'success' : 'error'}`;
  messageEl.textContent = message;
  
  // Add styles
  messageEl.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
    background: ${isSuccess ? '#4CAF50' : '#f44336'};
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;
  
  document.body.appendChild(messageEl);
  
  // Auto remove after 3 seconds
  messageTimeout = setTimeout(() => {
    messageEl.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.remove();
      }
    }, 300);
  }, 3000);
}

// Update header info (avatar and balance)
function updateHeaderUserInfo() {
  fetch('/api/users/me', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        document.querySelector('.balance-amount').textContent = data.user.balance;
        const avatar = document.querySelector('.user-avatar');
        if (avatar) {
          avatar.src = `/images/avatars/${data.user.profilePicture || 'default.png'}`;
          
          // Refresh decorations after avatar update
          if (window.avatarDecorations) {
            window.avatarDecorations.userData = data.user;
            window.avatarDecorations.userLevel = data.user.level || 1;
            window.avatarDecorations.userUnlocks = data.user.unlocks || [];
            window.avatarDecorations.applyDecorations();
          }
        }
      }
    })
    .catch(err => console.error('Failed to update header user info:', err));
}

// Setup collection tabs
function setupCollectionTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.collection-tab');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      
      // Update active tab
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(t => t.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(`${tabName}-tab`).classList.add('active');
    });
  });
}

// Enhanced loadCollections with better error handling
async function loadCollections() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) {
      console.error('Failed to fetch user data for collections');
      return;
    }
    
    const { user } = await response.json();
    
    // Load collections with fallback for missing containers
    const framesContainer = document.getElementById('frames-collection');
    if (framesContainer) {
      loadFramesCollection(user.unlocks || []);
    }
    
    const badgesContainer = document.getElementById('badges-collection');
    if (badgesContainer) {
      loadBadgesCollection(user);
    }
    
    const themesContainer = document.getElementById('themes-collection');
    if (themesContainer) {
      loadThemesCollection(user.theme);
    }
  } catch (err) {
    console.error('Failed to load collections:', err);
  }
}

// Load frames collection
function loadFramesCollection(unlocks) {
  const framesContainer = document.getElementById('frames-collection');
  const frames = [
    { id: 'bronze_frame', name: 'Bronze Frame', level: 25 },
    { id: 'silver_frame', name: 'Silver Frame', level: 50 },
    { id: 'gold_frame', name: 'Gold Frame', level: 75 },
    { id: 'legendary_frame', name: 'Legendary Frame', level: 100 }
  ];
  
  framesContainer.innerHTML = frames.map(frame => {
    const owned = unlocks.includes(frame.id);
    return `
      <div class="collection-item frame-item ${frame.id.split('_')[0]} ${owned ? 'owned' : 'locked'}" 
           data-tooltip="${owned ? 'Owned' : `Unlock at Level ${frame.level}`}">
        <div class="frame-preview">
          <img src="/images/avatars/default.png" alt="Avatar">
          <div class="frame-border ${frame.id}"></div>
        </div>
        <div class="collection-item-name">${frame.name}</div>
        <div class="collection-item-status">${owned ? 'Owned' : 'Locked'}</div>
      </div>
    `;
  }).join('');
}

// Load badges collection
function loadBadgesCollection(user) {
  const badgesContainer = document.getElementById('badges-collection');
  const badges = [
    { id: 'bronze_badge', name: 'Bronze Badge', level: 25, icon: 'fa-award' },
    { id: 'silver_badge', name: 'Silver Badge', level: 50, icon: 'fa-medal' },
    { id: 'gold_badge', name: 'Gold Badge', level: 75, icon: 'fa-trophy' },
    { id: 'legendary_badge', name: 'Legendary Badge', level: 100, icon: 'fa-crown' }
  ];
  
  badgesContainer.innerHTML = badges.map(badge => {
    const owned = user.level >= badge.level;
    return `
      <div class="collection-item badge-item ${owned ? 'owned' : 'locked'}" 
           data-tooltip="${owned ? 'Owned' : `Unlock at Level ${badge.level}`}">
        <div class="badge-preview ${badge.id}">
          <i class="fas ${badge.icon}"></i>
        </div>
        <div class="collection-item-name">${badge.name}</div>
        <div class="collection-item-status">${owned ? 'Owned' : 'Locked'}</div>
      </div>
    `;
  }).join('');
}

// Load themes collection
function loadThemesCollection(currentTheme) {
  const themesContainer = document.getElementById('themes-collection');
  const themes = [
    { id: 'default', name: 'Default', gradient: 'linear-gradient(135deg, #6e48aa 0%, #9d50bb 100%)' },
    { id: 'cyber', name: 'Cyber', gradient: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)' },
    { id: 'neon', name: 'Neon', gradient: 'linear-gradient(135deg, #a8ff78 0%, #78ffd6 100%)' },
    { id: 'dark', name: 'Dark', gradient: 'linear-gradient(135deg, #232526 0%, #414345 100%)' }
  ];
  
  themesContainer.innerHTML = themes.map(theme => {
    const isActive = currentTheme === theme.id;
    return `
      <div class="collection-item theme-item ${isActive ? 'owned' : ''}" 
           data-theme="${theme.id}"
           data-tooltip="${isActive ? 'Currently Active' : 'Click to Apply'}"
           style="background: ${theme.gradient};">
        <div class="theme-name">${theme.name}</div>
        ${isActive ? '<div class="theme-active-indicator"><i class="fas fa-check"></i></div>' : ''}
      </div>
    `;
  }).join('');
  
  // Add click handlers for theme switching
  themesContainer.querySelectorAll('.theme-item').forEach(item => {
    item.addEventListener('click', () => {
      const themeId = item.dataset.theme;
      updateTheme(themeId);
    });
  });
}

// Enhanced loadRecentActivity with empty state handling
async function loadRecentActivity() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) return;
    
    const { user } = await response.json();
    const activityContainer = document.getElementById('recent-activity');
    
    if (!activityContainer) {
      console.warn('Recent activity container not found');
      return;
    }
    
    if (!user.recentActivity || user.recentActivity.length === 0) {
      activityContainer.innerHTML = `
        <div class="activity-empty">
          <i class="fas fa-history"></i>
          <p>No recent activity</p>
          <small>Start playing to see your activity here!</small>
        </div>
      `;
      return;
    }
    
    activityContainer.innerHTML = user.recentActivity
      .slice(0, 10) // Show last 10 activities
      .map(activity => `
        <div class="activity-item ${activity.type}">
          <div class="activity-icon ${activity.type}">
            <i class="fas ${getActivityIcon(activity.type)}"></i>
          </div>
          <div class="activity-content">
            <div class="activity-title">${getActivityTitle(activity.type)}</div>
            <div class="activity-description">${activity.description}</div>
          </div>
          <div class="activity-time">${formatTimeAgo(activity.timestamp)}</div>
        </div>
      `).join('');
  } catch (err) {
    console.error('Failed to load recent activity:', err);
  }
}

// Enhanced loadLeaderboardRank with better error handling
async function loadLeaderboardRank() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/slots/leaderboard', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) {
      console.warn('Failed to fetch leaderboard data');
      return;
    }
    
    const data = await response.json();
    const currentUser = await getCurrentUser();
    
    if (currentUser && data.topPlayers) {
      const userRank = data.topPlayers.findIndex(player => 
        player._id === currentUser.user._id
      ) + 1;
      
      const rankElement = document.querySelector('.user-rank');
      if (rankElement) {
        rankElement.textContent = userRank > 0 ? `#${userRank}` : 'Unranked';
      }
    }
  } catch (err) {
    console.error('Failed to load leaderboard rank:', err);
    const rankElement = document.querySelector('.user-rank');
    if (rankElement) {
      rankElement.textContent = '--';
    }
  }
}

// Helper function to get current user
async function getCurrentUser() {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/users/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.ok ? await response.json() : null;
}

// Helper functions for activity
function getActivityIcon(type) {
  const icons = {
    spin: 'fa-sync-alt',
    win: 'fa-trophy',
    loss: 'fa-times-circle',
    jackpot: 'fa-crown',
    level: 'fa-level-up-alt',
    reward: 'fa-gift',
    achievement: 'fa-star',
    bonus: 'fa-bolt'
  };
  return icons[type] || 'fa-circle';
}

function getActivityTitle(type) {
  const titles = {
    spin: 'Slot Spin',
    win: 'Big Win!',
    loss: 'Spin Result',
    jackpot: 'JACKPOT!',
    level: 'Level Up!',
    reward: 'Reward Claimed',
    achievement: 'Achievement Unlocked',
    bonus: 'Bonus Round'
  };
  return titles[type] || 'Activity';
}

function formatTimeAgo(timestamp) {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now - time) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

// Helper function for email validation
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Load user stats with error handling
async function loadUserStats() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Failed to load stats');
    
    const { user } = await response.json();
    updateProfileStats(user);
  } catch (err) {
    console.error('Failed to load user stats:', err);
    // Show loading skeletons or error state
    document.querySelectorAll('.stat-number, .stat-value').forEach(el => {
      if (!el.textContent || el.textContent === '0') {
        el.classList.add('loading');
      }
    });
  }
}

// Complete the missing BoosterPack model completion
const BoosterPackSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    unique: true
  },
  levelRequired: { 
    type: Number, 
    required: true,
    min: 1,
    max: 20
  },
  price: { 
    type: Number, 
    required: true,
    min: 100
  },
  effects: {
    winMultiplier: { 
      type: Number, 
      default: 1.0,
      min: 1.0,
      max: 3.0
    },
    freeSpins: { 
      type: Number, 
      default: 0,
      min: 0
    },
    jackpotBoost: {
      type: Number,
      default: 0,
      min: 0,
      max: 2.0
    }
  },
  icon: {
    type: String,
    default: 'default-booster.png'
  },
  description: {
    type: String,
    required: true
  }
}, { timestamps: true });

// Complete the VIP Legend booster pack
BoosterPackSchema.statics.initBoosters = async function() {
  const defaultBoosters = [
    {
      name: "Beginner's Luck",
      levelRequired: 1,
      price: 100000, // 100k
      effects: { winMultiplier: 1.2, freeSpins: 3 },
      description: "20% win boost + 3 free spins"
    },
    {
      name: "Jackpot Hunter",
      levelRequired: 5,
      price: 500000, // 500k
      effects: { jackpotBoost: 0.5, freeSpins: 5 },
      description: "50% better jackpot odds + 5 free spins"
    },
    {
      name: "High Roller",
      levelRequired: 10,
      price: 1000000, // 1M
      effects: { winMultiplier: 1.5, jackpotBoost: 1.0 },
      description: "50% win boost + double jackpot chance"
    },
    {
      name: "Platinum Package",
      levelRequired: 15,
      price: 5000000, // 5M
      effects: { winMultiplier: 2.0, freeSpins: 10, jackpotBoost: 1.5 },
      description: "Double wins + 10 spins + massive jackpot boost"
    },
    {
      name: "VIP Legend",
      levelRequired: 20,
      price: 20000000, // 20M
      effects: { winMultiplier: 3.0, freeSpins: 15, jackpotBoost: 2.0 },
      description: "Triple wins + 15 spins + maximum jackpot boost"
    }
  ];

  // Check if boosters already exist
  const existingCount = await this.countDocuments();
  if (existingCount === 0) {
    await this.insertMany(defaultBoosters);
    console.log('Default booster packs created');
  }
};

// Complete the missing boosters.js renderBoosters function
function renderBoosters(boosters, activeBoosters = []) {
  // Filter out null boosters
  boosters = boosters.filter(b => b && b._id);
  
  // Get active booster IDs for comparison
  const activeBoosterIds = activeBoosters.map(ab => ab.pack?._id || ab.pack).filter(Boolean);
  
  this.packsContainer.innerHTML = boosters.map(pack => {
    const isActive = activeBoosterIds.includes(pack._id);
    const canAfford = this.currentBankBalance >= pack.price;
    
    return `
      <div class="pack-card ${pack.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}" data-id="${pack._id}">
        <div class="pack-header">
          <img src="/images/boosters/${pack.icon}" alt="${pack.name}" onerror="this.src='/images/boosters/default-booster.png'">
          <span class="pack-name">${pack.name}</span>
          <span class="pack-level">Level ${pack.levelRequired}+</span>
        </div>
        
        <div class="pack-effects">
          ${pack.effects.winMultiplier > 1 ? `<div class="effect"><i class="fas fa-arrow-up"></i> ${((pack.effects.winMultiplier - 1) * 100).toFixed(0)}% Win Boost</div>` : ''}
          ${pack.effects.freeSpins > 0 ? `<div class="effect"><i class="fas fa-sync"></i> ${pack.effects.freeSpins} Free Spins</div>` : ''}
          ${pack.effects.jackpotBoost > 0 ? `<div class="effect"><i class="fas fa-crown"></i> ${(pack.effects.jackpotBoost * 100).toFixed(0)}% Jackpot Boost</div>` : ''}
        </div>
        
        <div class="pack-description">${pack.description}</div>
        
        <div class="pack-price">
          <i class="fas fa-coins"></i> ${this.formatPrice(pack.price)}
        </div>
        
        <button class="purchase-btn ${isActive ? 'active' : canAfford ? 'available' : 'disabled'}" 
                ${isActive || !canAfford ? 'disabled' : ''}>
          ${isActive ? 'Active' : canAfford ? 'Purchase' : 'Insufficient Funds'}
        </button>
      </div>
    `;
  }).join('');
}

// Complete the missing purchaseBooster function
async function purchaseBooster(packId) {
  try {
    const response = await fetch('/api/boosters/purchase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ packId })
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('Booster purchased successfully!');
      this.currentBankBalance = result.newBankBalance;
      this.updateBankBalance();
      await this.loadBoosters();
      await this.loadActiveBoosters();
    } else {
      alert(result.error || 'Purchase failed');
    }
  } catch (err) {
    console.error('Purchase error:', err);
    alert('Network error - please try again');
  }
}

// Complete the missing loadActiveBoosters function
async function loadActiveBoosters() {
  try {
    const response = await fetch('/api/boosters/active', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const { success, boosters, error } = await response.json();
    
    if (success) {
      this.renderActiveBoosters(boosters);
    } else {
      console.error('Error loading active boosters:', error);
    }
  } catch (err) {
    console.error('Network error:', err);
  }
}

// Complete the missing renderActiveBoosters function
function renderActiveBoosters(boosters) {
  if (!boosters || boosters.length === 0) {
    this.activeBoostersEl.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-box-open"></i>
        <p>No active boosters</p>
      </div>
    `;
    return;
  }
  
  this.activeBoostersEl.innerHTML = boosters.map(booster => {
    const timeLeft = new Date(booster.expiresAt) - new Date();
    const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)));
    const minutesLeft = Math.max(0, Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)));
    
    return `
      <div class="active-booster">
        <div class="booster-info">
          <span class="booster-name">${booster.pack?.name || 'Unknown Booster'}</span>
          <div class="booster-effects">
            ${booster.effects.winMultiplier > 1 ? `<span class="effect">+${((booster.effects.winMultiplier - 1) * 100).toFixed(0)}% Win</span>` : ''}
            ${booster.effects.freeSpins > 0 ? `<span class="effect">${booster.effects.freeSpins} Free Spins</span>` : ''}
            ${booster.effects.jackpotBoost > 0 ? `<span class="effect">+${(booster.effects.jackpotBoost * 100).toFixed(0)}% Jackpot</span>` : ''}
          </div>
        </div>
        <div class="time-left">
          ${timeLeft > 0 ? `${hoursLeft}h ${minutesLeft}m left` : 'Expired'}
        </div>
      </div>
    `;
  }).join('');
}

// Complete the missing updateBankBalance function
function updateBankBalance() {
  fetch('/api/users/me', {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        this.currentBankBalance = data.user.bankBalance || 0;
        if (this.bankBalanceEl) {
          this.bankBalanceEl.textContent = this.currentBankBalance.toLocaleString();
        }
      }
    })
    .catch(err => console.error('Failed to update bank balance:', err));
}

// Complete the missing checkExpiredBoosters function
function checkExpiredBoosters() {
  const activeBoosterElements = document.querySelectorAll('.active-booster');
  let hasExpired = false;
  
  activeBoosterElements.forEach(element => {
    const timeLeftElement = element.querySelector('.time-left');
    if (timeLeftElement && timeLeftElement.textContent.includes('Expired')) {
      hasExpired = true;
    }
  });
  
  if (hasExpired) {
    this.loadActiveBoosters();
  }
}

const MAX_LEVEL = 100;

function getXpForLevel(level) {
  return 100 + level * 50;
}