# Product Requirements Document: Couch Rivals

## Executive Summary

**Product Name:** Couch Rivals  
**Tagline:** "Your living room just got a stadium upgrade"  
**Category:** Real-time Social Match Experience  
**Target Event:** Bundesliga Hackathon 2025  
**Build Timeline:** 4 days  
**Target Platform:** Web (responsive, multi-device)

### Vision Statement
Transform passive football watching into an electrifying multiplayer experience where friends compete in real-time mini-games synchronized to live match events, creating unforgettable shared moments that outlive the final whistle.

---

## Problem Statement

### Current State
- Football fans watch matches passively on individual devices
- Social interaction limited to WhatsApp messages or post-match discussions
- No meaningful engagement between goals (average 12 minutes between major events)
- Fantasy football is async and lacks real-time excitement
- Stadium atmosphere doesn't translate to home viewing

### Opportunity
- 56% of Bundesliga fans watch with friends/family (DFL 2024 report)
- Average match has 400+ trackable events (passes, tackles, shots)
- Second-screen usage at 73% during matches
- Gen Z expects multiplayer experiences in all entertainment

---

## Product Goals

### Primary Objectives
1. **Engagement:** Keep 3-8 friends actively engaged for full 90 minutes
2. **Retention:** 60%+ return for next match in same friend group
3. **Viral Growth:** 40%+ invite 2+ new friends within first 3 matches
4. **Technical Excellence:** <200ms WebSocket latency, 99.9% uptime

### Success Metrics
- **Session Duration:** Average 85+ minutes (full match)
- **Interaction Rate:** 15+ actions per user per match
- **Social Coefficient:** 2.5 invites per active user
- **NPS Score:** 50+ among early adopters

---

## Target Users

### Primary Persona: "The Squad Leader"
- **Age:** 22-34
- **Behavior:** Organizes friend gatherings, shares memes in group chats
- **Pain Point:** Wants to make match nights more memorable
- **Tech Comfort:** High - uses Discord, Twitch, betting apps
- **Motivation:** Social status, being the "fun organizer"

### Secondary Persona: "The Casual Fan"
- **Age:** 18-45
- **Behavior:** Watches big matches, not deeply tactical
- **Pain Point:** Feels left out of hardcore tactical discussions
- **Tech Comfort:** Medium - uses mainstream social apps
- **Motivation:** Belonging, shared experience with friends

### Tertiary Persona: "The Stats Nerd"
- **Age:** 25-40
- **Behavior:** Knows xG, follows tactical Twitter
- **Pain Point:** Can't show off knowledge in engaging way
- **Tech Comfort:** Very high - early adopter
- **Motivation:** Recognition, proving expertise

---

## Core Features

### 1. Real-Time Match Room
**Priority:** P0 (MVP Critical)

**Description:** Shared virtual space where 3-8 friends join to experience a match together

**User Stories:**
- As a Squad Leader, I can create a room and share a join code with friends
- As a Casual Fan, I can join a room with one tap from a shared link
- As any user, I see all participants with live avatars and online status

**Acceptance Criteria:**
- Room creation takes <3 seconds
- Join link works across all devices without login
- Real-time presence shows who's active/idle
- Room persists for 24 hours post-match
- Supports 3-8 simultaneous users per room

**Technical Requirements:**
- WebSocket connection via AWS API Gateway
- DynamoDB for room state management
- Lambda for room lifecycle management
- 6-digit alphanumeric room codes

---

### 2. Live Match Simulation Engine
**Priority:** P0 (MVP Critical)

**Description:** Bundesliga match data converted to real-time event stream that drives all game mechanics

**User Stories:**
- As any user, I experience match events (goals, cards, subs) in real-time
- As a developer, I can replay historical matches at configurable speeds
- As a Stats Nerd, I see accurate event data matching official Bundesliga stats

**Acceptance Criteria:**
- Events fire within 50ms of scheduled time
- Supports 1x, 2x, 5x playback speeds
- Includes 15+ event types (goal, shot, pass, tackle, card, sub, etc.)
- Visual countdown shows time to next major event
- Pause/resume capability for testing

**Technical Requirements:**
- EventBridge scheduled rules for event triggering
- Lambda functions parse Bundesliga JSON data
- WebSocket broadcasts to all room participants
- Event queue with priority system (goal > shot > pass)

**Data Structure:**
```json
{
  "eventId": "evt_001",
  "matchId": "bundesliga_2024_match_145",
  "timestamp": 1847,
  "type": "GOAL",
  "team": "FCB",
  "player": "Harry Kane",
  "metadata": {
    "minute": 31,
    "score": "2-1",
    "assistBy": "Jamal Musiala"
  }
}
```

---

### 3. Prediction Battles
**Priority:** P0 (MVP Critical)

**Description:** Real-time betting on match events with friend-vs-friend stakes

**User Stories:**
- As a Casual Fan, I bet on "Next goal in under 5 minutes?" and see instant results
- As a Squad Leader, I see a live leaderboard showing who's winning predictions
- As a Stats Nerd, I use match momentum indicators to inform my bets

**Acceptance Criteria:**
- New prediction every 2-4 minutes during active play
- 10-second window to place bet
- Instant scoring when event occurs
- 5-point base reward, 2x multiplier for risky bets
- 8+ prediction types (next goal, next card, 5-min shot count, etc.)

**Prediction Types:**
1. Next goal before minute X?
2. Next card color (yellow/red/none)?
3. Over/under shots in next 10 minutes
4. Player to touch ball next in attacking third
5. Corner kicks in next phase
6. Possession % for next 5 minutes
7. Successful passes in buildup to next shot
8. Time to next substitution

**Scoring Formula:**
```
Base Points = 5
Difficulty Multiplier = 1.0 to 3.0 (based on odds)
Speed Bonus = max(5 - seconds_to_answer, 0)
Streak Bonus = consecutive_correct * 2

Total = (Base * Difficulty + Speed) * (1 + Streak/10)
```

---

### 4. Momentum Wars
**Priority:** P1 (Launch Feature)

**Description:** Tap-battle mini-game during attacking phases where rapid tapping "boosts" your team

**User Stories:**
- As a Casual Fan, I frantically tap when my team attacks and see my contribution on screen
- As any user, I see a team-vs-team momentum bar filling based on collective tapping
- As a Stats Nerd, I understand that momentum affects prediction odds

**Acceptance Criteria:**
- Auto-triggers during dangerous attacks (final third possession)
- 15-second battle windows
- Minimum 3 taps/second to contribute
- Visual feedback for every 10 taps (sparks, color shifts)
- Team with higher momentum gets 1.5x prediction multiplier

**Anti-Cheat:**
- Max 15 taps/second counted (above = spam filter)
- Require alternating keys or touch points
- Cooldown after 3 consecutive momentum battles

**Priority:** P1
**Description:** A frantic 3D tap-battle where user taps visually "push" a dynamic energy barrier on a 3D stadium pitch.
**Visuals & Behavior:** 
- The background is a responsive, stylized 3D football pitch rendered via Three.js.
- During an attacking phase, a volumetric 3D "Momentum Core" appears in the center circle.
- Taps inject physics-based particles into the core, shifting its color and pushing the barrier toward the opponent's goal line in real-time.
- Anti-cheat limits individual contributions to 15 taps/second max.
---

### 5. Tactical Genius
**Priority:** P1 (Launch Feature)

**Description:** Predict formation changes and tactical shifts before they're announced

**User Stories:**
- As a Stats Nerd, I analyze the match state and predict the coach's next move
- As any user, I earn massive points (50+) for correct tactical predictions
- As a Squad Leader, I see who in my group has the best tactical eye

**Acceptance Criteria:**
- Predictions lock 30 seconds before substitution announcements
- Options include: formation change, specific player sub, tactical shift
- Bonus points for exact formation prediction
- Explanation of why each option makes sense (educational)

**Tactical Events:**
- Formation shift (4-4-2 to 3-5-2, etc.)
- Substitution (with position-specific options)
- Defensive/attacking mindset shift
- Set-piece specialist subbed on

### Performance & 3D Rendering
- **Target Framerate:** 60 FPS baseline on mobile (Safari/Chrome iOS & Android).
- **Asset Overhead:** Zero initial loading blocking. 3D assets must be low-poly, compressed via Draco (.glb), and lazy-loaded behind a lightweight loading state.
- **Render Loop Optimization:** RequestAnimationFrame loop must pause completely when the user switches tabs or when the match is in a "static data" phase to preserve device battery.
- **Shader Complexity:** Limit fragment shader math to basic vertex colors and simple lighting. No heavy post-processing effects (like Ambient Occlusion or Depth of Field) enabled by default on mobile.

---

### 6. Halftime Trivia Blitz
**Priority:** P2 (Nice-to-Have)

**Description:** 5-minute rapid-fire Bundesliga trivia during halftime break

**User Stories:**
- As a Casual Fan, I compete in fun trivia to stay engaged during halftime
- As a Stats Nerd, I dominate with my deep Bundesliga knowledge
- As any user, I see creative question formats beyond multiple choice

**Question Types:**
- Multiple choice (4 options, 10 seconds)
- Higher/Lower (comparing stats)
- Image identification (player, stadium, celebration)
- Audio clips (crowd chants, commentary moments)
- Video snippets (guess the match/year)

---

### 7. Celebration Moments
**Priority:** P0 (MVP Critical)

**Description:** Synchronized visual celebrations when major events occur

**User Stories:**
- As any user, I see confetti, screen shake, and color explosions when my team scores
- As a group, we all experience the same celebration synchronized
- As a losing team supporter, I see respectful but competitive reactions

**Celebration Types:**
- **Goal:** Confetti cannon, team color takeover, trophy emoji rain
- **Save:** Goalkeeper glove shield animation
- **Red Card:** Dramatic slow-mo zoom with red flash
- **Win:** Championship confetti with final scoreboard
- **Comeback:** "UNBELIEVABLE" banner with sparklers

**Customization:**
- Team-specific celebrations (Bayern = beer steins, Dortmund = yellow wall)
- Intensity scales with importance (90th min goal > 10th min goal)

**Priority:** P0 (MVP Critical)
**Description:** Immersive, 3D particle and camera animations triggered across all connected clients simultaneously via AWS WebSocket events.
**Visuals & Behavior:**
- **GOAL:** Three.js camera switches to a cinematic panning angle of the 3D stadium. A custom particle system generates 5,000+ pieces of physics-backed confetti tumbling down the viewport.
- **RED CARD:** The 3D scene lighting drastically shifts to dark crimson, and a glowing, floating 3D card meshes slices through the center screen.
- **WIN:** Post-match triggers a volumetric trophy presentation where user avatars light up based on leaderboard standings.

---

### 8. Trash Talk Widget
**Priority:** P1 (Launch Feature)

**Description:** Emoji reactions and quick messages that all participants see instantly

**User Stories:**
- As a Casual Fan, I send laughing emoji when opponent misses
- As any user, I see friend reactions float across screen in real-time
- As a Squad Leader, I use pre-written zingers for maximum impact

**Features:**
- 20+ football-themed emoji reactions
- 50+ pre-written trash talk phrases
- Custom message (50 char limit, profanity filter)
- Reactions trigger mini-animations (shake, bounce, fade)
- Rate limit: 1 reaction per 5 seconds

**Sample Phrases:**
- "That wasn't even close! 🤣"
- "Call the ambulance... but not for me 🚑"
- "Your goalkeeper needs glasses"
- "Is your defense on vacation?"
- "That pass was a donation to charity"

---

## Non-Functional Requirements

### Performance
- **WebSocket Latency:** <200ms p95
- **Event Sync Accuracy:** ±50ms across all clients
- **Time to Interactive:** <2 seconds on 4G connection
- **Animation Frame Rate:** Consistent 60fps
- **API Response Time:** <100ms for Lambda functions

### Scalability
- **Concurrent Rooms:** 1,000 during MVP phase
- **Users per Room:** 8 maximum
- **Events per Second:** 50 per match simulation
- **WebSocket Connections:** 8,000 simultaneous
- **Data Throughput:** 10MB/s aggregate

### Reliability
- **Uptime SLA:** 99.9% during match hours
- **Automatic Reconnection:** <5 second recovery from disconnect
- **State Persistence:** Room state saved every 30 seconds
- **Graceful Degradation:** Read-only mode if WebSocket fails

### Security
- **Authentication:** Optional (social login for persistence)
- **Room Privacy:** Private by default, join code required
- **Rate Limiting:** 100 actions/minute per user
- **Input Sanitization:** XSS protection on all text inputs
- **Data Encryption:** TLS 1.3 for all WebSocket traffic

### Accessibility
- **WCAG Compliance:** AA standard minimum
- **Keyboard Navigation:** Full feature access without mouse
- **Screen Reader:** Aria labels for all interactive elements
- **Color Blindness:** Deuteranopia/protanopia safe palettes
- **Reduced Motion:** Respect prefers-reduced-motion

### Browser Support
- Chrome 90+ (primary)
- Firefox 88+ (primary)
- Safari 14+ (secondary)
- Edge 90+ (secondary)
- Mobile Safari iOS 14+ (secondary)
- Chrome Android 90+ (secondary)

---

## User Flows

### Flow 1: First-Time Match Experience

```
1. User lands on homepage
   ↓
2. Clicks "Host a Match Room"
   ↓
3. Selects Bundesliga match (live or replay)
   ↓
4. Room created, receives join code: "XJ4K9P"
   ↓
5. Shares code via WhatsApp/Discord/iMessage
   ↓
6. Friends join (2-7 additional users)
   ↓
7. Host clicks "Start Match"
   ↓
8. Match simulation begins at 2x speed
   ↓
9. First event: Bayern kick-off
   ↓
10. Prediction appears: "Next goal before minute 15?"
    ↓
11. Users vote, countdown timer ticks
    ↓
12. Goal at minute 12 - Kane scores!
    ↓
13. Celebration animation triggers
    ↓
14. Leaderboard updates with prediction results
    ↓
15. Momentum War begins (Bayern attacking)
    ↓
16. Users tap frantically for 15 seconds
    ↓
17. Bayern fans win momentum boost
    ↓
18. Next prediction with 1.5x multiplier
    ↓
19. Cycle repeats for 90 minutes
    ↓
20. Final whistle - winner declared
    ↓
21. Match summary with highlights
    ↓
22. Option to "Play Next Match" or "View Stats"
```

### Flow 2: Rejoining After Disconnect

```
1. User's WiFi drops mid-match
   ↓
2. WebSocket connection lost
   ↓
3. UI shows "Reconnecting..." overlay
   ↓
4. Auto-retry every 2 seconds (5 attempts)
   ↓
5. Connection restored
   ↓
6. Lambda fetches current room state from DynamoDB
   ↓
7. Client receives full state sync
   ↓
8. UI updates to current match time, scores, leaderboard
   ↓
9. "You're back!" toast notification
   ↓
10. Continues from current match moment
```

### Flow 3: Post-Match Rivalry Stats

```
1. Match ends
   ↓
2. Final leaderboard displayed
   ↓
3. "Match MVP" animation for winner
   ↓
4. Per-user stats cards generated:
   - Predictions: 12/18 (67%)
   - Points: 247
   - Best Moment: "Called Kane's hat-trick!"
   - Momentum Wins: 5/8
   ↓
5. Season rivalry standings shown
   ↓
6. Share card with social media export
   ↓
7. "Challenge them to rematch" CTA
```

---

## Out of Scope (For MVP)

### Phase 2 Features
- AI-powered commentary and banter
- Video replay integration
- Fantasy team integration
- Cryptocurrency/NFT rewards
- Tournament brackets
- Public leaderboards
- Mobile native apps
- Watch party video chat
- Betting with real money
- VR/AR experiences

### Explicitly NOT Included
- Live streaming of actual matches (licensing issues)
- Direct integration with Bundesliga official APIs (no partnership yet)
- User authentication required (friction barrier)
- Native mobile apps (web-first strategy)
- Monetization features (focus on engagement)

---

## Technical Constraints

### AWS Free Tier Limits
- **Lambda:** 1M requests/month, 400,000 GB-seconds compute
- **API Gateway:** 1M WebSocket messages/month
- **DynamoDB:** 25GB storage, 25 WCU/RCU
- **S3:** 5GB storage, 20,000 GET requests
- **EventBridge:** Included in Lambda free tier

### Optimization Strategies
- Batch WebSocket messages where possible
- Cache static assets aggressively
- Use DynamoDB TTL for auto-cleanup
- Compress event payloads
- Client-side state for non-critical features

### Hard Limits
- Max 1,000 concurrent rooms (free tier WebSocket limit)
- Max 90-minute match duration (Lambda 15-min timeout = chunked events)
- Max 8 users per room (fan-out complexity)
- Max 50 events/second broadcast rate

---

## Data Requirements

### Match Data Format (Bundesliga JSON)
```json
{
  "matchId": "bundesliga_2024_145",
  "homeTeam": "Bayern Munich",
  "awayTeam": "Borussia Dortmund",
  "date": "2024-11-09",
  "events": [
    {
      "time": 847,
      "type": "GOAL",
      "team": "home",
      "player": "Harry Kane",
      "assist": "Jamal Musiala",
      "score": "1-0"
    },
    {
      "time": 1243,
      "type": "YELLOW_CARD",
      "team": "away",
      "player": "Emre Can"
    }
  ],
  "stats": {
    "possession": {"home": 58, "away": 42},
    "shots": {"home": 14, "away": 9},
    "tackles": {"home": 18, "away": 21}
  }
}
```

### Room State Schema
```json
{
  "roomId": "XJ4K9P",
  "matchId": "bundesliga_2024_145",
  "status": "LIVE",
  "currentTime": 2134,
  "participants": [
    {
      "userId": "temp_abc123",
      "displayName": "König",
      "team": "home",
      "points": 247,
      "online": true
    }
  ],
  "leaderboard": [...],
  "activeGame": {
    "type": "PREDICTION",
    "question": "Next goal before min 45?",
    "expiresAt": 1716391234,
    "votes": {...}
  }
}
```

---

## Design Principles

### 1. Instant Gratification
Every action should provide immediate visual/audio feedback. No loading spinners for user interactions.

### 2. Emergent Storytelling
Design mechanics that create memorable "remember when..." moments. The app should facilitate stories, not just display data.

### 3. Inclusive Competition
Casual fans should have paths to victory beyond tactical knowledge. Luck + skill balance.

### 4. Graceful Degradation
If real-time fails, fall back to turn-based. If multiplayer fails, single-player still fun.

### 5. Respect the Match
Never distract from actual football. Enhance, don't replace, the viewing experience.

---

## Success Criteria (Hackathon Specific)

### Must-Have for Demo
1. ✅ 3 users in same room on different devices
2. ✅ Match simulation runs smoothly for 10+ minutes
3. ✅ At least 2 mini-games fully functional
4. ✅ Leaderboard updates in real-time
5. ✅ One celebration animation triggers correctly
6. ✅ No crashes or disconnects during 15-minute demo
7. ✅ Visually stunning UI that wows judges

### Bonus Points
- 🌟 AI-powered trash talk generator (Claude API)
- 🌟 3D stadium visualization with WebGL
- 🌟 Audio announcer commentary
- 🌟 Social media share cards auto-generated
- 🌟 Mobile + desktop simultaneously
- 🌟 Replay system with highlight reel

### Judging Criteria Alignment
- **Innovation:** Multiplayer + real-time + gamification = ✅
- **Technical Execution:** AWS best practices, clean architecture = ✅
- **User Experience:** Stunning UI, smooth interactions = ✅
- **Bundesliga Integration:** Real match data, authentic feel = ✅
- **Scalability:** Free tier optimization shows planning = ✅

---

## Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| WebSocket latency >500ms | Medium | High | Pre-load events, client-side prediction |
| Free tier limits exceeded | High | Medium | Auto-scaling to paid tier, usage monitoring |
| Match data parsing errors | Medium | High | Extensive test data, error boundaries |
| Browser compatibility issues | Medium | Medium | Feature detection, graceful fallbacks |
| 4-day timeline too aggressive | High | High | MVP scope ruthlessly cut, modular architecture |
| Demo day technical failure | Low | Critical | Backup video recording, offline mode |

---

## Appendix A: Competitor Analysis

| Product | Strength | Weakness | Our Advantage |
|---------|----------|----------|---------------|
| Sofascore | Real-time scores | Passive consumption | Active multiplayer games |
| Sorare | Fantasy blockchain | No real-time play | Live match integration |
| FIFA Ultimate Team | Deep engagement | Not social | Friend-focused |
| Twitch co-watching | Social viewing | No gamification | Game mechanics |
| Discord watch parties | Voice chat | No match integration | Event-driven games |

---

## Appendix B: Terminology

- **Room:** Virtual space where friends gather for a match
- **Event:** Match happening (goal, card, shot, etc.)
- **Mini-game:** Interactive challenge (prediction, momentum, trivia)
- **Momentum:** Collective tapping energy that affects multipliers
- **Squad Leader:** User who creates the room
- **Match Simulation:** Replaying historical match as real-time events
- **Sync State:** Current match time, scores, and game state
- **WebSocket Message:** Real-time data packet sent to all room participants

---

## Appendix C: Future Vision (Post-Hackathon)

### Month 1-3: Beta Launch
- 100 alpha testers from Bundesliga subreddits
- 3 matches per week, feedback loops
- A/B test game mechanics

### Month 4-6: Public Launch
- Partnership discussions with Bundesliga Digital
- Influencer campaign with football YouTubers
- 10,000 MAU target

### Month 7-12: Platform Expansion
- Native iOS/Android apps
- Integration with official Bundesliga app
- Premium features (custom games, ad-free)
- Tournament mode for supporter clubs

### Year 2: Internationalization
- Premier League, La Liga, Serie A support
- Multi-language support
- Regional leaderboards
- Esports integration (FIFA, Football Manager)

---

**Document Version:** 1.0  
**Last Updated:** May 22, 2026  
**Author:** Product Team  
**Status:** Approved for Development
