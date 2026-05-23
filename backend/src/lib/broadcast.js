import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";
import { queryItems, deleteItem } from "./dynamodb.js";

const endpoint = process.env.WEBSOCKET_ENDPOINT;
const apiGwClient = new ApiGatewayManagementApiClient({ endpoint: `https://${endpoint}` });

export const broadcastToRoom = async (roomId, message, excludeConnectionId = null) => {
  const connections = await queryItems({
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
    ExpressionAttributeValues: {
      ":pk": `ROOM#${roomId}`,
      ":skPrefix": "CONN#",
    },
  });

  const sendPromises = connections
    .filter(conn => conn.connectionId !== excludeConnectionId)
    .map(async (conn) => {
      try {
        await apiGwClient.send(new PostToConnectionCommand({
          ConnectionId: conn.connectionId,
          Data: JSON.stringify(message),
        }));
      } catch (err) {
        if (err.statusCode === 410 || err.name === "GoneException") {
          console.log(`Stale connection ${conn.connectionId}, removing...`);
          await deleteItem({ PK: `ROOM#${roomId}`, SK: `CONN#${conn.connectionId}` });
        } else {
          console.error(`Failed to send to ${conn.connectionId}:`, err);
        }
      }
    });

  await Promise.all(sendPromises);
};
