class BoosterManager {
  constructor() {
    this.packsContainer = document.getElementById('packs-container');
    this.activeBoostersEl = document.getElementById('active-boosters');
    this.bankBalanceEl = document.getElementById('booster-bank-balance');
    this.init();
  }

  async init() {
    await this.loadBoosters();
    await this.loadActiveBoosters();
    this.updateBankBalance();
    this.setupEventListeners();
    setInterval(() => this.checkExpiredBoosters(), 60000);
  }

  setupEventListeners() {
    this.packsContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('purchase-btn')) {
        e.preventDefault(); // Prevent default button behavior
        
        // Get the pack ID from the button's data attribute or parent card
        const packId = e.target.dataset.packId || e.target.closest('.pack-card').dataset.id;
        
        console.log('Pack ID extracted:', packId); // Debug log
        
        if (packId) {
          this.purchaseBooster(packId);
        } else {
          console.error('No pack ID found');
          alert('Error: Could not identify booster pack');
        }
      }
    });
  }

  async loadBoosters() {
    try {
      const response = await fetch('/api/boosters', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const { success, boosters, error } = await response.json();
      if (success) {
        // Fetch active boosters to know which are active
        const activeRes = await fetch('/api/boosters/active', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const { boosters: activeBoosters = [] } = await activeRes.json();
        this.renderBoosters(boosters, activeBoosters);
      } else {
        console.error('Error loading boosters:', error);
        alert('Failed to load boosters');
      }
    } catch (err) {
      console.error('Network error:', err);
      alert('Connection error');
    }
  }

  formatPrice(price) {
    if (price >= 1_000_000_000) return (price / 1_000_000_000) + 'B';
    if (price >= 1_000_000) return (price / 1_000_000) + 'M';
    if (price >= 1_000) return (price / 1_000) + 'K';
    return price;
  }

  renderBoosters(boosters, activeBoosters = []) {
    // Filter out null boosters
    boosters = boosters.filter(b => b && b._id);
    
    this.packsContainer.innerHTML = boosters.map(booster => {
      const isActive = activeBoosters.some(active => 
        active.pack && active.pack._id === booster._id
      );
      
      return `
        <div class="pack-card" data-id="${booster._id}">
          <div class="pack-header">
            <h3>${booster.name}</h3>
            <div class="pack-level">Level ${booster.levelRequired}+</div>
          </div>
          <div class="pack-description">
            ${booster.description}
          </div>
          <div class="pack-effects">
            ${booster.effects.winMultiplier > 1 ? `<div>Win: ${booster.effects.winMultiplier}x</div>` : ''}
            ${booster.effects.freeSpins > 0 ? `<div>Free Spins: ${booster.effects.freeSpins}</div>` : ''}
            ${booster.effects.jackpotBoost > 0 ? `<div>Jackpot: +${booster.effects.jackpotBoost}x</div>` : ''}
          </div>
          <div class="pack-footer">
            <div class="pack-price">${this.formatPrice(booster.price)} coins</div>
            <button class="purchase-btn" 
                    data-pack-id="${booster._id}" 
                    ${isActive ? 'disabled' : ''}>
              ${isActive ? 'Active' : 'Purchase'}
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  async purchaseBooster(packId) {
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
        document.dispatchEvent(new CustomEvent('boosterPurchased', {
          detail: {
            boosterName: booster.name,
            price: booster.price,
            type: booster.type
          }
        }));
        // Add this after successful purchase
        if (window.ActivityTracker) {
          window.ActivityTracker.track('booster_purchase', `Purchased ${boosterName} for ${price} credits`, {
            boosterName: boosterName,
            price: price,
            type: boosterType
          });
        }
      } else {
        alert(result.error || 'Purchase failed');
      }
    } catch (err) {
      console.error('Purchase error:', err);
      alert('Network error - please try again');
    }
  }

  // Add success message method
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

  async loadActiveBoosters() {
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

  renderActiveBoosters(boosters) {
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

  updateBankBalance() {
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

  checkExpiredBoosters() {
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

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('booster-section')) {
    new BoosterManager();

    // Buy Coins logic
    const buyBtn = document.querySelector('.btn-buy-coins');
    const input = document.querySelector('.buy-coins-input');
    const bankBalanceEl = document.getElementById('booster-bank-balance');

    if (buyBtn && input) {
      buyBtn.addEventListener('click', async () => {
        const amount = parseInt(input.value, 10);
        if (!amount || amount < 10) {
          alert('Enter a valid amount (min 10)');
          return;
        }
        const res = await fetch('/api/boosters/buy-coins', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ amount })
        });
        const data = await res.json();
        if (data.success) {
          alert(`Added ${amount} coins!\nBuys left today: ${data.buysLeft}`);
          document.querySelector('.balance-amount').textContent = data.newBalance;
          if (bankBalanceEl && data.newBankBalance !== undefined) {
            bankBalanceEl.textContent = data.newBankBalance;
          }
          showBuyCoinsStatus(data.buysLeft, data.nextBuy);
        } else {
          alert(data.error || 'Failed to add coins');
          if (data.nextBuy) showBuyCoinsStatus(0, data.nextBuy);
        }
      });

      // On page load, fetch status
      fetch('/api/users/me', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            showBuyCoinsStatus(
              5 - (data.user.buyCoinsCount || 0),
              data.user.buyCoinsReset
            );
          }
        });
    }
  }
});

function showBuyCoinsStatus(buysLeft, nextBuy) {
  let status = document.querySelector('.buy-coins-status');
  if (!status) {
    status = document.createElement('div');
    status.className = 'buy-coins-status';
    document.querySelector('.buy-coins-section').appendChild(status);
  }
  if (buysLeft > 0) {
    status.textContent = `You have ${buysLeft} buy(s) left today.`;
  } else if (nextBuy) {
    const resetDate = new Date(nextBuy);
    status.textContent = `Buy limit reached. Next buy available at ${resetDate.toLocaleString()}`;
  }
}