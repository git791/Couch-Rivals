import { putItem } from "../../lib/dynamodb.js";
import { TTL_DURATIONS } from "../../lib/constants.js";
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";

const generateRoomCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export const handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const body = JSON.parse(event.body || "{}");
  const displayName = body.displayName || "Host";
  const userId = body.userId || `user_${connectionId.substring(0, 8)}`;

  const roomId = generateRoomCode();
  const ttl = Math.floor(Date.now() / 1000) + TTL_DURATIONS.ROOM;

  // Create room
  await putItem({
    PK: `ROOM#${roomId}`,
    SK: `METADATA`,
    GSI1PK: `STATUS#LOBBY`,
    GSI1SK: `ROOM#${roomId}`,
    hostConnectionId: connectionId,
    hostUserId: userId,
    status: "LOBBY",
    createdAt: Date.now(),
    ttl,
  });

  // Send response directly to the creator
  const endpoint = process.env.WEBSOCKET_ENDPOINT;
  const apiGwClient = new ApiGatewayManagementApiClient({ endpoint: `https://${endpoint}` });

  await apiGwClient.send(new PostToConnectionCommand({
    ConnectionId: connectionId,
    Data: JSON.stringify({
      type: "ROOM_CREATED",
      data: { roomId, displayName }
    }),
  }));

  return { statusCode: 200, body: "Room created" };
};
