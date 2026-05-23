import { SchedulerClient, CreateScheduleCommand } from "@aws-sdk/client-scheduler";
import { getItem, putItem } from "../../lib/dynamodb.js";
import { broadcastToRoom } from "../../lib/broadcast.js";

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const matchData = JSON.parse(
  readFileSync(join(__dirname, "../../data/matches/bayern_dortmund.json"), "utf8")
);

const scheduler = new SchedulerClient({});

export const handler = async (event) => {
  const body = JSON.parse(event.body || "{}");
  const { roomId, speed = 1 } = body;

  const room = await getItem({ PK: `ROOM#${roomId}`, SK: "METADATA" });
  if (!room) {
    return { statusCode: 400, body: JSON.stringify({ error: "Room not found" }) };
  }

  const now = new Date();
  
  for (const matchEvent of matchData.events) {
    const delaySeconds = Math.floor(matchEvent.time / speed);
    const fireAt = new Date(now.getTime() + delaySeconds * 1000);
    const scheduleTime = fireAt.toISOString().split(".")[0];

    try {
      await scheduler.send(new CreateScheduleCommand({
        Name: `match-${roomId}-evt-${matchEvent.time}`,
        ScheduleExpression: `at(${scheduleTime})`,
        FlexibleTimeWindow: { Mode: "OFF" },
        Target: {
          Arn: process.env.PROCESS_EVENT_FUNCTION_ARN,
          RoleArn: process.env.SCHEDULER_ROLE_ARN,
          Input: JSON.stringify({ roomId, event: matchEvent }),
        },
        ActionAfterCompletion: "DELETE",
      }));
    } catch (e) {
      console.error("Scheduler error:", e);
    }
  }

  room.status = "LIVE";
  room.GSI1PK = "STATUS#LIVE";
  room.startedAt = Date.now();
  await putItem(room);

  await broadcastToRoom(roomId, {
    type: "MATCH_STARTED",
    data: { roomId, speed }
  });

  return { statusCode: 200, body: "Match started" };
};
