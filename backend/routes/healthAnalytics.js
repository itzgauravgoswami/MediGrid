const express = require('express');
const router = express.Router();
const HealthPlan = require('../models/HealthPlan');
const Analysis = require('../models/Analysis');
const VitalsLog = require('../models/VitalsLog');
const User = require('../models/User');
const HealthProfile = require('../models/HealthProfile');
const Task = require('../models/Task');
const { regenerateActivePlan } = require('../utils/plannerHelper');
const {
  calculateBMI,
  calculateHistoricalHealthScore
} = require('../utils/healthCalculations');

// Safe sanitize utility to prevent prompt injection or malicious text
const sanitizeInput = (text) => {
  if (typeof text !== 'string') return '';
  return text.replace(/[<>{}]/g, '').trim();
};

// ─── GET /api/health-analytics/summary ───────────────────────────────────────
router.get('/summary', async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email'] || req.query.email;
    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required.' });
    }

    // 1. Fetch User Profile from MongoDB
    const dbUser = await User.findOne({ email: userEmail.toLowerCase().trim() });

    // 1b. Fetch HealthProfile (single source of truth — richer data)
    const healthProfile = dbUser
      ? await HealthProfile.findOne({ userId: dbUser._id })
      : null;

    // 2. Fetch Health Plan if available
    const queryUserId = dbUser ? String(dbUser._id) : userEmail;
    const healthPlan = await HealthPlan.findOne({ userId: queryUserId, active: true }).sort({ updatedAt: -1 });

    // 3. Fetch Analyzed Reports
    const reports = await Analysis.find({ userEmail }).sort({ createdAt: -1 });

    // 4. Fetch Vitals Logs from MongoDB — NO fake data insertion
    const dbVitals = await VitalsLog.find({ userEmail: userEmail.toLowerCase().trim() }).sort({ createdAt: 1 }).limit(30);

    // 5. Fetch Tasks from MongoDB
    const userTasks = await Task.find({ userEmail: userEmail.toLowerCase().trim() });
    const completedTasksCount = userTasks.filter(t => t.done).length;

    const hasVitals = dbVitals.length > 0;
    const hasReports = reports.length > 0;
    const hasProfile = !!dbUser || !!healthProfile;

    // If no data at all, return a clean empty state — never fabricate
    if (!hasVitals && !hasReports && !hasProfile) {
      return res.status(200).json({
        success: true,
        hasData: false,
        healthScore: null,
        scoreBreakdown: null,
        profile: {
          name: '',
          email: userEmail,
          age: null,
          gender: '',
          height: null,
          weight: null,
          bmi: null,
          bmiCategory: null,
          goals: []
        },
        reportsSummary: { total: 0, normal: 0, attentionNeeded: 0, reportScore: null, latestReport: null },
        symptomStats: { totalSearches: 0, frequentSymptoms: [], recoveredSymptoms: [], commonCategories: [] },
        medicineStats: { activeMeds: [], adherenceRate: null, missedDosesMonth: null, reminderSuccess: null },
        timeSeriesData: [],
        achievements: [],
        dailyLogsCount: 0,
        completedTasksCount: 0
      });
    }

    // ── Averages from real VitalsLog data, with onboarding fallback ──
    const avgWaterIntake = hasVitals
      ? parseFloat((dbVitals.reduce((acc, v) => acc + (v.waterIntakeLiters || 0), 0) / dbVitals.length).toFixed(1))
      : (healthProfile?.dailyWaterGoalLiters ?? healthPlan?.onboarding?.waterIntake ?? 3.0);

    const avgSleep = hasVitals
      ? parseFloat((dbVitals.reduce((acc, v) => acc + (v.sleepHours || 0), 0) / dbVitals.length).toFixed(1))
      : (healthProfile?.sleepHours ?? healthPlan?.onboarding?.sleepHours ?? 8.0);

    const avgCalories = hasVitals
      ? Math.round(dbVitals.reduce((acc, v) => acc + (v.calories || 0), 0) / dbVitals.length)
      : (healthProfile?.dailyCalorieEstimate ?? healthPlan?.plan?.estimatedDailyCalories ?? 2200);

    const avgWorkoutMins = hasVitals
      ? Math.round(dbVitals.reduce((acc, v) => acc + (v.workoutMins || 0), 0) / dbVitals.length)
      : (healthProfile?.exerciseFrequency === 'Every day' ? 60 : healthProfile?.exerciseFrequency === '5-6 days/week' ? 45 : 30);

    const latestVital = hasVitals ? dbVitals[dbVitals.length - 1] : null;

    // ── Profile — prefer HealthProfile (richer), fall back to User fields ──
    const profileName = healthProfile?.fullName || dbUser?.name || dbUser?.fullName || '';
    const profileAge = healthProfile?.age ?? dbUser?.age ?? null;
    const profileGender = healthProfile?.gender || dbUser?.gender || '';
    const profileHeight = healthProfile?.heightCm ?? dbUser?.heightCm ?? null;
    const profileWeight = latestVital?.weight ?? healthProfile?.weightKg ?? dbUser?.weightKg ?? null;
    const profileActivityLevel = healthProfile?.activityLevel || null;
    const profileGoals = healthProfile?.healthGoals || [];
    const profileWaterGoal = healthProfile?.dailyWaterGoalLiters ?? null;
    const profileCalorieGoal = healthProfile?.dailyCalorieEstimate ?? null;
    const profileBMI = healthProfile?.bmi ?? null;
    const profileBMICategory = healthProfile?.bmiCategory ?? null;
    const profileBloodGroup = healthProfile?.bloodGroup || dbUser?.bloodGroup || '';
    const profileDietType = healthProfile?.dietType || '';
    const profileMedications = healthProfile?.currentMedications || [];

    // Use pre-computed BMI from HealthProfile if available, else calculate
    let bmi = profileBMI;
    let bmiCategory = profileBMICategory;
    if (!bmi) {
      const calc = calculateBMI(profileWeight, profileHeight);
      bmi = calc.bmi;
      bmiCategory = calc.category;
    }

    // ── Report statistics from real data ──
    const totalReports = reports.length;
    const normalReports = reports.filter(r => r.riskLevel === 'Green').length;
    const reportScore = totalReports > 0 ? Math.round((normalReports / totalReports) * 100) : null;

    // ── Health scores and breakdown using centralized utility ──
    const { overallHealthScore, scoreBreakdown } = calculateHistoricalHealthScore({
      avgWaterIntake,
      avgSleep,
      avgWorkoutMins,
      latestSugar: latestVital?.sugar ?? 90,
      reportRiskScore: reportScore ?? 95,
      adherenceScore: userTasks.length > 0 ? Math.round((completedTasksCount / userTasks.length) * 100) : 90,
      bmi
    });

    // ── Dynamic time series from real MongoDB VitalsLog ──
    const timeSeriesData = dbVitals.map(v => ({
      day: v.date,
      weight: v.weight ?? null,
      bmi: (v.weight && profileHeight) ? parseFloat((v.weight / ((profileHeight / 100) ** 2)).toFixed(1)) : null,
      water: v.waterIntakeLiters ?? null,
      sleep: v.sleepHours ?? null,
      sugar: v.sugar ?? null,
      bp: v.bpSystolic ?? null,
      calories: v.calories ?? null,
      workout: v.workoutMins ?? null,
      steps: v.steps ?? null
    }));

    // ── Symptom history from real reports only ──
    const symptomStats = {
      totalSearches: totalReports,
      frequentSymptoms: totalReports > 0
        ? Array.from(new Set(reports.map(r => r.reportType || 'Lab Test')))
        : [],
      recoveredSymptoms: [],
      commonCategories: []
    };

    // ── Medication stats from HealthProfile (prefer) or User model ──
    const medsArray = profileMedications.length > 0
      ? profileMedications
      : (dbUser?.currentMedicines || '').split(',').map(m => m.trim()).filter(Boolean);
    const activeMedsList = medsArray.map(m => ({
      name: m,
      dosage: 'As prescribed',
      adherence: null,
      refillDate: 'Active'
    }));

    const medicineStats = {
      activeMeds: activeMedsList,
      adherenceRate: null,
      missedDosesMonth: null,
      reminderSuccess: null
    };

    // ── Achievements — only unlock based on real data ──
    const achievements = [
      {
        id: 'first-vitals',
        title: 'First Vitals Logged',
        icon: '📊',
        description: 'You logged your first health telemetry entry',
        unlocked: hasVitals,
        date: hasVitals ? new Date(dbVitals[0].createdAt).toLocaleDateString() : null
      },
      {
        id: 'report-pro',
        title: 'Health Scout',
        icon: '📑',
        description: 'Uploaded & analyzed 1+ medical reports',
        unlocked: totalReports >= 1,
        date: totalReports >= 1 ? new Date(reports[0].createdAt).toLocaleDateString() : null
      },
      {
        id: 'streak-7',
        title: '7-Day Streak',
        icon: '🔥',
        description: 'Logged health metrics for 7 consecutive days',
        unlocked: dbVitals.length >= 7,
        date: dbVitals.length >= 7 ? new Date(dbVitals[6].createdAt).toLocaleDateString() : null
      }
    ];

    res.status(200).json({
      success: true,
      hasData: hasVitals || hasReports || hasProfile,
      healthScore: overallHealthScore,
      scoreBreakdown,
      profile: {
        name: profileName,
        email: userEmail,
        age: profileAge,
        gender: profileGender,
        height: profileHeight,
        weight: profileWeight,
        bloodGroup: profileBloodGroup,
        bmi,
        bmiCategory,
        activityLevel: profileActivityLevel,
        goals: profileGoals,
        waterGoalLiters: profileWaterGoal,
        dailyCalorieGoal: profileCalorieGoal,
        dietType: profileDietType,
        onboardingCompleted: healthProfile?.onboardingCompleted || false
      },
      reportsSummary: {
        total: totalReports,
        normal: normalReports,
        attentionNeeded: reports.filter(r => r.riskLevel === 'Yellow' || r.riskLevel === 'Red').length,
        reportScore,
        latestReport: reports[0] || null
      },
      symptomStats,
      medicineStats,
      timeSeriesData,
      achievements,
      dailyLogsCount: dbVitals.length,
      completedTasksCount
    });

  } catch (err) {
    console.error('Error fetching health analytics summary:', err);
    res.status(500).json({ error: 'Server error compiling health analytics summary.' });
  }
});

// ─── POST /api/health-analytics/ai-insights ──────────────────────────────────
router.post('/ai-insights', async (req, res) => {
  const { userProfile, analyticsSummary, timeRange } = req.body;

  // Only generate insights when real data exists
  const hasRealData = analyticsSummary?.hasData === true || (analyticsSummary?.timeSeriesData?.length > 0);
  if (!hasRealData) {
    return res.status(200).json({
      success: true,
      hasData: false,
      message: 'Continue using MediGrid to receive personalised AI insights. Log vitals, analyze reports, or complete a symptom check first.',
      source: 'no-data'
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(200).json({
      success: true,
      hasData: true,
      aiStatusBadge: 'Health Data Synced',
      insightsList: [],
      predictions: null,
      weeklyReview: null,
      aiRecommendations: [],
      source: 'local-no-key'
    });
  }

  try {
    const prompt = `
You are Gemini Health Intelligence AI, acting as an elite personal health analytics coach for the MediGrid platform.
Analyze the following aggregated health data:
Time Range: ${timeRange || 'This Week'}
User Profile: ${JSON.stringify(userProfile || {})}
Analytics Summary: ${JSON.stringify(analyticsSummary || {})}

IMPORTANT INSTRUCTIONS:
- You are an analytics coach, NOT a medical doctor.
- Do NOT diagnose diseases or prescribe treatments.
- Only comment on data that exists in the analytics summary. Do NOT invent statistics.
- Highlight positive progress and achievable habit adjustments.
- Return ONLY a valid JSON object strictly matching this schema with NO extra text:

{
  "aiStatusBadge": "Short badge string like 'Health Data Synced'",
  "insightsList": [
    {
      "id": 1,
      "category": "String category",
      "title": "String title",
      "description": "String explanation based only on real data",
      "type": "positive" | "warning" | "neutral",
      "action": "Short actionable recommendation"
    }
  ],
  "predictions": {
    "lifestyleRisks": "String overview based on real data",
    "healthImprovements": "String expected improvement trajectory",
    "goalProbability": 75,
    "suggestedFocusAreas": ["Focus 1", "Focus 2"],
    "predictionConfidence": "Based on limited data"
  },
  "weeklyReview": {
    "summary": "Multi-sentence weekly health review",
    "achievements": ["Achievement 1"],
    "areasToImprove": ["Area 1"],
    "recommendations": ["Recommendation 1"],
    "motivationMessage": "Inspiring closing message"
  },
  "aiRecommendations": [
    {
      "priority": "High" | "Medium" | "Low",
      "title": "Short title",
      "reason": "Why this is recommended",
      "expectedBenefit": "Specific expected benefit"
    }
  ]
}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3 }
        })
      }
    );

    if (!response.ok) {
      return res.status(200).json({ success: true, hasData: true, insightsList: [], source: 'api-error' });
    }

    const resJson = await response.json();
    const rawText = resJson.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanJsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsedData = JSON.parse(cleanJsonText);
    res.status(200).json({ success: true, hasData: true, ...parsedData, source: 'gemini' });

  } catch (err) {
    console.error('Error generating AI health insights:', err.message);
    res.status(200).json({ success: true, hasData: true, insightsList: [], source: 'error' });
  }
});

// ─── POST /api/health-analytics/chat ────────────────────────────────────────
router.post('/chat', async (req, res) => {
  const { question, userProfile, analyticsSummary } = req.body;
  const sanitizedQuestion = sanitizeInput(question);

  if (!sanitizedQuestion) {
    return res.status(400).json({ error: 'Question is required.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(200).json({
      success: true,
      answer: 'Your question has been received. Please configure a Gemini API key to enable AI-powered health coaching responses.'
    });
  }

  try {
    const prompt = `
You are Gemini Health Analytics Coach in MediGrid.
User Query: "${sanitizedQuestion}"
User Profile Context: ${JSON.stringify(userProfile || {})}
Analytics Summary Context: ${JSON.stringify(analyticsSummary || {})}

Rules:
- Give a clear, encouraging, evidence-based response using the user's analytics context only.
- If the user has no data (empty profile/analytics), encourage them to start tracking.
- Keep tone professional, empathetic, and concise.
- Do NOT diagnose diseases or prescribe medications.
- Do NOT invent health statistics that are not in the context.
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4 }
        })
      }
    );

    if (!response.ok) {
      throw new Error('Gemini API request failed');
    }

    const resJson = await response.json();
    const answer = resJson.candidates?.[0]?.content?.parts?.[0]?.text || 'Thank you for your question. Start logging your daily vitals and health data to get personalised responses!';

    res.status(200).json({ success: true, answer });

  } catch (err) {
    console.error('Error in health analytics chat:', err.message);
    res.status(200).json({
      success: true,
      answer: 'Unable to process your request right now. Please try again later.'
    });
  }
});

// ─── GET /api/health-analytics/vitals ─────────────────────────────────────────
router.get('/vitals', async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email'] || req.query.email;
    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required.' });
    }

    // Return real vitals only — no fake data insertion
    const vitals = await VitalsLog.find({ userEmail: userEmail.toLowerCase().trim() }).sort({ createdAt: 1 }).limit(30);

    res.status(200).json({
      success: true,
      vitals
    });
  } catch (err) {
    console.error('Error fetching vitals logs:', err);
    res.status(500).json({ error: 'Failed to fetch vitals logs.' });
  }
});

// ─── POST /api/health-analytics/vitals ────────────────────────────────────────
router.post('/vitals', async (req, res) => {
  try {
    const userEmail = (req.headers['x-user-email'] || req.body.userEmail || '').toLowerCase().trim();
    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required.' });
    }

    const { date, sugar, bpSystolic, bpDiastolic, heartRate, weight, waterIntakeLiters, sleepHours, steps, calories, workoutMins, mood, notes } = req.body;

    const newLog = new VitalsLog({
      userEmail,
      date: sanitizeInput(date || new Date().toLocaleDateString('en-US', { weekday: 'short' })),
      ...(sugar != null && { sugar: Number(sugar) }),
      ...(bpSystolic != null && { bpSystolic: Number(bpSystolic) }),
      ...(bpDiastolic != null && { bpDiastolic: Number(bpDiastolic) }),
      ...(heartRate != null && { heartRate: Number(heartRate) }),
      ...(weight != null && { weight: Number(weight) }),
      ...(waterIntakeLiters != null && { waterIntakeLiters: Number(waterIntakeLiters) }),
      ...(sleepHours != null && { sleepHours: Number(sleepHours) }),
      ...(steps != null && { steps: Number(steps) }),
      ...(calories != null && { calories: Number(calories) }),
      ...(workoutMins != null && { workoutMins: Number(workoutMins) }),
      mood: sanitizeInput(mood || ''),
      notes: sanitizeInput(notes || '')
    });

    await newLog.save();

    try {
      const userDoc = await User.findOne({ email: userEmail });
      if (userDoc) {
        if (weight != null) {
          await HealthProfile.findOneAndUpdate(
            { userId: userDoc._id },
            { $set: { weightKg: Number(weight) } }
          );
          regenerateActivePlan(userDoc._id).catch(err => {
            console.error('Background plan regeneration error on vitals update:', err);
          });
        }

        const activePlan = await HealthPlan.findOne({ userId: String(userDoc._id), active: true });
        if (activePlan) {
          const todayStr = new Date().toISOString().split('T')[0];
          const idx = activePlan.dailyLogs.findIndex(l => l.date === todayStr);
          const logEntry = {
            date: todayStr,
            ...(waterIntakeLiters != null && { waterIntakeLiters: Number(waterIntakeLiters) }),
            ...(sleepHours != null && { sleepHours: Number(sleepHours) }),
            ...(weight != null && { weight: Number(weight) })
          };
          if (idx >= 0) {
            activePlan.dailyLogs[idx] = { ...activePlan.dailyLogs[idx].toObject(), ...logEntry };
          } else {
            activePlan.dailyLogs.push(logEntry);
          }
          await activePlan.save();
        }
      }
    } catch (syncErr) {
      console.error('Error syncing telemetry to profile/plan:', syncErr);
    }

    res.status(201).json({
      success: true,
      message: 'Vitals log stored in database successfully.',
      log: newLog
    });
  } catch (err) {
    console.error('Error posting vitals log:', err);
    res.status(500).json({ error: 'Failed to post vitals log.' });
  }
});

module.exports = router;
