const BAYERN_LOGO = `<img src="assets/bayern.jpg" alt="Bayern" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 2px solid #fff; box-shadow: 0 0 10px rgba(220,7,20,0.5);">`;

const DORTMUND_LOGO = `<img src="assets/dortmund.png" alt="Dortmund" style="width: 44px; height: 44px; object-fit: contain; filter: drop-shadow(0 0 8px rgba(240,225,48,0.4));">`;

const BUNDESLIGA_LOGO = `<img src="assets/bundesliga.svg" alt="Bundesliga" style="height: 35px; opacity: 0.9; margin-right: 15px;">`;
const AWS_LOGO = `<img src="assets/aws.svg" alt="AWS" style="height: 20px; opacity: 0.8; margin-right: 15px;">`;
const ADIDAS_LOGO = `<img src="assets/adidas.png" alt="Adidas" style="height: 25px; opacity: 0.8; filter: brightness(0) invert(1);">`;

export const renderMatch = (container, state, actions) => {
  container.innerHTML = `
    <div id="match-view" class="room-container animate-fade-in">
      <!-- Premium Broadcast Header -->
      <div class="match-header" style="justify-content: center; background: transparent; border-bottom: 1px solid rgba(255,255,255,0.1); padding: 0.8rem 2rem;">
        
        <div style="position: absolute; left: 20px; display: flex; align-items: center;">
          ${BUNDESLIGA_LOGO}
          ${AWS_LOGO}
          ${ADIDAS_LOGO}
          <div style="margin-left: 15px; background: rgba(0,240,255,0.1); border: 1px solid var(--accent-cyan); padding: 4px 10px; border-radius: 6px; font-family: 'Orbitron'; font-size: 0.8rem; color: var(--accent-cyan);">
            CODE: <span style="letter-spacing: 2px; font-weight: bold; color: #fff;">${state.roomId}</span>
          </div>
        </div>
        
        <button id="btn-exit-match" style="position: absolute; right: 20px; background: rgba(220, 7, 20, 0.2); border: 1px solid rgba(220, 7, 20, 0.5); color: #fff; padding: 0.4rem 1rem; border-radius: 20px; font-family: 'Rajdhani'; font-weight: bold; cursor: pointer; transition: background 0.2s; z-index: 50;">
          🚪 Leave Match
        </button>

        <div class="score-display" style="gap: 1.5rem;">
          <span class="team-name text-red" style="font-family:'Bebas Neue'; letter-spacing:2px; font-size: 2.2rem; text-shadow: 0 2px 5px rgba(0,0,0,0.5);">BAYERN</span>
          <span class="team-logo-inline" style="transform: scale(1.1);">${BAYERN_LOGO}</span>
          
          <div style="display: flex; flex-direction: column; align-items: center; background: #111; padding: 0.2rem 1.5rem; border-radius: 12px; border: 1px solid #333;">
            <div style="display: flex; gap: 1rem; align-items: center;">
              <span class="score score-pop" id="score-home" style="font-size: 2.5rem; color: #fff;">0</span>
              <span style="color:#555; font-size:2rem; margin-top:-5px;">-</span>
              <span class="score score-pop" id="score-away" style="font-size: 2.5rem; color: #fff;">0</span>
            </div>
            <div class="match-clock" id="match-clock" style="font-size: 1.2rem; color: var(--accent-cyan); letter-spacing: 2px; margin-top: -5px; text-shadow: 0 0 10px rgba(0,255,255,0.5);">00:00</div>
          </div>
          
          <span class="team-logo-inline" style="transform: scale(1.1);">${DORTMUND_LOGO}</span>
          <span class="team-name text-yellow" style="font-family:'Bebas Neue'; letter-spacing:2px; font-size: 2.2rem; text-shadow: 0 2px 5px rgba(0,0,0,0.5);">DORTMUND</span>
        </div>
      </div>
      
      <!-- Timeline -->
      <div class="timeline-container" id="timeline-container">
        <span style="color:rgba(255,255,255,0.25); font-size:0.75rem; white-space:nowrap; padding-right:1rem;">MATCH EVENTS →</span>
      </div>

      <!-- Body -->
      <div class="match-content">
        <!-- Leaderboard Sidebar -->
        <div class="leaderboard-sidebar" id="leaderboard-container">
          <div class="leaderboard-title">🏆 LEADERBOARD</div>
        </div>
        
        <!-- Center -->
        <div class="match-center">
          <!-- Pitch visual -->
          <div class="pitch-visual" id="pitch-visual">
            <div class="pitch-lines">
              <div class="pitch-center-circle"></div>
              <div class="pitch-center-line"></div>
              <div class="pitch-box pitch-box-left"></div>
              <div class="pitch-box pitch-box-right"></div>
            </div>
            <div class="pitch-overlay-text" id="pitch-status-text">⚽ MATCH LIVE — WATCHING FOR KEY EVENTS</div>
          </div>

          <!-- Prediction Area -->
          <div class="prediction-area" id="prediction-area">
          </div>
        </div>
      </div>

      <!-- Bottom padding for the emoji bar -->
      <div style="height: 80px;"></div>
    </div>
  `;

  updateLeaderboard(state.players || []);

  const btnExit = container.querySelector('#btn-exit-match');
  if (btnExit) {
    btnExit.addEventListener('click', () => {
      if (confirm('Are you sure you want to leave the match?')) {
        localStorage.removeItem('couchRivalsRoomId');
        window.location.reload();
      }
    });
  }
};

export const updateLeaderboard = (players) => {
  const container = document.getElementById('leaderboard-container');
  if (!container) return;

  // Keep title
  const title = container.querySelector('.leaderboard-title');
  container.innerHTML = '';
  if (title) container.appendChild(title);
  else {
    const t = document.createElement('div');
    t.className = 'leaderboard-title';
    t.textContent = '🏆 LEADERBOARD';
    container.appendChild(t);
  }

  const sorted = [...players].sort((a, b) => (b.points || 0) - (a.points || 0));

  if (sorted.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'color: rgba(255,255,255,0.3); text-align:center; font-size:0.85rem; padding: 1rem;';
    empty.textContent = 'No players yet...';
    container.appendChild(empty);
    return;
  }

  sorted.forEach((p, index) => {
    const row = document.createElement('div');
    row.className = 'lb-row glass-card';
    row.dataset.userId = p.userId || '';

    let rankIcon = `#${index + 1}`;
    let rankColor = '#fff';
    if (index === 0) { rankIcon = '🥇'; rankColor = 'var(--accent-gold)'; }
    if (index === 1) { rankIcon = '🥈'; rankColor = '#c0c0c0'; }
    if (index === 2) { rankIcon = '🥉'; rankColor = '#cd7f32'; }

    const teamColor = p.team === 'home' ? 'var(--accent-red)' : 'var(--accent-yellow)';
    const teamLabel = p.team === 'home' ? 'FCB' : 'BVB';

    row.innerHTML = `
      <div class="lb-rank" style="color:${rankColor};">${rankIcon}</div>
      <div class="lb-avatar" style="background:${teamColor}; color:${p.team === 'away' ? '#000' : '#fff'};">${(p.displayName || '?').charAt(0).toUpperCase()}</div>
      <div class="lb-info">
        <div class="lb-name">${p.displayName || 'Unknown'}</div>
        <div class="lb-team-badge" style="color:${teamColor}; font-size:0.7rem;">${teamLabel}</div>
      </div>
      <div class="lb-points">
        <span class="stats-number text-cyan">${p.points || 0}</span>
        <span style="color:rgba(255,255,255,0.4); font-size:0.75rem;"> pts</span>
        ${(p.streak || 0) > 0 ? `<div style="color:var(--accent-orange); font-size:0.7rem;">🔥 x${p.streak}</div>` : ''}
      </div>
    `;
    container.appendChild(row);
  });
};

export const updatePlayerScore = (userId, pointsEarned, newTotal, newStreak) => {
  // Update the leaderboard row immediately without a full redraw
  const row = document.querySelector(`.lb-row[data-user-id="${userId}"]`);
  if (row) {
    const pts = row.querySelector('.stats-number');
    if (pts) {
      pts.textContent = newTotal;
      // Animate the score change
      pts.style.transform = 'scale(1.5)';
      pts.style.color = 'var(--accent-gold)';
      setTimeout(() => {
        pts.style.transform = 'scale(1)';
        pts.style.color = 'var(--accent-cyan)';
      }, 600);
    }
  }
};

// Track events globally so we can sort them
window.timelineEvents = window.timelineEvents || [];

export const updateMatchState = (eventData) => {
  // Update scores if GOAL
  if (eventData.type === 'GOAL') {
    if (eventData.metadata && eventData.metadata.score) {
      const parts = eventData.metadata.score.split('-');
      const homeEl = document.getElementById('score-home');
      const awayEl = document.getElementById('score-away');
      if (homeEl) { homeEl.textContent = parts[0]; animateScorePop(homeEl); }
      if (awayEl) { awayEl.textContent = parts[1]; animateScorePop(awayEl); }
    } else {
      const el = document.getElementById(`score-${eventData.team}`);
      if (el) { el.textContent = parseInt(el.textContent) + 1; animateScorePop(el); }
    }
    updatePitchStatus(`⚽ GOAL! ${eventData.player || ''} scores!`, 'var(--accent-gold)');
  } else if (eventData.type === 'YELLOW_CARD') {
    updatePitchStatus(`🟨 Yellow card — ${eventData.player || ''}`, 'var(--accent-yellow)');
  } else if (eventData.type === 'RED_CARD') {
    updatePitchStatus(`🟥 RED CARD! ${eventData.player || ''} is off!`, 'var(--danger)');
  } else if (eventData.type === 'SUBSTITUTION') {
    updatePitchStatus(`🔄 Sub: ${eventData.player || ''}`, '#a0aec0');
  } else if (eventData.type === 'DANGEROUS_ATTACK') {
    updatePitchStatus(`⚡ DANGEROUS ATTACK!`, 'var(--accent-orange)');
  } else if (eventData.type === 'HALF_TIME') {
    updatePitchStatus(`⏸️ HALF TIME`, 'var(--accent-cyan)');
  } else if (eventData.type === 'FULL_TIME') {
    updatePitchStatus(`🏁 FULL TIME — MATCH OVER!`, 'var(--accent-gold)');
  } else {
    updatePitchStatus(`⏱️ ${eventData.type.replace(/_/g,' ')}${eventData.player ? ' — ' + eventData.player : ''}`, 'rgba(255,255,255,0.6)');
  }

  // Update clock
  const clockEl = document.getElementById('match-clock');
  if (clockEl && eventData.time !== undefined) {
    const mins = Math.floor(eventData.time / 60).toString().padStart(2, '0');
    const secs = (eventData.time % 60).toString().padStart(2, '0');
    clockEl.textContent = `${mins}:${secs}`;
  }

  // Add timeline event
  const timeline = document.querySelector('.timeline-container');
  if (timeline && eventData.time !== undefined) {
    const icon = getEventIcon(eventData.type);
    const mins = Math.floor(eventData.time / 60);
    
    // Only add if not already present
    if (!window.timelineEvents.find(e => e.time === eventData.time && e.type === eventData.type)) {
      window.timelineEvents.push({ ...eventData, icon, mins });
    }

    // Sort chronologically
    window.timelineEvents.sort((a, b) => a.time - b.time);

    timeline.innerHTML = window.timelineEvents.map(e => `
      <div class="timeline-event glass-card animate-slide-up">
        <span class="timeline-icon">${e.icon}</span>
        <span class="timeline-min">${e.mins}'</span>
        <span class="timeline-player">${e.player || ''}</span>
      </div>
    `).join('');
    
    timeline.scrollLeft = timeline.scrollWidth;
  }
};

const updatePitchStatus = (text, color) => {
  const el = document.getElementById('pitch-status-text');
  if (el) {
    el.textContent = text;
    el.style.color = color;
    el.style.transform = 'scale(1.1)';
    setTimeout(() => { el.style.transform = 'scale(1)'; }, 400);
  }
};

const animateScorePop = (el) => {
  el.style.transition = 'transform 0.2s, color 0.3s';
  el.style.transform = 'scale(1.5)';
  el.style.color = 'var(--accent-gold)';
  setTimeout(() => {
    el.style.transform = 'scale(1)';
    el.style.color = '#ffffff';
  }, 400);
};

const getEventIcon = (type) => {
  switch (type) {
    case 'GOAL': return '⚽';
    case 'YELLOW_CARD': return '🟨';
    case 'RED_CARD': return '🟥';
    case 'SUBSTITUTION': return '🔄';
    case 'SHOT': return '🎯';
    case 'SHOT_ON_TARGET': return '🎯';
    case 'SAVE': return '🧤';
    case 'CORNER': return '🚩';
    case 'FREE_KICK': return '⚡';
    case 'FOUL': return '🤚';
    case 'OFFSIDE': return '🚫';
    case 'DANGEROUS_ATTACK': return '💥';
    case 'HALF_TIME': return '⏸️';
    case 'FULL_TIME': return '🏁';
    case 'KICKOFF': return '🏟️';
    default: return '⏱️';
  }
};
