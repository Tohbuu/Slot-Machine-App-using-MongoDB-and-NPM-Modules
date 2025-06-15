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
    setInterval(() => this.checkExpiredBoosters(), 60000);
  }

  async loadBoosters() {
    try {
      const response = await fetch('/api/boosters', {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const { success, boosters, error } = await response.json();
      
      if (success) {
        this.renderBoosters(boosters);
      } else {
        console.error('Error loading boosters:', error);
        alert('Failed to load boosters');
      }
    } catch (err) {
      console.error('Network error:', err);
      alert('Connection error');
    }
  }

  renderBoosters(boosters) {
    this.packsContainer.innerHTML = boosters.map(pack => `
      <div class="pack-card" data-id="${pack._id}">
        <div class="pack-header">
          <img src="/images/boosters/${pack.icon}" alt="${pack.name}">
          <span class="pack-name">${pack.name}</span>
          <span class="pack-level">Lv. ${pack.levelRequired}+</span>
        </div>
        
        <p class="pack-desc">${pack.description}</p>
        
        <div class="pack-effects">
          ${pack.effects.winMultiplier > 1 ? `
            <div class="effect-item">
              <i class="fas fa-chart-line"></i>
              ${pack.effects.winMultiplier}x Win Multiplier
            </div>
          ` : ''}
          
          ${pack.effects.freeSpins > 0 ? `
            <div class="effect-item">
              <i class="fas fa-sync-alt"></i>
              ${pack.effects.freeSpins} Free Spins
            </div>
          ` : ''}
          
          ${pack.effects.jackpotBoost > 0 ? `
            <div class="effect-item">
              <i class="fas fa-trophy"></i>
              +${pack.effects.jackpotBoost * 100}% Jackpot Chance
            </div>
          ` : ''}
        </div>
        
        <button class="btn-buy" data-id="${pack._id}" data-price="${pack.price}">
          BUY - ${pack.price} Credits
        </button>
      </div>
    `).join('');

    // Add event listeners
    document.querySelectorAll('.btn-buy').forEach(btn => {
      btn.addEventListener('click', (e) => this.purchaseBooster(e));
    });
  }

  async purchaseBooster(e) {
    const packId = e.target.dataset.id;
    const price = parseInt(e.target.dataset.price);
    
    if (!confirm(`Purchase this booster for ${price} credits from your bank?`)) return;
    
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
        alert('Booster activated successfully!');
        this.bankBalanceEl.textContent = result.newBankBalance;
        this.loadActiveBoosters();
        this.loadBoosters(); // Refresh list
      } else {
        alert(result.error || 'Purchase failed');
      }
    } catch (err) {
      console.error('Purchase error:', err);
      alert('Network error - please try again');
    }
  }

  async loadActiveBoosters() {
    try {
      const response = await fetch('/api/boosters/active', {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
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
    if (boosters.length === 0) {
      this.activeBoostersEl.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-box-open"></i>
          <p>No active boosters</p>
        </div>
      `;
      return;
    }

    this.activeBoostersEl.innerHTML = boosters.map(booster => `
      <div class="active-booster">
        <img src="/images/boosters/${booster.pack.icon}" alt="${booster.pack.name}">
        <div>
          <div class="booster-name">${booster.pack.name}</div>
          <div class="expiry-time">
            Expires: ${new Date(booster.expiresAt).toLocaleString()}
          </div>
        </div>
      </div>
    `).join('');
  }

  async updateBankBalance() {
    try {
      const response = await fetch('/api/users/bank', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        this.bankBalanceEl.textContent = data.bankBalance;
      }
    } catch (err) {
      console.error('Bank balance update failed:', err);
    }
  }

  checkExpiredBoosters() {
    // In a real app, this would ping the server to clean up expired boosters
    this.loadActiveBoosters();
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
          document.getElementById('booster-balance').textContent = data.newBalance;
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