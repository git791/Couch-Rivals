export const generatePrediction = (matchEvent) => {
  const predictions = [
    {
      id: `pred_${Date.now()}`,
      question: "Will there be another goal in the next 15 minutes?",
      options: ["Yes", "No"],
      difficulty: 1.5,
      expiresIn: 10,
    },
    {
      id: `pred_${Date.now()}_2`,
      question: "Which team will get the next yellow card?",
      options: ["Bayern", "Dortmund", "None"],
      difficulty: 2.0,
      expiresIn: 10,
    }
  ];
  
  // Pick a random prediction
  return predictions[Math.floor(Math.random() * predictions.length)];
};

export const calculateScore = (baseScore, difficulty, secondsRemaining, streak) => {
  const speedBonus = Math.max(secondsRemaining, 0);
  const streakMultiplier = 1 + (streak / 10);
  return Math.floor((baseScore * difficulty + speedBonus) * streakMultiplier);
};
