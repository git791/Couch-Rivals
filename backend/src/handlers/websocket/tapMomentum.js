import { getItem, putItem } from "../../lib/dynamodb.js";
import { broadcastToRoom } from "../../lib/broadcast.js";

// A simpler atomic approach using UpdateCommand would be better in prod, but putItem works for MVP
export const handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const body = JSON.parse(event.body || "{}");
  const { roomId, taps, team } = body;

  const room = await getItem({ PK: `ROOM#${roomId}`, SK: "METADATA" });
  if (!room) return { statusCode: 400, body: "Room not found" };

  // Anti-cheat: cap max taps per message (e.g. 15 taps per second limit on client)
  const validTaps = Math.min(taps, 20); 

  if (team === 'home') {
    room.homeTaps = (room.homeTaps || 0) + validTaps;
  } else {
    room.awayTaps = (room.awayTaps || 0) + validTaps;
  }

  await putItem(room);

  await broadcastToRoom(roomId, {
    type: "MOMENTUM_UPDATE",
    data: { homeTaps: room.homeTaps, awayTaps: room.awayTaps }
  });

  return { statusCode: 200, body: "Taps recorded" };
};
