document.addEventListener('DOMContentLoaded', () => {
  // Load leaderboard data
  fetchLeaderboard();
  
  // Load user balance
  fetchUserData();
});

function fetchLeaderboard() {
  fetch('/api/slots/leaderboard')
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        renderLeaderboard(data.topPlayers);
      }
    });
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