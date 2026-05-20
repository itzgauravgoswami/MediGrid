/**
 * Centralized Health Calculations Utility
 * MediGrid AI Healthcare Platform
 */

/**
 * Calculate BMI and Category
 * @param {Number} weightKg 
 * @param {Number} heightCm 
 * @returns {Object} { bmi: Number|null, category: String|null }
 */
function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) {
    return { bmi: null, category: null };
  }
  const heightM = heightCm / 100;
  const bmi = parseFloat((weightKg / (heightM * heightM)).toFixed(1));
  let category = 'Normal weight';
  if (bmi < 18.5) category = 'Underweight';
  else if (bmi < 25) category = 'Normal weight';
  else if (bmi < 30) category = 'Overweight';
  else category = 'Obese';
  return { bmi, category };
}

/**
 * Calculate Daily Water Goal (Liters)
 * @param {Number} weightKg 
 * @param {String} activityLevel 
 * @param {Number} [customWaterIntake] 
 * @returns {Number} dailyWaterGoalLiters
 */
function calculateDailyWaterGoal(weightKg, activityLevel, customWaterIntake) {
  if (customWaterIntake !== undefined && customWaterIntake !== null && Number(customWaterIntake) > 0) {
    return Number(customWaterIntake);
  }
  if (!weightKg) return 3.0; // standard default fallback
  
  let activityBonus = 0;
  const act = (activityLevel || '').toLowerCase().trim();
  if (act === 'lightly active' || act === 'light') activityBonus = 0.3;
  else if (act === 'moderately active' || act === 'moderate') activityBonus = 0.5;
  else if (act === 'very active' || act === 'active') activityBonus = 0.8;
  else if (act === 'extremely active' || act === 'heavy') activityBonus = 1.2;

  return parseFloat(Math.max(2.0, (weightKg * 0.033) + activityBonus).toFixed(1));
}

/**
 * Calculate Daily Calorie Estimate (Mifflin-St Jeor)
 * @param {Number} weightKg 
 * @param {Number} heightCm 
 * @param {Number} age 
 * @param {String} gender 
 * @param {String} activityLevel 
 * @returns {Number} estimatedDailyCalories
 */
function calculateDailyCalories(weightKg, heightCm, age, gender, activityLevel) {
  if (!weightKg || !heightCm || !age) return 2000;
  
  let bmr;
  const gen = (gender || '').toLowerCase().trim();
  if (gen === 'male') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else if (gen === 'female') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 80;
  }

  let multiplier = 1.2; // Sedentary
  const act = (activityLevel || '').toLowerCase().trim();
  if (act === 'lightly active' || act === 'light') multiplier = 1.375;
  else if (act === 'moderately active' || act === 'moderate') multiplier = 1.55;
  else if (act === 'very active' || act === 'active') multiplier = 1.725;
  else if (act === 'extremely active' || act === 'heavy') multiplier = 1.9;

  return Math.round(bmr * multiplier);
}

/**
 * Calculate Today's/Daily Health Score (used on Overview Dashboard)
 */
function calculateDailyHealthScore({
  profileAge,
  profileGender,
  profileBloodGroup,
  profileEmergencyPhone,
  completedTasksCount = 0,
  totalTasksCount = 0,
  waterCount = 0,
  targetWater = 3.5,
  sleepHours = 7.0,
  targetSleep = 8.0,
  workoutDone = false
}) {
  let score = 0;

  // 1. Health Profile Completeness (max 20 pts)
  let profilePts = 0;
  if (profileAge) profilePts += 5;
  if (profileGender) profilePts += 5;
  if (profileBloodGroup) profilePts += 5;
  if (profileEmergencyPhone) profilePts += 5;
  score += profilePts;

  // 2. Plan Checklist Completion (max 30 pts)
  if (totalTasksCount > 0) {
    score += Math.round((completedTasksCount / totalTasksCount) * 30);
  } else {
    score += 20; // baseline fallback
  }

  // 3. Water Intake (max 20 pts)
  const wTarget = targetWater || 3.5;
  score += Math.min(20, Math.round(((waterCount || 0) / wTarget) * 20));

  // 4. Sleep (max 15 pts)
  const sTarget = targetSleep || 8.0;
  score += Math.min(15, Math.round(((sleepHours || 7.0) / sTarget) * 15));

  // 5. Exercise/Workout completed (max 15 pts)
  score += workoutDone ? 15 : 5;

  return Math.min(100, Math.max(10, score));
}

/**
 * Calculate Historical/Analytics Health Score (used on Analytics Summary)
 */
function calculateHistoricalHealthScore({
  avgWaterIntake,
  avgSleep,
  avgWorkoutMins,
  latestSugar,
  reportRiskScore,
  adherenceScore,
  bmi
}) {
  const waterScore = avgWaterIntake != null ? Math.min(100, Math.round((avgWaterIntake / 3.0) * 100)) : null;
  const sleepScore = avgSleep != null ? Math.min(100, Math.round((avgSleep / 8.0) * 100)) : null;
  const exerciseScore = avgWorkoutMins != null ? Math.min(100, Math.round((avgWorkoutMins / 45) * 100)) : null;
  const dietScore = latestSugar != null ? Math.min(100, Math.max(0, Math.round(100 - Math.abs(latestSugar - 90)))) : null;
  const bmiScore = bmi != null ? (bmi >= 18.5 && bmi <= 24.9 ? 95 : 70) : null;

  const scoreParts = [waterScore, sleepScore, exerciseScore, dietScore, reportRiskScore, bmiScore].filter(s => s != null);
  const overallHealthScore = scoreParts.length >= 3
    ? Math.round(scoreParts.reduce((a, b) => a + b, 0) / scoreParts.length)
    : null;

  return {
    overallHealthScore,
    scoreBreakdown: (waterScore != null || sleepScore != null || exerciseScore != null || dietScore != null) ? {
      diet: dietScore,
      exercise: exerciseScore,
      water: waterScore,
      sleep: sleepScore,
      reports: reportRiskScore,
      adherence: adherenceScore,
      bmi: bmiScore
    } : null
  };
}

module.exports = {
  calculateBMI,
  calculateDailyWaterGoal,
  calculateDailyCalories,
  calculateDailyHealthScore,
  calculateHistoricalHealthScore
};
