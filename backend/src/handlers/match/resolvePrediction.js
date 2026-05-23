import { queryItems, putItem, getItem } from "../../lib/dynamodb.js";
import { broadcastToRoom } from "../../lib/broadcast.js";
import { calculateScore } from "../../lib/predictions.js";

export const resolvePrediction = async (roomId, predictionId, correctAnswer) => {
  // Get all votes for this prediction
  const votes = await queryItems({
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
    ExpressionAttributeValues: {
      ":pk": `ROOM#${roomId}`,
      ":skPrefix": `VOTE#${predictionId}#`
    }
  });

  const results = [];
  const updatedScores = [];

  for (const vote of votes) {
    const userScore = await getItem({ PK: `ROOM#${roomId}`, SK: `SCORE#${vote.userId}` });
    if (!userScore) continue;

    if (vote.answer === correctAnswer) {
      const pointsEarned = calculateScore(5, 1.5, 5, userScore.streak || 0);
      const newTotal = (userScore.points || 0) + pointsEarned;
      const newStreak = (userScore.streak || 0) + 1;

      userScore.points = newTotal;
      userScore.streak = newStreak;
      userScore.predictions = (userScore.predictions || 0) + 1;
      userScore.GSI1SK = `SCORE#${String(newTotal).padStart(6, "0")}`;

      await putItem(userScore);
      results.push({ userId: vote.userId, pointsEarned, correct: true, newTotal, newStreak });
      updatedScores.push({
        userId: userScore.userId,
        displayName: userScore.displayName,
        team: userScore.team,
        points: newTotal,
        streak: newStreak
      });
    } else {
      userScore.streak = 0;
      await putItem(userScore);
      results.push({ userId: vote.userId, pointsEarned: 0, correct: false, newTotal: userScore.points || 0, newStreak: 0 });
      updatedScores.push({
        userId: userScore.userId,
        displayName: userScore.displayName,
        team: userScore.team,
        points: userScore.points || 0,
        streak: 0
      });
    }
  }

  // Notify room of prediction result (individual breakdown)
  await broadcastToRoom(roomId, {
    type: "PREDICTION_RESULT",
    data: { predictionId, correctAnswer, results }
  });

  // Fetch full leaderboard and broadcast it (so all clients sync)
  const allScores = await queryItems({
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
    ExpressionAttributeValues: {
      ":pk": `ROOM#${roomId}`,
      ":prefix": "SCORE#"
    }
  });

  const leaderboard = allScores
    .map(s => ({
      userId: s.userId,
      displayName: s.displayName,
      team: s.team,
      points: s.points || 0,
      streak: s.streak || 0,
      predictions: s.predictions || 0
    }))
    .sort((a, b) => b.points - a.points);

  await broadcastToRoom(roomId, {
    type: "LEADERBOARD_UPDATE",
    data: { scores: leaderboard }
  });
};
