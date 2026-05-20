const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const HealthProfile = require('../models/HealthProfile');
const VitalsLog = require('../models/VitalsLog');
const { regenerateActivePlan } = require('../utils/plannerHelper');
const {
  calculateBMI,
  calculateDailyWaterGoal,
  calculateDailyCalories
} = require('../utils/healthCalculations');

const JWT_SECRET = process.env.JWT_SECRET;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sanitize(str, maxLen = 200) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').replace(/[{}]/g, '').trim().substring(0, maxLen);
}

function sanitizeArray(arr, maxLen = 100) {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter(item => typeof item === 'string' && item.trim().length > 0)
    .map(item => sanitize(item, maxLen))
    .slice(0, 30); // max 30 items
}

/**
 * Middleware: Authenticate via Bearer JWT.
 * Sets req.userId and req.userEmail on success.
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token is required.' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('_id email name fullName age gender heightCm weightKg bloodGroup allergies medicalConditions currentMedicines');
    if (!user) return res.status(401).json({ error: 'User not found.' });
    req.userId = user._id;
    req.userEmail = user.email;
    req.userDoc = user; // pass full user doc for migration
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session.' });
  }
}

/**
 * Calculate derived health metrics from profile data.
 */
function computeMetrics(profile) {
  const { bmi, category } = calculateBMI(profile.weightKg, profile.heightCm);
  const dailyWaterGoalLiters = calculateDailyWaterGoal(profile.weightKg, profile.activityLevel, profile.waterIntakeLiters);
  const dailyCalorieEstimate = calculateDailyCalories(profile.weightKg, profile.heightCm, profile.age, profile.gender, profile.activityLevel);

  // Initial Health Score (profile completeness + BMI score)
  const fields = [
    profile.fullName, profile.age, profile.gender, profile.heightCm, profile.weightKg,
    profile.activityLevel, profile.sleepHours,
    profile.healthGoals?.length > 0, profile.dietType,
    profile.medicalConditions !== undefined
  ];
  const filledFields = fields.filter(f => f !== null && f !== '' && f !== undefined && f !== false).length;
  const completenessScore = Math.round((filledFields / fields.length) * 50); // max 50 pts

  let bmiScore = 0;
  if (bmi) {
    if (category === 'Normal weight') bmiScore = 50;
    else if (category === 'Overweight') bmiScore = 35;
    else bmiScore = 25;
  }

  return {
    bmi,
    bmiCategory: category,
    dailyWaterGoalLiters,
    dailyCalorieEstimate,
    initialHealthScore: completenessScore + bmiScore
  };
}

/**
 * Attempt to migrate legacy User fields into the HealthProfile on first access.
 * Only migrates if HealthProfile doesn't exist yet.
 */
async function migrateFromUser(userDoc, userId, userEmail) {
  const existing = await HealthProfile.findOne({ userId });
  if (existing) return existing;

  // Build a partial profile from User fields
  const migrated = new HealthProfile({
    userId,
    userEmail,
    fullName: userDoc.fullName || userDoc.name || '',
    age: userDoc.age || null,
    gender: userDoc.gender || '',
    heightCm: userDoc.heightCm || null,
    weightKg: userDoc.weightKg || null,
    bloodGroup: userDoc.bloodGroup || '',
    medicalConditions: userDoc.medicalConditions
      ? userDoc.medicalConditions.split(',').map(s => s.trim()).filter(Boolean)
      : [],
    allergies: userDoc.allergies
      ? userDoc.allergies.split(',').map(s => s.trim()).filter(Boolean)
      : [],
    currentMedications: userDoc.currentMedicines
      ? userDoc.currentMedicines.split(',').map(s => s.trim()).filter(Boolean)
      : [],
    onboardingCompleted: false,
    onboardingStep: 0
  });

  // Compute derived metrics from migrated data
  const metrics = computeMetrics(migrated);
  Object.assign(migrated, metrics);

  await migrated.save();
  return migrated;
}

// ─── GET /api/health-profile/status ──────────────────────────────────────────
// Returns whether this user has completed onboarding.
// Also auto-migrates legacy User data if no HealthProfile exists yet.
router.get('/status', authenticate, async (req, res) => {
  try {
    let profile = await HealthProfile.findOne({ userId: req.userId });

    if (!profile) {
      // Check if there's legacy data to migrate
      profile = await migrateFromUser(req.userDoc, req.userId, req.userEmail);
    }

    return res.status(200).json({
      success: true,
      hasProfile: !!profile,
      onboardingCompleted: profile?.onboardingCompleted || false,
      onboardingStep: profile?.onboardingStep || 0
    });
  } catch (err) {
    console.error('[GET /health-profile/status]', err);
    return res.status(500).json({ error: 'Failed to check health profile status.' });
  }
});

// ─── GET /api/health-profile ──────────────────────────────────────────────────
// Returns the full health profile for the authenticated user.
router.get('/', authenticate, async (req, res) => {
  try {
    let profile = await HealthProfile.findOne({ userId: req.userId });

    if (!profile) {
      profile = await migrateFromUser(req.userDoc, req.userId, req.userEmail);
    }

    if (!profile) {
      return res.status(404).json({ error: 'Health profile not found.' });
    }

    return res.status(200).json({ success: true, profile });
  } catch (err) {
    console.error('[GET /health-profile]', err);
    return res.status(500).json({ error: 'Failed to fetch health profile.' });
  }
});

// ─── POST /api/health-profile ─────────────────────────────────────────────────
// Creates or completes the initial health profile (called at onboarding Step 6).
router.post('/', authenticate, async (req, res) => {
  try {
    const raw = req.body || {};

    const profileData = {
      userId: req.userId,
      userEmail: req.userEmail,

      // Step 1 — Basic Info
      fullName: sanitize(raw.fullName || raw.name || ''),
      age: raw.age ? Math.max(1, Math.min(120, Number(raw.age))) : null,
      dateOfBirth: raw.dateOfBirth ? new Date(raw.dateOfBirth) : null,
      gender: sanitize(raw.gender || ''),
      heightCm: raw.heightCm ? Math.max(50, Math.min(300, Number(raw.heightCm))) : null,
      weightKg: raw.weightKg ? Math.max(10, Math.min(500, Number(raw.weightKg))) : null,
      bloodGroup: sanitize(raw.bloodGroup || ''),

      // Step 2 — Lifestyle
      activityLevel: sanitize(raw.activityLevel || ''),
      occupation: sanitize(raw.occupation || ''),
      dailyWorkingHours: raw.dailyWorkingHours ? Number(raw.dailyWorkingHours) : null,
      exerciseFrequency: sanitize(raw.exerciseFrequency || ''),
      sleepHours: raw.sleepHours ? Math.max(0, Math.min(24, Number(raw.sleepHours))) : null,
      wakeTime: sanitize(raw.wakeTime || ''),
      bedtime: sanitize(raw.bedtime || ''),
      waterIntakeLiters: raw.waterIntakeLiters ? Number(raw.waterIntakeLiters) : null,

      // Step 3 — Medical
      medicalConditions: sanitizeArray(raw.medicalConditions),
      allergies: sanitizeArray(raw.allergies),
      currentMedications: sanitizeArray(raw.currentMedications),
      previousSurgeries: sanitizeArray(raw.previousSurgeries),
      familyHistory: sanitizeArray(raw.familyHistory),
      disabilities: sanitizeArray(raw.disabilities),

      // Step 4 — Goals
      healthGoals: sanitizeArray(raw.healthGoals),

      // Step 5 — Food
      dietType: sanitize(raw.dietType || ''),
      foodAllergies: sanitizeArray(raw.foodAllergies),
      cuisinePreference: sanitizeArray(raw.cuisinePreference),
      foodsToAvoid: sanitizeArray(raw.foodsToAvoid),
      foodsLiked: sanitizeArray(raw.foodsLiked),

      // Onboarding tracking
      onboardingCompleted: true,
      onboardingCompletedAt: new Date(),
      onboardingStep: 6
    };

    // Compute derived metrics
    const metrics = computeMetrics(profileData);
    Object.assign(profileData, metrics);

    // Upsert — replace if exists, create if not
    const profile = await HealthProfile.findOneAndUpdate(
      { userId: req.userId },
      { $set: profileData },
      { new: true, upsert: true, runValidators: true }
    );

    // Save initial vitals to VitalsLog collection
    try {
      const heartRate = Number(raw.heartRate || 76);
      const bpSystolic = Number(raw.bloodPressureSystolic || raw.bpSystolic || 118);
      const bpDiastolic = Number(raw.bloodPressureDiastolic || raw.bpDiastolic || 78);
      const sugar = Number(raw.bloodGlucose || raw.sugar || 95);
      const weight = Number(profileData.weightKg || 68.5);
      const sleepHours = Number(profileData.sleepHours || 8);
      const waterIntakeLiters = Number(profileData.waterIntakeLiters || 3.0);
      const todayStr = new Date().toISOString().split('T')[0];

      await VitalsLog.findOneAndUpdate(
        { userEmail: req.userEmail.toLowerCase().trim(), date: todayStr },
        {
          $set: {
            userEmail: req.userEmail.toLowerCase().trim(),
            date: todayStr,
            heartRate,
            bpSystolic,
            bpDiastolic,
            sugar,
            weight,
            sleepHours,
            waterIntakeLiters,
            steps: 9500,
            calories: profile.dailyCalorieEstimate || 2050,
            workoutMins: 30,
            mood: 'Energetic'
          }
        },
        { upsert: true, new: true }
      );
    } catch (vitalsErr) {
      console.error('Error logging onboarding vitals:', vitalsErr);
    }

    // Also update the User model with basic fields for backward compatibility
    await User.findByIdAndUpdate(req.userId, {
      $set: {
        onboardingCompleted: true,
        fullName: profileData.fullName || undefined,
        name: profileData.fullName || undefined,
        age: profileData.age || undefined,
        gender: profileData.gender || undefined,
        bloodGroup: profileData.bloodGroup || undefined,
        heightCm: profileData.heightCm || undefined,
        weightKg: profileData.weightKg || undefined,
        allergies: profileData.allergies.join(', ') || undefined,
        medicalConditions: profileData.medicalConditions.join(', ') || undefined,
        currentMedicines: profileData.currentMedications.join(', ') || undefined
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Health profile created successfully!',
      profile,
      computedMetrics: {
        bmi: profile.bmi,
        bmiCategory: profile.bmiCategory,
        dailyWaterGoalLiters: profile.dailyWaterGoalLiters,
        dailyCalorieEstimate: profile.dailyCalorieEstimate,
        initialHealthScore: profile.initialHealthScore
      }
    });
  } catch (err) {
    console.error('[POST /health-profile]', err);
    return res.status(500).json({ error: 'Failed to create health profile.' });
  }
});

// ─── PUT /api/health-profile ──────────────────────────────────────────────────
// Partial update — only updates fields that are provided.
// Recalculates all derived metrics after every update.
router.put('/', authenticate, async (req, res) => {
  try {
    const raw = req.body || {};

    // Only include fields that were actually sent
    const updates = {};

    if (raw.fullName !== undefined) updates.fullName = sanitize(raw.fullName);
    if (raw.age !== undefined) updates.age = Math.max(1, Math.min(120, Number(raw.age)));
    if (raw.dateOfBirth !== undefined) updates.dateOfBirth = raw.dateOfBirth ? new Date(raw.dateOfBirth) : null;
    if (raw.gender !== undefined) updates.gender = sanitize(raw.gender);
    if (raw.heightCm !== undefined) updates.heightCm = Math.max(50, Math.min(300, Number(raw.heightCm)));
    if (raw.weightKg !== undefined) updates.weightKg = Math.max(10, Math.min(500, Number(raw.weightKg)));
    if (raw.bloodGroup !== undefined) updates.bloodGroup = sanitize(raw.bloodGroup);

    if (raw.activityLevel !== undefined) updates.activityLevel = sanitize(raw.activityLevel);
    if (raw.occupation !== undefined) updates.occupation = sanitize(raw.occupation);
    if (raw.dailyWorkingHours !== undefined) updates.dailyWorkingHours = Number(raw.dailyWorkingHours);
    if (raw.exerciseFrequency !== undefined) updates.exerciseFrequency = sanitize(raw.exerciseFrequency);
    if (raw.sleepHours !== undefined) updates.sleepHours = Math.max(0, Math.min(24, Number(raw.sleepHours)));
    if (raw.wakeTime !== undefined) updates.wakeTime = sanitize(raw.wakeTime);
    if (raw.bedtime !== undefined) updates.bedtime = sanitize(raw.bedtime);
    if (raw.waterIntakeLiters !== undefined) updates.waterIntakeLiters = Number(raw.waterIntakeLiters);
    if (raw.smoking !== undefined) updates.smoking = sanitize(raw.smoking);
    if (raw.alcohol !== undefined) updates.alcohol = sanitize(raw.alcohol);
    if (raw.budgetPreference !== undefined) updates.budgetPreference = sanitize(raw.budgetPreference);

    if (raw.medicalConditions !== undefined) updates.medicalConditions = sanitizeArray(raw.medicalConditions);
    if (raw.allergies !== undefined) updates.allergies = sanitizeArray(raw.allergies);
    if (raw.currentMedications !== undefined) updates.currentMedications = sanitizeArray(raw.currentMedications);
    if (raw.previousSurgeries !== undefined) updates.previousSurgeries = sanitizeArray(raw.previousSurgeries);
    if (raw.familyHistory !== undefined) updates.familyHistory = sanitizeArray(raw.familyHistory);
    if (raw.disabilities !== undefined) updates.disabilities = sanitizeArray(raw.disabilities);

    if (raw.healthGoals !== undefined) updates.healthGoals = sanitizeArray(raw.healthGoals);

    if (raw.dietType !== undefined) updates.dietType = sanitize(raw.dietType);
    if (raw.foodAllergies !== undefined) updates.foodAllergies = sanitizeArray(raw.foodAllergies);
    if (raw.cuisinePreference !== undefined) updates.cuisinePreference = sanitizeArray(raw.cuisinePreference);
    if (raw.foodsToAvoid !== undefined) updates.foodsToAvoid = sanitizeArray(raw.foodsToAvoid);
    if (raw.foodsLiked !== undefined) updates.foodsLiked = sanitizeArray(raw.foodsLiked);

    // Get current profile to merge for derived metric calculation
    let currentProfile = await HealthProfile.findOne({ userId: req.userId });
    if (!currentProfile) {
      currentProfile = await migrateFromUser(req.userDoc, req.userId, req.userEmail);
    }

    const mergedForCompute = { ...currentProfile.toObject(), ...updates };
    const metrics = computeMetrics(mergedForCompute);
    Object.assign(updates, metrics);

    const profile = await HealthProfile.findOneAndUpdate(
      { userId: req.userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({ error: 'Health profile not found. Please complete onboarding first.' });
    }

    // Sync basic fields back to User model
    const userSync = {};
    if (updates.fullName) { userSync.fullName = updates.fullName; userSync.name = updates.fullName; }
    if (updates.age) userSync.age = updates.age;
    if (updates.gender) userSync.gender = updates.gender;
    if (updates.bloodGroup) userSync.bloodGroup = updates.bloodGroup;
    if (updates.heightCm) userSync.heightCm = updates.heightCm;
    if (updates.weightKg) userSync.weightKg = updates.weightKg;
    if (updates.allergies) userSync.allergies = updates.allergies.join(', ');
    if (updates.medicalConditions) userSync.medicalConditions = updates.medicalConditions.join(', ');
    if (updates.currentMedications) userSync.currentMedicines = updates.currentMedications.join(', ');

    if (Object.keys(userSync).length > 0) {
      await User.findByIdAndUpdate(req.userId, { $set: userSync });
    }

    // Auto-regenerate active health plan if any plan-relevant parameters changed
    const plannerFields = [
      'age', 'gender', 'heightCm', 'weightKg', 'activityLevel', 'sleepHours',
      'waterIntakeLiters', 'exerciseFrequency', 'medicalConditions', 'allergies',
      'healthGoals', 'dietType', 'cuisinePreference', 'foodsToAvoid', 'foodsLiked',
      'smoking', 'alcohol', 'budgetPreference'
    ];
    const shouldRegenerate = Object.keys(updates).some(k => plannerFields.includes(k));
    if (shouldRegenerate) {
      regenerateActivePlan(req.userId).catch(err => {
        console.error('Background plan regeneration error:', err);
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Health profile updated successfully!',
      profile,
      computedMetrics: {
        bmi: profile.bmi,
        bmiCategory: profile.bmiCategory,
        dailyWaterGoalLiters: profile.dailyWaterGoalLiters,
        dailyCalorieEstimate: profile.dailyCalorieEstimate,
        initialHealthScore: profile.initialHealthScore
      }
    });
  } catch (err) {
    console.error('[PUT /health-profile]', err);
    return res.status(500).json({ error: 'Failed to update health profile.' });
  }
});

module.exports = router;
