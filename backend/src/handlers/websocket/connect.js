import { putItem } from "../../lib/dynamodb.js";
import { TTL_DURATIONS } from "../../lib/constants.js";

export const handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const ttl = Math.floor(Date.now() / 1000) + TTL_DURATIONS.CONNECTION;

  await putItem({
    PK: `CONN#${connectionId}`,
    SK: `METADATA`,
    connectionId,
    connectedAt: Date.now(),
    ttl,
  });

  return { statusCode: 200, body: "Connected" };
};
