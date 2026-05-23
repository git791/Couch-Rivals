import { broadcastToRoom } from "../../lib/broadcast.js";
import { getItem, putItem, deleteItem } from "../../lib/dynamodb.js";
import { resolvePrediction } from "./resolvePrediction.js";

export const handler = async (event) => {
  const { roomId, event: matchEvent } = event;

  // 1. Broadcast the match event to the room
  await broadcastToRoom(roomId, {
    type: "MATCH_EVENT",
    data: matchEvent,
  });

  // 2. Broadcast celebrations for major events
  if (["GOAL", "YELLOW_CARD", "RED_CARD", "SUBSTITUTION"].includes(matchEvent.type)) {
    await broadcastToRoom(roomId, {
      type: "CELEBRATION",
      data: {
        eventType: matchEvent.type,
        team: matchEvent.team,
        player: matchEvent.player,
      },
    });
  }

  // 3. Handle Active Prediction Resolution
  const activePred = await getItem({ PK: `ROOM#${roomId}`, SK: "ACTIVE_PREDICTION" });
  let predictionResolved = false;

  if (activePred) {
    if (activePred.question.includes("yellow card")) {
      if (matchEvent.type === "YELLOW_CARD") {
        const teamName = matchEvent.team === "home" ? "Bayern" : "Dortmund";
        await resolvePrediction(roomId, activePred.id, teamName);
        await deleteItem({ PK: `ROOM#${roomId}`, SK: "ACTIVE_PREDICTION" });
        predictionResolved = true;
      }
    } else if (activePred.question.includes("goal in the next 15 minutes")) {
      if (matchEvent.type === "GOAL") {
        await resolvePrediction(roomId, activePred.id, "Yes");
        await deleteItem({ PK: `ROOM#${roomId}`, SK: "ACTIVE_PREDICTION" });
        predictionResolved = true;
      } else if (matchEvent.time - activePred.generatedAtTime >= 900) {
        // 15 match minutes (900 seconds) have passed without a goal
        await resolvePrediction(roomId, activePred.id, "No");
        await deleteItem({ PK: `ROOM#${roomId}`, SK: "ACTIVE_PREDICTION" });
        predictionResolved = true;
      }
    }
  }

  // 4. Generate New Prediction if there isn't one active
  if (!activePred || predictionResolved) {
    let newPred = null;

    if (matchEvent.type === "FOUL" && Math.random() < 0.4) {
      newPred = {
        id: `pred_card_${matchEvent.time}`,
        question: "Which team will get the next yellow card?",
        options: ["Bayern", "Dortmund", "None"],
        difficulty: 2.0,
        expiresIn: 15,
        generatedAtTime: matchEvent.time
      };
    } else if ((matchEvent.type === "SHOT" || matchEvent.type === "CORNER") && Math.random() < 0.4) {
      newPred = {
        id: `pred_goal_${matchEvent.time}`,
        question: "Will there be another goal in the next 15 minutes?",
        options: ["Yes", "No"],
        difficulty: 1.5,
        expiresIn: 15,
        generatedAtTime: matchEvent.time
      };
    }

    if (newPred) {
      // Save active prediction
      await putItem({
        PK: `ROOM#${roomId}`,
        SK: "ACTIVE_PREDICTION",
        ...newPred,
        ttl: Math.floor(Date.now() / 1000) + 120 // keep it in DB for 2 mins
      });

      // Broadcast new prediction to room
      await broadcastToRoom(roomId, {
        type: "NEW_PREDICTION",
        data: newPred
      });
    }
  }

  return { statusCode: 200, body: "Processed" };
};
