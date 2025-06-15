class RewardManager {
  constructor() {
    this.rewardsGrid = document.getElementById('rewards-grid');
    this.currentLevelEl = document.getElementById('current-level');
    this.levelProgressEl = document.getElementById('level-progress');
    this.init();
  }

  async init() {
    await this.loadRewards();
    this.loadUserProgress();
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
        this.renderRewards(rewards);
      } else {
        console.error('Error loading rewards:', error);
        alert('Failed to load rewards');
      }
    } catch (err) {
      console.error('Network error:', err);
      alert('Connection error');
    }
  }

  renderRewards(rewards) {
    this.rewardsGrid.innerHTML = rewards.map(reward => `
      <div class="reward-card ${reward.isClaimed ? 'claimed' : ''}" data-id="${reward._id}">
        <div class="reward-level">Level ${reward.level}</div>
        <div class="reward-content">
          ${reward.rewards.credits > 0 ? `
            <div class="reward-item">
              <i class="fas fa-coins"></i>
              ${reward.rewards.credits} Credits
            </div>
          ` : ''}
          ${reward.rewards.boosterPacks?.length > 0 ? reward.rewards.boosterPacks.map(pack => `
            <div class="reward-item">
              <i class="fas fa-box-open"></i>
              ${pack.quantity}x ${pack.pack?.name || 'Booster Pack'}
            </div>
          `).join('') : ''}
          ${reward.rewards.unlocks?.length > 0 ? reward.rewards.unlocks.map(unlock => `
            <div class="reward-item">
              <i class="fas fa-unlock-alt"></i>
              ${this.formatUnlockName(unlock)}
            </div>
          `).join('') : ''}
        </div>
        ${
          reward.isClaimed
            ? `<button class="btn-claim disabled" disabled>Claimed</button>`
            : reward.isClaimable
              ? `<button class="btn-claim" >Claim Reward</button>`
              : `<button class="btn-claim disabled" disabled>Locked</button>`
        }
      </div>
    `).join('');

    // Add event listeners
    document.querySelectorAll('.btn-claim:not(.disabled)').forEach(btn => {
      btn.addEventListener('click', (e) => this.claimReward(e));
    });
  }

  formatUnlockName(unlock) {
    return unlock.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  async claimReward(e) {
    const rewardId = e.target.closest('.reward-card').dataset.id;
    
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
        alert('Reward claimed successfully!');
        this.loadRewards();
        this.loadUserProgress();
      } else {
        alert(result.error || 'Failed to claim reward');
      }
    } catch (err) {
      console.error('Claim error:', err);
      alert('Network error - please try again');
    }
  }

  async loadUserProgress() {
    try {
      const response = await fetch('/api/user', {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const { user } = await response.json();
      this.currentLevelEl.textContent = user.level;
      this.levelProgressEl.style.width = `${user.experience}%`;
    } catch (err) {
      console.error('Failed to load user progress:', err);
    }
  }
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