import { putItem, getItem } from "../../lib/dynamodb.js";
import { broadcastToRoom } from "../../lib/broadcast.js";

export const handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const body = JSON.parse(event.body || "{}");
  const { roomId, predictionId, answer } = body;

  const conn = await getItem({ PK: `ROOM#${roomId}`, SK: `CONN#${connectionId}` });
  const userId = conn ? conn.userId : `user_${connectionId.substring(0, 8)}`;

  // Ideally, validate prediction expiration time. For now, just record the vote.
  await putItem({
    PK: `ROOM#${roomId}`,
    SK: `VOTE#${predictionId}#${userId}`,
    userId,
    predictionId,
    answer,
    timestamp: Date.now(),
    ttl: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
  });

  // Broadcast vote update (we would normally aggregate this, but for hackathon speed we just notify)
  await broadcastToRoom(roomId, {
    type: "VOTE_UPDATE",
    data: { predictionId, userId, answer }
  });

  return { statusCode: 200, body: "Vote recorded" };
};
