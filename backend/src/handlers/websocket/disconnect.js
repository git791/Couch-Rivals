import { queryItems, deleteItem, putItem } from "../../lib/dynamodb.js";
import { broadcastToRoom } from "../../lib/broadcast.js";

export const handler = async (event) => {
  const connectionId = event.requestContext.connectionId;

  // Find room via GSI1
  const conns = await queryItems({
    IndexName: "GSI1",
    KeyConditionExpression: "GSI1PK = :gsi1pk",
    ExpressionAttributeValues: {
      ":gsi1pk": `CONN#${connectionId}`,
    },
  });

  if (conns && conns.length > 0) {
    const conn = conns[0];
    const roomId = conn.GSI1SK.split("#")[1];
    const userId = conn.userId;

    // Remove connection from room
    await deleteItem({
      PK: `ROOM#${roomId}`,
      SK: `CONN#${connectionId}`,
    });

    // Broadcast player left
    await broadcastToRoom(roomId, {
      type: "PLAYER_LEFT",
      data: { userId },
    });
  }

  // Delete base connection tracking
  await deleteItem({
    PK: `CONN#${connectionId}`,
    SK: `METADATA`,
  });

  return { statusCode: 200, body: "Disconnected" };
};
