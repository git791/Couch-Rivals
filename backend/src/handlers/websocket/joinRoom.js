import { getItem, putItem, queryItems } from "../../lib/dynamodb.js";
import { broadcastToRoom } from "../../lib/broadcast.js";
import { TTL_DURATIONS } from "../../lib/constants.js";
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";

export const handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const body = JSON.parse(event.body || "{}");
  const { roomId, displayName, team } = body;

  const room = await getItem({ PK: `ROOM#${roomId}`, SK: "METADATA" });
  if (!room) {
    return { statusCode: 400, body: JSON.stringify({ error: "Room not found" }) };
  }

  const existingConns = await queryItems({
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
    ExpressionAttributeValues: { ":pk": `ROOM#${roomId}`, ":prefix": "CONN#" }
  });

  if (existingConns && existingConns.length >= 8) {
    return { statusCode: 400, body: JSON.stringify({ error: "Room is full" }) };
  }

  const userId = body.userId || `user_${connectionId.substring(0, 8)}`;
  const ttl = Math.floor(Date.now() / 1000) + TTL_DURATIONS.ROOM;

  // Add connection to room
  await putItem({
    PK: `ROOM#${roomId}`,
    SK: `CONN#${connectionId}`,
    GSI1PK: `CONN#${connectionId}`,
    GSI1SK: `ROOM#${roomId}`,
    connectionId,
    userId,
    displayName,
    team: team || "home",
    online: true,
    joinedAt: Date.now(),
    ttl
  });

  // Initialize score ONLY if it doesn't already exist
  const existingScore = await getItem({ PK: `ROOM#${roomId}`, SK: `SCORE#${userId}` });
  if (!existingScore) {
    await putItem({
      PK: `ROOM#${roomId}`,
      SK: `SCORE#${userId}`,
      GSI1PK: `LB#${roomId}`,
      GSI1SK: `SCORE#${String(0).padStart(6, "0")}`,
      userId,
      displayName,
      team: team || "home",
      points: 0,
      predictions: 0,
      streak: 0,
      ttl
    });
  }

  await broadcastToRoom(roomId, {
    type: "PLAYER_JOINED",
    data: { userId, displayName, team: team || "home" },
  }, connectionId);
  
  // Get all players and send room state
  const connections = await queryItems({
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
    ExpressionAttributeValues: { ":pk": `ROOM#${roomId}`, ":prefix": "CONN#" },
  });
  
  const players = connections.map(c => ({
    userId: c.userId,
    displayName: c.displayName,
    team: c.team,
    online: c.online
  }));

  const endpoint = process.env.WEBSOCKET_ENDPOINT;
  const apiGwClient = new ApiGatewayManagementApiClient({ endpoint: `https://${endpoint}` });

  await apiGwClient.send(new PostToConnectionCommand({
    ConnectionId: connectionId,
    Data: JSON.stringify({
      type: "ROOM_STATE",
      data: { roomId, status: room.status, players, userId, isHost: room.hostUserId === userId }
    }),
  }));

  return { statusCode: 200, body: "Joined" };
};
