const EMOJIS = [
  '⚽','🏆','🍻','🥨','🔥','💀','😂','🤣','😤','👏',
  '🎉','💪','🤡','🧠','👀','🚑','😭','🥶','🫡','💅',
  '🫠','🤦','🙈','💯','⚡','🤮','🏳️'
];

const PHRASES = [
  "That wasn't even close! 🤣",
  "Call the ambulance... but not for me 🚑",
  "Your goalkeeper needs glasses 👓",
  "Is your defense on vacation? 🏖️",
  "That pass was a donation to charity 💝",
  "My grandma runs faster than your striker",
  "Where's the goalkeeper? On the bench? 🤷",
  "You call that a shot? 😂",
  "GOOOAL! Deal with it 🏆",
  "Peak performance right there 👀",
  "That tackle was a foul and you know it",
  "My team > your team, simple math",
  "Referee? Never heard of her",
  "How's that offside looking 🚫",
];

export const renderTrashTalk = (container, actions) => {
  container.innerHTML = `
    <div id="trash-talk-bar" style="
      position: fixed;
      bottom: 0; left: 0;
      width: 100%;
      background: rgba(5, 8, 20, 0.92);
      backdrop-filter: blur(12px);
      border-top: 1px solid var(--glass-border);
      z-index: 50;
      padding: 0.6rem 1rem;
    ">
      <!-- Emojis Row -->
      <div style="display:flex; align-items:center; gap:0.3rem; max-width:1000px; margin:0 auto; overflow-x:auto; padding-bottom:0.1rem;">
        <span style="font-size:0.7rem; color:rgba(255,255,255,0.35); white-space:nowrap; margin-right:0.3rem;">REACT</span>
        ${EMOJIS.map(e => `
          <button class="emoji-btn" data-emoji="${e}" title="${e}" style="
            background: transparent;
            border: none;
            font-size: 1.4rem;
            cursor: pointer;
            padding: 4px 6px;
            border-radius: 6px;
            transition: transform 0.15s, background 0.15s;
            flex-shrink: 0;
          ">${e}</button>
        `).join('')}
        <div style="width:1px; height:24px; background:rgba(255,255,255,0.15); margin:0 0.4rem; flex-shrink:0;"></div>
        <span style="font-size:0.7rem; color:rgba(255,255,255,0.35); white-space:nowrap; margin-right:0.3rem;">TRASH TALK</span>
        <select id="phrase-select" style="
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.15);
          color: #fff;
          border-radius: 6px;
          padding: 4px 6px;
          font-size: 0.75rem;
          cursor: pointer;
          flex-shrink: 0;
          max-width: 180px;
        ">
          <option value="" style="background: #111; color: #fff;">Pick a zinger...</option>
          ${PHRASES.map(p => `<option value="${p}" style="background: #111; color: #fff;">${p.substring(0, 35)}...</option>`).join('')}
        </select>
        <button id="send-phrase-btn" style="
          background: linear-gradient(135deg, var(--accent-cyan), #00a8ff);
          color: #000;
          border: none;
          border-radius: 6px;
          padding: 4px 10px;
          font-size: 0.75rem;
          font-weight: bold;
          cursor: pointer;
          flex-shrink: 0;
        ">SEND</button>
      </div>
    </div>
  `;

  let canReact = true;
  let reactCooldownTimer = null;

  const triggerCooldown = (btn) => {
    canReact = false;
    if (btn) {
      btn.style.background = 'rgba(255,255,255,0.08)';
      btn.style.transform = 'scale(0.85)';
    }
    clearTimeout(reactCooldownTimer);
    reactCooldownTimer = setTimeout(() => {
      canReact = true;
      if (btn) {
        btn.style.background = 'transparent';
        btn.style.transform = 'scale(1)';
      }
    }, 3000);
  };

  container.querySelectorAll('.emoji-btn').forEach(btn => {
    btn.addEventListener('mouseenter', () => { btn.style.background = 'rgba(255,255,255,0.1)'; btn.style.transform = 'scale(1.2)'; });
    btn.addEventListener('mouseleave', () => { if (canReact) { btn.style.background = 'transparent'; btn.style.transform = 'scale(1)'; }});
    btn.addEventListener('click', () => {
      if (!canReact) return;
      const emoji = btn.dataset.emoji;
      actions.sendReaction(emoji);
      triggerCooldown(btn);
    });
  });

  document.getElementById('send-phrase-btn')?.addEventListener('click', () => {
    if (!canReact) return;
    const sel = document.getElementById('phrase-select');
    if (sel && sel.value) {
      actions.sendReaction(sel.value);
      sel.value = '';
      triggerCooldown(null);
    }
  });
};

export const showReaction = (reactionData) => {
  const el = document.createElement('div');
  el.textContent = reactionData.content || '';
  
  const startX = 10 + Math.random() * 75;
  el.style.cssText = `
    position: fixed;
    left: ${startX}%;
    bottom: 90px;
    font-size: ${reactionData.content && reactionData.content.length > 2 ? '1rem' : '2.2rem'};
    z-index: 40;
    pointer-events: none;
    white-space: nowrap;
    max-width: 200px;
    padding: ${reactionData.content && reactionData.content.length > 2 ? '4px 10px' : '0'};
    background: ${reactionData.content && reactionData.content.length > 2 ? 'rgba(0,0,0,0.7)' : 'transparent'};
    border-radius: 20px;
    color: #fff;
  `;

  document.body.appendChild(el);

  if (typeof gsap !== 'undefined') {
    gsap.fromTo(el,
      { opacity: 1, y: 0 },
      {
        y: -(220 + Math.random() * 100),
        x: (Math.random() - 0.5) * 80,
        opacity: 0,
        duration: 2.5 + Math.random() * 0.5,
        ease: 'power1.out',
        onComplete: () => el.remove()
      }
    );
  } else {
    setTimeout(() => el.remove(), 3000);
  }
};
