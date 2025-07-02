class RewardManager {
  constructor() {
    this.battlepassTrack = document.getElementById('battlepass-track');
    this.currentLevelEl = document.getElementById('current-level');
    this.levelProgressEl = document.getElementById('level-progress');
    this.currentXpEl = document.getElementById('current-xp');
    this.requiredXpEl = document.getElementById('required-xp');
    this.milestoneList = document.getElementById('milestone-list');
    
    this.currentFilter = 'all';
    this.userLevel = 1;
    this.userXp = 0;
    this.userUnlocks = [];
    this.userFrames = [];
    this.userBadges = [];
    this.XP_PER_LEVEL = 100;
    
    this.init();
  }

  async init() {
    await this.loadUserProgress(); // Load user data first
    await this.loadRewards();
    this.setupEventListeners();
    this.loadMilestones();
    this.updateFilterCounts();
    this.updateUserStatus();
  }

  setupEventListeners() {
    // Filter controls
    document.getElementById('view-all').addEventListener('click', () => this.setFilter('all'));
    document.getElementById('view-available').addEventListener('click', () => this.setFilter('available'));
    document.getElementById('view-claimed').addEventListener('click', () => this.setFilter('claimed'));
    
    // Navigation
    document.getElementById('scroll-to-current').addEventListener('click', () => this.scrollToCurrentLevel());
    
    // Claim buttons (delegated)
    this.battlepassTrack.addEventListener('click', (e) => {
      if (e.target.classList.contains('claim-btn') && e.target.classList.contains('available')) {
        this.claimReward(e.target.dataset.rewardId);
      }
    });
  }

  setFilter(filter) {
    this.currentFilter = filter;
    
    // Update active button
    document.querySelectorAll('.control-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`view-${filter}`).classList.add('active');
    
    // Re-render with filter
    this.renderRewards(this.allRewards);
    this.updateFilterCounts();
  }

  updateFilterCounts() {
    if (!this.allRewards) return;
    
    const allCount = this.allRewards.length;
    const availableCount = this.allRewards.filter(r => r.isClaimable && !r.isClaimed).length;
    const claimedCount = this.allRewards.filter(r => r.isClaimed).length;
    
    // Update button text with counts
    document.getElementById('view-all').innerHTML = `All Levels <span class="count">(${allCount})</span>`;
    document.getElementById('view-available').innerHTML = `Available <span class="count">(${availableCount})</span>`;
    document.getElementById('view-claimed').innerHTML = `Claimed <span class="count">(${claimedCount})</span>`;
  }

  async loadRewards() {
    try {
      const response = await fetch('/api/rewards', {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const { success, rewards, error } = await response.json();
      
      if (success) {
        this.allRewards = rewards;
        this.renderRewards(rewards);
        this.updateFilterCounts();
      } else {
        console.error('Error loading rewards:', error);
        this.showError('Failed to load battle pass rewards');
      }
    } catch (err) {
      console.error('Network error:', err);
      this.showError('Connection error');
    }
  }

  renderRewards(rewards) {
    // Apply filter
    let filteredRewards = rewards;
    
    switch (this.currentFilter) {
      case 'available':
        filteredRewards = rewards.filter(r => r.isClaimable && !r.isClaimed);
        break;
      case 'claimed':
        filteredRewards = rewards.filter(r => r.isClaimed);
        break;
      default:
        filteredRewards = rewards;
    }

    // Show filter status
    this.showFilterStatus(filteredRewards.length, rewards.length);

    this.battlepassTrack.innerHTML = filteredRewards.map(reward => this.createRewardTierHTML(reward)).join('');
  }

  showFilterStatus(filteredCount, totalCount) {
    const statusText = this.currentFilter === 'all' 
      ? `Showing all ${totalCount} levels`
      : `Showing ${filteredCount} ${this.currentFilter} rewards of ${totalCount} total`;
    
    // Create or update status display
    let statusEl = document.querySelector('.filter-status');
    if (!statusEl) {
      statusEl = document.createElement('div');
      statusEl.className = 'filter-status';
      this.battlepassTrack.parentNode.insertBefore(statusEl, this.battlepassTrack);
    }
    
    statusEl.innerHTML = `
      <div class="status-info">
        <i class="fas fa-info-circle"></i>
        <span>${statusText}</span>
      </div>
    `;
  }

  createRewardTierHTML(reward) {
    const tierClasses = [
      'reward-tier',
      reward.level === this.userLevel ? 'current' : '',
      reward.isClaimed ? 'claimed' : '',
      !reward.isClaimable ? 'locked' : '',
      reward.isPremium ? 'premium' : '',
      this.isMilestone(reward.level) ? 'milestone' : '',
      `level-${reward.level}`
    ].filter(Boolean).join(' ');

    const statusText = reward.isClaimed ? 'Claimed' : 
                      reward.isClaimable ? 'Available' : 'Locked';
    
    const statusClass = reward.isClaimed ? 'claimed' : 
                       reward.isClaimable ? 'current' : 'locked';

    return `
      <div class="${tierClasses}" data-level="${reward.level}">
        ${this.getTierBadge(reward)}
        
        <div class="tier-header">
          <div class="tier-level ${reward.isPremium ? 'premium' : ''} ${this.isMilestone(reward.level) ? 'milestone' : ''}">
            Level ${reward.level}
          </div>
          <div class="tier-status ${statusClass}">
            <i class="fas ${this.getStatusIcon(reward)}"></i>
            ${statusText}
          </div>
        </div>

        <div class="tier-content">
          <div class="reward-items">
            ${this.createRewardItemsHTML(reward.rewards)}
          </div>
          ${this.createEnhancedFramePreview(reward)}
        </div>

        <button class="claim-btn ${this.getClaimButtonClass(reward)}" 
                data-reward-id="${reward._id}"
                ${!reward.isClaimable || reward.isClaimed ? 'disabled' : ''}>
          ${this.getClaimButtonText(reward)}
        </button>
      </div>
    `;
  }

  createRewardItemsHTML(rewards) {
    let html = '';
    
    // Credits
    if (rewards.credits > 0) {
      html += `
        <div class="reward-item credits">
          <div class="reward-icon credits">
            <i class="fas fa-coins"></i>
          </div>
          <div class="reward-text">Credits</div>
          <div class="reward-amount">${this.formatNumber(rewards.credits)}</div>
        </div>
      `;
    }

    // Booster Packs
    if (rewards.boosterPacks?.length > 0) {
      rewards.boosterPacks.forEach(pack => {
        html += `
          <div class="reward-item booster">
            <div class="reward-icon booster">
              <i class="fas fa-box-open"></i>
            </div>
            <div class="reward-text">${pack.pack?.name || 'Booster Pack'}</div>
            <div class="reward-amount">${pack.quantity}x</div>
          </div>
        `;
      });
    }

    // Frames and Badges with enhanced display
    if (rewards.unlocks?.length > 0) {
      rewards.unlocks.forEach(unlock => {
        const isFrame = unlock.includes('frame');
        const isBadge = unlock.includes('badge');
        const unlockType = isFrame ? 'frame' : isBadge ? 'badge' : 'unlock';
        
        html += `
          <div class="reward-item ${unlockType}">
            <div class="reward-icon ${unlockType}">
              <i class="fas ${this.getUnlockIcon(unlock)}"></i>
            </div>
            <div class="reward-text">${this.formatUnlockName(unlock)}</div>
            <div class="reward-amount">${this.getUnlockType(unlock)}</div>
            ${isFrame ? `<div class="frame-mini-preview ${unlock}"></div>` : ''}
            ${isBadge ? `<div class="badge-mini-preview ${unlock}"><i class="fas ${this.getBadgeIconByUnlock(unlock)}"></i></div>` : ''}
          </div>
        `;
      });
    }

    return html || '<div class="reward-item"><div class="reward-text">No rewards</div></div>';
  }

  createFramePreview(reward) {
    const frameUnlocks = reward.rewards.unlocks?.filter(unlock => unlock.includes('frame')) || [];
    if (frameUnlocks.length === 0) return '';

    return `
      <div class="frame-preview">
        <div class="preview-title">Frame Preview:</div>
        <div class="frame-showcase">
          ${frameUnlocks.map(frame => `
            <div class="frame-demo ${frame}">
              <div class="demo-avatar">
                <img src="/images/avatars/default.png" alt="Avatar">
                <div class="frame-border ${frame}"></div>
              </div>
              <span class="frame-name">${this.formatUnlockName(frame)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  getUnlockIcon(unlock) {
    if (unlock.includes('frame')) return 'fa-picture-o';
    if (unlock.includes('badge')) return 'fa-shield-alt';
    if (unlock.includes('theme')) return 'fa-palette';
    if (unlock.includes('spinner')) return 'fa-sync-alt';
    if (unlock.includes('avatar')) return 'fa-user-circle';
    return 'fa-unlock-alt';
  }

  getUnlockType(unlock) {
    if (unlock.includes('frame')) return 'Frame';
    if (unlock.includes('badge')) return 'Badge';
    if (unlock.includes('theme')) return 'Theme';
    return 'Unlock';
  }

  updateUserStatus() {
    console.log('Updating user status...', {
      level: this.userLevel,
      unlocks: this.userUnlocks
    });

    // Update user avatar with current frame and badge
    const userAvatar = document.querySelector('.user-avatar');
    console.log('User avatar found:', userAvatar);
    
    if (userAvatar) {
      // Get or create avatar container
      let avatarContainer = userAvatar.parentNode;
      if (!avatarContainer.classList.contains('avatar-container')) {
        // Wrap avatar in container if not already wrapped
        const container = document.createElement('div');
        container.className = 'avatar-container';
        userAvatar.parentNode.insertBefore(container, userAvatar);
        container.appendChild(userAvatar);
        avatarContainer = container;
      }

      // Remove existing decorations
      const existingFrame = avatarContainer.querySelector('.user-frame');
      const existingBadge = avatarContainer.querySelector('.user-badge');
      const existingGlow = avatarContainer.querySelector('.user-glow');
      
      if (existingFrame) existingFrame.remove();
      if (existingBadge) existingBadge.remove();
      if (existingGlow) existingGlow.remove();

      // Add current frame with glow effect
      const currentFrame = this.getCurrentFrame();
      console.log('Current frame:', currentFrame);
      
      if (currentFrame) {
        const frameEl = document.createElement('div');
        frameEl.className = `user-frame ${currentFrame}`;
        avatarContainer.appendChild(frameEl);
        
        // Add glow effect based on frame rarity
        const glowEl = document.createElement('div');
        glowEl.className = `user-glow ${this.getFrameRarity(currentFrame)}`;
        avatarContainer.appendChild(glowEl);
        
        console.log('Frame added:', frameEl.className);
      }

      // Add current badge
      const currentBadge = this.getCurrentBadge();
      console.log('Current badge:', currentBadge);
      
      if (currentBadge) {
        const badgeEl = document.createElement('div');
        badgeEl.className = `user-badge ${currentBadge}`;
        badgeEl.innerHTML = `<i class="fas ${this.getBadgeIcon(currentBadge)}"></i>`;
        badgeEl.title = this.getBadgeDescription(currentBadge);
        avatarContainer.appendChild(badgeEl);
        
        console.log('Badge added:', badgeEl.className);
      }

      // Force a test frame and badge for debugging (remove this after testing)
      if (!currentFrame && !currentBadge) {
        console.log('Adding test decorations...');
        
        // Test frame
        const testFrame = document.createElement('div');
        testFrame.className = 'user-frame bronze_frame';
        testFrame.style.cssText = `
          position: absolute;
          top: -3px;
          left: -3px;
          right: -3px;
          bottom: -3px;
          border: 3px solid #cd7f32;
          border-radius: 50%;
          pointer-events: none;
          z-index: 3;
          box-shadow: 0 0 10px rgba(205, 127, 50, 0.5);
        `;
        avatarContainer.appendChild(testFrame);
        
        // Test badge
        const testBadge = document.createElement('div');
        testBadge.className = 'user-badge bronze_badge';
        testBadge.innerHTML = '<i class="fas fa-award"></i>';
        testBadge.style.cssText = `
          position: absolute;
          bottom: -5px;
          right: -5px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #cd7f32, #b8860b);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7em;
          z-index: 4;
          border: 2px solid #1a1a2e;
        `;
        avatarContainer.appendChild(testBadge);
      }
    }
  }

  getCurrentFrame() {
    console.log('Getting current frame for level:', this.userLevel, 'unlocks:', this.userUnlocks);
    
    // For testing - show frames based on level even without unlocks
    if (this.userLevel >= 100) return 'legendary_frame';
    if (this.userLevel >= 75) return 'gold_frame';
    if (this.userLevel >= 50) return 'silver_frame';
    if (this.userLevel >= 25) return 'bronze_frame';
    
    // Original logic with unlocks
    const frameOrder = ['bronze_frame', 'silver_frame', 'gold_frame', 'legendary_frame'];
    for (let i = frameOrder.length - 1; i >= 0; i--) {
      if (this.userUnlocks.includes(frameOrder[i])) {
        return frameOrder[i];
      }
    }
    
    return null;
  }

  getCurrentBadge() {
    console.log('Getting current badge for level:', this.userLevel, 'unlocks:', this.userUnlocks);
    
    // For testing - show badges based on level even without unlocks
    if (this.userLevel >= 100) return 'legendary_badge';
    if (this.userLevel >= 75) return 'gold_badge';
    if (this.userLevel >= 50) return 'silver_badge';
    if (this.userLevel >= 25) return 'bronze_badge';
    
    // Original logic with unlocks
    if (this.userLevel >= 100 && this.userUnlocks.includes('legendary_badge')) return 'legendary_badge';
    if (this.userLevel >= 75 && this.userUnlocks.includes('gold_badge')) return 'gold_badge';
    if (this.userLevel >= 50 && this.userUnlocks.includes('silver_badge')) return 'silver_badge';
    if (this.userLevel >= 25 && this.userUnlocks.includes('bronze_badge')) return 'bronze_badge';
    if (this.userUnlocks.includes('vip_badge')) return 'vip_badge';
    
    return null;
  }

  getBadgeIcon(badge) {
    switch (badge) {
      case 'legendary_badge': return 'fa-crown';
      case 'gold_badge': return 'fa-trophy';
      case 'silver_badge': return 'fa-medal';
      case 'bronze_badge': return 'fa-award';
      case 'vip_badge': return 'fa-star';
      default: return 'fa-shield-alt';
    }
  }

  getTierBadge(reward) {
    if (reward.level === 100) {
      return '<div class="tier-badge legendary"><i class="fas fa-crown"></i></div>';
    }
    if (reward.isPremium) {
      return '<div class="tier-badge premium"><i class="fas fa-star"></i></div>';
    }
    if (this.isMilestone(reward.level)) {
      return '<div class="tier-badge milestone"><i class="fas fa-trophy"></i></div>';
    }
    return '';
  }

  getStatusIcon(reward) {
    if (reward.isClaimed) return 'fa-check-circle';
    if (reward.isClaimable) return 'fa-gift';
    return 'fa-lock';
  }

  getClaimButtonClass(reward) {
    if (reward.isClaimed) return 'claimed';
    if (reward.isClaimable) return 'available';
    return 'locked';
  }

  getClaimButtonText(reward) {
    if (reward.isClaimed) return 'Claimed';
    if (reward.isClaimable) return 'Claim Reward';
    return `Unlock at Level ${reward.level}`;
  }

  isMilestone(level) {
    return level % 25 === 0 || level === 100;
  }

  formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  }

  formatUnlockName(unlock) {
    return unlock.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  async claimReward(rewardId) {
    const button = document.querySelector(`[data-reward-id="${rewardId}"]`);
    
    if (button) {
      button.classList.add('claiming');
      button.textContent = 'Claiming...';
      button.disabled = true;
    }

    try {
      const response = await fetch('/api/rewards/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ rewardId })
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.showSuccessMessage('Reward claimed successfully!');
        await this.loadRewards();
        this.loadUserProgress();
        // Update reward notification after successful claim
        if (window.rewardNotification) {
          window.rewardNotification.onRewardClaimed();
        }
      } else {
        this.showError(result.error || 'Failed to claim reward');
        // Reset button state
        if (button) {
          button.classList.remove('claiming');
          button.classList.add('available');
          button.textContent = 'Claim Reward';
          button.disabled = false;
        }
      }
    } catch (err) {
      console.error('Claim error:', err);
      this.showError('Network error - please try again');
      
      // Reset button state
      if (button) {
        button.classList.remove('claiming');
        button.classList.add('available');
        button.textContent = 'Claim Reward';
        button.disabled = false;
      }
    }
  }

  async loadUserProgress() {
    try {
      const response = await fetch('/api/users/me', {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const { user } = await response.json();
      
      this.userLevel = user.level;
      this.userXp = user.experience;
      this.userUnlocks = user.unlocks || [];
      this.userFrames = user.frames || [];
      this.userBadges = user.badges || [];
      
      // Update UI
      this.currentLevelEl.textContent = user.level;
      this.currentXpEl.textContent = user.experience;
      
      // Calculate XP for current level (doubles each level)
      const requiredXp = getXpForLevel(user.level);
      this.requiredXpEl.textContent = requiredXp;
      
      // Update progress bar
      const progressPercent = Math.min(100, (user.experience / requiredXp) * 100);
      this.levelProgressEl.style.width = `${progressPercent}%`;
      
      document.querySelectorAll('.max-level').forEach(el => {
        el.textContent = MAX_LEVEL;
      });
      
    } catch (err) {
      console.error('Failed to load user progress:', err);
    }
  }

  loadMilestones() {
    const milestones = [
      { level: 25, reward: 'Bronze Frame + 25K Credits' },
      { level: 50, reward: 'Silver Frame + 100K Credits' },
      { level: 75, reward: 'Gold Frame + 300K Credits' },
      { level: 100, reward: 'Legendary Frame + 2.5M Credits + All Boosters' }
    ];

    this.milestoneList.innerHTML = milestones
      .filter(m => m.level > this.userLevel)
      .slice(0, 4)
      .map(milestone => `
        <div class="milestone-item">
          <div class="milestone-level">Level ${milestone.level}</div>
          <div class="milestone-reward">${milestone.reward}</div>
        </div>
      `).join('');
  }

  scrollToCurrentLevel() {
    const currentTier = document.querySelector(`[data-level="${this.userLevel}"]`);
    if (currentTier) {
      currentTier.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Add temporary highlight
      currentTier.style.boxShadow = '0 0 40px rgba(0, 212, 255, 0.8)';
      setTimeout(() => {
        currentTier.style.boxShadow = '';
      }, 2000);
    }
  }

  showSuccessMessage(message) {
    const successEl = document.createElement('div');
    successEl.className = 'success-message';
    successEl.textContent = message;
    successEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(45deg, #4caf50, #45a049);
      color: white;
      padding: 15px 20px;
      border-radius: 10px;
      box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
      z-index: 1000;
      font-family: 'Orbitron', monospace;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(successEl);
    
    setTimeout(() => {
      successEl.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => successEl.remove(), 300);
    }, 3000);
  }

  showError(message) {
    const errorEl = document.createElement('div');
    errorEl.className = 'error-message';
    errorEl.textContent = message;
    errorEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(45deg, #f44336, #d32f2f);
      color: white;
      padding: 15px 20px;
      border-radius: 10px;
      box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);
      z-index: 1000;
      font-family: 'Orbitron', monospace;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(errorEl);
    
    setTimeout(() => {
      errorEl.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => errorEl.remove(), 4000);
    }, 4000);
  }

  getBadgeIconByUnlock(unlock) {
    switch (unlock) {
      case 'bronze_badge': return 'fa-award';
      case 'silver_badge': return 'fa-medal';
      case 'gold_badge': return 'fa-trophy';
      case 'legendary_badge': return 'fa-crown';
      case 'vip_badge': return 'fa-star';
      case 'achievement_badge': return 'fa-shield-alt';
      default: return 'fa-shield-alt';
    }
  }

  getFrameRarity(frame) {
    switch (frame) {
      case 'bronze_frame': return 'common';
      case 'silver_frame': return 'rare';
      case 'gold_frame': return 'epic';
      case 'legendary_frame': return 'legendary';
      default: return 'common';
    }
  }

  createEnhancedFramePreview(reward) {
    const frameUnlocks = reward.rewards.unlocks?.filter(unlock => unlock.includes('frame')) || [];
    const badgeUnlocks = reward.rewards.unlocks?.filter(unlock => unlock.includes('badge')) || [];
    
    if (frameUnlocks.length === 0 && badgeUnlocks.length === 0) return '';

    return `
      <div class="cosmetic-preview">
        ${frameUnlocks.length > 0 ? `
          <div class="frame-preview-section">
            <div class="preview-title"><i class="fas fa-picture-o"></i> Frame Preview:</div>
            <div class="frame-showcase">
              ${frameUnlocks.map(frame => `
                <div class="frame-demo ${frame} ${this.getFrameRarity(frame)}">
                  <div class="demo-avatar-container">
                    <img src="/images/avatars/default.png" alt="Avatar" class="demo-avatar">
                    <div class="frame-border ${frame}"></div>
                    <div class="frame-glow ${this.getFrameRarity(frame)}"></div>
                  </div>
                  <span class="frame-name">${this.formatUnlockName(frame)}</span>
                  <span class="frame-rarity ${this.getFrameRarity(frame)}">${this.getFrameRarity(frame).toUpperCase()}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        ${badgeUnlocks.length > 0 ? `
          <div class="badge-preview-section">
            <div class="preview-title"><i class="fas fa-shield-alt"></i> Badge Preview:</div>
            <div class="badge-showcase">
              ${badgeUnlocks.map(badge => `
                <div class="badge-demo ${badge}">
                  <div class="badge-icon ${badge}">
                    <i class="fas ${this.getBadgeIconByUnlock(badge)}"></i>
                  </div>
                  <span class="badge-name">${this.formatUnlockName(badge)}</span>
                  <span class="badge-description">${this.getBadgeDescription(badge)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  getBadgeDescription(badge) {
    switch (badge) {
      case 'bronze_badge': return 'Reached Level 25';
      case 'silver_badge': return 'Reached Level 50';
      case 'gold_badge': return 'Reached Level 75';
      case 'legendary_badge': return 'Reached Level 100';
      case 'vip_badge': return 'VIP Status';
      default: return 'Special Achievement';
    }
  }
}

// Add this helper at the top of the file or inside the class as a static method
const MAX_LEVEL = 100;

function getXpForLevel(level) {
 return 100 + level * 50;
}

// Update user info in header (avatar and balance)
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
        }
      }
    });
}
document.addEventListener('DOMContentLoaded', updateHeaderUserInfo);

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('rewards-section')) {
    new RewardManager();
  }
});