document.addEventListener('DOMContentLoaded', () => {
  // Load leaderboard data
  fetchLeaderboard();
  
  // Load user balance
  fetchUserData();
});

// Fetch leaderboard
async function fetchLeaderboard() {
  const token = localStorage.getItem('token');
  const res = await fetch('/api/slots/leaderboard', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return; // handle error
  const leaderboard = await res.json();
  renderLeaderboard(leaderboard.topPlayers);
}

function fetchUserData() {
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

function renderLeaderboard(players) {
  const leaderboardBody = document.getElementById('leaderboard-body');
  leaderboardBody.innerHTML = '';
  
  players.forEach((player, index) => {
    const playerRow = document.createElement('div');
    playerRow.className = 'table-row';
    
    playerRow.innerHTML = `
      <div class="rank">${index + 1}</div>
      <div class="player">
        <img src="/images/avatars/${player.profilePicture}" alt="${player.username}" class="player-avatar">
        <span>${player.username}</span>
      </div>
      <div class="wins">${player.totalWins.toLocaleString()}</div>
      <div class="jackpots">${player.jackpotsWon}</div>
      <div class="level">${player.level}</div>
    `;
    
    leaderboardBody.appendChild(playerRow);
  });
}