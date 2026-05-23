export const renderMomentumOverlay = (container, actions) => {
  // Create a new div so we don't wipe out the app container
  const overlayDiv = document.createElement('div');
  overlayDiv.id = 'momentum-overlay';
  overlayDiv.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:9000; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:2rem; backdrop-filter:blur(5px);';
  
  overlayDiv.innerHTML = `
    <h2 style="font-family:'Bebas Neue'; font-size:4rem; color:var(--accent-gold); text-shadow:0 0 20px var(--accent-gold); margin-bottom:1rem; animation:pulse-glow 1s infinite;">MOMENTUM WARS!</h2>
    <p style="margin-bottom:2rem; color:#fff; font-size:1.5rem;">Tap to push the energy!</p>
    
    <div style="width:100%; max-width:600px; height:40px; background:#111; border-radius:20px; overflow:hidden; position:relative; border:2px solid #333; margin-bottom:3rem;">
      <div id="momentum-bar-home" style="position:absolute; top:0; left:0; height:100%; width:50%; background:var(--accent-red); transition:width 0.2s; box-shadow:0 0 20px var(--accent-red);"></div>
      <div id="momentum-bar-away" style="position:absolute; top:0; right:0; height:100%; width:50%; background:var(--accent-yellow); transition:width 0.2s; box-shadow:0 0 20px var(--accent-yellow);"></div>
      <div style="position:absolute; top:0; left:50%; width:4px; height:100%; background:#fff; transform:translateX(-50%);"></div>
    </div>
    
    <button id="btn-tap" style="width:200px; height:200px; border-radius:50%; background:radial-gradient(circle, var(--accent-cyan), #00a8ff); border:none; color:#000; font-family:'Bebas Neue'; font-size:3rem; cursor:pointer; box-shadow:0 0 40px rgba(0,240,255,0.5); transition:transform 0.1s;">TAP FAST!</button>
    
    <div id="momentum-timer" style="margin-top:2rem; font-family:'Rajdhani'; font-size:2rem; color:var(--accent-cyan);">15</div>
  `;

  document.body.appendChild(overlayDiv);

  let taps = 0;
  const btn = overlayDiv.querySelector('#btn-tap');
  btn.addEventListener('pointerdown', () => {
    taps++;
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => btn.style.transform = 'scale(1)', 100);
  });

  // Send taps to server every 1 second
  const tapInterval = setInterval(() => {
    if (taps > 0) {
      actions.tapMomentum(taps);
      taps = 0;
    }
  }, 1000);

  // Timer
  let timeLeft = 15;
  const timerInterval = setInterval(() => {
    timeLeft--;
    const timerEl = overlayDiv.querySelector('#momentum-timer');
    if (timerEl) timerEl.innerText = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      clearInterval(tapInterval);
      
      // Give local fake outcome for the hackathon
      const state = window.getState ? window.getState() : {};
      let outcomeMsg = "MOMENTUM WAR TIED!";
      let outcomeColor = "#fff";
      
      const homeWidth = document.getElementById('momentum-bar-home').style.width;
      const hPercent = parseFloat(homeWidth);
      if (hPercent > 55) { outcomeMsg = "BAYERN WINS MOMENTUM!"; outcomeColor = "var(--accent-red)"; }
      else if (hPercent < 45) { outcomeMsg = "DORTMUND WINS MOMENTUM!"; outcomeColor = "var(--accent-yellow)"; }

      // Give points to local user if their team won!
      if ((hPercent > 55 && state.team === 'home') || (hPercent < 45 && state.team === 'away')) {
        if (window.simulateLocalEvent) {
           // We can just simulate a LEADERBOARD_UPDATE or PREDICTION_RESULT to quickly add points
           window.simulateLocalEvent('PREDICTION_RESULT', {
              predictionId: 'momentum_' + Date.now(),
              correctAnswer: 'Your team won!',
              results: [{
                userId: state.userId,
                pointsEarned: 150,
                correct: true
              }]
           });
        }
      }

      overlayDiv.innerHTML = `
        <h2 style="font-family:'Bebas Neue'; font-size:4rem; color:${outcomeColor}; text-shadow:0 0 20px ${outcomeColor}; text-align:center;">${outcomeMsg}</h2>
        <p style="color:#fff; font-family:'Rajdhani'; font-size:1.5rem; text-align:center; margin-top:1rem;">Fan energy boosted!</p>
      `;

      setTimeout(() => overlayDiv.remove(), 2500);
    }
  }, 1000);
};

export const updateMomentumBar = (homeTaps, awayTaps) => {
  const total = homeTaps + awayTaps;
  if (total === 0) return;
  
  const homePct = (homeTaps / total) * 100;
  const awayPct = 100 - homePct;
  
  const homeBar = document.getElementById('momentum-bar-home');
  const awayBar = document.getElementById('momentum-bar-away');
  
  if (homeBar && awayBar) {
    homeBar.style.width = `${homePct}%`;
    awayBar.style.width = `${awayPct}%`;
  }
};
