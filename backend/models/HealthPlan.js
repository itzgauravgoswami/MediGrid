const mongoose = require('mongoose');

const HealthPlanSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    default: 'guest_user'
  },
  onboarding: {
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    height: { type: Number, required: true },
    weight: { type: Number, required: true },
    activityLevel: { type: String, required: true },
    healthGoals: [{ type: String }],
    sleepHours: { type: Number, default: 8 },
    wakeTime: { type: String, default: '07:00 AM' },
    bedtime: { type: String, default: '11:00 PM' },
    waterIntake: { type: Number, default: 3.0 },
    occupation: { type: String, default: 'Office Worker' },
    smoking: { type: String, default: 'No' },
    alcohol: { type: String, default: 'No' },
    exerciseFrequency: { type: String, default: '3-4 days/week' },
    medicalHistory: [{ type: String }],
    dietType: { type: String, default: 'Non-Vegetarian' },
    foodLikes: { type: String, default: '' },
    foodDislikes: { type: String, default: '' },
    foodAllergies: { type: String, default: '' },
    cuisinePreference: { type: String, default: '' },
    budgetPreference: { type: String, default: 'Moderate' }
  },
  plan: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  dailyLogs: [{
    date: { type: String, required: true },
    completedTaskIds: [{ type: String }],
    waterIntakeLiters: { type: Number, default: 0 },
    sleepHours: { type: Number, default: 0 },
    sleepQuality: { type: String, default: 'Good' },
    weight: { type: Number },
    mood: { type: String },
    energyLevel: { type: Number },
    feedbackText: { type: String }
  }],
  weeklyReviews: [{
    date: { type: String, required: true },
    summary: { type: String },
    achievements: [{ type: String }],
    areasToImprove: [{ type: String }],
    updatedRecommendations: [{ type: String }],
    newGoals: [{ type: String }],
    motivationMessage: { type: String }
  }],
  chatHistory: [{
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  notifications: {
    waterReminders: { type: Boolean, default: true },
    waterTime: { type: String, default: '09:00 AM' },
    mealReminders: { type: Boolean, default: true },
    workoutReminders: { type: Boolean, default: true },
    sleepReminders: { type: Boolean, default: true },
    weeklyReviewReminders: { type: Boolean, default: true },
    dailyMotivationReminders: { type: Boolean, default: true }
  },
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('HealthPlan', HealthPlanSchema);
