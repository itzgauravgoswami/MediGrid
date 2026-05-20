import React, { useState, useEffect } from 'react';
import {
  Sparkles, Heart, Activity, Flame, Shield, ShieldCheck, CheckCircle2, ChevronRight,
  TrendingUp, Award, Clock, RefreshCw, Calendar, Trash2, ArrowRight,
  Search, Filter, Send, Bot, User, Bell, Sliders, Play, Check, AlertCircle,
  Plus, RotateCcw, Zap, Moon, Sun, Apple, Dumbbell, Droplets, Info, Eye,
  Lock, X, FileText, ChevronDown, ChevronUp, Share2, HelpCircle
} from 'lucide-react';
import { BACKEND_URL } from '../config/api';

const API_BASE = `${BACKEND_URL}/api/health-planner`;

const formatMarkdown = (text) => {
  if (!text) return null;
  const renderBoldText = (txt) => {
    if (!txt) return null;
    const parts = txt.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-extrabold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const preprocessed = text.replace(/\s*(\d+)\.\s+\*\*/g, '\n$1. **');
  const lines = preprocessed.split('\n');

  return (
    <div className="space-y-1">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1.5" />;

        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          return (
            <ul key={idx} className="list-disc list-inside ml-3 my-0.5">
              <li className="text-xs text-slate-700 dark:text-slate-300">
                {renderBoldText(trimmed.substring(2))}
              </li>
            </ul>
          );
        }

        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          return (
            <div key={idx} className="pl-3 my-0.5 flex items-start gap-1 text-xs text-slate-700 dark:text-slate-300">
              <span className="font-bold text-sky-500">{numMatch[1]}.</span>
              <span className="flex-1">{renderBoldText(numMatch[2])}</span>
            </div>
          );
        }

        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-xs font-black text-slate-900 dark:text-white mt-2 mb-1">
              {renderBoldText(trimmed.substring(4))}
            </h4>
          );
        }

        return (
          <p key={idx} className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-1">
            {renderBoldText(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

const safeFetchJson = async (url, options = {}) => {
  const token = localStorage.getItem('authToken');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };
  const res = await fetch(url, {
    ...options,
    headers
  });
  const contentType = res.headers.get('content-type');
  if (!res.ok || !contentType || !contentType.includes('application/json')) {
    throw new Error(`API returned status ${res.status}`);
  }
  return await res.json();
};

export default function AIHealthPlanner({
  isDark = true,
  activePlanRecord: propActivePlanRecord,
  profileData: propProfileData,
  refreshActivePlan,
  refreshUserProfile,
  refreshVitalsHistory,
  refreshAllData
}) {
  // ─── STATE MANAGEMENT ────────────────────────────────────────────────────────
  const [activePlanRecord, setActivePlanRecord] = useState(null);
  const [historyPlans, setHistoryPlans] = useState([]);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);

  // Setup Wizard State (Steps 1-3)
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [otherGoalText, setOtherGoalText] = useState('');
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showFullForm, setShowFullForm] = useState(false);

  // Form Fields
  const [age, setAge] = useState(26);
  const [gender, setGender] = useState('Male');
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(72);
  const [activityLevel, setActivityLevel] = useState('Moderately Active');
  
  const [healthGoals, setHealthGoals] = useState(['Improve Fitness', 'Build Muscle']);
  
  const [sleepHours, setSleepHours] = useState(8);
  const [wakeTime, setWakeTime] = useState('07:00 AM');
  const [bedtime, setBedtime] = useState('11:00 PM');
  const [waterIntake, setWaterIntake] = useState(3.0);
  const [occupation, setOccupation] = useState('Office Worker');
  const [smoking, setSmoking] = useState('No');
  const [alcohol, setAlcohol] = useState('Occasionally');
  const [exerciseFrequency, setExerciseFrequency] = useState('3-4 days/week');

  const [medicalHistory, setMedicalHistory] = useState(['None']);
  const [customMedical, setCustomMedical] = useState('');

  const [dietType, setDietType] = useState('Non-Vegetarian');
  const [foodLikes, setFoodLikes] = useState('Oats, Eggs, Salmon, Berries, Avocados');
  const [foodDislikes, setFoodDislikes] = useState('Mushrooms');
  const [foodAllergies, setFoodAllergies] = useState('None');
  const [cuisinePreference, setCuisinePreference] = useState('Indian, Mediterranean');
  const [budgetPreference, setBudgetPreference] = useState('Moderate');

  // Interactive Trackers State
  const [todayCompletedTasks, setTodayCompletedTasks] = useState([]);
  const [currentWaterIntake, setCurrentWaterIntake] = useState(0.0);
  const [lastNightSleep, setLastNightSleep] = useState(7.5);
  const [sleepQualityRating, setSleepQualityRating] = useState('Good');
  const [currentWeightLog, setCurrentWeightLog] = useState(72);

  // UI Modals & Drawers
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackMood, setFeedbackMood] = useState('Good');
  const [feedbackEnergy, setFeedbackEnergy] = useState(8);
  const [feedbackMeals, setFeedbackMeals] = useState('Yes');
  const [feedbackWorkout, setFeedbackWorkout] = useState('Yes');
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [dynamicInsight, setDynamicInsight] = useState(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Weekly Review Modal
  const [showWeeklyReviewModal, setShowWeeklyReviewModal] = useState(false);
  const [weeklyReviewData, setWeeklyReviewData] = useState(null);
  const [loadingWeeklyReview, setLoadingWeeklyReview] = useState(false);

  // AI Chat Modal
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your AI Health & Wellness Coach. Ask me anything about your diet, workouts, recovery, or health goals!' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Notification Settings Drawer
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [notifSettings, setNotifSettings] = useState({
    waterReminders: true,
    waterTime: '09:00 AM',
    mealReminders: true,
    workoutReminders: true,
    sleepReminders: true,
    weeklyReviewReminders: true,
    dailyMotivationReminders: true
  });

  // History & Compare Modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoryPlan, setSelectedHistoryPlan] = useState(null);

  // Meal Plan Day Selector
  const [selectedMealDay, setSelectedMealDay] = useState('Monday');

  // Search / Filter State for history & tasks
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGoal, setFilterGoal] = useState('All');

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Generation Steps Labels
  const generationSteps = [
    'Analyzing Lifestyle & Biometrics...',
    'Understanding Health Goals & Preferences...',
    'Creating Personalized Wellness Plan...',
    'Preparing Balanced Nutrition & Diet...',
    'Customizing Workout & Recovery Routine...',
    'Finalizing AI Health Recommendations...'
  ];

  // Options Definitions
  const activityOptions = [
    { label: 'Sedentary', desc: 'Little to no exercise, desk job' },
    { label: 'Lightly Active', desc: 'Light exercise 1-3 days/week' },
    { label: 'Moderately Active', desc: 'Moderate exercise 3-5 days/week' },
    { label: 'Very Active', desc: 'Hard exercise 6-7 days/week' }
  ];

  const availableGoals = [
    'Lose Weight', 'Gain Weight', 'Maintain Weight', 'Build Muscle',
    'Improve Fitness', 'Better Sleep', 'Reduce Stress', 'Improve Heart Health',
    'Better Nutrition', 'Increase Energy', 'Improve Flexibility'
  ];

  const medicalOptions = [
    'None', 'Diabetes', 'Hypertension', 'Thyroid', 'PCOS',
    'Heart Disease', 'Asthma', 'Allergies', 'Recent Surgery', 'Food Allergies'
  ];

  const dietTypeOptions = ['Vegetarian', 'Vegan', 'Eggetarian', 'Non-Vegetarian'];

  // Synchronize active plan record with parent prop changes
  useEffect(() => {
    if (propActivePlanRecord) {
      setActivePlanRecord(propActivePlanRecord);
      setLoadingPlan(false);
      const todayStr = new Date().toISOString().split('T')[0];
      const todayLog = propActivePlanRecord.dailyLogs?.find(l => l.date === todayStr);
      if (todayLog) {
        setTodayCompletedTasks(todayLog.completedTaskIds || []);
        setCurrentWaterIntake(todayLog.waterIntakeLiters ?? 0);
        setLastNightSleep(todayLog.sleepHours ?? 7.5);
        setSleepQualityRating(todayLog.sleepQuality || 'Good');
      } else {
        setTodayCompletedTasks([]);
        setCurrentWaterIntake(0.0);
        setLastNightSleep(7.5);
        setSleepQualityRating('Good');
      }
    } else if (propActivePlanRecord === null) {
      setActivePlanRecord(null);
      setLoadingPlan(false);
    }
  }, [propActivePlanRecord]);

  // Synchronize profile data with parent prop changes
  useEffect(() => {
    if (propProfileData) {
      setProfileData(propProfileData);
      if (propProfileData.age) setAge(propProfileData.age);
      if (propProfileData.gender) setGender(propProfileData.gender);
      if (propProfileData.heightCm) setHeight(propProfileData.heightCm);
      if (propProfileData.weightKg) setWeight(propProfileData.weightKg);
      if (propProfileData.activityLevel) setActivityLevel(propProfileData.activityLevel);
      if (propProfileData.sleepHours) setSleepHours(propProfileData.sleepHours);
      if (propProfileData.wakeTime) setWakeTime(propProfileData.wakeTime);
      if (propProfileData.bedtime) setBedtime(propProfileData.bedtime);
      if (propProfileData.waterIntakeLiters) setWaterIntake(propProfileData.waterIntakeLiters);
      if (propProfileData.occupation) setOccupation(propProfileData.occupation);
      if (propProfileData.exerciseFrequency) setExerciseFrequency(propProfileData.exerciseFrequency);
      if (propProfileData.medicalConditions && propProfileData.medicalConditions.length > 0) {
        setMedicalHistory(propProfileData.medicalConditions);
      }
      if (propProfileData.dietType) setDietType(propProfileData.dietType);
      if (propProfileData.foodsLiked && propProfileData.foodsLiked.length > 0) {
        setFoodLikes(propProfileData.foodsLiked.join(', '));
      }
      if (propProfileData.foodsToAvoid && propProfileData.foodsToAvoid.length > 0) {
        setFoodDislikes(propProfileData.foodsToAvoid.join(', '));
      }
      if (propProfileData.allergies && propProfileData.allergies.length > 0) {
        setFoodAllergies(propProfileData.allergies.join(', '));
      }
      if (propProfileData.cuisinePreference && propProfileData.cuisinePreference.length > 0) {
        setCuisinePreference(propProfileData.cuisinePreference.join(', '));
      }
    }
  }, [propProfileData]);

  // ─── INITIAL LOAD ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!propActivePlanRecord && refreshActivePlan) {
      refreshActivePlan();
    }
    fetchPlanHistory();
  }, []);

  useEffect(() => {
    if (showWizard && !propProfileData) {
      const fetchProfile = async () => {
        setProfileLoading(true);
        try {
          const token = localStorage.getItem('authToken');
          const response = await fetch(`${BACKEND_URL}/api/health-profile/`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.profile) {
              setProfileData(data.profile);
              if (data.profile.age) setAge(data.profile.age);
              if (data.profile.gender) setGender(data.profile.gender);
              if (data.profile.heightCm) setHeight(data.profile.heightCm);
              if (data.profile.weightKg) setWeight(data.profile.weightKg);
              if (data.profile.activityLevel) setActivityLevel(data.profile.activityLevel);
              if (data.profile.sleepHours) setSleepHours(data.profile.sleepHours);
              if (data.profile.wakeTime) setWakeTime(data.profile.wakeTime);
              if (data.profile.bedtime) setBedtime(data.profile.bedtime);
              if (data.profile.waterIntakeLiters) setWaterIntake(data.profile.waterIntakeLiters);
              if (data.profile.occupation) setOccupation(data.profile.occupation);
              if (data.profile.exerciseFrequency) setExerciseFrequency(data.profile.exerciseFrequency);
              if (data.profile.medicalConditions && data.profile.medicalConditions.length > 0) {
                setMedicalHistory(data.profile.medicalConditions);
              }
              if (data.profile.dietType) setDietType(data.profile.dietType);
              if (data.profile.foodsLiked && data.profile.foodsLiked.length > 0) {
                setFoodLikes(data.profile.foodsLiked.join(', '));
              }
              if (data.profile.foodsToAvoid && data.profile.foodsToAvoid.length > 0) {
                setFoodDislikes(data.profile.foodsToAvoid.join(', '));
              }
              if (data.profile.allergies && data.profile.allergies.length > 0) {
                setFoodAllergies(data.profile.allergies.join(', '));
              }
              if (data.profile.cuisinePreference && data.profile.cuisinePreference.length > 0) {
                setCuisinePreference(data.profile.cuisinePreference.join(', '));
              }
            }
          }
        } catch (err) {
          console.error('Error fetching health profile inside wizard:', err);
        } finally {
          setProfileLoading(false);
        }
      };
      fetchProfile();
    }
  }, [showWizard, propProfileData]);

  const fetchCurrentPlan = async () => {
    setLoadingPlan(true);
    try {
      const data = await safeFetchJson(`${API_BASE}/current`);
      if (data.success && data.planRecord) {
        setActivePlanRecord(data.planRecord);
        const todayStr = new Date().toISOString().split('T')[0];
        const todayLog = data.planRecord.dailyLogs?.find(l => l.date === todayStr);
        if (todayLog) {
          setTodayCompletedTasks(todayLog.completedTaskIds || []);
          setCurrentWaterIntake(todayLog.waterIntakeLiters ?? 0);
          setLastNightSleep(todayLog.sleepHours ?? 7.5);
          setSleepQualityRating(todayLog.sleepQuality || 'Good');
        }
      } else {
        setActivePlanRecord(null);
        setShowWizard(false);
      }
    } catch (err) {
      console.error('Error fetching health plan:', err);
      setActivePlanRecord(null);
      setShowWizard(false);
    } finally {
      setLoadingPlan(false);
    }
  };

  const fetchPlanHistory = async () => {
    try {
      const data = await safeFetchJson(`${API_BASE}/history`);
      if (data.success && Array.isArray(data.history)) {
        setHistoryPlans(data.history);
      }
    } catch (err) {
      console.error('Error fetching plan history:', err);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to permanently delete this health plan?')) return;
    try {
      const data = await safeFetchJson(`${API_BASE}/plan/${planId}`, {
        method: 'DELETE'
      });
      if (data.success) {
        showToast('Plan deleted successfully');
        await fetchPlanHistory();
        if (activePlanRecord?._id === planId || activePlanRecord?.id === planId) {
          if (refreshActivePlan) {
            await refreshActivePlan();
          } else {
            setActivePlanRecord(null);
          }
        }
      }
    } catch (err) {
      console.error('Error deleting plan:', err);
      showToast('Failed to delete plan', 'error');
    }
  };

  // ─── WIZARD HANDLERS ─────────────────────────────────────────────────────────
  const toggleGoal = (goal) => {
    if (healthGoals.includes(goal)) {
      setHealthGoals(healthGoals.filter(g => g !== goal));
    } else {
      setHealthGoals([...healthGoals, goal]);
    }
  };

  const toggleMedical = (item) => {
    if (item === 'None') {
      setMedicalHistory(['None']);
      return;
    }
    let updated = medicalHistory.filter(m => m !== 'None');
    if (updated.includes(item)) {
      updated = updated.filter(m => m !== item);
    } else {
      updated.push(item);
    }
    if (updated.length === 0) updated = ['None'];
    setMedicalHistory(updated);
  };

  const handleGeneratePlan = async () => {
    setGenerating(true);
    setGenerationStep(0);

    const stepInterval = setInterval(() => {
      setGenerationStep(prev => {
        if (prev < generationSteps.length - 1) return prev + 1;
        return prev;
      });
    }, 900);

    try {
      const payload = {
        age: Number(age),
        gender,
        height: Number(height),
        weight: Number(weight),
        activityLevel,
        healthGoals: healthGoals.map(g => g === 'Other Goal' ? (otherGoalText || 'Custom Goal') : g),
        sleepHours: Number(sleepHours),
        wakeTime,
        bedtime,
        waterIntake: Number(waterIntake),
        occupation,
        smoking,
        alcohol,
        exerciseFrequency,
        medicalHistory,
        dietType,
        foodLikes,
        foodDislikes,
        foodAllergies,
        cuisinePreference,
        budgetPreference
      };

      const data = await safeFetchJson(`${API_BASE}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      clearInterval(stepInterval);

      if (data.success && data.planRecord) {
        setActivePlanRecord(data.planRecord);
        setShowWizard(false);
        fetchPlanHistory();
        if (refreshAllData) await refreshAllData();
        showToast('Your personalized AI Health Plan is ready! 🎉');
      } else {
        showToast(data.error || 'Failed to generate plan. Please try again.', 'error');
      }
    } catch (err) {
      clearInterval(stepInterval);
      console.error('Error generating plan:', err);
      showToast('Network error while generating plan', 'error');
    } finally {
      setGenerating(false);
    }
  };

  // ─── DAILY TRACKER HANDLERS ──────────────────────────────────────────────────
  const toggleTaskCompletion = async (taskId) => {
    const updated = todayCompletedTasks.includes(taskId)
      ? todayCompletedTasks.filter(id => id !== taskId)
      : [...todayCompletedTasks, taskId];
    
    setTodayCompletedTasks(updated);

    if (activePlanRecord) {
      try {
        await safeFetchJson(`${API_BASE}/daily-log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: activePlanRecord._id || activePlanRecord.id,
            completedTaskIds: updated,
            waterIntakeLiters: currentWaterIntake,
            sleepHours: lastNightSleep,
            sleepQuality: sleepQualityRating,
            weight: currentWeightLog
          })
        });
        if (refreshAllData) await refreshAllData();
      } catch (err) {
        console.error('Error updating log:', err);
      }
    }
  };

  const handleWaterAdd = async (amountLiters) => {
    const goalLiters = activePlanRecord?.plan?.waterIntakeGoalLiters || 3.5;
    const newWater = amountLiters === 0 ? 0 : Math.min(goalLiters + 1.0, Math.max(0, currentWaterIntake + amountLiters));
    const rounded = Math.round(newWater * 100) / 100;
    setCurrentWaterIntake(rounded);

    // Auto mark water task if goal reached
    const waterTaskId = activePlanRecord?.plan?.dailyTasks?.find(t => t.category === 'Hydration')?.id;
    let newCompleted = todayCompletedTasks;
    if (waterTaskId && rounded >= goalLiters && !todayCompletedTasks.includes(waterTaskId)) {
      newCompleted = [...todayCompletedTasks, waterTaskId];
      setTodayCompletedTasks(newCompleted);
      showToast('Hydration Goal Reached! 💧');
    }

    if (activePlanRecord) {
      try {
        await safeFetchJson(`${API_BASE}/daily-log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: activePlanRecord._id || activePlanRecord.id,
            completedTaskIds: newCompleted,
            waterIntakeLiters: rounded,
            sleepHours: lastNightSleep,
            sleepQuality: sleepQualityRating
          })
        });
        if (refreshAllData) await refreshAllData();
      } catch (err) {
        console.error('Error updating water log:', err);
      }
    }
  };

  // ─── DAILY FEEDBACK SUBMIT ───────────────────────────────────────────────────
  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    try {
      const data = await safeFetchJson(`${API_BASE}/daily-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: activePlanRecord?._id || activePlanRecord?.id,
          mood: feedbackMood,
          energyLevel: Number(feedbackEnergy),
          mealsFollowed: feedbackMeals,
          workoutCompleted: feedbackWorkout,
          waterCompleted: currentWaterIntake >= (activePlanRecord?.plan?.waterIntakeGoalLiters || 3.5) ? 'Yes' : 'Partial',
          sleepQuality: sleepQualityRating,
          feedbackText: feedbackNotes
        })
      });

      if (data.success && data.dynamicInsight) {
        setDynamicInsight(data.dynamicInsight);
        showToast('Feedback submitted! Gemini updated tomorrow’s recommendations ✨');
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      showToast('Failed to submit feedback', 'error');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // ─── WEEKLY AI REVIEW GENERATOR ──────────────────────────────────────────────
  const handleGenerateWeeklyReview = async () => {
    setLoadingWeeklyReview(true);
    setShowWeeklyReviewModal(true);
    try {
      const data = await safeFetchJson(`${API_BASE}/weekly-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: activePlanRecord?._id || activePlanRecord?.id })
      });
      if (data.success && data.review) {
        setWeeklyReviewData(data.review);
      }
    } catch (err) {
      console.error('Error generating weekly review:', err);
    } finally {
      setLoadingWeeklyReview(false);
    }
  };

  // ─── CHAT HANDLER ────────────────────────────────────────────────────────────
  const handleSendChatMessage = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userQ = chatInput.trim();
    setChatInput('');
    const newMsgList = [...chatMessages, { role: 'user', content: userQ }];
    setChatMessages(newMsgList);
    setChatLoading(true);

    try {
      const data = await safeFetchJson(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userQ,
          userContext: {
            goals: activePlanRecord?.onboarding?.healthGoals,
            dietType: activePlanRecord?.onboarding?.dietType,
            waterTarget: activePlanRecord?.plan?.waterIntakeGoalLiters,
            medicalHistory: activePlanRecord?.onboarding?.medicalHistory
          },
          history: newMsgList.slice(-6)
        })
      });

      if (data.success && data.reply) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', content: 'I am here to guide your wellness journey! How else can I assist your health plan today?' }]);
      }
    } catch (err) {
      console.error('Error in chat:', err);
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Apologies, I encountered a temporary connection issue. Please ask again!' }]);
    } finally {
      setChatLoading(false);
    }
  };

  // ─── CALCULATE DAILY HEALTH SCORE ───────────────────────────────────────────
  const calculateDailyScore = () => {
    if (!activePlanRecord?.plan?.dailyTasks) return 0;
    const tasks = activePlanRecord.plan.dailyTasks;
    if (tasks.length === 0) return 0;
    const completedCount = todayCompletedTasks.length;
    return Math.min(100, Math.round((completedCount / tasks.length) * 100));
  };

  const getMissingFields = () => {
    const missing = [];
    if (!profileData) return ['age', 'gender', 'height', 'weight', 'sleepHours', 'waterIntake', 'activityLevel'];
    if (!profileData.age) missing.push('age');
    if (!profileData.gender) missing.push('gender');
    if (!profileData.heightCm) missing.push('height');
    if (!profileData.weightKg) missing.push('weight');
    if (!profileData.sleepHours) missing.push('sleepHours');
    if (!profileData.waterIntakeLiters) missing.push('waterIntake');
    if (!profileData.activityLevel) missing.push('activityLevel');
    return missing;
  };

  const healthScore = calculateDailyScore();

  // ─── RENDER LOADING SKELETON ─────────────────────────────────────────────────
  if (loadingPlan) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto animate-pulse">
        <div className="h-44 bg-slate-200 dark:bg-slate-900 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-200 dark:bg-slate-900 rounded-3xl" />
          <div className="h-64 bg-slate-200 dark:bg-slate-900 rounded-3xl" />
          <div className="h-64 bg-slate-200 dark:bg-slate-900 rounded-3xl" />
        </div>
      </div>
    );
  }

  // ─── RENDER FIRST-TIME SETUP WIZARD ─────────────────────────────────────────
  if (showWizard) {
    const missing = getMissingFields();
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-cyan-600 rounded-[28px] p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Sparkles className="w-64 h-64" />
          </div>
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold tracking-wider uppercase mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              AI Personalized Health Coach
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
              Setup Your AI Health Plan
            </h2>
            <p className="text-sky-100 text-sm leading-relaxed">
              Answer a few quick lifestyle questions. Gemini AI will craft your tailored daily diet, workout program, hydration goals, and habit trackers.
            </p>
          </div>
          
          {/* Step Stepper */}
          <div className="mt-8 pt-6 border-t border-white/15 flex items-center justify-between text-xs font-bold">
            {[1, 2, 3].map(st => (
              <div key={st} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  wizardStep === st
                    ? 'bg-white text-sky-600 font-black shadow-lg scale-110'
                    : wizardStep > st
                    ? 'bg-sky-400 text-white'
                    : 'bg-white/20 text-white/60'
                }`}>
                  {st}
                </div>
                <span className="hidden md:inline text-[11px] text-sky-100">
                  {st === 1 && 'Select Goals'}
                  {st === 2 && 'Additional Info'}
                  {st === 3 && 'Confirm & Generate'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Wizard Form Container */}
        <div className="bg-white dark:bg-[#080b11] border border-slate-200 dark:border-slate-800 rounded-[28px] p-6 sm:p-10 shadow-xl transition-all">
          
          {/* STEP 1: Goal Selection */}
          {wizardStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-sky-500" />
                  Step 1: Select Your Health Goals
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Choose one or multiple goals. Gemini will optimize macro distributions and workout intensities accordingly.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableGoals.map(goal => {
                  const isSelected = healthGoals.includes(goal);
                  return (
                    <div
                      key={goal}
                      onClick={() => toggleGoal(goal)}
                      className={`p-4 rounded-2xl border text-left text-sm font-bold cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-sky-500 bg-sky-500/10 text-sky-500 shadow-md ring-1 ring-sky-500'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 hover:border-sky-400'
                      }`}
                    >
                      <span>{goal}</span>
                      {isSelected && <Check className="w-4 h-4 text-sky-500 shrink-0" />}
                    </div>
                  );
                })}
              </div>

              {healthGoals.includes('Other Goal') && (
                <div className="mt-4 space-y-2 animate-slideDown">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Please specify your custom goal
                  </label>
                  <input
                    type="text"
                    value={otherGoalText}
                    onChange={e => setOtherGoalText(e.target.value)}
                    placeholder="e.g. Train for a marathon, Improve flexibility"
                    className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 font-semibold focus:outline-none focus:border-sky-500 text-slate-900 dark:text-white"
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Collect Additional Information */}
          {wizardStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-sky-500" />
                    Step 2: Collect Health Information
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Provide your biometric details and preferences.
                  </p>
                </div>
                {profileData && (
                  <button
                    onClick={() => setShowFullForm(!showFullForm)}
                    className="text-xs font-bold text-sky-500 hover:text-sky-400 border border-sky-500/30 rounded-lg px-3 py-1.5 hover:bg-sky-500/5 transition-all"
                  >
                    {showFullForm ? 'Show Missing Only' : 'Show All Fields'}
                  </button>
                )}
              </div>

              {profileLoading ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <span className="text-xs font-bold text-slate-500">Loading your profile details...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Notice box */}
                  {!showFullForm && missing.length > 0 && (
                    <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 flex gap-3 text-xs text-indigo-700 dark:text-indigo-300">
                      <Info className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        We've fetched your health profile and noticed a few missing details. Please complete them below to help us personalize your plan.
                      </div>
                    </div>
                  )}

                  {!showFullForm && missing.length === 0 && (
                    <div className="p-8 text-center space-y-5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 dark:border-emerald-500/30 flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <Check className="w-6 h-6" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-base font-black text-slate-900 dark:text-white">All Details Imported!</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                          We successfully imported all biometric and lifestyle fields from your active Health Profile.
                        </p>
                      </div>
                      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => setWizardStep(3)}
                          className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-600/15 cursor-pointer transition-all inline-flex items-center justify-center gap-1.5"
                        >
                          Proceed to Review & Confirm
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowFullForm(true)}
                          className="w-full sm:w-auto px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer transition-all border border-slate-200 dark:border-slate-700"
                        >
                          Show / Edit All Fields
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Render Age */}
                    {(showFullForm || missing.includes('age')) && (
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                          Age (Years)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="120"
                          value={age}
                          onChange={e => setAge(e.target.value)}
                          className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 font-semibold focus:outline-none focus:border-sky-500 text-slate-900 dark:text-white"
                        />
                      </div>
                    )}

                    {/* Render Gender */}
                    {(showFullForm || missing.includes('gender')) && (
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                          Gender
                        </label>
                        <select
                          value={gender}
                          onChange={e => setGender(e.target.value)}
                          className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 font-semibold focus:outline-none focus:border-sky-500 text-slate-900 dark:text-white"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Non-binary">Non-binary</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </div>
                    )}

                    {/* Render Height */}
                    {(showFullForm || missing.includes('height')) && (
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                          Height (cm)
                        </label>
                        <input
                          type="number"
                          min="50"
                          max="250"
                          value={height}
                          onChange={e => setHeight(e.target.value)}
                          className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 font-semibold focus:outline-none focus:border-sky-500 text-slate-900 dark:text-white"
                        />
                      </div>
                    )}

                    {/* Render Weight */}
                    {(showFullForm || missing.includes('weight')) && (
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                          Weight (kg)
                        </label>
                        <input
                          type="number"
                          min="20"
                          max="300"
                          value={weight}
                          onChange={e => setWeight(e.target.value)}
                          className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 font-semibold focus:outline-none focus:border-sky-500 text-slate-900 dark:text-white"
                        />
                      </div>
                    )}

                    {/* Render Sleep Hours */}
                    {(showFullForm || missing.includes('sleepHours')) && (
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                          Sleep Hours per Night
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="4"
                          max="14"
                          value={sleepHours}
                          onChange={e => setSleepHours(e.target.value)}
                          className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 font-semibold focus:outline-none focus:border-sky-500 text-slate-900 dark:text-white"
                        />
                      </div>
                    )}

                    {/* Render Water Intake */}
                    {(showFullForm || missing.includes('waterIntake')) && (
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                          Daily Water Intake (Liters)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          max="10"
                          value={waterIntake}
                          onChange={e => setWaterIntake(e.target.value)}
                          className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 font-semibold focus:outline-none focus:border-sky-500 text-slate-900 dark:text-white"
                        />
                      </div>
                    )}
                  </div>

                  {/* Render Activity Level if missing or showFullForm */}
                  {(showFullForm || missing.includes('activityLevel')) && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        Activity Level
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {activityOptions.map(opt => (
                          <div
                            key={opt.label}
                            onClick={() => setActivityLevel(opt.label)}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                              activityLevel === opt.label
                                ? 'border-sky-500 bg-sky-500/10 text-sky-500 font-bold shadow-md'
                                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="text-sm font-bold">{opt.label}</div>
                            <div className="text-xs opacity-75 mt-0.5">{opt.desc}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dietary Preferences and Allergies (collapsible / secondary fields) */}
                  {showFullForm && (
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-6 animate-slideDown">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Dietary & Food Preferences</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">Diet Type</label>
                          <select
                            value={dietType}
                            onChange={e => setDietType(e.target.value)}
                            className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 font-semibold focus:outline-none focus:border-sky-500 text-slate-900 dark:text-white"
                          >
                            {dietTypeOptions.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">Medical History / Conditions</label>
                          <input
                            type="text"
                            value={medicalHistory.join(', ')}
                            onChange={e => setMedicalHistory(e.target.value.split(',').map(s => s.trim()))}
                            className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 font-semibold focus:outline-none focus:border-sky-500 text-slate-900 dark:text-white"
                            placeholder="e.g. Hypertension, None"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">Foods You Like</label>
                          <input
                            type="text"
                            value={foodLikes}
                            onChange={e => setFoodLikes(e.target.value)}
                            className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 font-semibold focus:outline-none focus:border-sky-500 text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">Food Allergies</label>
                          <input
                            type="text"
                            value={foodAllergies}
                            onChange={e => setFoodAllergies(e.target.value)}
                            className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 font-semibold focus:outline-none focus:border-sky-500 text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Review & Confirm */}
          {wizardStep === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-sky-500" />
                  Step 3: Review & Confirm Details
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Verify the parameters that Gemini AI will use to build your health recommendations.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 space-y-2">
                  <div className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Health Goals</div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100 flex flex-wrap gap-1.5">
                    {healthGoals.map(g => g === 'Other Goal' ? (otherGoalText || 'Custom Goal') : g).map(g => (
                      <span key={g} className="px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 space-y-2">
                  <div className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Biometrics</div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Age: <span className="text-slate-600 dark:text-slate-300 font-semibold">{age} yrs</span> | 
                    Gender: <span className="text-slate-600 dark:text-slate-300 font-semibold"> {gender}</span> | 
                    Height: <span className="text-slate-600 dark:text-slate-300 font-semibold"> {height} cm</span> | 
                    Weight: <span className="text-slate-600 dark:text-slate-300 font-semibold"> {weight} kg</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 space-y-2">
                  <div className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Lifestyle & Habits</div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Activity: <span className="text-slate-600 dark:text-slate-300 font-semibold">{activityLevel}</span> | 
                    Sleep: <span className="text-slate-600 dark:text-slate-300 font-semibold"> {sleepHours} hours</span> | 
                    Water Target: <span className="text-slate-600 dark:text-slate-300 font-semibold"> {waterIntake} L</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 space-y-2">
                  <div className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Dietary Preferences</div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Diet Style: <span className="text-slate-600 dark:text-slate-300 font-semibold">{dietType}</span> | 
                    Likes: <span className="text-slate-600 dark:text-slate-300 font-semibold text-xs leading-relaxed"> {foodLikes || 'None'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 text-center">
                {generating ? (
                  <div className="max-w-sm mx-auto p-6 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <div className="text-xs font-bold text-sky-500 animate-pulse">
                      {generationSteps[generationStep]}
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-sky-500 to-cyan-500 h-full transition-all duration-500"
                        style={{ width: `${((generationStep + 1) / generationSteps.length) * 100}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleGeneratePlan}
                    className="px-8 py-4 bg-gradient-to-r from-sky-600 via-indigo-600 to-cyan-600 text-white font-black text-sm rounded-2xl shadow-xl hover:shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer inline-flex items-center gap-3"
                  >
                    <Sparkles className="w-5 h-5" />
                    Generate My AI Health Plan
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          {!generating && (
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              {wizardStep > 1 ? (
                <button
                  onClick={() => setWizardStep(prev => prev - 1)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
                >
                  Previous Step
                </button>
              ) : (
                <button
                  onClick={() => setShowWizard(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
                >
                  Cancel Setup
                </button>
              )}

              {wizardStep < 3 ? (
                <button
                  onClick={() => setWizardStep(prev => prev + 1)}
                  className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-2"
                >
                  Next Step
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : null}
            </div>
          )}

        </div>
      </div>
    );
  }

  // Extract plan objects
  const planData = activePlanRecord?.plan;
  const onboardingData = activePlanRecord?.onboarding;

  if (!planData) {
    return (
      <div className="max-w-2xl mx-auto my-12 text-center p-8 rounded-3xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-xl shadow-xl space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-500/10 dark:bg-indigo-400/10 flex items-center justify-center border border-indigo-500/20 dark:border-indigo-400/20">
          <Sparkles className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
            No Active Health Plan
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
            Create your first personalized AI Health Plan to receive customized diet, workout, and wellness recommendations.
          </p>
        </div>
        <div>
          <button
            onClick={() => {
              setShowWizard(true);
              setWizardStep(1);
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-bold hover:shadow-lg hover:shadow-indigo-500/20 dark:hover:shadow-indigo-400/20 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Create My Health Plan
          </button>
        </div>
      </div>
    );
  }

  // ─── MAIN DASHBOARD RENDER ───────────────────────────────────────────────────
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2.5 animate-bounce ${
          toastMessage.type === 'error' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
        }`}>
          <CheckCircle2 className="w-4 h-4" />
          {toastMessage.msg}
        </div>
      )}

      {/* TOP HEADER BAR */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 bg-white dark:bg-[#080b11] border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 sm:px-6 sm:py-5 shadow-sm transition-all">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-500 text-white flex items-center justify-center shadow-md shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex flex-col justify-center min-w-0 gap-0.5">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight whitespace-nowrap">
                AI Health Planner
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-bold whitespace-nowrap">
                Active Plan
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
              Goal: <span className="text-sky-500 font-semibold">{onboardingData?.healthGoals?.join(', ')}</span> • {onboardingData?.dietType}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => setShowChatModal(true)}
            className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Ask Coach</span>
          </button>

          <button
            onClick={() => setShowFeedbackModal(true)}
            className="px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Daily Check-in</span>
          </button>

          <button
            onClick={handleGenerateWeeklyReview}
            className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
          >
            <Award className="w-3.5 h-3.5" />
            <span>Weekly Review</span>
          </button>

          <button
            onClick={() => setShowNotifDrawer(true)}
            className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-sky-500 rounded-lg transition-all cursor-pointer"
            title="Notification Reminders"
          >
            <Bell className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowHistoryModal(true)}
            className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-sky-500 rounded-lg transition-all cursor-pointer"
            title="Plan History"
          >
            <Calendar className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => { setShowWizard(true); setWizardStep(1); }}
            className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Regenerate</span>
          </button>
        </div>
      </div>

      {/* DYNAMIC INSIGHT BANNER (If daily feedback submitted) */}
      {dynamicInsight && (
        <div className="bg-gradient-to-r from-indigo-900/40 to-sky-900/40 border border-indigo-500/30 rounded-[24px] p-5 text-slate-100 flex items-start gap-4 shadow-lg animate-fadeIn">
          <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400 shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400">
              Gemini Dynamic Insight ({dynamicInsight.tomorrowFocus})
            </h3>
            <p className="text-xs font-semibold leading-relaxed">
              {dynamicInsight.updatedAdvice}
            </p>
            <div className="text-[11px] italic text-indigo-300 pt-1">
              "{dynamicInsight.motivationalQuote}"
            </div>
          </div>
        </div>
      )}

      {/* 4 HIGHLIGHT METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Metric 1: Daily Caloric Target */}
        <div className="bg-white dark:bg-[#080b11] border border-slate-200 dark:border-slate-800 rounded-[24px] p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Daily Target</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {planData.estimatedDailyCalories} <span className="text-xs font-semibold text-slate-400">kcal</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Based on {onboardingData?.activityLevel.toLowerCase()} routine
          </p>
        </div>

        {/* Metric 2: Water Goal */}
        <div className="bg-white dark:bg-[#080b11] border border-slate-200 dark:border-slate-800 rounded-[24px] p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Water Goal</span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
              <Droplets className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {currentWaterIntake} / {planData.waterIntakeGoalLiters} <span className="text-xs font-semibold text-slate-400">Liters</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className="bg-sky-500 h-full transition-all duration-500"
              style={{ width: `${Math.min(100, (currentWaterIntake / planData.waterIntakeGoalLiters) * 100)}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Sleep Recommendation */}
        <div className="bg-white dark:bg-[#080b11] border border-slate-200 dark:border-slate-800 rounded-[24px] p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Sleep Schedule</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Moon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {lastNightSleep} / {planData.sleepRecommendationHours} <span className="text-xs font-semibold text-slate-400">Hours</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Quality: <span className="font-bold text-indigo-400">{sleepQualityRating}</span>
          </p>
        </div>

        {/* Metric 4: Daily Health Score */}
        <div className="bg-white dark:bg-[#080b11] border border-slate-200 dark:border-slate-800 rounded-[24px] p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Health Score</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {healthScore}%
            </div>
            {/* SVG Circular Ring */}
            <div className="relative w-10 h-10">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-slate-200 dark:text-slate-800" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-emerald-500 stroke-current transition-all duration-700" strokeWidth="3.5" strokeDasharray={`${healthScore}, 100`} strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {todayCompletedTasks.length} of {planData.dailyTasks?.length || 5} tasks completed
          </p>
        </div>

      </div>

      {/* EXECUTIVE STRATEGY & MOTIVATION BANNER */}
      <div className="bg-white dark:bg-[#080b11] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm transition-colors space-y-3">
        <div className="flex items-center gap-2 text-sky-500 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Executive Strategy & Daily Motivation</span>
        </div>
        <p className="text-base sm:text-lg font-bold italic text-slate-800 dark:text-slate-100 leading-snug">
          "{planData.motivationMessage}"
        </p>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl">
          {planData.executiveSummary}
        </p>
      </div>

      {/* MAIN TWO COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT 2 COLUMNS: DIET & WORKOUT */}
        <div className="lg:col-span-2 space-y-8">

          {/* TODAY'S DIET PLAN */}
          <div className="bg-white dark:bg-[#080b11] border border-slate-200 dark:border-slate-800 rounded-[28px] p-6 shadow-xl space-y-5">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Apple className="w-5 h-5 text-sky-500" />
                Today's Nutrition & Meal Plan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Calculated macros tailored to your {onboardingData?.dietType} preference.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: 'Breakfast', icon: Sun, meal: planData.dailyDietPlan?.breakfast },
                { title: 'Lunch', icon: Apple, meal: planData.dailyDietPlan?.lunch },
                { title: 'Dinner', icon: Moon, meal: planData.dailyDietPlan?.dinner },
                { title: 'Snacks', icon: Flame, meal: planData.dailyDietPlan?.snacks }
              ].map(item => {
                const MealIcon = item.icon;
                return (
                  <div key={item.title} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-sky-500">
                        <MealIcon className="w-4 h-4" />
                        {item.title} ({item.meal?.time})
                      </div>
                      <span className="text-[11px] font-black text-slate-900 dark:text-white">
                        {item.meal?.calories} kcal
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {item.meal?.name}
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {item.meal?.description}
                    </p>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold text-slate-400">
                      <span>P: {item.meal?.protein}</span>
                      <span>C: {item.meal?.carbs}</span>
                      <span>F: {item.meal?.fat}</span>
                      <span>Fiber: {item.meal?.fiber}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* WEEKLY MEAL SCHEDULE */}
          <div className="bg-white dark:bg-[#080b11] border border-slate-200 dark:border-slate-800 rounded-[28px] p-6 shadow-xl space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sky-500" />
                7-Day Weekly Meal Schedule
              </h3>
            </div>

            {/* Day Selector Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                <button
                  key={d}
                  onClick={() => setSelectedMealDay(d)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                    selectedMealDay === d
                      ? 'bg-sky-500 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-sky-500'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Selected Day Meal Info */}
            {(() => {
              const dayItem = planData.weeklyMealPlan?.find(m => m.day === selectedMealDay) || planData.weeklyMealPlan?.[0];
              return (
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-3 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span>{dayItem?.day} Menu</span>
                    <span className="text-sky-500">~{dayItem?.approxCalories} Total Calories</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700 dark:text-slate-300">
                    <div><span className="font-bold text-slate-400">Breakfast:</span> {dayItem?.breakfast}</div>
                    <div><span className="font-bold text-slate-400">Lunch:</span> {dayItem?.lunch}</div>
                    <div><span className="font-bold text-slate-400">Dinner:</span> {dayItem?.dinner}</div>
                    <div><span className="font-bold text-slate-400">Snack:</span> {dayItem?.snack}</div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* WORKOUT PLAN */}
          <div className="bg-white dark:bg-[#080b11] border border-slate-200 dark:border-slate-800 rounded-[28px] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-sky-500" />
                  {planData.workoutPlan?.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Est. Burn: <span className="font-bold text-amber-500">{planData.workoutPlan?.caloriesBurnedEst} kcal</span> • Duration: <span className="font-bold text-sky-500">{planData.workoutPlan?.durationMinutes} mins</span>
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-indigo-500/10 text-indigo-500 rounded-full">
                {planData.workoutPlan?.difficulty}
              </span>
            </div>

            {/* Warmup & Cooldown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                <div className="font-bold text-sky-500 mb-1">Warm-Up Protocol</div>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-1 text-[11px]">
                  {planData.workoutPlan?.warmup?.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                <div className="font-bold text-indigo-500 mb-1">Cooldown & Mobility</div>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-1 text-[11px]">
                  {planData.workoutPlan?.cooldown?.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            </div>

            {/* Main Workout Exercises Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <th className="pb-2">Exercise</th>
                    <th className="pb-2">Sets & Reps / Duration</th>
                    <th className="pb-2">Target Benefit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {planData.workoutPlan?.mainWorkout?.map((ex, idx) => (
                    <tr key={idx} className="text-slate-800 dark:text-slate-200">
                      <td className="py-2.5 font-bold">{ex.name}</td>
                      <td className="py-2.5 text-sky-500 font-semibold">{ex.setsRepsOrDuration}</td>
                      <td className="py-2.5 text-slate-400">{ex.targetMuscleOrBenefit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: HABITS & ADVICE */}
        <div className="space-y-8">
          
          {/* FOODS TO PREFER VS LIMIT */}
          <div className="bg-white dark:bg-[#080b11] border border-slate-200 dark:border-slate-800 rounded-[28px] p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Apple className="w-4 h-4 text-emerald-500" />
              Nutritional Choices Guide
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-1.5">
                <div className="font-bold text-emerald-500 flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> Foods to Prefer
                </div>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1 text-[11px]">
                  {planData.foodsToPrefer?.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-1.5">
                <div className="font-bold text-rose-500 flex items-center gap-1.5">
                  <X className="w-4 h-4" /> Foods to Limit
                </div>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1 text-[11px]">
                  {planData.foodsToAvoid?.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            </div>
          </div>

          {/* WEEKLY CHALLENGE CARD */}
          {planData.weeklyChallenge && (
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-[28px] p-6 shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-amber-500 text-xs font-black uppercase tracking-wider">
                <Award className="w-4 h-4" />
                Weekly Challenge
              </div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                {planData.weeklyChallenge.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {planData.weeklyChallenge.target}
              </p>
              <div className="flex items-center justify-between text-xs font-bold text-amber-500">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 bg-amber-500/20 rounded-full">
                  {planData.weeklyChallenge.durationDays} Days Left
                </span>
              </div>
            </div>
          )}

          {/* MEDICAL DISCLAIMER */}
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed flex items-start gap-2.5">
            <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
            <span>
              {planData.disclaimer}
            </span>
          </div>

        </div>

      </div>

      {/* ─── DYNAMIC DAILY FEEDBACK MODAL ────────────────────────────────────── */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#080b11] border border-slate-200 dark:border-slate-800 rounded-[28px] max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-fadeIn relative">
            <button
              onClick={() => setShowFeedbackModal(false)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-sky-500" />
                End-of-Day Health Check-in
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                How was your day? Gemini uses your feedback to adjust tomorrow’s routine!
              </p>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Overall Mood</label>
                <div className="grid grid-cols-5 gap-1.5 text-[11px] font-bold text-center">
                  {['Great', 'Good', 'Okay', 'Exhausted', 'Stressed'].map(m => (
                    <div
                      key={m}
                      onClick={() => setFeedbackMood(m)}
                      className={`py-2 rounded-xl border cursor-pointer transition-all ${
                        feedbackMood === m ? 'border-sky-500 bg-sky-500/10 text-sky-500' : 'border-slate-200 dark:border-slate-800 text-slate-500'
                      }`}
                    >
                      {m}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Energy Level (1-10)</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={feedbackEnergy}
                  onChange={e => setFeedbackEnergy(e.target.value)}
                  className="w-full text-sky-500"
                />
                <div className="text-right text-sky-500 font-bold text-xs">{feedbackEnergy} / 10</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Meals Followed?</label>
                  <select
                    value={feedbackMeals}
                    onChange={e => setFeedbackMeals(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="Yes">Yes, 100%</option>
                    <option value="Partial">Partial</option>
                    <option value="No">No / Off-track</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Workout Completed?</label>
                  <select
                    value={feedbackWorkout}
                    onChange={e => setFeedbackWorkout(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="Yes">Yes, Fully</option>
                    <option value="Partial">Partial</option>
                    <option value="Skipped">Skipped / Rest</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Notes / How do you feel?</label>
                <textarea
                  rows="3"
                  value={feedbackNotes}
                  onChange={e => setFeedbackNotes(e.target.value)}
                  placeholder="e.g. Slightly sore legs, felt energetic after lunch..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <button
                type="submit"
                disabled={submittingFeedback}
                className="w-full py-3 bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-black rounded-xl cursor-pointer shadow-lg hover:shadow-sky-500/20"
              >
                {submittingFeedback ? 'Updating AI Recommendations...' : 'Submit Feedback & Update Plan'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── WEEKLY REVIEW MODAL ──────────────────────────────────────────────── */}
      {showWeeklyReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#080b11] border border-slate-200 dark:border-slate-800 rounded-[28px] max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-fadeIn relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowWeeklyReviewModal(false)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-500" />
                7-Day Weekly AI Performance Review
              </h3>
            </div>

            {loadingWeeklyReview ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-emerald-500">Gemini is synthesizing your weekly telemetry & progress...</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
                  {weeklyReviewData?.summary}
                </p>

                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                  <div className="font-bold text-emerald-500">Key Achievements</div>
                  <ul className="list-disc list-inside text-slate-700 dark:text-slate-200 space-y-1">
                    {weeklyReviewData?.achievements?.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                  <div className="font-bold text-amber-500">Areas to Improve</div>
                  <ul className="list-disc list-inside text-slate-700 dark:text-slate-200 space-y-1">
                    {weeklyReviewData?.areasToImprove?.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 space-y-2">
                  <div className="font-bold text-sky-500">New Goals Next Week</div>
                  <ul className="list-disc list-inside text-slate-700 dark:text-slate-200 space-y-1">
                    {weeklyReviewData?.newGoals?.map((g, i) => <li key={i}>{g}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── AI CHAT MODAL ("Ask My Health Coach") ───────────────────────────── */}
      {showChatModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#080b11] border border-slate-200 dark:border-slate-800 rounded-[28px] max-w-2xl w-full h-[600px] flex flex-col shadow-2xl relative overflow-hidden animate-fadeIn">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Ask My Health Coach</h3>
                  <span className="text-[10px] text-emerald-500 font-bold">● Active Context Sync</span>
                </div>
              </div>
              <button
                onClick={() => setShowChatModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div className={`p-3.5 rounded-2xl max-w-md leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-sky-500 text-white rounded-br-none font-semibold'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200 dark:border-slate-800'
                  }`}>
                    {msg.role === 'assistant' ? formatMarkdown(msg.content) : msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {chatLoading && (
                <div className="flex items-center gap-2 text-slate-400 text-xs italic">
                  <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  Gemini Health Coach is typing...
                </div>
              )}
            </div>

            {/* Sample Prompt Chips */}
            <div className="px-5 py-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center gap-2 overflow-x-auto text-[11px]">
              {['What should I eat today?', 'Suggest healthy snacks', 'I missed today workout', 'Feeling tired advice'].map(prompt => (
                <button
                  key={prompt}
                  onClick={() => { setChatInput(prompt); }}
                  className="px-3 py-1 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-sky-500 rounded-full whitespace-nowrap cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSendChatMessage} className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Ask about diet, workout modifications, or energy boost..."
                className="flex-1 px-4 py-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-semibold focus:outline-none focus:border-sky-500 text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={chatLoading}
                className="p-3 bg-sky-500 hover:bg-sky-400 text-white rounded-xl shadow-md cursor-pointer transition-all shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

          </div>
        </div>
      )}

      {/* ─── NOTIFICATION REMINDERS DRAWER ─────────────────────────────────── */}
      {showNotifDrawer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-end">
          <div className="bg-white dark:bg-[#080b11] border-l border-slate-200 dark:border-slate-800 max-w-md w-full h-full p-6 space-y-6 shadow-2xl overflow-y-auto animate-fadeIn relative">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-sky-500" />
                Notification & Reminder Settings
              </h3>
              <button onClick={() => setShowNotifDrawer(false)} className="p-2 text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {[
                { title: 'Water Reminders', key: 'waterReminders', timeKey: 'waterTime' },
                { title: 'Meal Schedule Alerts', key: 'mealReminders' },
                { title: 'Workout Reminders', key: 'workoutReminders' },
                { title: 'Bedtime Reminders', key: 'sleepReminders' },
                { title: 'Weekly Review Summary', key: 'weeklyReviewReminders' },
                { title: 'Daily Motivation Quote', key: 'dailyMotivationReminders' }
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{item.title}</span>
                  <input
                    type="checkbox"
                    checked={notifSettings[item.key]}
                    onChange={e => setNotifSettings({ ...notifSettings, [item.key]: e.target.checked })}
                    className="w-4 h-4 accent-sky-500 cursor-pointer"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={() => { setShowNotifDrawer(false); showToast('Reminder preferences saved! 🔔'); }}
              className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer"
            >
              Save Preferences
            </button>
          </div>
        </div>
      )}

      {/* ─── PLAN HISTORY & COMPARISON MODAL ──────────────────────────────── */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#080b11] border border-slate-200 dark:border-slate-800 rounded-[28px] max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-fadeIn relative max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sky-500" />
                AI Health Plan History
              </h3>
              <button onClick={() => setShowHistoryModal(false)} className="p-2 text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {historyPlans.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No past plans recorded.</p>
            ) : (
              <div className="space-y-3 text-xs">
                {historyPlans.map(p => (
                  <div key={p.id || p._id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {p.onboarding?.healthGoals?.join(', ')} Plan
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Created: {new Date(p.createdAt).toLocaleDateString()} • Cal: {p.plan?.estimatedDailyCalories} kcal • Water: {p.plan?.waterIntakeGoalLiters} L
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setActivePlanRecord(p); setShowHistoryModal(false); showToast('Loaded selected plan!'); }}
                        className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white font-bold text-[11px] rounded-lg cursor-pointer transition-colors"
                      >
                        Activate
                      </button>
                      <button
                        onClick={() => handleDeletePlan(p._id || p.id)}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg cursor-pointer border border-rose-500/20 transition-colors"
                        title="Delete Plan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
