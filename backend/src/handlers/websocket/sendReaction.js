import { broadcastToRoom } from "../../lib/broadcast.js";

export const handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const body = JSON.parse(event.body || "{}");
  const { roomId, content } = body;

  const userId = `user_${connectionId.substring(0, 8)}`;

  // Sanitize content (basic)
  const safeContent = content.substring(0, 50).replace(/[<>]/g, "");

  await broadcastToRoom(roomId, {
    type: "REACTION",
    data: { userId, content: safeContent }
  });

  return { statusCode: 200, body: "Reaction sent" };
};
