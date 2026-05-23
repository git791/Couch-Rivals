# Technology Stack Guide
## Couch Rivals - Complete Stack Breakdown

---

### 📋 Document Information
- **Project:** Couch Rivals
- **Audience:** Beginners & Intermediate Developers
- **Purpose:** Understand every technology choice and how to use it

---

## 🎯 Stack Overview

Think of our tech stack like building a house:
- **Frontend** = The rooms where people hang out (what users see)
- **Backend** = The plumbing and electricity (what makes things work)
- **Database** = The storage closets (where we keep stuff)
- **Infrastructure** = The foundation and walls (AWS services)

---

## 🎨 Frontend Stack

### 1. React 18
**What it is:** A JavaScript library for building user interfaces

**Why we use it:**
- Makes it easy to build interactive UIs
- Components are reusable (like LEGO blocks)
- Fast updates when data changes
- Huge community = lots of help online

**Example:**
```javascript
// A simple React component
function PlayerCard({ name, score }) {
  return (
    <div className="player-card">
      <h3>{name}</h3>
      <p>Score: {score}</p>
    </div>
  )
}

// Use it like this:
<PlayerCard name="Sam" score={450} />
```

**How to learn:**
- Official tutorial: https://react.dev/learn
- Time needed: 1-2 weeks for basics

---

### 2. Tailwind CSS
**What it is:** A utility-first CSS framework

**Why we use it:**
- Write styles directly in HTML (no separate CSS files)
- Faster development
- Consistent design system
- Responsive by default

**Example:**
```html
<!-- Old way (traditional CSS) -->
<div class="my-custom-button">Click me</div>
<style>
  .my-custom-button {
    background-color: blue;
    padding: 8px 16px;
    border-radius: 4px;
  }
</style>

<!-- Tailwind way -->
<button class="bg-blue-500 px-4 py-2 rounded">
  Click me
</button>
```

**How to learn:**
- Docs: https://tailwindcss.com/docs
- Time needed: 2-3 days to get comfortable

---

### 3. Framer Motion
**What it is:** Animation library for React

**Why we use it:**
- Makes animations super easy
- Smooth 60fps performance
- Great for celebrations and transitions
- Works well on mobile

**Example:**
```javascript
import { motion } from 'framer-motion'

// Confetti that falls from top
function Confetti() {
  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 600, opacity: 1 }}
      transition={{ duration: 2, ease: "easeOut" }}
    >
      🎉
    </motion.div>
  )
}
```

**How to learn:**
- Docs: https://www.framer.com/motion/
- Time needed: 1 day for basics

---

### 4. Zustand (State Management)
**What it is:** A tiny state management library

**Why we use it (instead of Redux):**
- Much simpler than Redux
- Less code to write
- Easier to understand
- Perfect for our app size

**Example:**
```javascript
// Create a store
import create from 'zustand'

const useGameStore = create((set) => ({
  score: 0,
  playerName: '',
  
  // Actions to change state
  addPoints: (points) => set((state) => ({ 
    score: state.score + points 
  })),
  
  setPlayerName: (name) => set({ playerName: name })
}))

// Use in any component
function ScoreDisplay() {
  const score = useGameStore((state) => state.score)
  const addPoints = useGameStore((state) => state.addPoints)
  
  return (
    <div>
      <p>Score: {score}</p>
      <button onClick={() => addPoints(10)}>
        Add 10 points
      </button>
    </div>
  )
}
```

**Think of it as:** A shared notebook that all components can read and write to

**How to learn:**
- Docs: https://zustand-demo.pmnd.rs/
- Time needed: 2 hours

---

### 5. WebSocket (Native Browser API)
**What it is:** Two-way communication between browser and server

**Why we need it:**
- HTTP is one-way (you ask, server responds, done)
- WebSocket is like a phone call (both can talk anytime)
- Perfect for real-time games

**Visual Comparison:**
```
HTTP (Traditional):
You: "What's the score?"
Server: "3-2"
[Connection closes]
You: "What's the score NOW?"
Server: "Still 3-2"
[Connection closes]

WebSocket:
You: "Connect me to the game"
Server: "Connected!"
[Connection stays open]
Server: "GOAL! Score is now 4-2"
Server: "Player joined the room"
Server: "New prediction available"
```

**Example Code:**
```javascript
// Connect to server
const ws = new WebSocket('wss://your-server.com')

// When connection opens
ws.onopen = () => {
  console.log('Connected!')
  ws.send(JSON.stringify({ action: 'joinRoom', roomId: 'FCB-4782' }))
}

// When server sends a message
ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  console.log('Got message from server:', data)
  
  if (data.type === 'goal') {
    showConfetti()
  }
}

// Send a message
ws.send(JSON.stringify({
  action: 'submitPrediction',
  prediction: 'yes'
}))
```

**How to learn:**
- MDN Docs: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
- Time needed: 3-4 hours

---

### 6. Vite (Build Tool)
**What it is:** Super fast development server and build tool

**Why we use it (instead of Create React App):**
- 10x faster startup
- Instant hot reload (see changes immediately)
- Modern and well-maintained

**You don't write Vite code, it just makes your life easier**

**Setup:**
```bash
# Create new React project with Vite
npm create vite@latest couch-rivals -- --template react

# Install dependencies
cd couch-rivals
npm install

# Start development server
npm run dev
```

**How to learn:**
- Docs: https://vitejs.dev/guide/
- Time needed: 30 minutes

---

## 🔧 Backend Stack

### 1. AWS Lambda (Serverless Functions)
**What it is:** Run code without managing servers

**Why it's amazing:**
- You only pay when code runs
- Auto-scales (handles 1 or 1000 users automatically)
- No servers to maintain
- Perfect for our budget

**How it works:**
```
Traditional Server:
- Server runs 24/7 (costs $$$ even when sleeping)
- You manage: OS, security, updates, scaling
- If traffic spikes, server might crash

AWS Lambda:
- Code runs only when triggered
- AWS manages everything
- Costs $0 when nobody is playing
- Auto-scales to handle any load
```

**Example Lambda Function:**
```javascript
// This runs in AWS Lambda
exports.handler = async (event) => {
  // event = incoming data (like a user joining a room)
  const { roomId, playerId } = JSON.parse(event.body)
  
  // Do something
  console.log(`Player ${playerId} joining room ${roomId}`)
  
  // Return response
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Successfully joined room!',
      roomId: roomId
    })
  }
}
```

**Free Tier:**
- 1 million requests per month FREE
- 400,000 GB-seconds of compute FREE

**How to learn:**
- AWS Lambda basics: https://aws.amazon.com/lambda/getting-started/
- Time needed: 1 day

---

### 2. API Gateway (WebSocket API)
**What it is:** The door between your frontend and Lambda functions

**Why we need it:**
- Handles WebSocket connections
- Routes messages to the right Lambda function
- Manages connection lifecycle

**How it works:**
```
Browser                API Gateway              Lambda Functions
  |                         |                         |
  |--- Connect ------------>|                         |
  |                         |--- Call ---------------→| connectHandler()
  |<-- Connected -----------|                         |
  |                         |                         |
  |--- Join Room ---------->|                         |
  |                         |--- Call ---------------→| joinRoomHandler()
  |<-- Room Joined ---------|                         |
```

**Routes in API Gateway:**
```
$connect    → connectHandler (when user connects)
$disconnect → disconnectHandler (when user leaves)
joinRoom    → joinRoomHandler (custom route)
submitPred  → predictionHandler (custom route)
```

**Free Tier:**
- 1 million messages per month FREE
- 750,000 connection minutes FREE

**How to learn:**
- AWS Docs: https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html
- Time needed: 3-4 hours

---

### 3. DynamoDB (NoSQL Database)
**What it is:** A super fast database that doesn't use tables like Excel

**Why we use it (instead of PostgreSQL/MySQL):**
- Lightning fast (single-digit millisecond response)
- Auto-scales
- No server to manage
- Perfect for real-time data

**SQL vs NoSQL Comparison:**
```
SQL Database (like PostgreSQL):
+----------------+
| Players Table  |
+----+------+----+
| ID | Name | Score |
+----+------+----+
|  1 | Sam  | 450 |
|  2 | Lisa | 380 |
+----+------+----+

NoSQL (DynamoDB):
{
  "playerId": "player_123",
  "name": "Sam",
  "score": 450,
  "team": "bayern",
  "achievements": ["first_goal", "winner"]
}
```

**Example Operations:**
```javascript
const AWS = require('aws-sdk')
const dynamoDB = new AWS.DynamoDB.DocumentClient()

// Save data
await dynamoDB.put({
  TableName: 'Rooms',
  Item: {
    roomId: 'FCB-4782',
    players: ['Sam', 'Lisa', 'Max'],
    score: { home: 2, away: 1 },
    createdAt: Date.now()
  }
}).promise()

// Get data
const result = await dynamoDB.get({
  TableName: 'Rooms',
  Key: { roomId: 'FCB-4782' }
}).promise()

console.log(result.Item) // { roomId: 'FCB-4782', players: [...], ... }

// Update data
await dynamoDB.update({
  TableName: 'Rooms',
  Key: { roomId: 'FCB-4782' },
  UpdateExpression: 'SET score.home = score.home + :val',
  ExpressionAttributeValues: {
    ':val': 1
  }
}).promise()
```

**Free Tier:**
- 25 GB of storage FREE
- 25 read/write capacity units FREE
- Enough for thousands of concurrent users!

**How to learn:**
- DynamoDB Tutorial: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GettingStartedDynamoDB.html
- Time needed: 1-2 days

---

### 4. EventBridge (Event Scheduler)
**What it is:** A cron job service (runs tasks on schedule)

**Why we need it:**
- Simulates match events in real-time
- Triggers Lambda functions every minute during match
- Sends timed events

**How it works:**
```
EventBridge Schedule:
"Every 60 seconds during match, trigger Lambda"

Lambda receives trigger:
1. Read current match minute
2. Load events for that minute
3. Broadcast to all players
4. Update match minute
5. Schedule next minute
```

**Example Rule:**
```javascript
// EventBridge Rule
{
  "source": ["couch-rivals.match-engine"],
  "detail-type": ["MatchMinuteProgress"],
  "schedule": "rate(1 minute)"
}

// Lambda gets triggered
exports.handler = async (event) => {
  const currentMinute = event.detail.minute
  
  // Get events for this minute
  const events = await getMatchEvents(currentMinute)
  
  // Broadcast each event
  for (const evt of events) {
    await broadcastToAllRooms(evt)
  }
}
```

**Free Tier:**
- Unlimited rules
- First 1 million invocations FREE per month

**How to learn:**
- EventBridge Guide: https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-what-is.html
- Time needed: 2-3 hours

---

### 5. S3 (File Storage)
**What it is:** Cloud storage for files (like Dropbox but for apps)

**What we store:**
- Match data (JSON files)
- Team logos
- Static assets (images, icons)

**Example:**
```javascript
const AWS = require('aws-sdk')
const s3 = new AWS.S3()

// Upload a file
await s3.putObject({
  Bucket: 'couch-rivals-data',
  Key: 'matches/match_001.json',
  Body: JSON.stringify(matchData),
  ContentType: 'application/json'
}).promise()

// Download a file
const result = await s3.getObject({
  Bucket: 'couch-rivals-data',
  Key: 'matches/match_001.json'
}).promise()

const matchData = JSON.parse(result.Body.toString())
```

**Free Tier:**
- 5 GB storage FREE
- 20,000 GET requests FREE
- 2,000 PUT requests FREE

**How to learn:**
- S3 Getting Started: https://docs.aws.amazon.com/AmazonS3/latest/userguide/GetStartedWithS3.html
- Time needed: 2 hours

---

### 6. Node.js 18
**What it is:** JavaScript runtime for backend

**Why we use it:**
- Same language as frontend (JavaScript everywhere!)
- Huge ecosystem (npm packages)
- Fast and efficient
- AWS Lambda supports it natively

**You already know JavaScript from frontend, so backend is easy!**

---

## 🛠️ Development Tools

### 1. AWS SAM (Serverless Application Model)
**What it is:** Tool to deploy AWS Lambda functions easily

**Why we use it:**
- One command to deploy everything
- Local testing before deploying
- Infrastructure as code (no clicking in AWS Console)

**Example SAM Template:**
```yaml
# template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  # Lambda function
  RoomManagerFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: index.handler
      Runtime: nodejs18.x
      CodeUri: src/roomManager/
  
  # DynamoDB table
  RoomsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: Rooms
      BillingMode: PAY_PER_REQUEST
```

**Commands:**
```bash
# Build your app
sam build

# Test locally
sam local invoke RoomManagerFunction

# Deploy to AWS
sam deploy --guided
```

**How to learn:**
- SAM Tutorial: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-getting-started.html
- Time needed: 3-4 hours

---

### 2. Git & GitHub
**What it is:** Version control (saves your code history)

**Why you need it:**
- Never lose code
- Work on features without breaking main code
- Required for hackathon submission

**Basic Workflow:**
```bash
# Initialize repo
git init

# Add all files
git add .

# Save changes
git commit -m "Added prediction game feature"

# Push to GitHub
git push origin main
```

**How to learn:**
- GitHub Tutorial: https://guides.github.com/introduction/git-handbook/
- Time needed: 2-3 hours

---

### 3. VS Code
**What it is:** Best code editor for web development

**Essential Extensions:**
- ESLint (catches errors)
- Prettier (auto-formats code)
- AWS Toolkit (manage AWS from VS Code)
- Tailwind CSS IntelliSense (autocomplete for Tailwind)

**Download:** https://code.visualstudio.com/

---

### 4. Postman (API Testing)
**What it is:** Tool to test APIs

**Why you need it:**
- Test Lambda functions before connecting frontend
- Debug WebSocket connections
- Save example requests

**Example:**
```
POST https://your-api.amazonaws.com/joinRoom
Body:
{
  "roomId": "FCB-4782",
  "playerId": "test_player",
  "playerName": "TestSam"
}
```

**Download:** https://www.postman.com/downloads/

---

## 📦 Package Dependencies

### Frontend Packages
```json
{
  "dependencies": {
    "react": "^18.2.0",              // UI framework
    "react-dom": "^18.2.0",           // React for web
    "zustand": "^4.5.0",              // State management
    "framer-motion": "^11.0.0",       // Animations
    "tailwindcss": "^3.4.0"           // Styling
  },
  "devDependencies": {
    "vite": "^5.0.0",                 // Build tool
    "eslint": "^8.56.0",              // Code linting
    "prettier": "^3.2.0"              // Code formatting
  }
}
```

**Install all:**
```bash
npm install
```

---

### Backend Packages
```json
{
  "dependencies": {
    "aws-sdk": "^2.1565.0",           // AWS services SDK
    "uuid": "^9.0.1"                  // Generate unique IDs
  },
  "devDependencies": {
    "aws-sam-cli": "^1.108.0",        // SAM deployment
    "jest": "^29.7.0"                 // Testing
  }
}
```

---

## 🚀 Complete Setup Guide

### Step 1: Install Prerequisites
```bash
# Install Node.js 18+ (includes npm)
# Download from: https://nodejs.org/

# Verify installation
node --version  # Should show v18.x.x or higher
npm --version   # Should show v9.x.x or higher

# Install AWS CLI
# Download from: https://aws.amazon.com/cli/

# Verify
aws --version

# Install SAM CLI
# Download from: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html

# Verify
sam --version
```

---

### Step 2: Setup AWS Account
```bash
# Create free AWS account
# Go to: https://aws.amazon.com/free/

# Configure AWS credentials
aws configure

# Enter when prompted:
AWS Access Key ID: [Your key]
AWS Secret Access Key: [Your secret]
Default region name: eu-central-1  # Frankfurt (close to Germany)
Default output format: json
```

---

### Step 3: Create Project Structure
```bash
# Create project directory
mkdir couch-rivals
cd couch-rivals

# Create frontend
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install zustand framer-motion

# Install Tailwind
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Go back to root
cd ..

# Create backend structure
mkdir -p backend/src/handlers
mkdir -p backend/src/utils

# Create SAM template
touch backend/template.yaml
```

---

### Step 4: Project Structure
```
couch-rivals/
├── frontend/                  # React app
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── hooks/             # Custom hooks
│   │   ├── store/             # Zustand stores
│   │   ├── utils/             # Helper functions
│   │   └── App.jsx            # Main app
│   ├── package.json
│   └── vite.config.js
│
├── backend/                   # AWS Lambda functions
│   ├── src/
│   │   ├── handlers/
│   │   │   ├── roomManager.js
│   │   │   ├── eventBroadcaster.js
│   │   │   ├── gameHandler.js
│   │   │   └── scoringEngine.js
│   │   └── utils/
│   │       ├── dynamodb.js
│   │       └── websocket.js
│   ├── template.yaml          # SAM infrastructure
│   └── package.json
│
├── data/                      # Match data
│   └── matches/
│       └── match_001.json
│
└── README.md
```

---

### Step 5: Development Workflow

**Frontend Development:**
```bash
cd frontend
npm run dev

# Open browser to: http://localhost:5173
```

**Backend Development:**
```bash
cd backend

# Build
sam build

# Test locally
sam local start-api

# Deploy to AWS
sam deploy --guided
```

**Full Stack Testing:**
```bash
# Terminal 1: Run frontend
cd frontend && npm run dev

# Terminal 2: Run backend locally
cd backend && sam local start-api

# Frontend connects to: http://localhost:3000
```

---

## 🎓 Learning Path (4 Days)

### Day 0 (Preparation - Before Hackathon)
**Time: 8 hours**

- [2 hours] React basics tutorial
- [2 hours] AWS account setup + Lambda tutorial
- [2 hours] DynamoDB basics
- [2 hours] WebSocket fundamentals

---

### Day 1 (Foundation)
**Time: 8 hours**

**Morning (4 hours):**
- [1 hour] Setup project structure
- [2 hours] Create basic React app with routing
- [1 hour] Deploy first Lambda function

**Afternoon (4 hours):**
- [2 hours] Setup DynamoDB tables
- [1 hour] Create room creation flow
- [1 hour] Test room joining

**End of Day Checkpoint:**
✅ Can create a room
✅ Can join a room
✅ See players in room

---

### Day 2 (Match Engine)
**Time: 8 hours**

**Morning (4 hours):**
- [2 hours] Setup EventBridge + match simulator
- [2 hours] WebSocket event broadcasting

**Afternoon (4 hours):**
- [2 hours] Match visualization in frontend
- [1 hour] Sync testing (all clients see events)
- [1 hour] Bug fixes

**End of Day Checkpoint:**
✅ Match events broadcast to all players
✅ Events synchronized across clients
✅ Match clock working

---

### Day 3 (Games & Scoring)
**Time: 8 hours**

**Morning (4 hours):**
- [2 hours] Prediction Battle game
- [2 hours] Momentum Wars game

**Afternoon (4 hours):**
- [2 hours] Leaderboard system
- [1 hour] Scoring logic
- [1 hour] Integration testing

**End of Day Checkpoint:**
✅ Both mini-games working
✅ Points awarded correctly
✅ Leaderboard updates in real-time

---

### Day 4 (Polish & Demo)
**Time: 8 hours**

**Morning (4 hours):**
- [2 hours] UI/UX improvements (animations, colors)
- [1 hour] Celebration effects (confetti, sounds)
- [1 hour] Mobile responsiveness

**Afternoon (4 hours):**
- [1 hour] Bug fixes
- [1 hour] Performance optimization
- [1 hour] Record demo video
- [1 hour] Prepare presentation

**End of Day Checkpoint:**
✅ Polished, demo-ready app
✅ Recorded video
✅ Presentation slides ready

---

## 📊 Technology Decision Matrix

### Why These Technologies?

| Requirement | Options Considered | Chosen | Reason |
|-------------|-------------------|--------|---------|
| **Frontend Framework** | React, Vue, Svelte | **React** | Largest community, best for real-time UIs |
| **State Management** | Redux, MobX, Zustand | **Zustand** | Simplest, smallest bundle size |
| **Styling** | CSS Modules, Styled Components, Tailwind | **Tailwind** | Fastest development |
| **Backend** | Express + EC2, Lambda, Firebase | **Lambda** | Serverless = no ops, free tier |
| **Database** | PostgreSQL, MongoDB, DynamoDB | **DynamoDB** | Fastest, serverless, free tier |
| **Real-time** | Socket.io, WebSocket, Pusher | **WebSocket** | Native, no dependencies |
| **Animations** | CSS, GSAP, Framer Motion | **Framer Motion** | React-native, declarative |

---

## 🔍 Debugging Tools

### Frontend Debugging
```javascript
// React DevTools (Chrome extension)
// Install: https://chrome.google.com/webstore/detail/react-developer-tools/

// Console logging
console.log('Current score:', score)

// Zustand DevTools
import { devtools } from 'zustand/middleware'

const useStore = create(
  devtools((set) => ({
    score: 0,
    // ...
  }))
)

// Network tab in Chrome DevTools
// See WebSocket messages
```

### Backend Debugging
```javascript
// CloudWatch Logs
// AWS Console → CloudWatch → Log Groups

// Local testing with SAM
sam local invoke RoomManagerFunction -e events/join-room.json

// Add logging
console.log('Player joined:', { roomId, playerId })

// X-Ray tracing (advanced)
// See exactly where time is spent
```

---

## 💡 Pro Tips

### 1. Start Simple
Don't try to build everything at once. Build in this order:
1. ✅ Basic room (create + join)
2. ✅ WebSocket connection
3. ✅ One match event (goal)
4. ✅ One mini-game (prediction)
5. ✅ Polish

### 2. Test Early, Test Often
```bash
# Frontend
npm run dev  # Check it works in browser

# Backend
sam local invoke  # Test Lambda before deploying

# Integration
Open 2 browser tabs, join same room, see if they sync
```

### 3. Use AI Assistants
```bash
# Ask Claude (me!) or ChatGPT:
"How do I update a DynamoDB item?"
"Why isn't my WebSocket connecting?"
"Help me debug this error: [paste error]"
```

### 4. Read Error Messages
```
❌ "Cannot read property 'score' of undefined"
✅ This means: player object doesn't exist or doesn't have 'score'

❌ "Network request failed"
✅ This means: Check WebSocket URL, check AWS region

❌ "ResourceNotFoundException"
✅ This means: DynamoDB table doesn't exist or wrong name
```

### 5. Use the Free Tier Wisely
```bash
# Check usage
aws cloudwatch get-metric-statistics

# Set billing alerts
# AWS Console → Billing → Budgets
# Create alert at $5, $10
```

---

## 📚 Essential Resources

### Documentation
- **React:** https://react.dev/learn
- **Tailwind:** https://tailwindcss.com/docs
- **AWS Lambda:** https://docs.aws.amazon.com/lambda/
- **DynamoDB:** https://docs.aws.amazon.com/dynamodb/
- **WebSocket API:** https://developer.mozilla.org/en-US/docs/Web/API/WebSocket

### Video Tutorials
- **React Crash Course:** https://www.youtube.com/watch?v=w7ejDZ8SWv8
- **AWS Lambda for Beginners:** https://www.youtube.com/watch?v=eOBq__h4OJ4
- **DynamoDB Tutorial:** https://www.youtube.com/watch?v=2k2GINpO308

### Communities
- **React Discord:** https://discord.com/invite/react
- **AWS Reddit:** https://reddit.com/r/aws
- **Stack Overflow:** Tag questions with [react] [aws-lambda] [dynamodb]

---

## 🎯 Quick Reference Cheat Sheet

### Common Commands
```bash
# Frontend
npm run dev           # Start dev server
npm run build         # Build for production
npm run preview       # Preview production build

# Backend
sam build             # Compile Lambda functions
sam local start-api   # Run API locally
sam deploy            # Deploy to AWS
sam logs              # View CloudWatch logs

# AWS CLI
aws s3 ls             # List S3 buckets
aws dynamodb scan --table-name Rooms  # View table data
aws lambda list-functions  # List Lambda functions

# Git
git add .             # Stage all changes
git commit -m "msg"   # Save changes
git push              # Upload to GitHub
```

### Common Errors & Fixes

**Error:** "Module not found"
```bash
# Fix: Install the package
npm install [package-name]
```

**Error:** "Port 5173 already in use"
```bash
# Fix: Kill the process
# Mac/Linux: lsof -ti:5173 | xargs kill -9
# Windows: netstat -ano | findstr :5173 (then TaskManager → kill PID)
```

**Error:** "Unable to connect to WebSocket"
```bash
# Fix: Check API Gateway URL
# Make sure it starts with wss:// not ws://
# Check AWS region matches your deployment
```

**Error:** "Access Denied" in AWS
```bash
# Fix: Check IAM permissions
aws iam get-user  # Check current user
# Add policies in AWS Console → IAM
```

---

## 🏆 Success Checklist

Before you present, make sure:

- [ ] App runs on your laptop
- [ ] App works on phone (mobile browser)
- [ ] 2+ players can join same room
- [ ] Match events broadcast to all
- [ ] At least 1 mini-game works
- [ ] Leaderboard updates
- [ ] Basic animations/celebrations work
- [ ] Demo video recorded (2-3 min)
- [ ] GitHub repo is public
- [ ] README has setup instructions
- [ ] Costs are under $10
- [ ] You can explain the tech stack

---

## 🎓 Conclusion

You now have:
- ✅ Complete understanding of every technology
- ✅ Step-by-step setup guide
- ✅ 4-day learning plan
- ✅ Debugging tools
- ✅ Resource links

**Remember:**
1. Start simple, add complexity gradually
2. Test early and often
3. Ask for help when stuck (Discord, Stack Overflow, Claude)
4. Focus on making it work first, pretty second
5. Have fun!

**You got this! 🚀**

---

**Document Version:** 1.0  
**Last Updated:** May 22, 2026  
**Questions?** Ask in comments or create GitHub issue!
