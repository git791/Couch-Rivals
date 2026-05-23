# Couch Rivals 🏆

**Submission for the AWS Innovation Cup by Adidas, Bundesliga & AWS**  
**Track:** Advanced Level (L300) - A Real Time Social Match Experience  

---

## 👥 Team Members
- **Mohammed Ayaan Adil Ahmed** (Team Lead)
- **Bi Bi Sufiya Shariff**

---

## 🎯 Problem Statement & Alignment

**The Challenge:** Design and build a real‑time, social fan experience that brings groups of fans together around a live (or simulated‑live) football match. Using live match data as your heartbeat, create a multiplayer experience where what happens on the pitch directly shapes what happens in the app — where fans interact with each other, not just the screen.

**Our Solution (Couch Rivals):** We built a highly interactive, multiplayer second-screen experience. Instead of just passively watching a broadcast, fans join "Rooms" where they pick a side (e.g., FC Bayern Munich vs. Borussia Dortmund). The live match heartbeat directly drives dynamic UI changes, interactive mini-games, and a live competitive leaderboard.

### Key Gamification Features:
1. **Live Pulse Predictions:** When the heartbeat data indicates a Foul or Corner, the app dynamically generates a context-aware quiz (e.g., "Will there be a yellow card?").
2. **Momentum Wars:** During a "Dangerous Attack" event, fans engage in a real-time tug-of-war mini-game by furiously tapping their screens to "boost" their team's momentum.
3. **Team-Based Scoring:** Fans are intrinsically tied to their team's performance on the pitch. A goal awards points to that team's fans, while red cards deduct points.

---

## ☁️ AWS Architecture & Technical POV

Because this was the Advanced Level (L300) track, our goal was to architect a highly scalable, serverless real-time application using AWS infrastructure.

### How it is *Supposed* to Work (Production Architecture):
### Intended Production Architecture:
- **Amazon API Gateway (WebSocket):** Maintains thousands of persistent duplex connections with fans with ultra-low latency.
- **AWS Lambda:** Handles serverless execution for routing messages, joining rooms, processing predictions, and triggering game states.
- **Amazon DynamoDB:** A high-throughput NoSQL database storing volatile state—Room Metadata, Live Leaderboards, and Active Predictions.
- **Amazon EventBridge:** Used as the heartbeat ingestor. Live Bundesliga data feeds into EventBridge, triggering our `processEvent` Lambda to broadcast updates.
- **AWS SAM (Serverless Application Model):** Used as our Infrastructure-as-Code (IaC) framework to rapidly define and provision the API Gateway, Lambdas, and DynamoDB tables.
- **AWS IAM:** Implements strict least-privilege access control, ensuring that specific Lambda functions only have permissions to access required DynamoDB tables and EventBridge streams.
- **Kiro AI Integration (Architecture Design):** We designed the backend to query Kiro's Agentic AI models. In a production environment, Kiro analyzes the live Bundesliga data heartbeat (e.g., historical foul rates, player aggression metrics) to *automatically generate* context-aware, dynamic prediction questions instead of relying on hardcoded quizzes.
- **AWS Amplify:** Used for robust, fully managed frontend deployment, providing seamless CI/CD directly from our code repository.

### Current Implementation:
We successfully deployed the entire architecture to AWS using our personal IAM roles (as the official hackathon sandbox accounts were delayed). 
The backend is currently **live** and fully serverless:
- The **AWS SAM** stack successfully provisioned our API Gateway, DynamoDB tables, and Lambda functions.
- The frontend connects directly to our deployed **AWS WebSocket API**.
- To ensure a fast-paced presentation for the judges, we added optional "Hackathon Demo Overrides" on the frontend to instantly resolve 15-minute prediction windows in 3 seconds, demonstrating the real-time websocket capabilities without making the judges wait.

*(Note: Kiro AI integration is currently configured as an architecture design. We have hardcoded the dynamic prediction generation in our Lambda functions to simulate what Kiro's Agentic AI would return).*

---

## 📱 User POV (The Experience)

1. **Onboarding:** The user lands on a sleek, dynamic UI hosted on AWS Amplify, enters their name, and chooses their allegiance (FCB or BVB).
2. **The Room:** They are placed in a live sync room with their friends. The UI features a pulsing 3D background and an interactive pitch.
3. **The Heartbeat:** As the match progresses, events pop up on the timeline. If a player scores, the screen shakes, confetti rains in the team's colors, and the leaderboard instantly updates.
4. **Interaction:** Users can send live floating emoji reactions across everyone's screens, participate in Momentum Wars, and answer live Kiro-generated predictions.

---

## 🚀 Deployment (AWS Amplify)

To maximize AWS usage and ensure a production-ready, globally distributed frontend, Couch Rivals is designed to be deployed via **AWS Amplify**.

1. Navigate to the AWS Amplify Console.
2. Connect this repository.
3. Point the build settings to the `frontend/` directory.
4. Amplify will automatically build and deploy the application to a global CDN.
5. Provide the generated AWS Amplify URL to fans to instantly join the real-time match!

*(For local testing without AWS, you can still serve the `frontend/` directory using Python's `http.server 3000`)*

---

## ⚖️ Copyright & Legal Disclaimer

**Music Usage (Waka Waka):** 
The background music used in this application (Shakira's *Waka Waka*) is included **strictly for the purpose of this hackathon demo submission**. We do not own the rights to this audio track. 

For any future production deployment or commercial release, we will remove this track entirely and replace it with official, legally licensed background music or integrate a verified audio API.
