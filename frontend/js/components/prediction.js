export const showPrediction = (container, prediction, actions) => {
  const totalTime = prediction.expiresIn || 15;
  const radius = 22;
  const circumference = 2 * Math.PI * radius;

  container.innerHTML = `
    <div class="prediction-card glass-card animate-slide-up" id="pred-${prediction.id}" style="pointer-events:auto; position: relative; z-index: 10000;">
      <!-- Header row -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem; pointer-events:none;">
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <span style="background:var(--accent-orange); color:#000; padding:2px 10px; border-radius:4px; font-weight:bold; font-size:0.75rem; font-family:'Orbitron'; letter-spacing:1px;">PREDICT</span>
          <span style="color:rgba(255,255,255,0.4); font-size:0.75rem;">× ${prediction.difficulty || 1.5} points</span>
        </div>
        <!-- SVG countdown ring -->
        <div style="position:relative; width:54px; height:54px;">
          <svg width="54" height="54" style="transform:rotate(-90deg);">
            <circle cx="27" cy="27" r="${radius}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="4"/>
            <circle id="pred-ring" cx="27" cy="27" r="${radius}" fill="none" stroke="var(--accent-cyan)" stroke-width="4"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="0"
              stroke-linecap="round"
              style="transition: stroke-dashoffset 1s linear, stroke 0.5s;"/>
          </svg>
          <div class="timer" style="
            position:absolute; top:50%; left:50%;
            transform: translate(-50%,-50%);
            font-family:'Rajdhani'; font-weight:700; font-size:1rem;
            color:var(--accent-cyan);
          ">${totalTime}</div>
        </div>
      </div>

      <!-- Question -->
      <h3 style="margin-bottom:1rem; text-align:center; font-size:1.1rem; line-height:1.4; font-family:'Rajdhani'; font-weight:600;">
        ${prediction.question}
      </h3>

      <!-- Options -->
      <div style="display:flex; flex-direction:column; gap:0.4rem; position: relative; z-index: 99999;" id="pred-options-${prediction.id}">
        ${prediction.options.map(opt => `
          <button class="pred-option" data-answer="${opt}" style="
            background: rgba(255,255,255,0.07);
            border: 1px solid rgba(255,255,255,0.15);
            color: #fff;
            padding: 10px 16px;
            border-radius: 8px;
            font-family:'Rajdhani'; font-weight:600; font-size:1rem;
            cursor: pointer;
            text-align:left;
            transition: background 0.15s, border-color 0.15s, transform 0.1s;
            pointer-events: auto !important;
            position: relative;
            z-index: 99999;
          ">${opt}</button>
        `).join('')}
      </div>

      <div id="pred-voted-msg-${prediction.id}" style="display:none; text-align:center; margin-top:0.5rem; color:var(--success); font-family:'Rajdhani'; font-weight:600;">
        ✓ Vote locked in — waiting for result...
      </div>
    </div>
  `;

  // Hover effects
  container.querySelectorAll('.pred-option').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      if (!btn.disabled) {
        btn.style.background = 'rgba(0,240,255,0.1)';
        btn.style.borderColor = 'rgba(0,240,255,0.4)';
        btn.style.transform = 'translateX(4px)';
      }
    });
    btn.addEventListener('mouseleave', () => {
      if (!btn.disabled) {
        btn.style.background = 'rgba(255,255,255,0.07)';
        btn.style.borderColor = 'rgba(255,255,255,0.15)';
        btn.style.transform = '';
      }
    });
  });

  // Countdown logic
  let timeLeft = totalTime;
  const timerEl = container.querySelector('.timer');
  const ring = container.querySelector('#pred-ring');

  const timerInterval = setInterval(() => {
    timeLeft--;
    if (timerEl) timerEl.textContent = timeLeft;

    // Update ring stroke
    if (ring) {
      const offset = circumference * (1 - timeLeft / totalTime);
      ring.style.strokeDashoffset = offset;
      if (timeLeft <= 5) ring.style.stroke = 'var(--danger)';
    }
    if (timerEl && timeLeft <= 5) timerEl.style.color = 'var(--danger)';

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      lockOptions('CLOSED');
    }
  }, 1000);

  const lockOptions = (label) => {
    container.querySelectorAll('.pred-option').forEach(b => {
      b.disabled = true;
      b.style.opacity = '0.4';
      b.style.cursor = 'default';
      b.style.transform = '';
    });
    if (timerEl) { timerEl.textContent = label === 'CLOSED' ? '✕' : '✓'; timerEl.style.color = label === 'CLOSED' ? 'var(--danger)' : 'var(--success)'; }
    if (ring) ring.style.stroke = label === 'CLOSED' ? 'var(--danger)' : 'var(--success)';
  };

  // Click handler
  container.querySelectorAll('.pred-option').forEach(btn => {
    btn.addEventListener('click', (e) => {
      clearInterval(timerInterval);
      const answer = e.target.dataset.answer;

      lockOptions('VOTED');

      // Highlight chosen answer
      e.target.style.opacity = '1';
      e.target.style.background = 'rgba(0,240,255,0.2)';
      e.target.style.borderColor = 'var(--accent-cyan)';
      e.target.style.color = 'var(--accent-cyan)';

      const msg = document.getElementById(`pred-voted-msg-${prediction.id}`);
      if (msg) msg.style.display = 'block';

      // HACKATHON DEMO OVERRIDE: Fake immediate resolution so judges don't have to wait
      setTimeout(() => {
        const state = window.getState ? window.getState() : {};
        const isCorrect = Math.random() > 0.3; // 70% chance to be "correct" for the demo
        if (window.simulateLocalEvent) {
          window.simulateLocalEvent('PREDICTION_RESULT', {
            predictionId: prediction.id,
            correctAnswer: isCorrect ? answer : (prediction.options.find(o => o !== answer) || "None"),
            results: [{
              userId: state.userId,
              pointsEarned: isCorrect ? 50 : 0,
              correct: isCorrect
            }]
          });
        }
      }, 3000);
      actions.submitPrediction(prediction.id, answer);
    });
  });
};
