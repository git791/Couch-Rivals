export const renderLanding = (container, actions) => {
  const defaultName = `Fan_${Math.floor(Math.random() * 9000) + 1000}`;
  let selectedTeam = null; // MUST be explicitly chosen

  container.innerHTML = `
    <div id="landing-view">
      <canvas id="bg-canvas"></canvas>
      <div class="hero-section">
        <h1 class="hero-title">COUCH RIVALS</h1>
        <p class="hero-tagline" style="font-family:'Rajdhani'">Your living room just got a stadium upgrade.</p>
        
        <!-- Profile Setup Card -->
        <div class="profile-setup glass-card animate-slide-up" style="animation-delay: 0.05s">
          <h3 class="text-cyan" style="font-size: 1.6rem; margin-bottom: 0.5rem; font-family:'Bebas Neue';">
            1. Set Up Your Profile
          </h3>
          
          <div class="flex-col gap-sm" style="text-align: left; width: 100%;">
            <label style="font-family:'Orbitron'; font-size: 0.8rem; color: #a0aec0; letter-spacing:1px;">DISPLAY NAME</label>
            <input type="text" id="username-input" class="input-field" placeholder="${defaultName}" maxlength="15" autocomplete="off">
          </div>
          
          <div class="flex-col gap-sm" style="width: 100%;">
            <label style="font-family:'Orbitron'; font-size: 0.8rem; color: #a0aec0; letter-spacing:1px;">
              PICK YOUR ALLIANCE <span id="team-required" style="color:var(--danger); font-size:0.7rem; margin-left:0.3rem; display:none;">← Required!</span>
            </label>
            <div class="flex gap-md" style="width: 100%;">
              <button id="btn-team-bayern" class="team-select-btn" data-team="home">
                <span style="font-size:1.2rem;">🔴</span>&nbsp;BAYERN MUNICH
              </button>
              <button id="btn-team-dortmund" class="team-select-btn" data-team="away">
                <span style="font-size:1.2rem;">🟡</span>&nbsp;BORUSSIA DORTMUND
              </button>
            </div>
          </div>
        </div>

        <h3 class="animate-slide-up text-cyan" style="font-size: 1.4rem; margin-bottom: 1.5rem; animation-delay: 0.1s; font-family:'Bebas Neue';">
          2. Choose Your Entry
        </h3>

        <div class="action-cards">
          <div class="action-card glass-card animate-slide-up" style="animation-delay: 0.15s">
            <h3 class="text-cyan">🏟️ Host a Match Room</h3>
            <p>Create a private room for you and your friends.</p>
            <button class="btn-primary" id="btn-host">Create Room</button>
          </div>
          
          <div class="action-card glass-card animate-slide-up" style="animation-delay: 0.2s">
            <h3 class="text-gold">🔗 Join a Room</h3>
            <div class="join-input-group">
              <input type="text" id="room-code-input" class="input-field room-code-input" placeholder="XXXXXX" maxlength="6" autocomplete="off">
              <button class="btn-secondary" id="btn-join">Join Match</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Team Selection
  const bayernBtn = document.getElementById('btn-team-bayern');
  const dortmundBtn = document.getElementById('btn-team-dortmund');
  const teamRequired = document.getElementById('team-required');

  const selectTeam = (team) => {
    selectedTeam = team;
    teamRequired.style.display = 'none';
    if (team === 'home') {
      bayernBtn.classList.add('active');
      dortmundBtn.classList.remove('active');
    } else {
      dortmundBtn.classList.add('active');
      bayernBtn.classList.remove('active');
    }
  };

  bayernBtn.addEventListener('click', () => selectTeam('home'));
  dortmundBtn.addEventListener('click', () => selectTeam('away'));

  const getDisplayName = () => {
    const val = document.getElementById('username-input').value.trim();
    return val || defaultName;
  };

  const validateAndRun = (fn) => {
    // Play background music on first interaction via YouTube API
    if (window.startBackgroundMusic) {
      window.startBackgroundMusic();
    }

    if (!selectedTeam) {
      teamRequired.style.display = 'inline';
      bayernBtn.style.animation = 'pulse-glow 0.5s ease 2';
      dortmundBtn.style.animation = 'pulse-glow 0.5s ease 2';
      setTimeout(() => {
        bayernBtn.style.animation = '';
        dortmundBtn.style.animation = '';
      }, 1000);
      return;
    }
    fn();
  };

  document.getElementById('btn-host').addEventListener('click', () => {
    validateAndRun(() => actions.createRoom(getDisplayName(), selectedTeam));
  });

  document.getElementById('btn-join').addEventListener('click', () => {
    validateAndRun(() => {
      const code = document.getElementById('room-code-input').value.toUpperCase().trim();
      if (code.length !== 6) {
        const inp = document.getElementById('room-code-input');
        inp.style.borderColor = 'var(--danger)';
        inp.placeholder = 'Need 6 chars!';
        setTimeout(() => { inp.style.borderColor = ''; inp.placeholder = 'XXXXXX'; }, 2000);
        return;
      }
      actions.joinRoom(code, getDisplayName(), selectedTeam);
    });
  });

  // Also allow Enter key on room code input
  document.getElementById('room-code-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('btn-join').click();
  });

  // Background particles
  const canvas = document.getElementById('bg-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.4 + 0.1,
      opacity: Math.random() * 0.5 + 0.1,
    }));

    let animFrame;
    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 240, 255, ${p.opacity})`;
        ctx.fill();
        p.y -= p.speed;
        if (p.y < 0) { p.y = canvas.height; p.x = Math.random() * canvas.width; }
      });
      animFrame = requestAnimationFrame(drawParticles);
    };
    drawParticles();

    // Stop animation when view is destroyed
    const observer = new MutationObserver(() => {
      if (!document.getElementById('landing-view')) {
        cancelAnimationFrame(animFrame);
        observer.disconnect();
      }
    });
    observer.observe(container, { childList: true });
  }
};
