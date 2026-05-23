import { WebSocketClient } from './websocket.js';
import { renderLanding } from './views/landing.js';
import { renderLobby } from './views/lobby.js';
import { renderMatch, updateLeaderboard, updateMatchState } from './views/match.js';
import { showPrediction } from './components/prediction.js';
import { renderMomentumOverlay, updateMomentumBar } from './components/momentum.js';
import { renderTrashTalk, showReaction } from './components/trashTalk.js';

const appContainer = document.getElementById('app');

// Persistent identity
let myUserId = localStorage.getItem('couchRivalsUserId');
if (!myUserId) {
  myUserId = `user_${Math.random().toString(36).substring(2, 10)}`;
  localStorage.setItem('couchRivalsUserId', myUserId);
}

// State
const state = {
  currentView: 'landing',
  roomId: localStorage.getItem('couchRivalsRoomId') || null,
  userId: myUserId,
  displayName: localStorage.getItem('couchRivalsName') || null,
  team: localStorage.getItem('couchRivalsTeam') || null,
  players: [],
  matchStatus: null
};

// Helper — get or update a player in state
const upsertPlayer = (playerData) => {
  const idx = state.players.findIndex(p => p.userId === playerData.userId);
  if (idx >= 0) {
    state.players[idx] = { ...state.players[idx], ...playerData };
  } else {
    state.players.push(playerData);
  }
};

// Actions
const actions = {
  createRoom: (displayName, team) => {
    state.displayName = displayName;
    state.team = team;
    localStorage.setItem('couchRivalsName', displayName);
    localStorage.setItem('couchRivalsTeam', team);
    wsClient.send('createRoom', { displayName, team, userId: myUserId });
  },
  joinRoom: (roomId, displayName, team) => {
    state.roomId = roomId;
    state.displayName = displayName;
    state.team = team;
    localStorage.setItem('couchRivalsRoomId', roomId);
    localStorage.setItem('couchRivalsName', displayName);
    localStorage.setItem('couchRivalsTeam', team);
    wsClient.send('joinRoom', { roomId, displayName, team, userId: myUserId });
  },
  startMatch: (roomId, speed) => {
    wsClient.send('startMatch', { roomId, speed });
  },
  submitPrediction: (predictionId, answer) => {
    wsClient.send('submitPrediction', { roomId: state.roomId, predictionId, answer });
  },
  tapMomentum: (taps) => {
    wsClient.send('tapMomentum', { roomId: state.roomId, taps, team: state.team });
  },
  sendReaction: (content) => {
    wsClient.send('sendReaction', { roomId: state.roomId, content });
  }
};

// WebSocket URL
const wsUrl = window.__CONFIG__?.wsUrl || 'wss://mgyoq0pmci.execute-api.us-east-1.amazonaws.com/prod';

const handleMessage = (message) => {
  console.log('📨 Received:', message);

  switch (message.type) {
    case 'ROOM_CREATED':
      state.roomId = message.data.roomId;
      // Auto-join as host
      actions.joinRoom(state.roomId, state.displayName, state.team || 'home');
      break;

    case 'ROOM_STATE': {
      state.roomId = message.data.roomId;
      state.userId = message.data.userId;
      state.matchStatus = message.data.status;
      state.isHost = message.data.isHost;

      // Merge players: preserve points if already known
      const incoming = message.data.players || [];
      state.players = incoming.map(p => {
        const existing = state.players.find(ep => ep.userId === p.userId);
        return existing ? { ...p, points: existing.points || p.points || 0, streak: existing.streak || p.streak || 0 } : { ...p, points: p.points || 0, streak: p.streak || 0 };
      });

      if (state.matchStatus === 'LOBBY') {
        state.currentView = 'lobby';
        renderLobby(appContainer, state, actions);
      } else {
        state.currentView = 'match';
        renderMatch(appContainer, state, actions);
        attachTrashTalk();
      }
      break;
    }

    case 'PLAYER_JOINED':
      upsertPlayer({ ...message.data, points: message.data.points || 0, streak: message.data.streak || 0 });
      if (state.currentView === 'lobby') {
        renderLobby(appContainer, state, actions);
      } else if (state.currentView === 'match') {
        updateLeaderboard(state.players);
      }
      break;

    case 'PLAYER_LEFT':
      state.players = state.players.filter(p => p.userId !== message.data.userId);
      if (state.currentView === 'lobby') {
        renderLobby(appContainer, state, actions);
      } else if (state.currentView === 'match') {
        updateLeaderboard(state.players);
      }
      break;

    case 'MATCH_STARTED':
      state.matchStatus = 'LIVE';
      state.currentView = 'match';
      renderMatch(appContainer, state, actions);
      attachTrashTalk();
      break;

    case 'MATCH_EVENT':
      if (state.currentView === 'match') {
        updateMatchState(message.data);
        
        // HACKATHON DEMO: Update points locally based on team events!
        const evtTeam = message.data.team; // 'home' or 'away'
        if (evtTeam) {
          const isMyTeam = state.team === evtTeam;
          let pointsDelta = 0;
          if (message.data.type === 'GOAL') pointsDelta = 100;
          else if (message.data.type === 'YELLOW_CARD') pointsDelta = -20;
          else if (message.data.type === 'RED_CARD') pointsDelta = -50;
          else if (message.data.type === 'SHOT_ON_TARGET') pointsDelta = 10;
          else if (message.data.type === 'SAVE') pointsDelta = 15;
          
          if (pointsDelta !== 0) {
            // Apply points ONLY if it happened to MY team
            if (isMyTeam) {
              const currentPoints = state.players.find(p => p.userId === state.userId)?.points || 0;
              upsertPlayer({
                userId: state.userId,
                points: Math.max(0, currentPoints + pointsDelta) // prevent negative
              });
              updateLeaderboard(state.players);
            }
          }
        }

        if (message.data.type === 'DANGEROUS_ATTACK') {
          // Only trigger if overlay not already showing
          if (!document.getElementById('momentum-overlay')) {
            renderMomentumOverlay(appContainer, actions);
          }
        }
      }
      break;

    case 'NEW_PREDICTION':
      if (state.currentView === 'match') {
        const area = document.getElementById('prediction-area');
        if (area) showPrediction(area, message.data, actions);
      }
      break;

    case 'VOTE_UPDATE':
      // Could show live vote counts — for now just log
      console.log('Vote update:', message.data);
      break;

    case 'PREDICTION_RESULT': {
      if (state.currentView === 'match') {
        const area = document.getElementById('prediction-area');
        const { correctAnswer, results } = message.data;

        // Update local player scores
        if (results && Array.isArray(results)) {
          results.forEach(r => {
            upsertPlayer({
              userId: r.userId,
              points: r.newTotal !== undefined ? r.newTotal : ((state.players.find(p => p.userId === r.userId)?.points || 0) + (r.pointsEarned || 0)),
              streak: r.newStreak !== undefined ? r.newStreak : (r.correct ? ((state.players.find(p => p.userId === r.userId)?.streak || 0) + 1) : 0)
            });
          });
          updateLeaderboard(state.players);
        }

        // Brief result message
        if (area) {
          const myResult = results ? results.find(r => r.userId === state.userId) : null;
          let icon = "📢";
          let title = `Result: ${correctAnswer}`;
          let color = "var(--accent-cyan)";
          let subtext = "Scores updated!";

          if (myResult) {
            if (myResult.correct) {
              icon = "✅";
              title = "CORRECT!";
              color = "var(--success)";
              subtext = `You earned +${myResult.pointsEarned || 50} points!`;
            } else {
              icon = "❌";
              title = "INCORRECT!";
              color = "var(--danger)";
              subtext = `The correct answer was: ${correctAnswer}`;
            }
          } else {
            title = `Correct Answer: ${correctAnswer}`;
          }

          area.innerHTML = `
            <div class="glass-card" style="text-align:center; padding:2rem; border: 2px solid ${color};">
              <div style="font-size:2.5rem; margin-bottom:0.5rem;">${icon}</div>
              <h3 style="color:${color}; font-family:'Bebas Neue'; font-size:2.2rem; letter-spacing:1px;">${title}</h3>
              <p style="color:#fff; font-family:'Rajdhani'; font-weight:600; font-size:1.1rem; margin-top:0.5rem;">${subtext}</p>
            </div>`;
          setTimeout(() => { if (area) area.innerHTML = ''; }, 4000);
        }
      }
      break;
    }

    case 'LEADERBOARD_UPDATE': {
      // Backend sends fresh scores
      if (message.data && Array.isArray(message.data.scores)) {
        message.data.scores.forEach(s => upsertPlayer(s));
        updateLeaderboard(state.players);
      }
      break;
    }

    case 'MOMENTUM_UPDATE':
      if (state.currentView === 'match') {
        updateMomentumBar(message.data.homeTaps, message.data.awayTaps);
      }
      break;

    case 'MOMENTUM_RESULT':
      if (state.currentView === 'match') {
        const overlay = document.getElementById('momentum-overlay');
        if (overlay) {
          if (window.momentumTimerInterval) clearInterval(window.momentumTimerInterval);
          if (window.momentumTapInterval) clearInterval(window.momentumTapInterval);

          const { winner, homeTaps, awayTaps } = message.data;
          let outcomeMsg = "MOMENTUM WAR TIED!";
          let outcomeColor = "#fff";
          if (winner === 'home') {
            outcomeMsg = "BAYERN WINS MOMENTUM!";
            outcomeColor = "var(--accent-red)";
          } else if (winner === 'away') {
            outcomeMsg = "DORTMUND WINS MOMENTUM!";
            outcomeColor = "var(--accent-yellow)";
          }

          overlay.innerHTML = `
            <h2 style="font-family:'Bebas Neue'; font-size:4rem; color:${outcomeColor}; text-shadow:0 0 20px ${outcomeColor}; text-align:center;">${outcomeMsg}</h2>
            <p style="color:#fff; font-family:'Rajdhani'; font-size:1.5rem; text-align:center; margin-top:1rem;">Fan energy boosted!</p>
          `;
          setTimeout(() => overlay.remove(), 2500);
        }
      }
      break;

    case 'REACTION':
      if (state.currentView === 'match') {
        if (message.data.content === '🍻') {
          // Special Beer Animation! Drops from top instead of floating up
          const beer = document.createElement('div');
          beer.textContent = '🍻';
          beer.style.cssText = `position:fixed; top:-50px; left:${10 + Math.random() * 80}%; font-size:4rem; z-index:9000; pointer-events:none; filter:drop-shadow(0 0 10px rgba(255,200,0,0.8));`;
          document.body.appendChild(beer);
          if (typeof gsap !== 'undefined') {
            gsap.to(beer, { y: window.innerHeight + 100, rotation: (Math.random() - 0.5) * 360, duration: 2 + Math.random(), ease: 'bounce.out', onComplete: () => beer.remove() });
          }
        } else {
          showReaction(message.data);
        }
      }
      break;

    case 'CELEBRATION':
      if (message.data.eventType === 'GOAL') {
        if (typeof confetti !== 'undefined') {
          confetti({
            particleCount: 250,
            spread: 120,
            origin: { y: 0.55 },
            colors: message.data.team === 'home'
              ? ['#DC0714', '#ffffff', '#ff6b6b']
              : ['#f0e130', '#000000', '#ffe500']
          });
          // Screen shake
          if (typeof gsap !== 'undefined') {
            gsap.to('#match-view', { x: 8, yoyo: true, repeat: 7, duration: 0.04, ease: 'none' });
          }
        }
      } else if (message.data.eventType === 'RED_CARD') {
        // Flash red
        const flash = document.createElement('div');
        flash.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(220,7,20,0.35);z-index:8888;pointer-events:none;';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 600);
      }
      break;
  }
};

let trashTalkAttached = false;
const attachTrashTalk = () => {
  if (trashTalkAttached) return;
  trashTalkAttached = true;
  const div = document.createElement('div');
  document.body.appendChild(div);
  renderTrashTalk(div, actions);
};

const wsClient = new WebSocketClient(wsUrl, handleMessage);

// Expose for debugging
window.simulateLocalEvent = (type, data) => handleMessage({ type, data });
window.getState = () => state;

// --- Local Music Player Logic ---
let bgMusic;
let isMusicPlaying = false;

window.startBackgroundMusic = () => {
  if (!bgMusic) {
    bgMusic = new Audio('assets/bg_music.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.3;
  }
  if (!isMusicPlaying) {
    bgMusic.play().catch(e => console.log('Audio play failed:', e));
    isMusicPlaying = true;
    document.getElementById('track-name').textContent = "FIFA World Cup";
  }
};

document.body.addEventListener('click', () => {
  if (state.currentView === 'match' && !isMusicPlaying) {
    window.startBackgroundMusic();
  }
}, { once: true });

// Toggle mute/play on the music UI click
const musicUi = document.getElementById('music-player');
if (musicUi) {
  musicUi.addEventListener('click', (e) => {
    if (bgMusic) {
      if (isMusicPlaying) {
        bgMusic.pause();
        isMusicPlaying = false;
        document.getElementById('track-name').textContent = "Paused";
      } else {
        bgMusic.play();
        isMusicPlaying = true;
        document.getElementById('track-name').textContent = "FIFA World Cup";
      }
    } else {
      window.startBackgroundMusic();
    }
  });
}

// Start
if (state.roomId && state.displayName && state.team) {
  appContainer.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; height:100vh; color:var(--accent-cyan); font-family:'Bebas Neue'; font-size:2rem; flex-direction:column; gap:1rem;">
    <div class="animate-pulse">RECONNECTING TO ROOM...</div>
    <div style="font-size:1rem; color:#888; cursor:pointer;" id="btn-leave-room">Click here to leave room</div>
  </div>`;
  
  setTimeout(() => {
    const leaveBtn = document.getElementById('btn-leave-room');
    if (leaveBtn) {
      leaveBtn.addEventListener('click', () => {
        localStorage.removeItem('couchRivalsRoomId');
        window.location.reload();
      });
    }
  }, 100);

  actions.joinRoom(state.roomId, state.displayName, state.team);
} else {
  renderLanding(appContainer, actions);
}
wsClient.connect();
