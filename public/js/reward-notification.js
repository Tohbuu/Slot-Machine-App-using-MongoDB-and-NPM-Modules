// Notification management
class RewardNotification {
  constructor() {
    console.log('🔔 RewardNotification: Initializing...');
    this.init();
  }

  init() {
    // Wait for DOM to be fully loaded, then try to find elements
    this.findElements();
    
    // If elements aren't found, try again after a short delay
    if (!this.notificationDot || !this.rewardsLink) {
      console.log('🔔 Elements not found, retrying in 1 second...');
      setTimeout(() => {
        this.findElements();
        this.setupEventListeners();
        this.checkForNewRewards();
      }, 1000);
    } else {
      this.setupEventListeners();
      this.checkForNewRewards();
    }
  }

  findElements() {
    this.notificationDot = document.getElementById('rewards-notification');
    this.rewardsLink = document.querySelector('.rewards-nav-link');
    
    console.log('🔔 Notification dot found:', !!this.notificationDot);
    console.log('🔔 Rewards link found:', !!this.rewardsLink);
    
    // If elements still don't exist, create them
    if (!this.notificationDot && this.rewardsLink) {
      console.log('🔔 Creating missing notification dot...');
      this.createNotificationDot();
    }
    
    // If rewards link doesn't exist, try to find it by href
    if (!this.rewardsLink) {
      console.log('🔔 Trying to find rewards link by href...');
      this.rewardsLink = document.querySelector('a[href="/rewards"]');
      if (this.rewardsLink) {
        this.rewardsLink.classList.add('rewards-nav-link');
        console.log('🔔 Found and updated rewards link');
        this.createNotificationDot();
      }
    }
  }

  createNotificationDot() {
    if (this.rewardsLink && !this.notificationDot) {
      const dot = document.createElement('span');
      dot.className = 'notification-dot';
      dot.id = 'rewards-notification';
      dot.style.display = 'none';
      this.rewardsLink.appendChild(dot);
      this.notificationDot = dot;
      console.log('🔔 Created notification dot element');
    }
  }

  setupEventListeners() {
    // Hide notification when rewards link is clicked (but don't mark as claimed yet)
    if (this.rewardsLink) {
      this.rewardsLink.addEventListener('click', () => {
        console.log('🔔 Rewards link clicked - temporarily hiding notification');
        this.hideNotification();
        localStorage.setItem('rewards-visited', Date.now().toString());
        
        // Check again after a short delay to see if there are still unclaimed rewards
        setTimeout(() => {
          this.checkForUnclaimedRewards();
        }, 2000);
      });
    }
  }

  async checkForNewRewards() {
    console.log('🔔 Checking for new rewards...');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('🔔 No token found');
        return;
      }

      const response = await fetch('/api/users/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          const lastVisited = localStorage.getItem('rewards-visited');
          const lastLevelUp = localStorage.getItem('last-level-up');
          
          console.log('🔔 Last visited rewards:', lastVisited);
          console.log('🔔 Last level up:', lastLevelUp);
          console.log('🔔 Current user level:', data.user.level);
          
          // Show notification if user leveled up since last visit
          if (lastLevelUp && (!lastVisited || parseInt(lastLevelUp) > parseInt(lastVisited))) {
            console.log('🔔 Should show notification - user leveled up since last visit');
            this.showNotification();
          } else {
            console.log('🔔 No notification needed');
          }
          
          // Also check for unclaimed rewards
          await this.checkForUnclaimedRewards();
        }
      } else {
        console.log('🔔 Failed to fetch user data:', response.status);
      }
    } catch (error) {
      console.error('🔔 Error checking for new rewards:', error);
    }
  }

  async checkForUnclaimedRewards() {
    console.log('🔔 Checking for unclaimed rewards...');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('🔔 No token found for unclaimed rewards check');
        return;
      }

      // Check if there are available rewards to claim
      const response = await fetch('/api/rewards', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.rewards) {
          // Count unclaimed rewards that the user is eligible for
          const unclaimedRewards = data.rewards.filter(reward => 
            reward.canClaim && !reward.claimed
          );
          
          console.log('🔔 Unclaimed rewards found:', unclaimedRewards.length);
          
          if (unclaimedRewards.length > 0) {
            console.log('🔔 User has unclaimed rewards - showing notification');
            this.showNotification();
            
            // Store the count of unclaimed rewards
            localStorage.setItem('unclaimed-rewards-count', unclaimedRewards.length.toString());
          } else {
            console.log('🔔 No unclaimed rewards - hiding notification');
            this.hideNotification();
            localStorage.removeItem('unclaimed-rewards-count');
          }
        }
      } else {
        console.log('🔔 Failed to fetch rewards data:', response.status);
      }
    } catch (error) {
      console.error('🔔 Error checking for unclaimed rewards:', error);
    }
  }

  showNotification() {
    console.log('🔔 Showing notification');
    if (this.notificationDot) {
      // Force show with multiple methods
      this.notificationDot.style.display = 'block';
      this.notificationDot.style.visibility = 'visible';
      this.notificationDot.style.opacity = '1';
      this.notificationDot.classList.add('show-notification');
      console.log('🔔 Notification dot displayed');
      console.log('🔔 Dot styles:', this.notificationDot.style.cssText);
    } else {
      console.log('🔔 ERROR: Notification dot element not found!');
    }
  }

  hideNotification() {
    console.log('🔔 Hiding notification');
    if (this.notificationDot) {
      this.notificationDot.style.display = 'none';
      this.notificationDot.classList.remove('show-notification');
      console.log('🔔 Notification dot hidden');
    }
  }

  // Call this when user levels up
  onLevelUp() {
    console.log('🔔 User leveled up! Setting timestamp and showing notification');
    localStorage.setItem('last-level-up', Date.now().toString());
    this.showNotification();
  }

  // Call this when user claims a reward
  onRewardClaimed() {
    console.log('🔔 Reward claimed! Checking for remaining unclaimed rewards');
    // Check if there are still unclaimed rewards after claiming one
    setTimeout(() => {
      this.checkForUnclaimedRewards();
    }, 500);
  }

  // Periodic check for unclaimed rewards (every 30 seconds)
  startPeriodicCheck() {
    setInterval(() => {
      console.log('🔔 Periodic check for unclaimed rewards');
      this.checkForUnclaimedRewards();
    }, 30000); // Check every 30 seconds
  }
}

// Initialize notification system
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔔 DOM loaded, creating RewardNotification instance');
  window.rewardNotification = new RewardNotification();
  
  // Start periodic checking after initialization
  setTimeout(() => {
    if (window.rewardNotification) {
      window.rewardNotification.startPeriodicCheck();
    }
  }, 5000);
});