const mongoose = require('mongoose');

/**
 * HealthProfile — Single Source of Truth for all health-related data in MediGrid.
 *
 * Linked 1:1 to User via userId (ObjectId ref).
 * All health modules (Analytics, Planner, Reports, Dashboard) read from this model.
 * Derived metrics (BMI, water goal, calorie estimate, health score) are recalculated
 * automatically on every update via the route layer.
 */
const HealthProfileSchema = new mongoose.Schema({
  // ── Primary link ──────────────────────────────────────────────────────────────
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  userEmail: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },

  // ── Step 1: Basic Information ─────────────────────────────────────────────────
  fullName: { type: String, default: '' },
  dateOfBirth: { type: Date, default: null },
  age: { type: Number, default: null },
  gender: { type: String, default: '' },
  heightCm: { type: Number, default: null },
  weightKg: { type: Number, default: null },
  bloodGroup: { type: String, default: '' },

  // ── Step 2: Lifestyle ─────────────────────────────────────────────────────────
  activityLevel: {
    type: String,
    enum: ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Extremely Active', ''],
    default: ''
  },
  occupation: { type: String, default: '' },
  dailyWorkingHours: { type: Number, default: null },
  exerciseFrequency: { type: String, default: '' },
  sleepHours: { type: Number, default: null },
  wakeTime: { type: String, default: '' },
  bedtime: { type: String, default: '' },
  waterIntakeLiters: { type: Number, default: null },
  smoking: { type: String, default: 'No' },
  alcohol: { type: String, default: 'No' },
  budgetPreference: { type: String, default: 'Moderate' },

  // ── Step 3: Medical Information ───────────────────────────────────────────────
  medicalConditions: [{ type: String }],
  allergies: [{ type: String }],
  currentMedications: [{ type: String }],
  previousSurgeries: [{ type: String }],
  familyHistory: [{ type: String }],
  disabilities: [{ type: String }],

  // ── Step 4: Health Goals ──────────────────────────────────────────────────────
  healthGoals: [{ type: String }],

  // ── Step 5: Food Preferences ──────────────────────────────────────────────────
  dietType: { type: String, default: '' },
  foodAllergies: [{ type: String }],
  cuisinePreference: [{ type: String }],
  foodsToAvoid: [{ type: String }],
  foodsLiked: [{ type: String }],

  // ── Computed / Derived Metrics (recalculated on every profile update) ─────────
  bmi: { type: Number, default: null },
  bmiCategory: { type: String, default: null },
  dailyWaterGoalLiters: { type: Number, default: null },
  dailyCalorieEstimate: { type: Number, default: null },
  initialHealthScore: { type: Number, default: null },

  // ── Onboarding tracking ───────────────────────────────────────────────────────
  onboardingCompleted: { type: Boolean, default: false },
  onboardingCompletedAt: { type: Date, default: null },
  onboardingStep: { type: Number, default: 0 }, // last completed step (1-6)

}, { timestamps: true });

module.exports = mongoose.model('HealthProfile', HealthProfileSchema);
