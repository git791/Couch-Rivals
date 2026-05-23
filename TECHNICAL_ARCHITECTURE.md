# Technical Architecture Document
## Couch Rivals: Bundesliga Real-Time Social Match Experience

---

### 📋 Document Information
- **Project:** Couch Rivals
- **Version:** 1.0
- **Date:** May 22, 2026
- **Author:** Technical Team

---

## 🎯 Architecture Overview

### System Purpose
Build a real-time, multiplayer web application that synchronizes match events and mini-games across multiple clients with sub-200ms latency using serverless AWS infrastructure.

### Core Requirements
1. **Real-time Communication:** WebSocket connections for bi-directional data flow
2. **Scalability:** Support 100+ concurrent rooms (800 players)
3. **Low Latency:** < 200ms event propagation
4. **Cost Efficiency:** Stay within AWS Free Tier limits
5. **High Availability:** 99.9% uptime during matches
6. **Mobile Performance:** 60fps on mid-range devices

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Browser    │  │   Mobile     │  │   Tablet     │      │
│  │  (Desktop)   │  │   Safari     │  │   Chrome     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │               │
│         └──────────────────┴──────────────────┘               │
│                            │                                  │
│                    WebSocket (WSS)                           │
└────────────────────────────┼────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────┐
│                      AWS CLOUD                               │
│                            │                                  │
│         ┌──────────────────▼──────────────────┐             │
│         │   API Gateway (WebSocket API)       │             │
│         │  - Connection Management            │             │
│         │  - Route Handling                   │             │
│         │  - Authorization                    │             │
│         └──────┬─────────────────┬────────────┘             │
│                │                 │                            │
│     ┌──────────▼─────┐  ┌───────▼──────────┐               │
│     │  Lambda Layer  │  │  Lambda Layer    │               │
│     │  (Connect)     │  │  (Disconnect)    │               │
│     └────────────────┘  └──────────────────┘               │
│                │                                              │
│     ┌──────────▼─────────────────────────┐                 │
│     │      Lambda Functions Layer        │                 │
│     │  ┌──────────┐  ┌──────────────┐   │                 │
│     │  │  Room    │  │  Event       │   │                 │
│     │  │ Manager  │  │ Broadcaster  │   │                 │
│     │  └──────────┘  └──────────────┘   │                 │
│     │  ┌──────────┐  ┌──────────────┐   │                 │
│     │  │  Game    │  │  Scoring     │   │                 │
│     │  │ Handler  │  │  Engine      │   │                 │
│     │  └──────────┘  └──────────────┘   │                 │
│     └──────┬───────────────┬─────────────┘                 │
│            │               │                                 │
│   ┌────────▼──────┐  ┌────▼──────────────┐                │
│   │   DynamoDB    │  │   EventBridge     │                │
│   │  - Rooms      │  │  - Match Events   │                │
│   │  - Players    │  │  - Schedulers     │                │
│   │  - Scores     │  │                   │                │
│   │  - Connections│  │                   │                │
│   └───────────────┘  └───────────────────┘                │
│                                                              │
│   ┌────────────────────────────────────────┐               │
│   │              S3 Bucket                 │               │
│   │  - Match Data (JSON)                   │               │
│   │  - Static Assets                       │               │
│   │  - Event Sequences                     │               │
│   └────────────────────────────────────────┘               │
└──────────────────────────────────────────────────────────┘
```

---

## 🔧 Component Details

### 1. Frontend Layer (React + WebSocket Client)

#### Technology Stack
```javascript
{
  "framework": "React 18",
  "styling": "Tailwind CSS + Framer Motion",
  "state": "Zustand (lightweight state management)",
  "websocket": "Native WebSocket API",
  "animations": "Framer Motion + GSAP",
  "build": "Vite (fast dev server)",
  "hosting": "Claude Artifacts (for demo) / S3 + CloudFront (production)"
}
```

#### Key Components

**WebSocket Manager (`websocket.js`)**
```javascript
// Handles connection lifecycle
class WebSocketManager {
  constructor(roomId, playerId) {
    this.url = 'wss://your-api-id.execute-api.region.amazonaws.com/prod'
    this.roomId = roomId
    this.playerId = playerId
    this.ws = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
  }

  connect() {
    this.ws = new WebSocket(this.url)
    
    this.ws.onopen = () => {
      console.log('Connected to match server')
      this.send({ action: 'joinRoom', roomId: this.roomId, playerId: this.playerId })
    }

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      this.handleMessage(data)
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    this.ws.onclose = () => {
      console.log('Disconnected from match server')
      this.attemptReconnect()
    }
  }

  handleMessage(data) {
    switch(data.type) {
      case 'matchEvent':
        eventBus.emit('matchEvent', data.payload)
        break
      case 'gameStart':
        eventBus.emit('gameStart', data.payload)
        break
      case 'scoreUpdate':
        eventBus.emit('scoreUpdate', data.payload)
        break
      case 'leaderboardUpdate':
        eventBus.emit('leaderboardUpdate', data.payload)
        break
    }
  }

  send(data) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++
        this.connect()
      }, 1000 * Math.pow(2, this.reconnectAttempts)) // Exponential backoff
    }
  }
}
```

**State Management (`store.js`)**
```javascript
import create from 'zustand'

export const useGameStore = create((set) => ({
  // Room state
  roomId: null,
  players: [],
  
  // Match state
  matchTime: 0,
  score: { home: 0, away: 0 },
  events: [],
  
  // Game state
  activeGame: null, // 'prediction' | 'momentum' | null
  playerScore: 0,
  leaderboard: [],
  
  // Actions
  setRoomId: (id) => set({ roomId: id }),
  addPlayer: (player) => set((state) => ({ 
    players: [...state.players, player] 
  })),
  updateScore: (newScore) => set({ score: newScore }),
  setActiveGame: (game) => set({ activeGame: game }),
  updateLeaderboard: (leaderboard) => set({ leaderboard }),
}))
```

**Component Structure**
```
src/
├── components/
│   ├── MatchView/
│   │   ├── MatchClock.jsx
│   │   ├── ScoreBoard.jsx
│   │   ├── EventFeed.jsx
│   │   └── MatchVisualization.jsx
│   ├── Games/
│   │   ├── PredictionBattle.jsx
│   │   ├── MomentumWars.jsx
│   │   └── GameOverlay.jsx
│   ├── Leaderboard/
│   │   ├── LiveLeaderboard.jsx
│   │   ├── PlayerCard.jsx
│   │   └── RankAnimation.jsx
│   ├── Room/
│   │   ├── RoomLobby.jsx
│   │   ├── PlayerList.jsx
│   │   └── ShareModal.jsx
│   └── Effects/
│       ├── Confetti.jsx
│       ├── ScreenShake.jsx
│       └── CelebrationOverlay.jsx
├── hooks/
│   ├── useWebSocket.js
│   ├── useMatchEvents.js
│   └── useGameLogic.js
├── utils/
│   ├── websocket.js
│   ├── eventBus.js
│   └── animations.js
└── store/
    └── gameStore.js
```

#### Performance Optimizations

**1. Optimistic UI Updates**
```javascript
// Update UI immediately, reconcile with server later
const submitPrediction = (prediction) => {
  // Immediate visual feedback
  setLocalPrediction(prediction)
  setPredictionLocked(true)
  
  // Send to server
  ws.send({ action: 'submitPrediction', prediction })
  
  // Server will confirm/correct later
}
```

**2. Virtual Scrolling for Event Feed**
```javascript
// Only render visible events
import { useVirtualizer } from '@tanstack/react-virtual'

const EventFeed = ({ events }) => {
  const parentRef = useRef()
  
  const virtualizer = useVirtualizer({
    count: events.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
  })
  
  // Render only visible items
}
```

**3. Debounced Tap Counting**
```javascript
// Prevent spam, batch updates
let tapBuffer = 0
let lastSentTime = Date.now()

const handleTap = () => {
  tapBuffer++
  
  // Send every 100ms max
  if (Date.now() - lastSentTime > 100) {
    ws.send({ action: 'recordTaps', count: tapBuffer })
    tapBuffer = 0
    lastSentTime = Date.now()
  }
}
```

---

### 2. API Gateway (WebSocket API)

#### Configuration

**WebSocket Routes**
```yaml
Routes:
  $connect:
    handler: connectHandler
    description: Initial connection establishment
    
  $disconnect:
    handler: disconnectHandler
    description: Cleanup on disconnect
    
  $default:
    handler: defaultHandler
    description: Handle unknown routes
    
  joinRoom:
    handler: joinRoomHandler
    description: Player joins a match room
    
  createRoom:
    handler: createRoomHandler
    description: Host creates a new room
    
  submitPrediction:
    handler: predictionHandler
    description: Player submits prediction
    
  recordTaps:
    handler: tapHandler
    description: Record momentum taps
    
  sendReaction:
    handler: reactionHandler
    description: Send emoji reaction
```

**Connection Management**
```javascript
// Store connection IDs in DynamoDB
const connectHandler = async (event) => {
  const connectionId = event.requestContext.connectionId
  
  await dynamoDB.put({
    TableName: 'Connections',
    Item: {
      connectionId,
      timestamp: Date.now(),
      ttl: Math.floor(Date.now() / 1000) + 7200 // 2 hours
    }
  })
  
  return { statusCode: 200, body: 'Connected' }
}

const disconnectHandler = async (event) => {
  const connectionId = event.requestContext.connectionId
  
  // Remove from connections table
  await dynamoDB.delete({
    TableName: 'Connections',
    Key: { connectionId }
  })
  
  // Remove from any active rooms
  await removePlayerFromRooms(connectionId)
  
  return { statusCode: 200, body: 'Disconnected' }
}
```

**Broadcasting to Connections**
```javascript
const broadcastToRoom = async (roomId, message) => {
  // Get all connections in room
  const players = await getPlayersInRoom(roomId)
  
  const apiGatewayManagementApi = new AWS.ApiGatewayManagementApi({
    endpoint: process.env.WEBSOCKET_ENDPOINT
  })
  
  // Send to all connected clients
  const sendPromises = players.map(async (player) => {
    try {
      await apiGatewayManagementApi.postToConnection({
        ConnectionId: player.connectionId,
        Data: JSON.stringify(message)
      }).promise()
    } catch (error) {
      if (error.statusCode === 410) {
        // Connection is stale, remove it
        await removeConnection(player.connectionId)
      }
    }
  })
  
  await Promise.all(sendPromises)
}
```

---

### 3. Lambda Functions Layer

#### Function Definitions

**1. Room Manager (`roomManager.js`)**
```javascript
// Creates and manages match rooms

exports.createRoom = async (event) => {
  const { matchId, playerId, playerName, team } = JSON.parse(event.body)
  
  const roomId = generateRoomCode() // e.g., "FCB-4782"
  const connectionId = event.requestContext.connectionId
  
  const room = {
    roomId,
    matchId,
    hostId: playerId,
    createdAt: Date.now(),
    status: 'waiting', // waiting | active | finished
    players: [{
      playerId,
      playerName,
      connectionId,
      team,
      score: 0,
      joinedAt: Date.now()
    }],
    ttl: Math.floor(Date.now() / 1000) + 7200 // 2 hours
  }
  
  await dynamoDB.put({
    TableName: 'Rooms',
    Item: room
  })
  
  return {
    statusCode: 200,
    body: JSON.stringify({ roomId, room })
  }
}

exports.joinRoom = async (event) => {
  const { roomId, playerId, playerName, team } = JSON.parse(event.body)
  const connectionId = event.requestContext.connectionId
  
  // Get room
  const room = await dynamoDB.get({
    TableName: 'Rooms',
    Key: { roomId }
  })
  
  if (!room.Item) {
    return { statusCode: 404, body: 'Room not found' }
  }
  
  if (room.Item.players.length >= 8) {
    return { statusCode: 400, body: 'Room is full' }
  }
  
  // Add player
  const newPlayer = {
    playerId,
    playerName,
    connectionId,
    team,
    score: 0,
    joinedAt: Date.now()
  }
  
  await dynamoDB.update({
    TableName: 'Rooms',
    Key: { roomId },
    UpdateExpression: 'SET players = list_append(players, :player)',
    ExpressionAttributeValues: {
      ':player': [newPlayer]
    }
  })
  
  // Broadcast to all players
  await broadcastToRoom(roomId, {
    type: 'playerJoined',
    payload: newPlayer
  })
  
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, room: room.Item })
  }
}

const generateRoomCode = () => {
  const teams = ['FCB', 'BVB', 'RBL', 'B04', 'SGE']
  const team = teams[Math.floor(Math.random() * teams.length)]
  const number = Math.floor(1000 + Math.random() * 9000)
  return `${team}-${number}`
}
```

**2. Event Broadcaster (`eventBroadcaster.js`)**
```javascript
// Handles match events and distributes to rooms

exports.broadcastMatchEvent = async (event) => {
  const matchEvent = JSON.parse(event.body)
  
  // Get all active rooms for this match
  const rooms = await dynamoDB.query({
    TableName: 'Rooms',
    IndexName: 'MatchIdIndex',
    KeyConditionExpression: 'matchId = :matchId AND #status = :status',
    ExpressionAttributeNames: {
      '#status': 'status'
    },
    ExpressionAttributeValues: {
      ':matchId': matchEvent.matchId,
      ':status': 'active'
    }
  })
  
  // Broadcast to all rooms
  const broadcastPromises = rooms.Items.map(room => 
    broadcastToRoom(room.roomId, {
      type: 'matchEvent',
      payload: matchEvent
    })
  )
  
  await Promise.all(broadcastPromises)
  
  // Trigger mini-games if applicable
  if (shouldTriggerGame(matchEvent)) {
    await triggerMiniGame(matchEvent, rooms.Items)
  }
  
  return { statusCode: 200, body: 'Event broadcasted' }
}

const shouldTriggerGame = (event) => {
  // Prediction: Every 5 minutes
  // Momentum: On attacking phases
  
  if (event.eventType === 'attackingThird') {
    return 'momentum'
  }
  
  if (event.matchMinute % 5 === 0 && event.eventType === 'clock') {
    return 'prediction'
  }
  
  return null
}

const triggerMiniGame = async (matchEvent, rooms) => {
  const gameType = shouldTriggerGame(matchEvent)
  
  if (!gameType) return
  
  const gameData = generateGameData(gameType, matchEvent)
  
  const promises = rooms.map(room =>
    broadcastToRoom(room.roomId, {
      type: 'gameStart',
      payload: gameData
    })
  )
  
  await Promise.all(promises)
}
```

**3. Game Handler (`gameHandler.js`)**
```javascript
// Processes mini-game interactions

exports.handlePrediction = async (event) => {
  const { roomId, playerId, prediction, gameId } = JSON.parse(event.body)
  
  // Store prediction
  await dynamoDB.put({
    TableName: 'Predictions',
    Item: {
      gameId,
      playerId,
      prediction,
      timestamp: Date.now(),
      resolved: false
    }
  })
  
  // Acknowledge
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  }
}

exports.resolvePrediction = async (event) => {
  const { gameId, result } = JSON.parse(event.body)
  
  // Get all predictions for this game
  const predictions = await dynamoDB.query({
    TableName: 'Predictions',
    KeyConditionExpression: 'gameId = :gameId',
    ExpressionAttributeValues: {
      ':gameId': gameId
    }
  })
  
  // Calculate winners
  const updates = predictions.Items.map(async (pred) => {
    const correct = pred.prediction === result
    const pointsAwarded = correct ? 100 : -25
    
    // Update player score
    await updatePlayerScore(pred.playerId, pred.roomId, pointsAwarded)
    
    return { playerId: pred.playerId, correct, pointsAwarded }
  })
  
  const results = await Promise.all(updates)
  
  // Get updated leaderboard
  const leaderboard = await getLeaderboard(predictions.Items[0].roomId)
  
  // Broadcast results
  await broadcastToRoom(predictions.Items[0].roomId, {
    type: 'predictionResults',
    payload: { results, leaderboard }
  })
  
  return { statusCode: 200, body: 'Predictions resolved' }
}

exports.handleTaps = async (event) => {
  const { roomId, playerId, tapCount, gameId } = JSON.parse(event.body)
  
  // Update tap count
  await dynamoDB.update({
    TableName: 'MomentumGames',
    Key: { gameId, playerId },
    UpdateExpression: 'ADD tapCount :count',
    ExpressionAttributeValues: {
      ':count': tapCount
    }
  })
  
  // Award points (1 point per tap)
  await updatePlayerScore(playerId, roomId, tapCount)
  
  return { statusCode: 200, body: 'Taps recorded' }
}
```

**4. Scoring Engine (`scoringEngine.js`)**
```javascript
// Manages player scores and leaderboard

exports.updatePlayerScore = async (playerId, roomId, points) => {
  await dynamoDB.update({
    TableName: 'Rooms',
    Key: { roomId },
    UpdateExpression: 'SET players[playerIdx].score = players[playerIdx].score + :points',
    // Note: Actual implementation needs to find player index first
    ExpressionAttributeValues: {
      ':points': points
    }
  })
  
  // Get updated leaderboard
  const leaderboard = await getLeaderboard(roomId)
  
  // Broadcast update
  await broadcastToRoom(roomId, {
    type: 'scoreUpdate',
    payload: { playerId, points, leaderboard }
  })
}

exports.getLeaderboard = async (roomId) => {
  const room = await dynamoDB.get({
    TableName: 'Rooms',
    Key: { roomId }
  })
  
  // Sort players by score
  const sorted = room.Item.players
    .sort((a, b) => b.score - a.score)
    .map((player, index) => ({
      rank: index + 1,
      playerId: player.playerId,
      playerName: player.playerName,
      score: player.score,
      team: player.team
    }))
  
  return sorted
}
```

---

### 4. DynamoDB Schema

#### Table Definitions

**Rooms Table**
```javascript
{
  TableName: 'Rooms',
  KeySchema: [
    { AttributeName: 'roomId', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'roomId', AttributeType: 'S' },
    { AttributeName: 'matchId', AttributeType: 'S' },
    { AttributeName: 'status', AttributeType: 'S' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'MatchIdIndex',
      KeySchema: [
        { AttributeName: 'matchId', KeyType: 'HASH' },
        { AttributeName: 'status', KeyType: 'RANGE' }
      ],
      Projection: { ProjectionType: 'ALL' }
    }
  ],
  BillingMode: 'PAY_PER_REQUEST', // On-demand for flexibility
  TimeToLiveSpecification: {
    Enabled: true,
    AttributeName: 'ttl'
  }
}

// Example Item:
{
  "roomId": "FCB-4782",
  "matchId": "match_001",
  "hostId": "player_123",
  "status": "active",
  "createdAt": 1716422400000,
  "players": [
    {
      "playerId": "player_123",
      "playerName": "SamTheMan",
      "connectionId": "abc123==",
      "team": "bayern",
      "score": 450,
      "joinedAt": 1716422400000
    }
  ],
  "ttl": 1716429600
}
```

**Connections Table**
```javascript
{
  TableName: 'Connections',
  KeySchema: [
    { AttributeName: 'connectionId', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'connectionId', AttributeType: 'S' }
  ],
  BillingMode: 'PAY_PER_REQUEST',
  TimeToLiveSpecification: {
    Enabled: true,
    AttributeName: 'ttl'
  }
}

// Example Item:
{
  "connectionId": "abc123==",
  "roomId": "FCB-4782",
  "playerId": "player_123",
  "timestamp": 1716422400000,
  "ttl": 1716429600
}
```

**Predictions Table**
```javascript
{
  TableName: 'Predictions',
  KeySchema: [
    { AttributeName: 'gameId', KeyType: 'HASH' },
    { AttributeName: 'playerId', KeyType: 'RANGE' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'gameId', AttributeType: 'S' },
    { AttributeName: 'playerId', AttributeType: 'S' }
  ],
  BillingMode: 'PAY_PER_REQUEST',
  TimeToLiveSpecification: {
    Enabled: true,
    AttributeName: 'ttl'
  }
}

// Example Item:
{
  "gameId": "pred_001",
  "playerId": "player_123",
  "roomId": "FCB-4782",
  "prediction": "yes",
  "timestamp": 1716422400000,
  "resolved": false,
  "result": null,
  "pointsAwarded": null,
  "ttl": 1716429600
}
```

**MomentumGames Table**
```javascript
{
  TableName: 'MomentumGames',
  KeySchema: [
    { AttributeName: 'gameId', KeyType: 'HASH' },
    { AttributeName: 'playerId', KeyType: 'RANGE' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'gameId', AttributeType: 'S' },
    { AttributeName: 'playerId', AttributeType: 'S' }
  ],
  BillingMode: 'PAY_PER_REQUEST'
}

// Example Item:
{
  "gameId": "momentum_001",
  "playerId": "player_123",
  "roomId": "FCB-4782",
  "tapCount": 87,
  "startTime": 1716422400000,
  "endTime": 1716422430000
}
```

---

### 5. EventBridge (Match Simulation)

#### Event Scheduling

**Match Event Sequencer**
```javascript
// Lambda function triggered by EventBridge

exports.handler = async (event) => {
  // Load match data from S3
  const matchData = await s3.getObject({
    Bucket: 'couch-rivals-data',
    Key: 'matches/match_001.json'
  }).promise()
  
  const match = JSON.parse(matchData.Body.toString())
  
  // Get current match minute from state
  const state = await getMatchState(match.matchId)
  let currentMinute = state.currentMinute || 0
  
  // Get events for this minute
  const events = match.events.filter(e => e.minute === currentMinute)
  
  // Broadcast each event
  for (const event of events) {
    await broadcastMatchEvent({
      matchId: match.matchId,
      eventType: event.type,
      matchMinute: currentMinute,
      data: event.data
    })
    
    // Wait between events (simulate real-time)
    await sleep(event.delay || 1000)
  }
  
  // Update state
  currentMinute++
  await updateMatchState(match.matchId, currentMinute)
  
  // Schedule next minute
  if (currentMinute < 90) {
    await scheduleNextMinute(match.matchId, currentMinute)
  } else {
    await endMatch(match.matchId)
  }
}

const scheduleNextMinute = async (matchId, minute) => {
  await eventBridge.putEvents({
    Entries: [{
      Source: 'couch-rivals.match-engine',
      DetailType: 'MatchMinuteProgress',
      Detail: JSON.stringify({ matchId, minute }),
      Time: new Date(Date.now() + 60000) // 1 minute from now
    }]
  }).promise()
}
```

**Match Data Format (JSON)**
```json
{
  "matchId": "match_001",
  "homeTeam": "Bayern Munich",
  "awayTeam": "Borussia Dortmund",
  "date": "2024-05-18",
  "events": [
    {
      "minute": 0,
      "type": "kickoff",
      "delay": 0
    },
    {
      "minute": 12,
      "type": "attackingThird",
      "team": "home",
      "delay": 2000,
      "data": {
        "player": "Sané",
        "zone": "right"
      }
    },
    {
      "minute": 23,
      "type": "goal",
      "team": "home",
      "delay": 5000,
      "data": {
        "scorer": "Harry Kane",
        "assist": "Sané",
        "type": "header",
        "distance": 6
      }
    },
    {
      "minute": 45,
      "type": "halftime",
      "delay": 0
    },
    {
      "minute": 78,
      "type": "goal",
      "team": "away",
      "delay": 4000,
      "data": {
        "scorer": "Füllkrug",
        "assist": "Adeyemi",
        "type": "shot",
        "distance": 18
      }
    },
    {
      "minute": 90,
      "type": "fulltime",
      "delay": 0,
      "data": {
        "finalScore": { "home": 3, "away": 2 }
      }
    }
  ]
}
```

---

### 6. S3 Storage

#### Bucket Structure
```
couch-rivals-data/
├── matches/
│   ├── match_001.json
│   ├── match_002.json
│   └── match_003.json
├── teams/
│   ├── bayern.json
│   ├── dortmund.json
│   └── ...
└── assets/
    ├── logos/
    │   ├── bayern.png
    │   ├── dortmund.png
    │   └── ...
    └── celebrations/
        ├── confetti.json
        └── fireworks.json
```

#### S3 Configuration
```javascript
{
  BucketName: 'couch-rivals-data',
  Region: 'eu-central-1', // Frankfurt (close to Bundesliga)
  PublicAccessBlock: {
    BlockPublicAcls: false,
    IgnorePublicAcls: false,
    BlockPublicPolicy: false,
    RestrictPublicBuckets: false
  },
  CorsConfiguration: {
    CorsRules: [{
      AllowedOrigins: ['*'],
      AllowedMethods: ['GET'],
      AllowedHeaders: ['*'],
      MaxAgeSeconds: 3600
    }]
  },
  LifecycleConfiguration: {
    Rules: [{
      Id: 'DeleteOldMatches',
      Status: 'Enabled',
      Expiration: { Days: 30 }
    }]
  }
}
```

---

## 🔐 Security Architecture

### Authentication & Authorization

**No Traditional Auth (MVP)**
- Nickname-based identification
- No passwords, no email
- ConnectionId serves as session token

**Future Enhancement:**
```javascript
// Cognito User Pools for proper auth
const authConfig = {
  userPoolId: 'eu-central-1_xxxxx',
  clientId: 'xxxxxxxxxxxxx',
  identityPoolId: 'eu-central-1:xxxx-xxxx'
}
```

### Rate Limiting

**API Gateway Throttling**
```javascript
{
  RouteSettings: {
    'joinRoom': {
      ThrottlingBurstLimit: 100,
      ThrottlingRateLimit: 50
    },
    'recordTaps': {
      ThrottlingBurstLimit: 500,
      ThrottlingRateLimit: 200
    }
  }
}
```

**DDoS Protection**
- AWS Shield Standard (free)
- CloudFront with WAF (optional)

### Data Validation

**Input Sanitization**
```javascript
const sanitizeInput = (input) => {
  // Remove dangerous characters
  return input
    .replace(/[<>\"']/g, '')
    .trim()
    .slice(0, 50) // Max length
}

const validateRoomJoin = (data) => {
  if (!data.roomId || !data.playerId || !data.playerName) {
    throw new Error('Missing required fields')
  }
  
  if (!/^[A-Z]{3}-\d{4}$/.test(data.roomId)) {
    throw new Error('Invalid room code format')
  }
  
  if (data.playerName.length > 20) {
    throw new Error('Player name too long')
  }
  
  return {
    roomId: sanitizeInput(data.roomId),
    playerId: sanitizeInput(data.playerId),
    playerName: sanitizeInput(data.playerName)
  }
}
```

---

## 📊 Monitoring & Observability

### CloudWatch Metrics

**Custom Metrics**
```javascript
const publishMetric = async (metricName, value) => {
  await cloudwatch.putMetricData({
    Namespace: 'CouchRivals',
    MetricData: [{
      MetricName: metricName,
      Value: value,
      Unit: 'Count',
      Timestamp: new Date()
    }]
  }).promise()
}

// Track key events
await publishMetric('RoomsCreated', 1)
await publishMetric('PlayersJoined', 1)
await publishMetric('PredictionsSubmitted', 1)
await publishMetric('WebSocketConnections', 1)
```

**Alarms**
```javascript
{
  AlarmName: 'HighWebSocketErrors',
  MetricName: 'WebSocketErrors',
  Threshold: 10,
  EvaluationPeriods: 2,
  ComparisonOperator: 'GreaterThanThreshold',
  AlarmActions: ['arn:aws:sns:region:account:alerts']
}
```

### Logging Strategy

**Structured Logging**
```javascript
const logger = {
  info: (message, context) => {
    console.log(JSON.stringify({
      level: 'INFO',
      message,
      timestamp: new Date().toISOString(),
      ...context
    }))
  },
  error: (message, error, context) => {
    console.error(JSON.stringify({
      level: 'ERROR',
      message,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      ...context
    }))
  }
}

// Usage
logger.info('Player joined room', { 
  roomId: 'FCB-4782', 
  playerId: 'player_123' 
})
```

**Log Retention**
- Lambda logs: 7 days
- API Gateway logs: 7 days
- Application logs: 30 days

---

## ⚡ Performance Optimization

### Lambda Cold Start Mitigation

**Provisioned Concurrency** (if needed post-MVP)
```javascript
{
  FunctionName: 'eventBroadcaster',
  ProvisionedConcurrentExecutions: 2
}
```

**Function Warming**
```javascript
// EventBridge rule to ping functions every 5 minutes
exports.warmUp = async (event) => {
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return 'Lambda is warm!'
  }
  // Normal execution
}
```

### DynamoDB Optimization

**Single-Table Design Benefits**
- Fewer cross-table queries
- Better read/write efficiency
- Simplified access patterns

**Batch Operations**
```javascript
// Batch get players
const getPlayers = async (playerIds) => {
  const params = {
    RequestItems: {
      'Rooms': {
        Keys: playerIds.map(id => ({ playerId: id }))
      }
    }
  }
  
  return await dynamoDB.batchGet(params).promise()
}
```

### WebSocket Connection Pooling

**Reuse API Gateway Management API Client**
```javascript
let apiGatewayClient = null

const getClient = () => {
  if (!apiGatewayClient) {
    apiGatewayClient = new AWS.ApiGatewayManagementApi({
      endpoint: process.env.WEBSOCKET_ENDPOINT
    })
  }
  return apiGatewayClient
}
```

---

## 🧪 Testing Strategy

### Unit Tests
```javascript
// Jest tests for core logic
describe('Room Manager', () => {
  test('generates valid room codes', () => {
    const code = generateRoomCode()
    expect(code).toMatch(/^[A-Z]{3}-\d{4}$/)
  })
  
  test('prevents duplicate players', async () => {
    const room = await createRoom(...)
    await expect(
      joinRoom(room.roomId, 'player_123', 'Sam')
    ).rejects.toThrow('Player already in room')
  })
})
```

### Integration Tests
```javascript
// Test WebSocket flow
describe('WebSocket Integration', () => {
  test('player can join room and receive events', async () => {
    const ws = new WebSocket(WS_URL)
    
    await waitForConnection(ws)
    
    ws.send(JSON.stringify({
      action: 'joinRoom',
      roomId: 'TEST-1234',
      playerId: 'test_player'
    }))
    
    const response = await waitForMessage(ws)
    expect(response.type).toBe('playerJoined')
  })
})
```

### Load Testing
```bash
# Artillery config
artillery quick --count 100 --num 10 wss://your-api.execute-api.region.amazonaws.com/prod
```

---

## 🚀 Deployment Pipeline

### Infrastructure as Code (AWS SAM)

**template.yaml**
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Globals:
  Function:
    Runtime: nodejs18.x
    Timeout: 30
    MemorySize: 512
    Environment:
      Variables:
        ROOMS_TABLE: !Ref RoomsTable
        CONNECTIONS_TABLE: !Ref ConnectionsTable

Resources:
  WebSocketApi:
    Type: AWS::ApiGatewayV2::Api
    Properties:
      Name: CouchRivalsWebSocket
      ProtocolType: WEBSOCKET
      RouteSelectionExpression: "$request.body.action"
  
  ConnectRoute:
    Type: AWS::ApiGatewayV2::Route
    Properties:
      ApiId: !Ref WebSocketApi
      RouteKey: $connect
      Target: !Sub integrations/${ConnectIntegration}
  
  RoomsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: Rooms
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: roomId
          AttributeType: S
      KeySchema:
        - AttributeName: roomId
          KeyType: HASH
      TimeToLiveSpecification:
        Enabled: true
        AttributeName: ttl
  
  RoomManagerFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/handlers/roomManager/
      Handler: index.handler
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref RoomsTable

Outputs:
  WebSocketURL:
    Description: WebSocket API URL
    Value: !Sub wss://${WebSocketApi}.execute-api.${AWS::Region}.amazonaws.com/prod
```

### Deployment Commands
```bash
# Build
sam build

# Deploy
sam deploy --guided

# Outputs
export WS_URL=$(aws cloudformation describe-stacks \
  --stack-name couch-rivals \
  --query 'Stacks[0].Outputs[?OutputKey==`WebSocketURL`].OutputValue' \
  --output text)
```

---

## 💰 Cost Estimation (AWS Free Tier)

### Expected Usage (100 concurrent rooms, 4 days)

| Service | Usage | Free Tier | Overage Cost | Total |
|---------|-------|-----------|--------------|-------|
| API Gateway (WebSocket) | 10M messages | 1M free | $0.90/M | $8.10 |
| Lambda | 500K invocations | 1M free | $0 | $0 |
| Lambda (duration) | 50K GB-seconds | 400K free | $0 | $0 |
| DynamoDB | 5M read/write | 25 WCU/RCU free | $0 | $0 |
| S3 | 1GB storage | 5GB free | $0 | $0 |
| CloudWatch Logs | 5GB | 5GB free | $0 | $0 |
| Data Transfer | 10GB out | 100GB free | $0 | $0 |
| **TOTAL** | | | | **~$8.10** |

**Optimization Tips:**
- Use batching to reduce API Gateway messages
- Implement connection pooling
- Cache frequently accessed data
- Set aggressive TTLs on DynamoDB items

---

## 🔄 Scalability Considerations

### Horizontal Scaling
- Lambda auto-scales to 1000 concurrent executions
- DynamoDB on-demand scales automatically
- API Gateway handles 10,000 connections/second

### Bottlenecks & Solutions

**1. WebSocket Broadcasting**
- **Problem:** Broadcasting to 800+ connections is slow
- **Solution:** Fan-out pattern with SQS + parallel Lambdas

**2. DynamoDB Hot Partition**
- **Problem:** All reads/writes to same room
- **Solution:** Partition by room + player for better distribution

**3. Lambda Throttling**
- **Problem:** Too many concurrent invocations
- **Solution:** Reserved concurrency + SQS buffering

### Global Scaling (Future)
```javascript
// Multi-region setup
const regions = ['eu-central-1', 'us-east-1', 'ap-southeast-1']

// Route users to nearest region
const getNearestRegion = (lat, lon) => {
  // Geo-routing logic
}
```

---

## 📱 Mobile Considerations

### Progressive Web App (PWA)
```json
// manifest.json
{
  "name": "Couch Rivals",
  "short_name": "CouchRivals",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a1a1a",
  "theme_color": "#ff0050",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

### Service Worker
```javascript
// Cache match data for offline support
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/matches/')) {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    )
  }
})
```

### Touch Optimizations
```css
/* Prevent zoom on double-tap */
button {
  touch-action: manipulation;
}

/* Large tap targets */
.game-button {
  min-height: 48px;
  min-width: 48px;
}
```

---

## 🐛 Error Handling & Recovery

### Client-Side Error Handling
```javascript
class ResilientWebSocket {
  constructor(url) {
    this.url = url
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.messageQueue = []
  }
  
  connect() {
    this.ws = new WebSocket(this.url)
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      this.handleError(error)
    }
    
    this.ws.onclose = () => {
      this.attemptReconnect()
    }
    
    this.ws.onopen = () => {
      this.reconnectAttempts = 0
      this.flushQueue()
    }
  }
  
  send(data) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    } else {
      // Queue message for later
      this.messageQueue.push(data)
    }
  }
  
  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
      setTimeout(() => {
        this.reconnectAttempts++
        this.connect()
      }, delay)
    } else {
      // Show error to user
      this.onMaxRetriesReached()
    }
  }
  
  flushQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      this.send(message)
    }
  }
}
```

### Server-Side Error Handling
```javascript
exports.handler = async (event) => {
  try {
    // Main logic
    return { statusCode: 200, body: 'Success' }
  } catch (error) {
    logger.error('Handler failed', error, { event })
    
    // Notify monitoring
    await publishMetric('HandlerErrors', 1)
    
    // Return graceful error
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        requestId: event.requestContext.requestId
      })
    }
  }
}
```

---

## 📚 Documentation & Code Comments

### API Documentation (OpenAPI)
```yaml
openapi: 3.0.0
info:
  title: Couch Rivals WebSocket API
  version: 1.0.0

paths:
  /:
    get:
      summary: WebSocket connection endpoint
      parameters:
        - name: roomId
          in: query
          schema:
            type: string
            pattern: '^[A-Z]{3}-\d{4}$'
      responses:
        '101':
          description: Switching Protocols (WebSocket upgrade)
```

### Code Documentation Standards
```javascript
/**
 * Creates a new match room
 * 
 * @param {Object} params - Room creation parameters
 * @param {string} params.matchId - ID of the match
 * @param {string} params.playerId - ID of the host player
 * @param {string} params.playerName - Display name of the host
 * @param {string} params.team - Team the host supports ('home' or 'away')
 * 
 * @returns {Promise<Object>} Created room object with roomId
 * 
 * @throws {Error} If matchId is invalid
 * @throws {Error} If playerName exceeds 20 characters
 * 
 * @example
 * const room = await createRoom({
 *   matchId: 'match_001',
 *   playerId: 'player_123',
 *   playerName: 'SamTheMan',
 *   team: 'home'
 * })
 */
async function createRoom({ matchId, playerId, playerName, team }) {
  // Implementation
}
```

---

## 🎓 Conclusion

This architecture provides:
- ✅ **Real-time sync** via WebSockets
- ✅ **Scalability** through serverless patterns
- ✅ **Cost efficiency** staying in Free Tier
- ✅ **Reliability** with error handling & retries
- ✅ **Performance** optimized for mobile
- ✅ **Maintainability** through clean separation of concerns

**Next Steps:**
1. Set up AWS account & Free Tier
2. Deploy SAM template
3. Build React frontend
4. Test with sample match data
5. Polish & demo!

---

**Document Version:** 1.0  
**Last Updated:** May 22, 2026
