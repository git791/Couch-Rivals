export const renderLobby = (container, state, actions) => {
  const playersHtml = state.players.map(p => `
    <div class="player-item">
      <div class="player-info">
        <div class="avatar">${p.displayName.charAt(0)}</div>
        <span>${p.displayName}</span>
      </div>
      <div class="team-badge team-${p.team}">${p.team.toUpperCase()}</div>
    </div>
  `).join('');

  container.innerHTML = `
    <div id="lobby-view">
      <div class="lobby-card glass-card animate-fade-in">
        <div class="room-code-display">
          <h2>ROOM CODE</h2>
          <div class="code-box">
            <span class="code" id="room-code-text">${state.roomId}</span>
          </div>
          <p style="margin-top:1rem; color:#a0aec0;">Share this code with friends!</p>
        </div>
        
        <div class="player-list">
          <h3 class="text-cyan" style="font-family:'Bebas Neue';">Players (${state.players.length}/8)</h3>
          ${playersHtml}
        </div>
        
        ${state.isHost ? `
        <div class="settings-section">
          <h3 class="text-gold" style="font-family:'Bebas Neue'; text-align:center;">Match Simulation Speed</h3>
          <div class="speed-controls">
            <button class="speed-btn" data-speed="1">1x</button>
            <button class="speed-btn active" data-speed="5">5x</button>
            <button class="speed-btn" data-speed="20">20x</button>
          </div>
        </div>
        
        <button class="btn-primary" id="btn-start-match" style="width:100%; font-size:1.2rem;">START MATCH</button>
        ` : `
        <div style="text-align:center; padding: 2rem 0;">
          <h3 style="color:var(--accent-cyan); font-family:'Bebas Neue'; font-size:1.5rem;" class="animate-pulse">Waiting for host to start the match...</h3>
        </div>
        `}
      </div>
    </div>
  `;

  if (state.isHost) {
    let selectedSpeed = 5;
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        selectedSpeed = parseInt(e.target.dataset.speed);
      });
    });

    document.getElementById('btn-start-match')?.addEventListener('click', () => {
      actions.startMatch(state.roomId, selectedSpeed);
    });
  }
};
