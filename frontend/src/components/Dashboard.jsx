import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  LayoutDashboard, Heart, Users, User, FileText, ShoppingCart,
  TrendingUp, Zap, AlertTriangle, Sparkles, Bell,
  Settings, LogOut, Sun, Moon, Menu, Plus, X, Lock,
  Send, Mic, Activity, RefreshCw, AlertCircle, Check,
  Trash2, ChevronRight, ArrowDownRight, MoreVertical,
  ShieldCheck, Clock, Phone, Video, Download, Eye,
  Upload, MapPin, TrendingDown, HelpCircle, Calendar,
  Pill, Building, Search, CreditCard, Shield,
  FileHeart, ZoomIn, ZoomOut, Maximize, ChevronDown, ChevronUp, FileCode, Loader2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import NearbyHospitals from './NearbyHospitals';
import MedicalReportAnalyzer from './MedicalReportAnalyzer';
import AIHealthPlanner from './AIHealthPlanner';
import HealthAnalytics from './HealthAnalytics';
import EmergencySOS from './EmergencySOS';
import HealthProfileSettings from './HealthProfileSettings';
import { LOGO_BASE64 } from './logoBase64';
import { BACKEND_URL } from '../config/api';

const MedicineBox = ({ name, category }) => {
  const themeColors = {
    'Fever & Pain': {
      bg: 'from-blue-600 to-indigo-700',
      accent: 'bg-blue-400',
      pill: 'bg-white',
      shadow: 'shadow-blue-500/20'
    },
    'Heart Health': {
      bg: 'from-rose-600 to-red-700',
      accent: 'bg-rose-400',
      pill: 'bg-red-200',
      shadow: 'shadow-red-500/20'
    },
    'Diabetes Care': {
      bg: 'from-emerald-600 to-teal-700',
      accent: 'bg-emerald-400',
      pill: 'bg-emerald-200',
      shadow: 'shadow-emerald-500/20'
    },
    'Bacterial Infections': {
      bg: 'from-amber-600 to-orange-700',
      accent: 'bg-amber-400',
      pill: 'bg-amber-100',
      shadow: 'shadow-orange-500/20'
    },
    'Vitamins & Minerals': {
      bg: 'from-purple-600 to-indigo-800',
      accent: 'bg-purple-400',
      pill: 'bg-yellow-200',
      shadow: 'shadow-purple-500/20'
    }
  };

  const theme = themeColors[category] || {
    bg: 'from-sky-600 to-cyan-700',
    accent: 'bg-sky-400',
    pill: 'bg-white',
    shadow: 'shadow-sky-500/20'
  };

  const brandName = name.split(' ')[0];
  const genericName = name.split(' ').slice(1).join(' ').replace(/[()]/g, '');

  return (
    <div className={`w-full h-full bg-gradient-to-br ${theme.bg} rounded-xl p-3 flex flex-col justify-between text-white shadow-lg ${theme.shadow} relative overflow-hidden group transition-all duration-300 hover:scale-[1.02]`}>
      {/* Gloss reflection overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/15 pointer-events-none" />
      {/* Pattern Lines */}
      <div className="absolute inset-y-0 right-0 w-1/3 opacity-10 flex justify-around pointer-events-none">
        <div className="w-px h-full bg-white" />
        <div className="w-px h-full bg-white" />
        <div className="w-px h-full bg-white" />
      </div>

      {/* Top Section */}
      <div className="flex justify-between items-start relative z-10">
        <span className="text-[6px] font-black tracking-widest uppercase opacity-75">MediGrid Rx</span>
        <div className="flex items-center gap-1">
          <span className="text-[5px] font-bold opacity-60">HQ-SECURE</span>
        </div>
      </div>

      {/* Branding & Pill Illustration */}
      <div className="my-auto relative z-10 text-left pl-1 pr-2">
        <div className="flex items-center gap-1 mb-0.5">
          {/* Pill SVG Icon */}
          <svg className="w-3.5 h-3.5 text-white drop-shadow-md shrink-0 opacity-80" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m9-9H3" />
            <circle cx="12" cy="12" r="9" />
          </svg>
          <span className="text-[5px] font-black uppercase tracking-wider bg-white/20 px-1 py-0.5 rounded leading-none">Pack</span>
        </div>
        <h4 className="text-xs font-black tracking-tight leading-none drop-shadow-md truncate">{brandName}</h4>
        <span className="text-[7px] font-bold opacity-80 block mt-1 tracking-wider leading-tight drop-shadow-sm truncate">{genericName}</span>
      </div>

      {/* Bottom Section */}
      <div className="flex justify-between items-end relative z-10 border-t border-white/20 pt-1 mt-0.5">
        <div>
          <span className="text-[5px] block opacity-50 leading-none">CERTIFIED</span>
          <span className="text-[7px] font-black tracking-wider leading-none">IP / USP</span>
        </div>
        <div className="px-1 py-0.5 rounded bg-white/20 text-[5px] font-black uppercase tracking-wider border border-white/10">
          Rx Only
        </div>
      </div>
    </div>
  );
};

const ProductImage = ({ med }) => {
  const [imgFailed, setImgFailed] = useState(false);
  
  if (imgFailed || !med.image) {
    return <MedicineBox name={med.name} category={med.category} />;
  }
  
  return (
    <img 
      src={med.image} 
      alt={med.name} 
      className="h-full w-full object-contain filter drop-shadow-md" 
      onError={() => setImgFailed(true)}
    />
  );
};

const Dashboard = ({ theme, setTheme }) => {
  const navigate = useNavigate();

  // ─── Layout Controls ────────────────────────────────────────────────────────
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ─── Account Settings State ──────────────────────────────────────────────────
  const [profileName, setProfileName] = useState(() => localStorage.getItem('userName') || '');
  const [profileEmail, setProfileEmail] = useState(() => localStorage.getItem('userEmail') || '');
  const [profilePictureUrl, setProfilePictureUrl] = useState(() => localStorage.getItem('profilePicture') || '');
  const [isPremium, setIsPremium] = useState(() => localStorage.getItem('isPremium') === 'true');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profilePhone, setProfilePhone] = useState('');
  const [profileEmergencyName, setProfileEmergencyName] = useState('');
  const [profileEmergencyPhone, setProfileEmergencyPhone] = useState('');
  const [profileAge, setProfileAge] = useState(null);
  const [profileGender, setProfileGender] = useState('');
  const [profileBloodGroup, setProfileBloodGroup] = useState('');
  const [profileAllergies, setProfileAllergies] = useState('');
  const [profileMedicalConditions, setProfileMedicalConditions] = useState('');
  const [profileCurrentMedicines, setProfileCurrentMedicines] = useState('');
  const [settingsGeminiKey, setSettingsGeminiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || '');
  const [settingsRzpKey, setSettingsRzpKey] = useState(import.meta.env.VITE_RAZORPAY_KEY_ID || '');
  const [settingsRzpSecret, setSettingsRzpSecret] = useState('');
  const [settingsAutoSync, setSettingsAutoSync] = useState(true);
  const [settingsSmsWarnings, setSettingsSmsWarnings] = useState(true);
  const [settingsEForward, setSettingsEForward] = useState(false);
  const [settingsAnomalyScan, setSettingsAnomalyScan] = useState(true);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsSubTab, setSettingsSubTab] = useState('account');
  const [settingsOldPassword, setSettingsOldPassword] = useState('');
  const [settingsNewPassword, setSettingsNewPassword] = useState('');
  const [settingsConfirmPassword, setSettingsConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const { tab } = useParams();

  const tabSlugs = {
    0: 'overview',
    1: 'symptom-checker',
    2: 'health-analytics',
    3: 'report-analyzer',
    4: 'medicine-store',
    5: 'nearby-hospitals',
    6: 'ai-health-planner',
    7: 'emergency-sos',
    8: 'ai-assistant',
    9: 'medicine-cart',
    10: 'account-settings'
  };

  const slugTabs = {
    'overview': 0,
    'symptom-checker': 1,
    'health-analytics': 2,
    'report-analyzer': 3,
    'medicine-store': 4,
    'nearby-hospitals': 5,
    'ai-health-planner': 6,
    'emergency-sos': 7,
    'ai-assistant': 8,
    'medicine-cart': 9,
    'account-settings': 10
  };

  const activeTab = tab && slugTabs[tab] !== undefined ? slugTabs[tab] : 0;

  const setActiveTab = (tabId) => {
    const slug = tabSlugs[tabId] || 'overview';
    navigate(`/dashboard/${slug}`);
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login', { replace: true });
    } else if (!tab) {
      navigate('/dashboard/overview', { replace: true });
    }
  }, [tab, navigate]);

  // ─── Theme ──────────────────────────────────────────────────────────────────
  const [isDark, setIsDark] = useState(() => theme === 'dark');
  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    setTheme(next ? 'dark' : 'light');
  };

  useEffect(() => {
    setIsDark(theme === 'dark');
  }, [theme]);

  // ─── Time ───────────────────────────────────────────────────────────────────
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const getGreeting = () => {
    const h = currentTime.getHours();
    if (h < 12) return 'GOOD MORNING';
    if (h < 18) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  };

  // ─── Notifications ──────────────────────────────────────────────────────────
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const handleNotificationRead = (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const clearAllNotifications = () => setNotifications([]);

  // ─── Water Intake ───────────────────────────────────────────────────────────
  const [waterCount, setWaterCount] = useState(0);
  const [activePlan, setActivePlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [todayCompletedTasks, setTodayCompletedTasks] = useState([]);
  const [analyticsSummary, setAnalyticsSummary] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Fetch Current Active Health Plan
  const fetchCurrentPlan = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      const resp = await fetch(`${BACKEND_URL}/api/health-planner/current`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.success && data.planRecord) {
          setActivePlan(data.planRecord);
          const todayStr = new Date().toISOString().split('T')[0];
          const todayLog = data.planRecord.dailyLogs?.find(l => l.date === todayStr);
          const completed = todayLog ? (todayLog.completedTaskIds || []) : [];
          setTodayCompletedTasks(completed);
          if (todayLog) {
            setWaterCount(todayLog.waterIntakeLiters ?? 0);
          }

          if (data.planRecord.plan?.dailyTasks) {
            setTasks(data.planRecord.plan.dailyTasks.map(t => ({
              id: t.id,
              text: t.title,
              priority: t.category?.toLowerCase() || 'medium',
              done: completed.includes(t.id)
            })));
          }
        } else {
          setActivePlan(null);
        }
      }
    } catch (err) {
      console.warn('Dashboard fetch active plan error:', err);
    }
  };

  // ─── Health Checklist (Tasks connected to MongoDB) ──────────────────────────
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState('');

  // Fetch tasks from MongoDB backend
  const fetchTasksFromBackend = async () => {
    try {
      const resp = await fetch(`${BACKEND_URL}/api/tasks`, {
        headers: { 'x-user-email': profileEmail }
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.tasks) {
          setTasks(data.tasks.map(t => ({
            id: t._id || t.id,
            text: t.text,
            priority: t.priority || 'medium',
            done: t.done || false
          })));
        }
      }
    } catch (err) {
      console.warn('Backend task fetch error, using local array:', err);
    }
  };

  // Fetch User Profile from MongoDB backend
  const fetchUserProfileFromBackend = async () => {
    try {
      const resp = await fetch(`${BACKEND_URL}/api/user/profile`, {
        headers: { 'x-user-email': profileEmail }
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.user) {
          setProfileName(data.user.name || data.user.fullName || localStorage.getItem('userName') || '');
          setProfileEmail(data.user.email || '');
          setIsPremium(data.user.isPremium || false);
          localStorage.setItem('isPremium', data.user.isPremium || false);
          setProfilePhone(data.user.phone || '');
          setProfileEmergencyName(data.user.emergencyName || '');
          setProfileEmergencyPhone(data.user.emergencyPhone || '');
          if (data.user.profilePicture) {
            setProfilePictureUrl(data.user.profilePicture);
            localStorage.setItem('profilePicture', data.user.profilePicture);
          } else {
            setProfilePictureUrl('');
            localStorage.removeItem('profilePicture');
          }
          setProfileAge(data.user.age ?? null);
          setProfileGender(data.user.gender || '');
          setProfileBloodGroup(data.user.bloodGroup || '');
          setProfileAllergies(data.user.allergies || '');
          setProfileMedicalConditions(data.user.medicalConditions || '');
          setProfileCurrentMedicines(data.user.currentMedicines || '');
          if (data.user.settings) {
            setSettingsAutoSync(data.user.settings.autoSync);
            setSettingsSmsWarnings(data.user.settings.smsWarnings);
            setSettingsEForward(data.user.settings.emailForwarding);
            setSettingsAnomalyScan(data.user.settings.anomalyScan);
          }
        }
      }
    } catch (err) {
      console.warn('Backend profile fetch warning:', err);
    }
  };

  // ─── Health Profile (single source of truth) ─────────────────────────────────
  const [healthProfile, setHealthProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem('healthProfile') || 'null'); } catch { return null; }
  });

  // Fetch HealthProfile from backend
  const fetchHealthProfileFromBackend = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      const resp = await fetch(`${BACKEND_URL}/api/health-profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.success && data.profile) {
          setHealthProfile(data.profile);
          localStorage.setItem('healthProfile', JSON.stringify(data.profile));
          if (data.profile.fullName) setProfileName(data.profile.fullName);
          if (data.profile.age) setProfileAge(data.profile.age);
          if (data.profile.gender) setProfileGender(data.profile.gender);
          if (data.profile.bloodGroup) setProfileBloodGroup(data.profile.bloodGroup);
          if (data.profile.allergies) setProfileAllergies(data.profile.allergies.join(', '));
          if (data.profile.medicalConditions) setProfileMedicalConditions(data.profile.medicalConditions.join(', '));
          if (data.profile.currentMedications) setProfileCurrentMedicines(data.profile.currentMedications.join(', '));
        }
      }
    } catch (err) {
      console.warn('Dashboard fetch health profile error:', err);
    }
  };

  const handleHealthProfileUpdate = async (updatedProfile, metrics) => {
    setHealthProfile(updatedProfile);
    if (updatedProfile) {
      if (updatedProfile.fullName) setProfileName(updatedProfile.fullName);
      if (updatedProfile.age) setProfileAge(updatedProfile.age);
      if (updatedProfile.gender) setProfileGender(updatedProfile.gender);
      if (updatedProfile.bloodGroup) setProfileBloodGroup(updatedProfile.bloodGroup);
    }
    await refreshAllData();
  };

  // Fetch Vitals Logs from MongoDB backend
  const fetchVitalsFromBackend = async () => {
    try {
      const resp = await fetch(`${BACKEND_URL}/api/health-analytics/vitals`, {
        headers: { 'x-user-email': profileEmail }
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.vitals && data.vitals.length > 0) {
          setVitalsHistory(data.vitals.map(v => ({
            date: v.date,
            sugar: v.sugar ?? null,
            bp: v.bpSystolic ?? null,
            bpDia: v.bpDiastolic ?? null,
            weight: v.weight ?? null,
            water: v.waterIntakeLiters ?? null,
            sleep: v.sleepHours ?? null,
            heartRate: v.heartRate ?? null
          })));
        }
      }
    } catch (err) {
      console.warn('Backend vitals fetch warning:', err);
    }
  };

  // Fetch Summary Analytics from backend
  const fetchAnalyticsSummary = async () => {
    setLoadingAnalytics(true);
    try {
      const resp = await fetch(`${BACKEND_URL}/api/health-analytics/summary`, {
        headers: { 'X-User-Email': profileEmail }
      });
      if (resp.ok) {
        const data = await resp.json();
        setAnalyticsSummary(data);
      }
    } catch (err) {
      console.warn('Dashboard fetch analytics summary error:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Centralized Refresh Callback to keep everything synchronized automatically
  const refreshAllData = async () => {
    await Promise.all([
      fetchUserProfileFromBackend(),
      fetchHealthProfileFromBackend(),
      fetchTasksFromBackend(),
      fetchVitalsFromBackend(),
      fetchCurrentPlan(),
      fetchAnalyticsSummary()
    ]);
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const text = newTaskText.trim();
    setNewTaskText('');

    try {
      const resp = await fetch(`${BACKEND_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': profileEmail
        },
        body: JSON.stringify({ text, priority: 'medium' })
      });
      if (resp.ok) {
        const data = await resp.json();
        setTasks(prev => [{ id: data.task._id, text: data.task.text, priority: data.task.priority, done: false }, ...prev]);
      } else {
        setTasks(prev => [{ id: Date.now(), text, priority: 'medium', done: false }, ...prev]);
      }
    } catch (err) {
      setTasks(prev => [{ id: Date.now(), text, priority: 'medium', done: false }, ...prev]);
    }
  };

  const toggleTask = async (id) => {
    const target = tasks.find(t => t.id === id);
    const nextDone = !target?.done;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: nextDone } : t));

    if (activePlan) {
      const updatedCompleted = nextDone 
        ? [...todayCompletedTasks, id]
        : todayCompletedTasks.filter(tid => tid !== id);
      setTodayCompletedTasks(updatedCompleted);

      try {
        const token = localStorage.getItem('authToken');
        const resp = await fetch(`${BACKEND_URL}/api/health-planner/daily-log`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            planId: activePlan._id || activePlan.id,
            completedTaskIds: updatedCompleted,
            waterIntakeLiters: waterCount,
            sleepHours: 8
          })
        });
        if (resp.ok) {
          await refreshAllData();
        }
      } catch (err) {
        console.warn('Error syncing task toggle to active health plan daily-log:', err);
      }
      return;
    }

    try {
      const resp = await fetch(`${BACKEND_URL}/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-email': profileEmail },
        body: JSON.stringify({ done: nextDone })
      });
      if (resp.ok) {
        await refreshAllData();
      }
    } catch (err) {
      console.warn('Task toggle sync warning:', err);
    }
  };

  const deleteTask = async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      const resp = await fetch(`${BACKEND_URL}/api/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-email': profileEmail }
      });
      if (resp.ok) {
        await refreshAllData();
      }
    } catch (err) {
      console.warn('Task delete sync warning:', err);
    }
  };

  // ─── Doctors (Client directory equivalent) ──────────────────────────────────
  const doctors = [
    { id: 1, name: 'Dr. Sarah Chen', specialty: 'General Medicine', online: true },
    { id: 2, name: 'Dr. Rajeev Mehta', specialty: 'Cardiology', online: true },
    { id: 3, name: 'Dr. Priya Sharma', specialty: 'Pediatrics', online: false },
    { id: 4, name: 'Dr. Ananya Goel', specialty: 'Dermatology', online: true },
    { id: 5, name: 'Dr. Vikram Malhotra', specialty: 'Neurology', online: false },
  ];

  // ─── AI Health Assistant (Connected to Backend Gemini API) ───────────────────
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: `Hello${profileName ? `, ${profileName}` : ''}! I am your MediGrid AI Health Assistant. Ask me about symptoms, medications, vitals, or to schedule an appointment.` }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, aiThinking]);

  const handleSendAiMessage = async (textToSend) => {
    const text = textToSend || chatInput;
    if (!text.trim()) return;

    setChatMessages(prev => [...prev, { role: 'user', content: text }]);
    if (!textToSend) setChatInput('');
    setAiThinking(true);

    try {
      const resp = await fetch(`${BACKEND_URL}/api/assistant/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': profileEmail
        },
        body: JSON.stringify({ message: text })
      });

      if (resp.ok) {
        const data = await resp.json();
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        throw new Error('Assistant API failed');
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Your health vitals and clinical metrics are stable. For specific symptoms, consult Dr. Sarah Chen or your primary doctor.' }]);
    } finally {
      setAiThinking(false);
    }
  };

  // ─── Vitals History for Chart ────────────────────────────────────────────────
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const maxSugar = vitalsHistory.length > 0 ? Math.max(...vitalsHistory.map(d => d.sugar ?? 0), 1) : 1;
  const maxBP    = vitalsHistory.length > 0 ? Math.max(...vitalsHistory.map(d => d.bp ?? 0), 1) : 1;

  // ─── Sidebar nav ─────────────────────────────────────────────────────────────
  const sidebarItems = [
    { id: 0, label: 'Dashboard',       icon: LayoutDashboard },
    { id: 1, label: 'Symptom Checker',  icon: Heart },
    { id: 2, label: 'Health Analytics', icon: Activity },
    { id: 3, label: 'Report Analyzer',  icon: FileHeart },
    { id: 4, label: 'Medicine Store',   icon: Pill },
    { id: 5, label: 'Nearby Hospitals',  icon: MapPin },
    { id: 6, label: 'AI Health Planner', icon: Sparkles },
    { id: 7, label: 'Emergency SOS',    icon: AlertTriangle },
    { id: 8, label: 'AI Assistant',     icon: Sparkles },
  ];

  // ─── Health Activity Feed — built from real data only ─────────────────────
  const activityFeed = [
    // Profile entry: only show if name or email is available
    ...(profileName || profileEmail ? [{
      title: 'Profile Connected',
      desc: profileName
        ? `${profileName}${profileBloodGroup ? ` (${profileBloodGroup})` : ''}${profileAge ? `, Age ${profileAge}` : ''} — profile active.`
        : `Account ${profileEmail} connected.`,
      time: 'Account',
      color: 'bg-sky-500'
    }] : []),
    // Vitals entry: only show if real vitals exist
    ...(vitalsHistory.length > 0 ? [{
      title: 'Vitals Logged',
      desc: `Latest: Glucose ${vitalsHistory[vitalsHistory.length - 1]?.sugar ?? '—'} mg/dL, BP ${vitalsHistory[vitalsHistory.length - 1]?.bp ?? '—'} mmHg.`,
      time: 'Today',
      color: 'bg-cyan-500'
    }] : []),
    // Tasks: only show if tasks exist
    ...(tasks.length > 0 ? [{
      title: 'Health Checklist',
      desc: `${tasks.filter(t => t.done).length} of ${tasks.length} tasks completed.`,
      time: 'Today',
      color: 'bg-emerald-500'
    }] : [])
  ];


  // ─── Markdown formatter ──────────────────────────────────────────────────────
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
      <div className="space-y-1 text-left">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1.5" />;

          if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
            return (
              <ul key={idx} className="list-disc list-inside ml-3 my-0.5">
                <li className="text-[11px] md:text-xs text-slate-700 dark:text-slate-300">
                  {renderBoldText(trimmed.substring(2))}
                </li>
              </ul>
            );
          }

          const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
          if (numMatch) {
            return (
              <div key={idx} className="pl-3 my-0.5 flex items-start gap-1 text-[11px] md:text-xs text-slate-700 dark:text-slate-300">
                <span className="font-bold text-sky-500">{numMatch[1]}.</span>
                <span className="flex-1">{renderBoldText(numMatch[2])}</span>
              </div>
            );
          }

          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={idx} className="text-[11px] md:text-xs font-black text-slate-900 dark:text-white mt-2 mb-1">
                {renderBoldText(trimmed.substring(4))}
              </h4>
            );
          }

          return (
            <p key={idx} className="text-[11px] md:text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-1">
              {renderBoldText(trimmed)}
            </p>
          );
        })}
      </div>
    );
  };

  // ─── Sub-tab states (Symptom Checker) ───────────────────────────────────────
  // ─── Sub-tab states (Symptom Checker) ───────────────────────────────────────
  const [symptomInput, setSymptomInput] = useState('');
  const [symptomStage, setSymptomStage] = useState('input');
  const [symptomResults, setSymptomResults] = useState(null);
  const [patientAge, setPatientAge] = useState('28');
  const [patientGender, setPatientGender] = useState('Male');
  const [symptomSeverity, setSymptomSeverity] = useState('Moderate');
  const [symptomCategory, setSymptomCategory] = useState('Fever & Pain');
  const [symptomDuration, setSymptomDuration] = useState('1–3 days');

  const handleSymptomSubmit = (e) => {
    e.preventDefault();
    if (!symptomInput.trim()) return;
    setSymptomStage('loading');
    setTimeout(() => setSymptomStage('questions'), 1500);
  };

  const runLocalFallback = (durationOption) => {
    let condition = '';
    let probability = '';
    let color = 'yellow';
    let specialist = 'General Medicine';
    let specialistId = 1;
    let precautions = '';
    let expected = [];

    if (symptomCategory === 'Heart Health' || symptomInput.toLowerCase().includes('chest') || symptomInput.toLowerCase().includes('heart')) {
      condition = 'Angina / Cardiovascular Spasm';
      probability = '74%';
      color = 'red';
      specialist = 'Cardiology';
      specialistId = 2;
      precautions = 'Avoid heavy physical exertion immediately. Sit upright and breathe slowly. If symptoms worsen, call Emergency SOS.';
      expected = [
        'Heavy crushing pressure or tightness in the center of the chest',
        'Pain radiating to your shoulder, left arm, neck, or jaw',
        'Shortness of breath or difficulty breathing (Dyspnea)',
        'Dizziness, lightheadedness, or cold sweating'
      ];
    } else if (symptomCategory === 'Diabetes Care' || symptomInput.toLowerCase().includes('sugar') || symptomInput.toLowerCase().includes('glucose')) {
      condition = 'Hyperglycemic Trend (Elevated Blood Sugar)';
      probability = '85%';
      color = 'yellow';
      specialist = 'General Medicine';
      specialistId = 1;
      precautions = 'Drink plenty of water. Monitor blood glucose levels hourly. Avoid all processed carbohydrates and sugary beverages.';
      expected = [
        'Increased thirst (Polydipsia) and dry mouth',
        'Frequent urination (Polyuria), especially at night',
        'Fatigue, lethargy, or blurred vision',
        'Mild headache and difficulty concentrating'
      ];
    } else if (symptomCategory === 'Bacterial Infections' || symptomInput.toLowerCase().includes('throat') || symptomInput.toLowerCase().includes('cough')) {
      condition = 'Acute Tonsillitis / Streptococcus Infection';
      probability = '81%';
      color = 'yellow';
      specialist = 'General Medicine';
      specialistId = 1;
      precautions = 'Do warm saltwater gargles 3-4 times a day. Hydrate with warm liquids. Isolate dishes and maintain distance.';
      expected = [
        'Severe sore throat and painful swallowing (Odynophagia)',
        'Redness and swelling of tonsils, potentially with white patches',
        'Swollen, tender lymph nodes in the neck',
        'Fever, chills, and mild headache'
      ];
    } else {
      condition = 'Influenza (Viral Respiratory Infection)';
      probability = '88%';
      color = 'yellow';
      specialist = 'General Medicine';
      specialistId = 1;
      precautions = 'Get bed rest, stay hydrated with fluids, and take Paracetamol (Calpol/Dolo) for fever and body aches.';
      expected = [
        'Sudden fever (above 100.4°F) and cold chills',
        'Severe body aches and joint pain (myalgia)',
        'Persistent dry cough and runny or stuffy nose',
        'Extreme fatigue and weakness lasting multiple days'
      ];
    }

    return {
      condition,
      probability,
      color,
      specialist,
      specialistId,
      precautions,
      expected,
      duration: durationOption,
      isLive: false
    };
  };

  const analyzeSymptomsWithGemini = async (durationOption) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("Gemini API key is not set. Falling back to local clinical rules.");
      return runLocalFallback(durationOption);
    }

    const prompt = `
You are an advanced medical clinical AI assistant in the MediGrid platform.
Analyze the following patient profile and symptom description:
- Age: ${patientAge}
- Gender: ${patientGender}
- General Category: ${symptomCategory}
- Severity: ${symptomSeverity}
- Symptoms Reported: "${symptomInput}"
- Symptoms Duration: "${durationOption}"

Based on this, return a valid JSON object matching this schema:
{
  "condition": "Likely condition name (e.g. Influenza, Angina, Strep Throat, Hyperglycemia)",
  "probability": "Confidence level percentage (e.g. 85%)",
  "color": "either 'red' for high risk/cardiovascular/emergency conditions, or 'yellow' for medium/minor risks",
  "specialist": "The specialty name matching the condition (either 'General Medicine', 'Cardiology', 'Neurology', 'Dermatology', or 'Pediatrics')",
  "specialistId": The ID of the doctor (1 for General Medicine, 2 for Cardiology, 3 for Pediatrics, 4 for Dermatology, 5 for Neurology),
  "precautions": "Clear clinical advice and precautions to take immediately.",
  "expected": [
    "List 3-4 other associated symptoms the patient is likely experiencing or should watch out for."
  ]
}
Return only the raw JSON.
`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API returned status ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      const parsed = JSON.parse(text);
      
      return {
        ...parsed,
        duration: durationOption,
        isLive: true
      };
    } catch (err) {
      console.error("Gemini API call failed, falling back to local simulation:", err);
      return runLocalFallback(durationOption);
    }
  };

  const handleSymptomAnswer = async (durationOption) => {
    setSymptomDuration(durationOption);
    setSymptomStage('loading');
    const results = await analyzeSymptomsWithGemini(durationOption);
    setSymptomResults(results);
    setSymptomStage('result');
  };

  // ─── Doctor Consultation states ──────────────────────────────────────────────
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [activeConsultation, setActiveConsultation] = useState(null);
  const [consultChat, setConsultChat] = useState([]);
  const [docChatInput, setDocChatInput] = useState('');
  const [presGenerated, setPresGenerated] = useState(null);
  const [bookingDate, setBookingDate] = useState('2026-07-17');
  const [bookingSlot, setBookingSlot] = useState('10:00 AM');

  const doctorsList = [
    { id: 1, name: 'Dr. Sarah Chen',      specialty: 'General Medicine', rating: 4.9, reviews: 142, online: true,  experience: '12 years', cost: 500,  timeSlots: ['09:30 AM', '10:00 AM', '11:30 AM', '04:00 PM'] },
    { id: 2, name: 'Dr. Rajeev Mehta',    specialty: 'Cardiology',       rating: 4.8, reviews: 298, online: true,  experience: '18 years', cost: 1000, timeSlots: ['11:00 AM', '12:30 PM', '03:00 PM', '05:30 PM'] },
    { id: 3, name: 'Dr. Priya Sharma',    specialty: 'Pediatrics',       rating: 4.9, reviews: 180, online: false, experience: '9 years',  cost: 450,  timeSlots: ['10:00 AM', '10:30 AM', '02:00 PM'] },
    { id: 4, name: 'Dr. Ananya Goel',     specialty: 'Dermatology',      rating: 4.7, reviews: 95,  online: true,  experience: '7 years',  cost: 600,  timeSlots: ['11:15 AM', '01:00 PM', '04:30 PM'] },
    { id: 5, name: 'Dr. Vikram Malhotra', specialty: 'Neurology',        rating: 5.0, reviews: 310, online: false, experience: '22 years', cost: 1200, timeSlots: ['12:00 PM', '02:30 PM'] },
  ];

  const startConsultation = (doc) => {
    setActiveConsultation(doc);
    setConsultChat([{ sender: 'doc', text: `Hello${profileName ? ` ${profileName}` : ''}, I am ${doc.name}. I have reviewed your clinical profile. What symptoms or updates do you have today?` }]);
  };

  const sendConsultMessage = (e) => {
    e.preventDefault();
    if (!docChatInput.trim()) return;
    const msg = docChatInput;
    setConsultChat(prev => [...prev, { sender: 'user', text: msg }]);
    setDocChatInput('');
    setTimeout(() => {
      let reply = 'Got it. Rest is extremely important right now. I am logging this in your clinical file.';
      if (msg.toLowerCase().includes('fever') || msg.toLowerCase().includes('temperature')) {
        reply = 'I will prescribe Amoxicillin 500mg (antibiotic) and Paracetamol 650mg. Take antibiotic for 5 days. Digital prescription sent to your records.';
        setPresGenerated({ date: 'July 16, 2026', rxNumber: 'RX-982421', meds: [{ name: 'Amoxicillin 500mg', dosage: '1 capsule thrice a day for 5 days' }, { name: 'Paracetamol 650mg', dosage: '1 tablet thrice a day as needed' }] });
      }
      setConsultChat(prev => [...prev, { sender: 'doc', text: reply }]);
    }, 1200);
  };

  const handleBookSlot = (e) => {
    e.preventDefault();
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setSelectedDoctor(null);
      alert(`Appointment confirmed with ${selectedDoctor.name} on ${bookingDate} at ${bookingSlot}.`);
    }, 1500);
  };

  // ─── Toasts State ────────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState([]);
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  // ─── Medical Report Analyzer State ──────────────────────────────────────────
  const [reportsHistory, setReportsHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilterType, setHistoryFilterType] = useState('All');
  const [historyFilterTime, setHistoryFilterTime] = useState('All');

  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [analysisState, setAnalysisState] = useState('idle'); // 'idle' | 'uploading' | 'validating' | 'extracting' | 'analyzing' | 'generating' | 'ready' | 'loading-report'
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState('');
  const [analysisError, setAnalysisError] = useState(null);

  const [activeAnalysis, setActiveAnalysis] = useState(null);
  const [reportChatInput, setReportChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);

  const [normalValuesCollapsed, setNormalValuesCollapsed] = useState(true);

  // Collapsible section for diet/exercise suggestions in dashboard
  const [reportDashboardTab, setReportDashboardTab] = useState('diet');

  // Fetch analysis history
  const fetchReportsHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/reports/history`, {
        headers: { 'X-User-Email': profileEmail }
      });
      if (res.ok) {
        const data = await res.json();
        setReportsHistory(data.history || []);
      } else {
        showToast('Failed to retrieve analysis history.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error loading history.', 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (profileEmail) {
      fetchReportsHistory();
    }
  }, [profileEmail]);

  // Handle file select
  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate size: 20 MB max
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast('File size exceeds the 20 MB limit.', 'error');
      return;
    }

    // Validate extension
    const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'webp'];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      showToast('Unsupported file type. Please upload PDF, PNG, JPG, JPEG, or WEBP.', 'error');
      return;
    }

    setSelectedFile(file);
    setAnalysisError(null);
    setZoomLevel(1);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview('pdf-placeholder');
    }
  };

  // Perform Gemini analysis pipeline
  const startReportAnalysis = async () => {
    if (!selectedFile) return;

    setAnalysisState('uploading');
    setAnalysisProgress(5);
    setAnalysisStep('Uploading Report...');

    // Progress bar animations
    const progressInterval = setInterval(() => {
      setAnalysisProgress(p => {
        if (p < 95) return p + Math.floor(Math.random() * 4) + 1;
        return p;
      });
    }, 200);

    const messageInterval = setInterval(() => {
      setAnalysisProgress(p => {
        if (p < 15) setAnalysisStep('Uploading Report...');
        else if (p < 30) setAnalysisStep('Checking Security...');
        else if (p < 50) setAnalysisStep('Extracting Medical Data...');
        else if (p < 75) setAnalysisStep('Analyzing with Gemini AI...');
        else if (p < 90) setAnalysisStep('Generating Insights...');
        else setAnalysisStep('Preparing Dashboard...');
        return p;
      });
    }, 300);

    const formData = new FormData();
    formData.append('report', selectedFile);

    try {
      const res = await fetch(`${BACKEND_URL}/api/reports/analyze`, {
        method: 'POST',
        headers: {
          'X-User-Email': profileEmail
        },
        body: formData
      });

      clearInterval(progressInterval);
      clearInterval(messageInterval);

      if (res.ok) {
        setAnalysisProgress(100);
        setAnalysisStep('Done!');
        const data = await res.json();
        setTimeout(() => {
          setActiveAnalysis(data.analysis);
          setAnalysisState('ready');
          showToast('Medical report successfully analyzed!', 'success');
          fetchReportsHistory();
        }, 500);
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Server error during report analysis.');
      }
    } catch (err) {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      setAnalysisState('idle');
      setAnalysisError(err.message);
      showToast(err.message || 'Report analysis failed.', 'error');
    }
  };

  // Open existing analysis from history list
  const openReportAnalysis = async (id) => {
    setAnalysisState('loading-report');
    try {
      const res = await fetch(`${BACKEND_URL}/api/reports/${id}`, {
        headers: { 'X-User-Email': profileEmail }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveAnalysis(data.analysis);
        setAnalysisState('ready');
      } else {
        showToast('Failed to load report analysis.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error loading report analysis.', 'error');
    } finally {
      setAnalysisState(prev => prev === 'loading-report' ? 'idle' : prev);
    }
  };

  // Delete history item
  const deleteReportAnalysis = async (id, e) => {
    if (e) e.stopPropagation();
    if (!confirm('Are you sure you want to permanently delete this report analysis?')) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/reports/${id}`, {
        method: 'DELETE',
        headers: { 'X-User-Email': profileEmail }
      });
      if (res.ok) {
        showToast('Report analysis deleted.', 'success');
        if (activeAnalysis && activeAnalysis._id === id) {
          setActiveAnalysis(null);
          setAnalysisState('idle');
        }
        fetchReportsHistory();
      } else {
        showToast('Failed to delete report analysis.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error deleting report analysis.', 'error');
    }
  };

  // Send message in follow-up chat
  const handleSendReportChatMessage = async (e) => {
    if (e) e.preventDefault();
    if (!reportChatInput.trim() || chatLoading || !activeAnalysis) return;

    const userMsg = reportChatInput.trim();
    setReportChatInput('');
    setChatLoading(true);
    setChatError(null);

    // Optimistic local update
    const optimisticMessage = { role: 'user', content: userMsg, timestamp: new Date() };
    setActiveAnalysis(prev => ({
      ...prev,
      chatHistory: [...(prev.chatHistory || []), optimisticMessage]
    }));

    try {
      const res = await fetch(`${BACKEND_URL}/api/reports/${activeAnalysis._id}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': profileEmail
        },
        body: JSON.stringify({ question: userMsg })
      });

      if (res.ok) {
        const data = await res.json();
        setActiveAnalysis(prev => ({
          ...prev,
          chatHistory: data.chatHistory
        }));
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to get response.');
      }
    } catch (err) {
      console.error(err);
      setChatError(err.message);
      showToast(err.message || 'Error processing follow-up question.', 'error');
      // Rollback last message
      setActiveAnalysis(prev => ({
        ...prev,
        chatHistory: prev.chatHistory.slice(0, -1)
      }));
    } finally {
      setChatLoading(false);
    }
  };

  // Safe markdown style renderer without dangerouslySetInnerHTML
  const renderSafeText = (text) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-extrabold text-slate-800 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // Download PDF summary
  const downloadPdfSummary = (analysisDoc) => {
    if (!analysisDoc) return;
    const data = analysisDoc.structuredData;

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const margin = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const contentWidth = pageWidth - (margin * 2);
      let y = 20;

      const checkPageBreak = (neededHeight) => {
        const pageHeight = doc.internal.pageSize.getHeight();
        if (y + neededHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
          drawHeaderFooter();
        }
      };

      const drawHeaderFooter = () => {
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(14, 165, 233);
        doc.text("MEDIGRID AI CLINICAL INTELLIGENCE MESH", margin, 12);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);
        doc.line(margin, 14, pageWidth - margin, 14);

        const totalPages = doc.internal.getNumberOfPages();
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text("CONFIDENTIAL - MEDICAL INFORMATION SUMMARY", margin, doc.internal.pageSize.getHeight() - 10);
        doc.text(`Page ${totalPages}`, pageWidth - margin - 15, doc.internal.pageSize.getHeight() - 10);
      };

      drawHeaderFooter();

      // Title
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42);
      doc.text("Medical Report Summary", margin, y + 5);
      y += 15;

      // Metadata
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(`Report Name: ${analysisDoc.fileName}`, margin, y);
      doc.text(`Report Type: ${analysisDoc.reportType}`, margin, y + 5);
      doc.text(`Date of Analysis: ${new Date(analysisDoc.createdAt).toLocaleDateString()}`, margin, y + 10);

      // Risk Badge
      const riskColor = 
        analysisDoc.riskLevel === 'Green' ? [16, 185, 129] : 
        analysisDoc.riskLevel === 'Yellow' ? [245, 158, 11] : [239, 68, 68];
      doc.setFillColor(riskColor[0], riskColor[1], riskColor[2]);
      doc.rect(pageWidth - margin - 35, y - 4, 35, 8, 'F');
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(`Risk: ${analysisDoc.riskLevel.toUpperCase()}`, pageWidth - margin - 32, y + 1);

      y += 18;

      // Executive Summary
      checkPageBreak(30);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(14, 165, 233);
      doc.text("Executive Summary", margin, y);
      y += 5;
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      const summaryLines = doc.splitTextToSize(data.executiveSummary, contentWidth);
      doc.text(summaryLines, margin, y);
      y += summaryLines.length * 5 + 8;

      // Health status
      checkPageBreak(15);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`Overall Health Status: ${data.overallHealthStatus}`, margin, y);
      if (data.healthScore !== null) {
        doc.text(`Health Score: ${data.healthScore}/100`, pageWidth - margin - 40, y);
      }
      y += 10;

      // Abnormal Findings
      if (data.abnormalValues && data.abnormalValues.length > 0) {
        checkPageBreak(30);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(239, 68, 68);
        doc.text("Abnormal Findings & Values", margin, y);
        y += 6;

        data.abnormalValues.forEach((val) => {
          const descLines = doc.splitTextToSize(`• ${val.parameter}: ${val.value} (Reference: ${val.referenceRange}) - Status: ${val.status}\nExplanation: ${val.explanation}`, contentWidth - 8);
          const boxHeight = descLines.length * 5 + 6;
          checkPageBreak(boxHeight + 5);

          doc.setFillColor(254, 242, 242);
          doc.rect(margin, y - 4, contentWidth, boxHeight, 'F');
          doc.setDrawColor(254, 202, 202);
          doc.rect(margin, y - 4, contentWidth, boxHeight, 'D');

          doc.setFont("Helvetica", "normal");
          doc.setFontSize(9.5);
          doc.setTextColor(127, 29, 29);
          doc.text(descLines, margin + 4, y + 1);
          y += boxHeight + 4;
        });
        y += 4;
      }

      // Recommendations
      if (data.recommendations && data.recommendations.length > 0) {
        checkPageBreak(30);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(14, 165, 233);
        doc.text("Personalized Recommendations", margin, y);
        y += 6;

        data.recommendations.forEach(rec => {
          const recLines = doc.splitTextToSize(`- ${rec}`, contentWidth);
          checkPageBreak(recLines.length * 5 + 2);
          doc.setFont("Helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(51, 65, 85);
          doc.text(recLines, margin, y);
          y += recLines.length * 5 + 1;
        });
        y += 6;
      }

      // Questions for Doctor
      if (data.questionsToAskDoctor && data.questionsToAskDoctor.length > 0) {
        checkPageBreak(35);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(79, 70, 229);
        doc.text("Suggested Questions for your Physician", margin, y);
        y += 6;

        data.questionsToAskDoctor.forEach(q => {
          const qLines = doc.splitTextToSize(`? ${q}`, contentWidth);
          checkPageBreak(qLines.length * 5 + 2);
          doc.setFont("Helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(71, 85, 105);
          doc.text(qLines, margin, y);
          y += qLines.length * 5 + 1;
        });
        y += 8;
      }

      // Disclaimer
      checkPageBreak(25);
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 4, contentWidth, 20, 'F');
      doc.setDrawColor(241, 245, 249);
      doc.rect(margin, y - 4, contentWidth, 20, 'D');

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      const disLines = doc.splitTextToSize(data.medicalDisclaimer || "This analysis is for educational purposes only. Always consult a physician.", contentWidth - 8);
      doc.text(disLines, margin + 4, y + 1);

      doc.save(`${analysisDoc.fileName.replace(/\.[^/.]+$/, "")}_Summary.pdf`);
      showToast('Summary PDF downloaded successfully.', 'success');
    } catch (pdfErr) {
      console.error(pdfErr);
      showToast('Failed to generate PDF summary.', 'error');
    }
  };

  const filteredHistory = reportsHistory.filter(item => {
    const matchesSearch = item.fileName.toLowerCase().includes(historySearch.toLowerCase()) ||
                          item.reportType.toLowerCase().includes(historySearch.toLowerCase());
    
    let matchesTime = true;
    if (historyFilterTime !== 'All') {
      const createdDate = new Date(item.createdAt);
      const now = new Date();
      if (historyFilterTime === 'Today') {
        matchesTime = createdDate.toDateString() === now.toDateString();
      } else if (historyFilterTime === 'This Week') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        matchesTime = createdDate >= oneWeekAgo;
      } else if (historyFilterTime === 'This Month') {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(now.getMonth() - 1);
        matchesTime = createdDate >= oneMonthAgo;
      }
    }

    let matchesType = true;
    if (historyFilterType !== 'All') {
      if (historyFilterType === 'Others') {
        const standardTypes = ['Blood Reports', 'MRI', 'Prescription', 'Urine', 'CT Scan'];
        matchesType = !standardTypes.some(t => item.reportType.toLowerCase().includes(t.toLowerCase().replace(' reports', '').replace(' test', '')));
      } else {
        const typeKeyword = historyFilterType.toLowerCase().replace(' reports', '').replace(' test', '');
        matchesType = item.reportType.toLowerCase().includes(typeKeyword);
      }
    }

    return matchesSearch && matchesTime && matchesType;
  });

  const [cartItems, setCartItems] = useState([]);
  const [medSearch, setMedSearch] = useState('');
  const [checkoutStatus, setCheckoutStatus] = useState(null);
  const [substituteFilter, setSubstituteFilter] = useState(null);
  
  const storeMedicines = [
    // --- Fever & Pain ---
    { id: 1, name: 'Calpol (Paracetamol) 650mg', price: 30.90, category: 'Fever & Pain', quantity: '15 tablets', desc: 'Effective pain and fever relief medication', inStock: false, image: '/medicines/Calpol.png', substituteType: 'Paracetamol 650mg' },
    { id: 2, name: 'Dolo (Paracetamol) 650mg', price: 30.91, category: 'Fever & Pain', quantity: '15 tablets', desc: 'Highly trusted fever reducer and analgesic', inStock: true, image: '/medicines/Dolo.png', substituteType: 'Paracetamol 650mg' },
    { id: 3, name: 'Crocin Pain Relief 650mg', price: 66.00, category: 'Fever & Pain', quantity: '15 tablets', desc: 'Fast relief from severe headaches and body pain', inStock: true, image: '/medicines/Crocin.png', substituteType: 'Paracetamol 650mg' },
    { id: 4, name: 'Pacimol (Paracetamol) 650mg', price: 30.50, category: 'Fever & Pain', quantity: '15 tablets', desc: 'Clinical formulation for lowering high fever', inStock: true, image: '/medicines/Pacimol.png', substituteType: 'Paracetamol 650mg' },
    { id: 5, name: 'Sumo L (Paracetamol) 650mg', price: 30.80, category: 'Fever & Pain', quantity: '15 tablets', desc: 'Rapid-acting fever and mild pain relief agent', inStock: true, image: '/medicines/SumoL.png', substituteType: 'Paracetamol 650mg' },

    // --- Heart Health ---
    { id: 6, name: 'Lipitor (Atorvastatin) 20mg', price: 380.00, category: 'Heart Health', quantity: '10 tablets', desc: 'Premium Pfizer brand for cholesterol management', inStock: false, image: '/medicines/Lipitor.png', substituteType: 'Atorvastatin 20mg' },
    { id: 7, name: 'Storvas (Atorvastatin) 20mg', price: 200.50, category: 'Heart Health', quantity: '15 tablets', desc: 'Statin to control bad cholesterol and triglycerides', inStock: true, image: '/medicines/Storvas.png', substituteType: 'Atorvastatin 20mg' },
    { id: 8, name: 'Atorva (Atorvastatin) 20mg', price: 218.00, category: 'Heart Health', quantity: '15 tablets', desc: 'Cardiovascular health support & lipid control', inStock: true, image: '/medicines/Atorva.png', substituteType: 'Atorvastatin 20mg' },
    { id: 9, name: 'Tonact (Atorvastatin) 20mg', price: 195.00, category: 'Heart Health', quantity: '15 tablets', desc: 'Effective cholesterol synthesis regulation', inStock: true, image: '/medicines/Tonact.png', substituteType: 'Atorvastatin 20mg' },
    { id: 10, name: 'Lipvas (Atorvastatin) 20mg', price: 185.00, category: 'Heart Health', quantity: '15 tablets', desc: 'Protects blood vessels by lowering serum lipids', inStock: true, image: '/medicines/Lipvas.png', substituteType: 'Atorvastatin 20mg' },

    // --- Diabetes Care ---
    { id: 11, name: 'Glycomet (Metformin) 500mg', price: 24.50, category: 'Diabetes Care', quantity: '15 tablets', desc: 'First-line oral diabetes management medication', inStock: false, image: '/medicines/Glycomet.png', substituteType: 'Metformin 500mg' },
    { id: 12, name: 'Obimet (Metformin) 500mg', price: 22.00, category: 'Diabetes Care', quantity: '15 tablets', desc: 'Lowers hepatic glucose production and absorption', inStock: true, image: '/medicines/Obimet.png', substituteType: 'Metformin 500mg' },
    { id: 13, name: 'Gluformin (Metformin) 500mg', price: 23.80, category: 'Diabetes Care', quantity: '15 tablets', desc: 'Assists in maintaining optimal HbA1c levels', inStock: true, image: '/medicines/Gluformin.png', substituteType: 'Metformin 500mg' },
    { id: 14, name: 'Glyciphage (Metformin) 500mg', price: 25.00, category: 'Diabetes Care', quantity: '15 tablets', desc: 'Improves insulin sensitivity in type 2 diabetes', inStock: true, image: '/medicines/Glyciphage.png', substituteType: 'Metformin 500mg' },
    { id: 15, name: 'Glucophage (Metformin) 500mg', price: 27.50, category: 'Diabetes Care', quantity: '15 tablets', desc: 'Sustained-release clinical blood sugar regulator', inStock: true, image: '/medicines/Glucophage.png', substituteType: 'Metformin 500mg' },

    // --- Bacterial Infections ---
    { id: 16, name: 'Mox (Amoxicillin) 500mg', price: 115.00, category: 'Bacterial Infections', quantity: '15 capsules', desc: 'Broad-spectrum penicillin antibiotic for infections', inStock: false, image: '/medicines/Mox.png', substituteType: 'Antibiotic 500mg' },
    { id: 17, name: 'Novamox (Amoxicillin) 500mg', price: 118.00, category: 'Bacterial Infections', quantity: '15 capsules', desc: 'Combats bacterial throat, ear, and lung infections', inStock: true, image: '/medicines/Novamox.png', substituteType: 'Antibiotic 500mg' },
    { id: 18, name: 'Althrocin (Erythromycin) 500mg', price: 102.00, category: 'Bacterial Infections', quantity: '10 tablets', desc: 'Erythromycin formulation for soft tissue infections', inStock: true, image: '/medicines/Althrocin.png', substituteType: 'Antibiotic 500mg' },
    { id: 19, name: 'Azithral (Azithromycin) 500mg', price: 122.00, category: 'Bacterial Infections', quantity: '5 tablets', desc: 'High-strength short-course respiratory antibiotic', inStock: true, image: '/medicines/Azithral.png', substituteType: 'Antibiotic 500mg' },
    { id: 20, name: 'Ciplox (Ciprofloxacin) 500mg', price: 44.50, category: 'Bacterial Infections', quantity: '10 tablets', desc: 'Ciprofloxacin broad-spectrum bacterial inhibitor', inStock: true, image: '/medicines/Ciplox.png', substituteType: 'Antibiotic 500mg' },

    // --- Vitamins & Minerals ---
    { id: 21, name: 'Uprise-D3 (Vitamin D3) 60K', price: 152.00, category: 'Vitamins & Minerals', quantity: '4 capsules', desc: 'Weekly high-dose softgel for bone & muscle strength', inStock: false, image: '/medicines/Uprise.png', substituteType: 'Vitamin D3 60K' },
    { id: 22, name: 'Calcirol (Vitamin D3) 60K', price: 120.00, category: 'Vitamins & Minerals', quantity: '4 sachets', desc: 'Cholecalciferol powder for calcium absorption', inStock: true, image: '/medicines/Calcirol.png', substituteType: 'Vitamin D3 60K' },
    { id: 23, name: 'D3 Must (Vitamin D3) 60K', price: 110.00, category: 'Vitamins & Minerals', quantity: '4 capsules', desc: 'Supports immune function and bone density', inStock: true, image: '/medicines/D3Must.png', substituteType: 'Vitamin D3 60K' },
    { id: 24, name: 'Tayo (Vitamin D3) 60K', price: 135.00, category: 'Vitamins & Minerals', quantity: '4 tablets', desc: 'Helps correct chronic Vitamin D deficiency', inStock: true, image: '/medicines/Tayo.png', substituteType: 'Vitamin D3 60K' },
    { id: 25, name: 'Depura (Vitamin D3 Nano) 60K', price: 380.00, category: 'Vitamins & Minerals', quantity: '4 shots', desc: 'Ready-to-drink premium nano oral solution shots', inStock: true, image: '/medicines/DePura.png', substituteType: 'Vitamin D3 60K' }
  ];

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showInStockOnly, setShowInStockOnly] = useState(false);

  const filteredMeds = substituteFilter
    ? storeMedicines.filter(m => m.inStock && m.substituteType === substituteFilter.substituteType && m.id !== substituteFilter.id)
    : storeMedicines.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(medSearch.toLowerCase()) || 
                              m.substituteType.toLowerCase().includes(medSearch.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory;
        const matchesStock = !showInStockOnly || m.inStock;
        return matchesSearch && matchesCategory && matchesStock;
      });

  const addToCart = (med) => {
    setCartItems(prev => {
      const ex = prev.find(i => i.id === med.id);
      return ex ? prev.map(i => i.id === med.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { ...med, qty: 1 }];
    });
  };

  const getCartTotal = () => cartItems.reduce((a, i) => a + i.price * i.qty, 0);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async (grandTotal, totalSavings) => {
    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

    if (!razorpayKey) {
      alert("Razorpay Key ID (VITE_RAZORPAY_KEY_ID) is not configured in your .env file. Please add it and restart the server.");
      return;
    }

    // Load Razorpay SDK
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      alert("Failed to load Razorpay SDK. Please check your internet connection.");
      return;
    }

    // Amount in paise (multiply by 100)
    const amountInPaise = Math.round(grandTotal * 100);

    const options = {
      key: razorpayKey,
      amount: amountInPaise,
      currency: "INR",
      name: "MediGrid",
      description: "Medicine Store Order",
      image: LOGO_BASE64,
      handler: function (response) {
        const paymentId = response.razorpay_payment_id || `pay_${Math.random().toString(36).substring(2, 16)}`;
        const orderId = response.razorpay_order_id || `MG-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
        
        setCheckoutStatus({
          status: 'success',
          paymentId,
          orderId,
          items: [...cartItems],
          totalAmount: grandTotal,
          savings: totalSavings
        });

        // Persist Order in MongoDB
        fetch(`${BACKEND_URL}/api/orders/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-email': profileEmail },
          body: JSON.stringify({
            orderId,
            paymentId,
            items: cartItems,
            totalAmount: grandTotal,
            discount: totalSavings,
            savings: totalSavings
          })
        }).catch(err => console.warn('Order save sync warning:', err));

        setCartItems([]);
      },
      prefill: {
        name: profileName || '',
        email: profileEmail || '',
        contact: (profilePhone || '').replace(/[^0-9]/g, '').slice(-10)
      },
      notes: {
        platform: "MediGrid",
        order_type: "Medicine Store"
      },
      theme: {
        color: "#0ea5e9"
      },
      modal: {
        ondismiss: function () {
          console.log("Razorpay checkout closed by user.");
        }
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        alert("Payment failed: " + (response.error?.description || "Unknown error"));
      });
      rzp.open();
    } catch (err) {
      console.error("Razorpay open error:", err);
      alert("Could not open Razorpay checkout. Error: " + err.message);
    }
  };

  const handleUpgradePayment = async () => {
    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

    if (!razorpayKey) {
      alert("Razorpay Key (VITE_RAZORPAY_KEY_ID) is not configured in your .env file.");
      return;
    }

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      alert("Failed to load Razorpay SDK. Please check your internet connection.");
      return;
    }

    const grandTotal = 499;
    const amountInPaise = Math.round(grandTotal * 100);

    const options = {
      key: razorpayKey,
      amount: amountInPaise,
      currency: "INR",
      name: "MediGrid Premium",
      description: "Upgrade Account to Premium Plan",
      image: LOGO_BASE64,
      handler: async function (response) {
        try {
          const resp = await fetch(`${BACKEND_URL}/api/user/upgrade`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-email': profileEmail }
          });
          if (resp.ok) {
            const data = await resp.json();
            setIsPremium(true);
            localStorage.setItem('isPremium', 'true');
            
            const newNotif = {
              id: Date.now(),
              title: "Plan Upgraded!",
              text: "Welcome to MediGrid Premium. Premium discounts and golden borders are now active.",
              time: "Just now",
              read: false
            };
            setNotifications(prev => [newNotif, ...prev]);
            alert("Congratulations! Your account has been upgraded to Premium successfully.");
          } else {
            const errData = await resp.json();
            alert("Upgrade check failed: " + (errData.error || "Internal error"));
          }
        } catch (err) {
          console.error("Upgrade request error:", err);
          alert("Failed to confirm upgrade with the server.");
        }
      },
      prefill: {
        name: profileName || '',
        email: profileEmail || '',
        contact: (profilePhone || '').replace(/[^0-9]/g, '').slice(-10)
      },
      notes: {
        platform: "MediGrid",
        order_type: "Premium Upgrade"
      },
      theme: {
        color: "#fbbf24"
      },
      modal: {
        ondismiss: function () {
          console.log("Upgrade checkout closed by user.");
        }
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        alert("Payment failed: " + (response.error?.description || "Unknown error"));
      });
      rzp.open();
    } catch (err) {
      console.error("Upgrade Razorpay open error:", err);
      alert("Could not open Razorpay checkout. Error: " + err.message);
    }
  };

  // ─── Vitals & Telemetry ───────────────────────────────────────────────────────
  const [logWeight, setLogWeight] = useState('');
  const [logSugar, setLogSugar] = useState('');
  const [logSys, setLogSys] = useState('');
  const [logDia, setLogDia] = useState('');
  const [logHeartRate, setLogHeartRate] = useState('');
  const [logWater, setLogWater] = useState('');
  const [logSleep, setLogSleep] = useState('');
  const [logCalories, setLogCalories] = useState('');
  const [logWorkout, setLogWorkout] = useState('');

  const [vitalsLog, setVitalsLog] = useState([]);
  const handleVitalsLog = async (e) => {
    e.preventDefault();
    const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'short' });

    // Only include fields the user actually filled in — no fake fallbacks
    const payload = { date: dateStr };
    if (logSugar.trim())     payload.sugar = parseInt(logSugar);
    if (logSys.trim())       payload.bpSystolic = parseInt(logSys);
    if (logDia.trim())       payload.bpDiastolic = parseInt(logDia);
    if (logHeartRate.trim()) payload.heartRate = parseInt(logHeartRate);
    if (logWeight.trim())    payload.weight = parseFloat(logWeight);
    if (logWater.trim())     payload.waterIntakeLiters = parseFloat(logWater);
    if (logSleep.trim())     payload.sleepHours = parseFloat(logSleep);
    if (logCalories.trim())  payload.calories = parseInt(logCalories);
    if (logWorkout.trim())   payload.workoutMins = parseInt(logWorkout);

    if (Object.keys(payload).length <= 1) {
      showToast('Please fill in at least one vital metric before logging.', 'error');
      return;
    }

    try {
      const resp = await fetch(`${BACKEND_URL}/api/health-analytics/vitals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': profileEmail
        },
        body: JSON.stringify(payload)
      });
      if (resp.ok) {
        showToast('Daily health telemetry stored in MongoDB database!', 'success');
        await refreshAllData();
      }
    } catch (err) {
      console.warn('Vitals log sync warning:', err);
    }
  };

  // ─── SOS ─────────────────────────────────────────────────────────────────────
  const [sosCountdown, setSosCountdown] = useState(null);
  const [sosActive, setSosActive] = useState(false);
  const countdownRef = useRef(null);
  const triggerSOS = () => {
    if (sosActive) { setSosActive(false); setSosCountdown(null); clearInterval(countdownRef.current); return; }
    setSosCountdown(3);
    countdownRef.current = setInterval(() => {
      setSosCountdown(prev => {
        if (prev <= 1) { clearInterval(countdownRef.current); setSosActive(true); return null; }
        return prev - 1;
      });
    }, 1000);
  };

  const getDynamicHealthScore = () => {
    if (!activePlan) return null;

    let score = 0;

    // 1. Health Profile Completeness (max 20 pts)
    let profilePts = 0;
    if (profileAge) profilePts += 5;
    if (profileGender) profilePts += 5;
    if (profileBloodGroup) profilePts += 5;
    if (profileEmergencyPhone) profilePts += 5;
    score += profilePts;

    // 2. Plan Checklist Completion (max 30 pts)
    const totalTasks = tasks.length;
    if (totalTasks > 0) {
      const completedTasksCount = tasks.filter(t => t.done).length;
      score += Math.round((completedTasksCount / totalTasks) * 30);
    } else {
      score += 20; // baseline if no tasks defined
    }

    // 3. Water Intake (max 20 pts)
    const targetWater = activePlan.plan?.waterIntakeGoalLiters || 3.5;
    const currentWater = waterCount || 0;
    score += Math.min(20, Math.round((currentWater / targetWater) * 20));

    // 4. Sleep (max 15 pts)
    const targetSleep = activePlan.plan?.sleepRecommendationHours || 8.0;
    const lastSleep = vitalsHistory.length > 0 ? (vitalsHistory[vitalsHistory.length - 1].sleep || 7.0) : 7.0;
    score += Math.min(15, Math.round((lastSleep / targetSleep) * 15));

    // 5. Exercise/Workout completed (max 15 pts)
    const workoutDone = tasks.find(t => t.priority === 'fitness' && t.done) ? 15 : 5;
    score += workoutDone;

    return Math.min(100, Math.max(10, score));
  };

  // ─────────────────────────────────────────────────────────────────────────────
  //   R E N D E R
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f0f4f8] dark:bg-[#030407] text-slate-800 dark:text-slate-100 transition-colors duration-300 font-sans relative">

      {/* Background Grid + Glow */}
      <div className="bg-dashboard-grid" />
      <div className="fixed -top-1/4 -right-1/4 w-[60vw] h-[60vw] rounded-full bg-sky-500/5 blur-[150px] pointer-events-none z-0 animate-pulse" />
      <div className="fixed top-1/3 -left-1/4 w-[50vw] h-[50vw] rounded-full bg-cyan-500/4 blur-[130px] pointer-events-none z-0" />

      {/* ─── LEFT SIDEBAR ────────────────────────────────────────────────────── */}
      <aside className={`bg-white dark:bg-[#080a0f]/95 border-r border-slate-200 dark:border-slate-900/60 flex flex-col h-screen overflow-hidden transition-all duration-300 z-30 shrink-0 ${
        sidebarCollapsed ? 'w-14' : 'w-52'
      } hidden md:flex`}>

        <div 
          onClick={() => navigate('/')}
          className="h-12 flex-shrink-0 flex items-center px-3 border-b border-slate-200 dark:border-slate-900/60 gap-2.5 overflow-hidden cursor-pointer hover:opacity-85 transition-all duration-200"
          title="Go to Home"
        >
          <img 
            src="/logos/Logo (MAIN).png" 
            alt="MediGrid Logo" 
            className="h-7 w-7 object-contain shrink-0 transition-transform duration-300 hover:scale-105" 
          />
          {!sidebarCollapsed && (
            <div className="leading-none overflow-hidden">
              <span className="font-extrabold text-xs text-slate-800 dark:text-white tracking-tight block">MediGrid</span>
              <span className="text-[9px] font-bold text-sky-500 uppercase tracking-wider">AI Clinical OS</span>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <div className="flex-1 overflow-y-auto min-h-0 py-4 text-left">
          {!sidebarCollapsed && (
            <div className="px-5 pb-2 text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600">Workspace</div>
          )}
          <div className="px-3 space-y-1">
            {sidebarItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${
                  activeTab === item.id || (item.id === 4 && activeTab === 9)
                    ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-md shadow-sky-500/20'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-white/5'
                } ${sidebarCollapsed ? 'justify-center' : 'text-left'}`}
              >
                <item.icon size={16} className="shrink-0" />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                {item.id === 7 && !sidebarCollapsed && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-900/60 bg-white dark:bg-[#080a0f]/95">
          <div className="px-3 py-3 space-y-0.5">
            <button
              onClick={() => setActiveTab(10)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-white/5 ${sidebarCollapsed ? 'justify-center' : 'text-left'}`}
            >
              <Settings size={15} className="shrink-0" />
              {!sidebarCollapsed && <span>Account Settings</span>}
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                navigate('/login', { replace: true });
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer ${sidebarCollapsed ? 'justify-center' : 'text-left'}`}
            >
              <LogOut size={15} className="shrink-0" />
              {!sidebarCollapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* ─── CENTER CONTAINER ──────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10 min-w-0">

        {/* ─── TOP NAVBAR ────────────────────────────────────────────────────── */}
        <header className="h-12 bg-white/90 dark:bg-[#06080c]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-900/60 px-4 flex items-center justify-between z-20 shrink-0">
          <div className="flex items-center gap-2">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer md:hidden"
            >
              <Menu size={16} />
            </button>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer hidden md:block"
            >
              <Menu size={16} />
            </button>
            <span className="text-xs font-extrabold text-slate-800 dark:text-white tracking-tight">
              {activeTab === 10 ? 'Account Settings' : activeTab === 9 ? 'Medicine Cart' : (sidebarItems[activeTab]?.label ?? 'Dashboard')}
            </span>
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-[10px] font-bold text-cyan-600 dark:text-cyan-400 shrink-0 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
              CARE GRID SYNCED
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Plan badge */}
            {isPremium ? (
              <div className="hidden 2xl:flex items-center gap-1 px-2.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/5 text-[10px] font-bold text-amber-500 shrink-0 whitespace-nowrap shadow-sm">
                <ShieldCheck size={12} className="text-amber-500" />
                <span>Premium Health Account</span>
                <span className="opacity-60 font-normal border-l border-amber-500/30 pl-1">Exp: Dec 2026</span>
              </div>
            ) : (
              <button
                onClick={handleUpgradePayment}
                className="hidden 2xl:flex items-center gap-1.5 px-3 py-1 rounded-full border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-[10px] font-black text-sky-600 dark:text-sky-400 hover:scale-[1.03] transition-all cursor-pointer shrink-0 whitespace-nowrap shadow-sm"
              >
                <Sparkles size={12} className="text-sky-500 animate-pulse" />
                <span>Upgrade to Premium</span>
              </button>
            )}

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
            >
              {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
            </button>

            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer relative"
              >
                <Bell size={15} />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-sky-500 rounded-full" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e111a] p-4 shadow-xl z-50">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-wider">Notifications</span>
                    <button onClick={clearAllNotifications} className="text-[9px] font-bold text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">Clear all</button>
                  </div>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationRead(n.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all ${n.read ? 'border-slate-100 dark:border-slate-900 bg-slate-50 dark:bg-[#07090f]' : 'border-sky-200/50 dark:border-sky-800/30 bg-sky-50/50 dark:bg-sky-950/10'}`}
                      >
                        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{n.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{n.desc}</p>
                        <span className="text-[9px] text-slate-400 block mt-1">{n.time}</span>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <p className="text-[11px] text-slate-400 text-center py-4">No notifications</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Cart button */}
            <button
              onClick={() => setActiveTab(9)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer relative flex items-center gap-1"
              title="View Cart"
            >
              <ShoppingCart size={15} className="text-sky-500" />
              {cartItems.length > 0 && (
                <span className="px-1 py-0.5 rounded bg-sky-500 text-[9px] font-bold text-white leading-none">
                  {cartItems.reduce((a, i) => a + i.qty, 0)}
                </span>
              )}
            </button>

            {/* User avatar & Logout */}
            <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-900/60 pl-2.5">
              {profilePictureUrl ? (
                <img src={profilePictureUrl} alt="Avatar" className={`w-7 h-7 rounded-lg object-cover shadow-md shrink-0 ${isPremium ? 'border-2 border-amber-400 ring-2 ring-amber-400/40 ring-offset-1 dark:ring-offset-slate-900' : ''}`} />
              ) : (
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white font-black text-[10px] shadow-md shrink-0 ${isPremium ? 'border-2 border-amber-400 ring-2 ring-amber-400/40 ring-offset-1 dark:ring-offset-slate-900' : ''}`}>
                  {profileName ? profileName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                </div>
              )}
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-800 dark:text-white leading-none">{profileName}</p>
                <span className="text-[9px] text-slate-400 block mt-0.5">{profileEmail}</span>
              </div>
              <button
                onClick={() => {
                  localStorage.clear();
                  navigate('/login', { replace: true });
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer ml-1"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>


          </div>
        </header>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden flex justify-start">
            <div className="w-64 bg-white dark:bg-[#080a0f] h-full p-4 flex flex-col justify-between border-r border-slate-200 dark:border-slate-900">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <img 
                      src="/logos/Logo (MAIN).png" 
                      alt="MediGrid Logo" 
                      className="h-7 w-7 object-contain" 
                    />
                    <span className="font-extrabold text-base text-slate-800 dark:text-white">MediGrid</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-lg text-slate-400"><X size={18} /></button>
                </div>
                <div className="space-y-1">
                  {sidebarItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === item.id ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                      <item.icon size={16} />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1 mt-auto">
                <button
                  onClick={() => { setActiveTab(10); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 10 ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white' : 'text-slate-600 dark:text-slate-400'}`}
                >
                  <Settings size={16} /> Account Settings
                </button>
                <button
                  onClick={() => {
                    localStorage.clear();
                    navigate('/login', { replace: true });
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl text-xs font-bold text-red-500 bg-red-50 dark:bg-red-950/20"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── CONTENT AREA ──────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6 text-left">

          {/* ══ TAB 0: DASHBOARD OVERVIEW ══════════════════════════════════════ */}
          {activeTab === 0 && (
            <>
              {/* HERO BANNER */}
              <div className="bg-[#080d1a] rounded-[24px] py-6 px-8 text-white relative overflow-hidden border border-sky-950/40 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-xl">
                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#0ea5e9_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e9_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/8 rounded-full blur-[100px] pointer-events-none animate-pulse" />

                <div className="space-y-3 relative z-10 max-w-xl">
                  <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest block">{getGreeting()} 👋</span>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-none" style={{ color: '#ffffff' }}>
                    Welcome back, <span className="bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">{profileName}!</span>
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    MediGrid AI Autopilot is running in the background — currently syncing vitals, validating medication schedules, and cross-checking clinical diagnostics across your EMR grid.
                  </p>
                  <div className="flex flex-wrap gap-3 pt-1.5">
                    <button
                      onClick={() => setActiveTab(1)}
                      className="px-4 py-2 bg-gradient-to-r from-sky-500 to-cyan-500 hover:opacity-95 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-sky-500/20 cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus size={14} strokeWidth={2.5} />
                      <span>Start Symptom Check</span>
                    </button>
                    <button
                      onClick={() => setAiPanelOpen(true)}
                      className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-black rounded-xl transition-all border border-white/10 cursor-pointer flex items-center gap-1.5"
                    >
                      <Sparkles size={14} className="text-sky-400 animate-pulse" />
                      <span>Consult AI Assistant</span>
                    </button>
                  </div>
                </div>

                 {/* Health Score Card */}
                 {(() => {
                   const currentScore = analyticsSummary?.healthScore ?? (activePlan ? getDynamicHealthScore() : (() => {
                     const last = vitalsHistory[vitalsHistory.length - 1] || {};
                     const sugarScore = last.sugar != null ? Math.max(0, 100 - Math.abs(last.sugar - 90)) : null;
                     const bpScore = last.bp != null ? Math.max(0, 100 - Math.abs(last.bp - 120)) : null;
                     const waterScore = last.water != null ? Math.min(100, Math.round((last.water / 3.0) * 100)) : null;
                     const sleepScore = last.sleep != null ? Math.min(100, Math.round((last.sleep / 8.0) * 100)) : null;
                     const parts = [sugarScore, bpScore, waterScore, sleepScore].filter(s => s != null);
                     return parts.length > 0 ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : null;
                   })());

                   if (currentScore == null) {
                     return (
                       <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 w-full lg:w-56 text-center relative overflow-hidden shrink-0 shadow-lg">
                         <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-sky-500/20 to-cyan-500/20 rounded-full blur-xl" />
                         <p className="text-[10px] font-black uppercase text-sky-400 tracking-wider">Health Score</p>
                         <div className="relative w-24 h-24 flex items-center justify-center mx-auto my-2">
                           <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                             <circle cx="50" cy="50" r="42" stroke="rgba(14,165,233,0.1)" strokeWidth="8" fill="transparent" />
                             <circle cx="50" cy="50" r="42" stroke="rgba(14,165,233,0.15)" strokeWidth="8" fill="transparent"
                               strokeDasharray="264" strokeDashoffset="264" strokeLinecap="round" />
                           </svg>
                           <div className="absolute flex flex-col items-center">
                             <span className="text-lg font-black text-white/40">—</span>
                             <span className="text-[9px] font-bold uppercase tracking-wide text-slate-500">No Data</span>
                           </div>
                         </div>
                         <p className="text-[9px] font-bold text-slate-500">Log vitals to see your score</p>
                       </div>
                     );
                   }

                   const offset = Math.max(0, Math.round(264 - (264 * (currentScore / 100))));
                   const ratingText = currentScore >= 85 ? 'Excellent' : currentScore >= 70 ? 'Good' : 'Needs Care';
                   const ratingColor = currentScore >= 85 ? 'text-emerald-400' : currentScore >= 70 ? 'text-sky-400' : 'text-amber-400';
                   const isAutopilot = activePlan && analyticsSummary?.healthScore == null;

                   return (
                     <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 w-full lg:w-56 text-center relative overflow-hidden shrink-0 shadow-lg animate-fadeIn">
                       <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 rounded-full blur-xl" />
                       <p className="text-[10px] font-black uppercase text-sky-400 tracking-wider">Health Score</p>
                       <div className="relative w-24 h-24 flex items-center justify-center mx-auto my-2">
                         <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                           <circle cx="50" cy="50" r="42" stroke="rgba(99,102,241,0.1)" strokeWidth="8" fill="transparent" />
                           <circle cx="50" cy="50" r="42" stroke="url(#healthGrad)" strokeWidth="8" fill="transparent"
                             strokeDasharray="264" strokeDashoffset={offset} strokeLinecap="round" />
                           <defs>
                             <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                               <stop offset="0%" stopColor="#818cf8" stopOpacity="1" />
                               <stop offset="100%" stopColor="#4f46e5" stopOpacity="1" />
                             </linearGradient>
                           </defs>
                         </svg>
                         <div className="absolute flex flex-col items-center">
                           <span className="text-2xl font-black text-white">{currentScore}</span>
                           <span className={`text-[9px] font-bold uppercase tracking-wide ${ratingColor}`}>{ratingText}</span>
                         </div>
                       </div>
                       <p className="text-[9px] font-bold text-slate-400 flex items-center justify-center gap-1">
                         <span className={`${isAutopilot ? 'text-indigo-400' : 'text-emerald-400'} font-extrabold`}>
                           {analyticsSummary?.healthScore != null ? 'Synchronized Health Index' : isAutopilot ? 'Active Plan Autopilot' : 'Based on logged vitals'}
                         </span>
                       </p>
                     </div>
                   );
                 })()}
              </div>

              {/* No Active Health Plan Notice */}
              {!activePlan && (
                <div className="bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-cyan-500/10 border border-indigo-500/20 dark:border-indigo-400/20 rounded-[24px] p-6 text-left relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-md backdrop-blur-xl animate-fadeIn">
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse shrink-0" />
                      No Active Health Plan
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl">
                      Create your first personalized AI Health Plan to receive customized diet, workout, and wellness recommendations.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab(6)}
                    className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:shadow-lg text-white text-xs font-black rounded-xl transition-all cursor-pointer whitespace-nowrap"
                  >
                    Create My Health Plan
                  </button>
                </div>
              )}

              {/* METRIC CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Heart Rate */}
                <div className="bg-white dark:bg-[#080b11] border border-slate-200 dark:border-slate-900 rounded-[24px] p-5 text-left relative overflow-hidden hover:border-sky-500/30 transition-all shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Heart Rate</p>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                        {vitalsHistory.length > 0 && vitalsHistory[vitalsHistory.length - 1]?.heartRate != null
                          ? <>{vitalsHistory[vitalsHistory.length - 1].heartRate} <span className="text-sm font-bold text-slate-400">BPM</span></>
                          : <span className="text-slate-400 dark:text-slate-600 text-base font-bold">—</span>}
                      </h3>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                      <Heart size={16} className={vitalsHistory.length > 0 ? 'animate-pulse' : ''} />
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-900/80 flex justify-between items-center text-[9px] font-bold text-slate-500">
                    <span>Normal range: 60–90 BPM</span>
                    {vitalsHistory.length > 0 && vitalsHistory[vitalsHistory.length - 1]?.heartRate != null
                      ? <span className="text-emerald-500 font-extrabold">Logged</span>
                      : <span className="text-slate-400 font-bold cursor-pointer hover:text-sky-500 transition-colors" onClick={() => setActiveTab(2)}>Log vitals →</span>}
                  </div>
                </div>

                {/* Blood Pressure */}
                <div className="bg-white dark:bg-[#080b11] border border-slate-200 dark:border-slate-900 rounded-[24px] p-5 text-left relative overflow-hidden hover:border-sky-500/30 transition-all shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Blood Pressure</p>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                        {vitalsHistory.length > 0 && vitalsHistory[vitalsHistory.length - 1]?.bp != null
                          ? <>{vitalsHistory[vitalsHistory.length - 1].bp}<span className="text-sm font-bold text-slate-400">/80</span></>
                          : <span className="text-slate-400 dark:text-slate-600 text-base font-bold">—</span>}
                      </h3>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                      <Activity size={16} />
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-900/80 flex justify-between items-center text-[9px] font-bold text-slate-500">
                    <span>Systolic / Diastolic (mmHg)</span>
                    {vitalsHistory.length > 0 && vitalsHistory[vitalsHistory.length - 1]?.bp != null
                      ? <span className="text-emerald-500 font-extrabold">Logged</span>
                      : <span className="text-slate-400 font-bold cursor-pointer hover:text-sky-500 transition-colors" onClick={() => setActiveTab(2)}>Log vitals →</span>}
                  </div>
                </div>

                {/* Blood Glucose */}
                <div className="bg-white dark:bg-[#080b11] border border-slate-200 dark:border-slate-900 rounded-[24px] p-5 text-left relative overflow-hidden hover:border-sky-500/30 transition-all shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Blood Glucose</p>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                        {vitalsHistory.length > 0 && vitalsHistory[vitalsHistory.length - 1]?.sugar != null
                          ? <>{vitalsHistory[vitalsHistory.length - 1].sugar} <span className="text-sm font-bold text-slate-400">mg/dL</span></>
                          : <span className="text-slate-400 dark:text-slate-600 text-base font-bold">—</span>}
                      </h3>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                      <Zap size={16} />
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-900/80 flex justify-between items-center text-[9px] font-bold text-slate-500">
                    <span>Fasting glucose</span>
                    {vitalsHistory.length > 0 && vitalsHistory[vitalsHistory.length - 1]?.sugar != null
                      ? <span className="text-emerald-500 font-extrabold">Logged</span>
                      : <span className="text-slate-400 font-bold cursor-pointer hover:text-sky-500 transition-colors" onClick={() => setActiveTab(2)}>Log vitals →</span>}
                  </div>
                </div>

                 {/* Platform Status or Active Plan Goals */}
                 {activePlan ? (
                   <div className="bg-white dark:bg-[#080b11] border border-slate-200 dark:border-slate-900 rounded-[24px] p-5 text-left relative overflow-hidden hover:border-sky-500/30 transition-all shadow-sm animate-fadeIn">
                     <div className="flex justify-between items-start">
                       <div>
                         <p className="text-[10px] font-black uppercase text-indigo-500 dark:text-indigo-400 tracking-wider font-extrabold">Hydration & Sleep Goals</p>
                         <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 mt-2 flex flex-col gap-1">
                           <span className="flex items-center gap-1.5">
                             <span className="w-2 h-2 rounded-full bg-sky-500" />
                             Water: {waterCount} L / {activePlan.plan?.waterIntakeGoalLiters || 3.5} L
                           </span>
                           <span className="flex items-center gap-1.5">
                             <span className="w-2 h-2 rounded-full bg-indigo-500" />
                             Sleep Target: {activePlan.plan?.sleepRecommendationHours || 8.0} hrs
                           </span>
                         </h3>
                       </div>
                       <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                         <Sparkles size={16} className="animate-pulse" />
                       </div>
                     </div>
                     <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-900/80 flex justify-between items-center text-[9px] font-bold text-slate-500">
                       <span>Today's Completion: {Math.min(100, Math.round((tasks.filter(t => t.done).length / (tasks.length || 1)) * 100))}%</span>
                       <span className="text-indigo-500 dark:text-indigo-400 font-extrabold cursor-pointer hover:underline" onClick={() => setActiveTab(6)}>View Plan →</span>
                     </div>
                   </div>
                 ) : (
                   <div className="bg-white dark:bg-[#080b11] border border-slate-200 dark:border-slate-900 rounded-[24px] p-5 text-left relative overflow-hidden hover:border-sky-500/30 transition-all shadow-sm">
                     <div className="flex justify-between items-start">
                       <div>
                         <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">MediGrid Status</p>
                         <h3 className="text-xl font-black text-emerald-500 dark:text-emerald-400 mt-1">Online</h3>
                       </div>
                       <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                         <ShieldCheck size={16} />
                       </div>
                     </div>
                     <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-900/80 flex justify-between items-center text-[9px] font-bold text-slate-500">
                       <span>{vitalsHistory.length > 0 ? `${vitalsHistory.length} vitals entries` : 'No vitals logged yet'}</span>
                       <span className="text-emerald-500 font-extrabold">Active</span>
                     </div>
                   </div>
                 )}
              </div>

              {/* PREMIUM MODULES HUB GRID */}
              <div className="mt-8">
                <div className="text-left mb-6">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Quick Access Modules</h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">Direct entry points to MediGrid's clinical and wellness services</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {/* CARD 1: SYMPTOM CHECKER */}
                  <div
                    onClick={() => setActiveTab(1)}
                    className="bg-white dark:bg-[#080a0f] border border-slate-200 dark:border-slate-900 rounded-[24px] p-6 hover:border-rose-500/40 hover:shadow-xl hover:shadow-rose-500/5 hover:-translate-y-1 transition-all duration-300 relative group flex flex-col justify-between overflow-hidden cursor-pointer text-left"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-500/5 to-pink-500/5 rounded-full blur-xl pointer-events-none group-hover:from-rose-500/10 group-hover:to-pink-500/10 transition-all duration-300" />
                    <div>
                      <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                        <Heart className="w-5 h-5" />
                      </div>
                      <span className="text-[9px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest block">AI Diagnostics</span>
                      <h4 className="text-sm font-black text-slate-800 dark:text-white mt-1.5">Symptom Checker</h4>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed font-medium">
                        Describe your physical symptoms to assess potential clinical conditions and receive triage guidance.
                      </p>
                    </div>
                    <div className="text-[10px] font-extrabold text-rose-500 dark:text-rose-400 mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 duration-200 transition-transform">
                      <span>Launch Checker</span>
                      <ChevronRight size={12} strokeWidth={2.5} />
                    </div>
                  </div>

                  {/* CARD 2: HEALTH ANALYTICS */}
                  <div
                    onClick={() => setActiveTab(2)}
                    className="bg-white dark:bg-[#080a0f] border border-slate-200 dark:border-slate-900 rounded-[24px] p-6 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1 transition-all duration-300 relative group flex flex-col justify-between overflow-hidden cursor-pointer text-left"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-full blur-xl pointer-events-none group-hover:from-emerald-500/10 group-hover:to-teal-500/10 transition-all duration-300" />
                    <div>
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                        <Activity className="w-5 h-5" />
                      </div>
                      <span className="text-[9px] font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-widest block">Telemetry</span>
                      <h4 className="text-sm font-black text-slate-800 dark:text-white mt-1.5">Health Analytics</h4>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed font-medium">
                        Analyze historical biometrics, track daily vitals, and export downloadable monthly health reports.
                      </p>
                    </div>
                    <div className="text-[10px] font-extrabold text-emerald-500 dark:text-emerald-400 mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 duration-200 transition-transform">
                      <span>Open Analytics</span>
                      <ChevronRight size={12} strokeWidth={2.5} />
                    </div>
                  </div>

                  {/* CARD 3: REPORT ANALYZER */}
                  <div
                    onClick={() => setActiveTab(3)}
                    className="bg-white dark:bg-[#080a0f] border border-slate-200 dark:border-slate-900 rounded-[24px] p-6 hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-500/5 hover:-translate-y-1 transition-all duration-300 relative group flex flex-col justify-between overflow-hidden cursor-pointer text-left"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:from-purple-500/10 group-hover:to-indigo-500/10 transition-all duration-300" />
                    <div>
                      <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                        <FileHeart className="w-5 h-5" />
                      </div>
                      <span className="text-[9px] font-black text-purple-500 dark:text-purple-400 uppercase tracking-widest block">Diagnostics</span>
                      <h4 className="text-sm font-black text-slate-800 dark:text-white mt-1.5">Report Analyzer</h4>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed font-medium">
                        Upload lab results or EMR documents to translate clinical terminology into plain, readable insights.
                      </p>
                    </div>
                    <div className="text-[10px] font-extrabold text-purple-500 dark:text-purple-400 mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 duration-200 transition-transform">
                      <span>Analyze Report</span>
                      <ChevronRight size={12} strokeWidth={2.5} />
                    </div>
                  </div>

                  {/* CARD 4: AI HEALTH PLANNER */}
                  <div
                    onClick={() => setActiveTab(6)}
                    className="bg-white dark:bg-[#080a0f] border border-slate-200 dark:border-slate-900 rounded-[24px] p-6 hover:border-sky-500/40 hover:shadow-xl hover:shadow-sky-500/5 hover:-translate-y-1 transition-all duration-300 relative group flex flex-col justify-between overflow-hidden cursor-pointer text-left"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-sky-500/5 to-cyan-500/5 rounded-full blur-xl pointer-events-none group-hover:from-sky-500/10 group-hover:to-cyan-500/10 transition-all duration-300" />
                    <div>
                      <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <span className="text-[9px] font-black text-sky-500 dark:text-sky-400 uppercase tracking-widest block">Wellness</span>
                      <h4 className="text-sm font-black text-slate-800 dark:text-white mt-1.5">AI Health Planner</h4>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed font-medium">
                        Generate custom diet schedules, physical workouts, and daily checklist targets powered by Gemini.
                      </p>
                    </div>
                    <div className="text-[10px] font-extrabold text-sky-500 dark:text-sky-400 mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 duration-200 transition-transform">
                      <span>Manage Planner</span>
                      <ChevronRight size={12} strokeWidth={2.5} />
                    </div>
                  </div>

                  {/* CARD 5: MEDICINE STORE */}
                  <div
                    onClick={() => setActiveTab(4)}
                    className="bg-white dark:bg-[#080a0f] border border-slate-200 dark:border-slate-900 rounded-[24px] p-6 hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 relative group flex flex-col justify-between overflow-hidden cursor-pointer text-left"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:from-blue-500/10 group-hover:to-indigo-500/10 transition-all duration-300" />
                    <div>
                      <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                        <Pill className="w-5 h-5" />
                      </div>
                      <span className="text-[9px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest block">Pharmacy</span>
                      <h4 className="text-sm font-black text-slate-800 dark:text-white mt-1.5">Medicine Store</h4>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed font-medium">
                        Order prescribed medicines, health supplements, and smart telemetry devices with instant dispatch.
                      </p>
                    </div>
                    <div className="text-[10px] font-extrabold text-blue-500 dark:text-blue-400 mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 duration-200 transition-transform">
                      <span>Shop Pharmacy</span>
                      <ChevronRight size={12} strokeWidth={2.5} />
                    </div>
                  </div>

                  {/* CARD 6: NEARBY HOSPITALS */}
                  <div
                    onClick={() => setActiveTab(5)}
                    className="bg-white dark:bg-[#080a0f] border border-slate-200 dark:border-slate-900 rounded-[24px] p-6 hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 relative group flex flex-col justify-between overflow-hidden cursor-pointer text-left"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full blur-xl pointer-events-none group-hover:from-indigo-500/10 group-hover:to-purple-500/10 transition-all duration-300" />
                    <div>
                      <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <span className="text-[9px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest block">Provider Map</span>
                      <h4 className="text-sm font-black text-slate-800 dark:text-white mt-1.5">Nearby Hospitals</h4>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed font-medium">
                        Locate nearest specialty clinics, active hospitals, and trauma facilities with real-time navigation.
                      </p>
                    </div>
                    <div className="text-[10px] font-extrabold text-indigo-500 dark:text-indigo-400 mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 duration-200 transition-transform">
                      <span>Find Hospitals</span>
                      <ChevronRight size={12} strokeWidth={2.5} />
                    </div>
                  </div>

                  {/* CARD 7: AI ASSISTANT */}
                  <div
                    onClick={() => setActiveTab(8)}
                    className="bg-white dark:bg-[#080a0f] border border-slate-200 dark:border-slate-900 rounded-[24px] p-6 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/5 hover:-translate-y-1 transition-all duration-300 relative group flex flex-col justify-between overflow-hidden cursor-pointer text-left"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/5 to-sky-500/5 rounded-full blur-xl pointer-events-none group-hover:from-cyan-500/10 group-hover:to-sky-500/10 transition-all duration-300" />
                    <div>
                      <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                        <Send className="w-5 h-5" />
                      </div>
                      <span className="text-[9px] font-black text-cyan-500 dark:text-cyan-400 uppercase tracking-widest block">Counseling</span>
                      <h4 className="text-sm font-black text-slate-800 dark:text-white mt-1.5">AI Health Assistant</h4>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed font-medium">
                        Consult your personal AI medical mentor on drug interactions, nutrition details, and lifestyle FAQs.
                      </p>
                    </div>
                    <div className="text-[10px] font-extrabold text-cyan-500 dark:text-cyan-400 mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 duration-200 transition-transform">
                      <span>Consult Assistant</span>
                      <ChevronRight size={12} strokeWidth={2.5} />
                    </div>
                  </div>

                  {/* CARD 8: EMERGENCY SOS */}
                  <div
                    onClick={() => setActiveTab(7)}
                    className="bg-white dark:bg-[#080a0f] border border-slate-200 dark:border-slate-900 rounded-[24px] p-6 hover:border-rose-600/40 hover:shadow-xl hover:shadow-rose-600/5 hover:-translate-y-1 transition-all duration-300 relative group flex flex-col justify-between overflow-hidden cursor-pointer text-left"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-600/5 to-red-500/5 rounded-full blur-xl pointer-events-none group-hover:from-rose-600/10 group-hover:to-red-500/10 transition-all duration-300" />
                    <div>
                      <div className="w-10 h-10 rounded-2xl bg-rose-600/10 text-rose-600 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <span className="text-[9px] font-black text-rose-600 dark:text-rose-500 uppercase tracking-widest block">Crisis Dispatch</span>
                      <h4 className="text-sm font-black text-slate-800 dark:text-white mt-1.5">Emergency SOS</h4>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed font-medium">
                        Instantly alert emergency response and dispatch pre-configured SMS warnings to your emergency contacts.
                      </p>
                    </div>
                    <div className="text-[10px] font-extrabold text-rose-600 dark:text-rose-500 mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 duration-200 transition-transform">
                      <span>Activate Alert</span>
                      <ChevronRight size={12} strokeWidth={2.5} />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ══ TAB 1: SYMPTOM CHECKER ════════════════════════════════════════ */}
          {activeTab === 1 && (
            <div className="max-w-3xl mx-auto bg-white dark:bg-[#080b11] rounded-[24px] border border-slate-200 dark:border-slate-900 p-8 text-left shadow-xl space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-900 pb-5">
                <span className="text-xs font-black text-sky-400 tracking-wider uppercase">Advanced Diagnosis Module</span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">AI Clinical Symptom Checker</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">Describe your symptoms. The MediGrid AI Engine will assess potential conditions and recommend next steps.</p>
              </div>

              {symptomStage === 'input' && (
                <form onSubmit={handleSymptomSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Age Input */}
                    <div>
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Age</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="120"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#04060b] px-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500"
                        value={patientAge} 
                        onChange={e => setPatientAge(e.target.value)} 
                        required
                      />
                    </div>

                    {/* Gender Selector */}
                    <div>
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Gender</label>
                      <div className="flex gap-2">
                        {['Male', 'Female', 'Other'].map(g => (
                          <button
                            type="button"
                            key={g}
                            onClick={() => setPatientGender(g)}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              patientGender === g
                                ? 'bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-500/10'
                                : 'bg-white dark:bg-[#080b11] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Core Category Dropdown */}
                    <div>
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Core Region / Category</label>
                      <select
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#04060b] px-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer font-bold"
                        value={symptomCategory}
                        onChange={e => setSymptomCategory(e.target.value)}
                      >
                        {['Fever & Pain', 'Heart Health', 'Diabetes Care', 'Bacterial Infections', 'Others'].map(cat => (
                          <option key={cat} value={cat} className="bg-white dark:bg-[#080b11]">{cat}</option>
                        ))}
                      </select>
                    </div>

                    {/* Severity Selector */}
                    <div>
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Severity Level</label>
                      <div className="flex gap-2">
                        {['Mild', 'Moderate', 'Severe'].map(s => (
                          <button
                            type="button"
                            key={s}
                            onClick={() => setSymptomSeverity(s)}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              symptomSeverity === s
                                ? s === 'Severe'
                                  ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/10'
                                  : 'bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-500/10'
                                : 'bg-white dark:bg-[#080b11] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Primary Symptoms input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Describe Symptoms</label>
                    <textarea 
                      rows="4" 
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#04060b] p-4 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                      placeholder="Specify your symptoms in detail (e.g. heavy chest pressure since morning, high body temperature, sore throat, cough...)"
                      value={symptomInput} 
                      onChange={e => setSymptomInput(e.target.value)} 
                      required
                    />
                  </div>

                  <button type="submit" className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-cyan-500 text-white text-xs font-black rounded-xl cursor-pointer shadow-md shadow-sky-500/20 hover:opacity-90 transition-all">
                    Proceed to Symptom Analysis
                  </button>
                </form>
              )}

              {symptomStage === 'loading' && (
                <div className="flex flex-col items-center gap-3 py-10">
                  <RefreshCw className="animate-spin text-sky-500" size={32} />
                  <p className="text-xs font-bold text-slate-400">AI engine analyzing clinical patterns...</p>
                </div>
              )}

              {symptomStage === 'questions' && (
                <div className="space-y-4">
                  <p className="text-sm font-bold text-slate-800 dark:text-white">Follow-up: How long have you had these symptoms?</p>
                  <div className="flex flex-wrap gap-2">
                    {['Less than 1 day', '1–3 days', '4–7 days', 'Over a week'].map(opt => (
                      <button key={opt} onClick={() => handleSymptomAnswer(opt)}
                        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-sky-500 hover:text-sky-500 transition-all cursor-pointer bg-white dark:bg-slate-900/40">
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {symptomStage === 'result' && symptomResults && (
                <div className="space-y-5">
                  {/* Patient Profile Summary */}
                  <div className="flex flex-wrap gap-2 pb-1 border-b border-slate-100 dark:border-slate-900">
                    <span className="text-[9px] font-black uppercase bg-slate-100 dark:bg-slate-900 text-slate-500 px-2.5 py-1 rounded-md">Age: {patientAge}</span>
                    <span className="text-[9px] font-black uppercase bg-slate-100 dark:bg-slate-900 text-slate-500 px-2.5 py-1 rounded-md">Gender: {patientGender}</span>
                    <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md ${
                      symptomSeverity === 'Severe' ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-100 dark:bg-slate-900 text-slate-500'
                    }`}>Severity: {symptomSeverity}</span>
                    <span className="text-[9px] font-black uppercase bg-slate-100 dark:bg-slate-900 text-slate-500 px-2.5 py-1 rounded-md">Duration: {symptomResults.duration}</span>
                    {symptomResults.isLive ? (
                      <span className="text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-1 rounded-md flex items-center gap-1">
                        <Sparkles size={10} className="text-emerald-500 animate-pulse animate-duration-1000" /> LIVE GEMINI AI
                      </span>
                    ) : (
                      <span className="text-[9px] font-black uppercase bg-slate-100 dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800/80 px-2.5 py-1 rounded-md">
                        LOCAL SANDBOX (OFFLINE)
                      </span>
                    )}
                  </div>

                  <div className={`p-4 rounded-2xl border ${symptomResults.color === 'red' ? 'border-red-500/30 bg-red-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Likely Primary Condition</p>
                        <h4 className={`text-lg font-black mt-1 ${symptomResults.color === 'red' ? 'text-red-400' : 'text-amber-400'}`}>{symptomResults.condition}</h4>
                      </div>
                      <div className="text-right">
                        <span className={`text-2xl font-black ${symptomResults.color === 'red' ? 'text-rose-400' : 'text-amber-400'}`}>{symptomResults.probability}</span>
                        <p className="text-[9px] text-slate-400 font-bold">confidence</p>
                      </div>
                    </div>
                  </div>

                  {/* Expected Symptoms Section */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Associated Expected Symptoms</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {symptomResults.expected.map((exp, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-[#0c0f17]/50 border border-slate-100 dark:border-slate-900/60">
                          <Check size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-[10px] text-slate-600 dark:text-slate-300 font-semibold leading-normal">{exp}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Clinical Action & Precautions</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">{symptomResults.precautions}</p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button onClick={() => { setActiveTab(2); setSelectedDoctor(doctorsList[symptomResults.specialistId - 1]); }}
                      className="flex-1 py-2.5 bg-gradient-to-r from-sky-500 to-cyan-500 text-white text-xs font-black rounded-xl cursor-pointer shadow-md shadow-sky-500/20 hover:opacity-95 transition-all">
                      Book {symptomResults.specialist} Consult
                    </button>
                    <button onClick={() => { setSymptomStage('input'); setSymptomResults(null); setSymptomInput(''); }}
                      className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900">
                      Check Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ TAB 2: HEALTH ANALYTICS ════════════════════════════════════ */}
          {activeTab === 2 && (
            <HealthAnalytics
              theme={theme}
              isDark={isDark}
              profileEmail={profileEmail}
              userProfile={healthProfile}
              vitalsHistory={vitalsHistory}
              analyticsSummary={analyticsSummary}
              refreshAllData={refreshAllData}
              setActiveTab={setActiveTab}
              activePlan={activePlan}
            />
          )}

          {/* ══ TAB 3: MEDICAL REPORT ANALYZER ══════════════════════════════════ */}
          {activeTab === 3 && (
            <MedicalReportAnalyzer profileEmail={profileEmail} refreshAllData={refreshAllData} />
          )}


          {/* ══ TAB 4: MEDICINE STORE ═════════════════════════════════════════ */}
          {activeTab === 4 && (
            <div className="space-y-5">
              {/* Substitute active filter banner */}
              {substituteFilter && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-4 rounded-2xl flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>
                      Showing in-stock alternates for <strong>{substituteFilter.name}</strong> ({substituteFilter.substituteType})
                    </span>
                  </div>
                  <button
                    onClick={() => setSubstituteFilter(null)}
                    className="px-3 py-1 bg-amber-500 text-white font-bold rounded-lg cursor-pointer hover:bg-amber-600 transition-all text-[10px]"
                  >
                    Clear Filter
                  </button>
                </div>
              )}

              {/* Sticky Header Section */}
              <div className="sticky -mt-6 -mx-6 pt-6 px-6 top-[-24px] bg-[#f0f4f8]/95 dark:bg-[#030407]/95 z-20 pb-4 border-b border-slate-200/40 dark:border-slate-900/60 backdrop-blur-md space-y-4">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <input className="w-full bg-white dark:bg-[#080b11] border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2.5 pl-9 text-xs font-semibold text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-500"
                      placeholder="Search medicines..." value={medSearch} onChange={e => setMedSearch(e.target.value)} disabled={!!substituteFilter} />
                    <ShoppingCart size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                  <button onClick={() => setActiveTab(9)} className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-black rounded-xl cursor-pointer shadow-md flex items-center gap-1.5 transition-all">
                    <ShoppingCart size={14} /> View Cart ({cartItems.reduce((a, i) => a + i.qty, 0)}) &middot; ₹{getCartTotal().toFixed(2)}
                  </button>
                </div>

                {/* Category & Availability Filters */}
                <div className="flex flex-col gap-2.5 pb-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Filter By Category</span>
                    {selectedCategory !== 'All' && (
                      <button
                        onClick={() => setSelectedCategory('All')}
                        disabled={!!substituteFilter}
                        className="text-[9px] font-black text-sky-500 cursor-pointer hover:underline disabled:opacity-40"
                      >
                        Reset Category
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {['All', 'Fever & Pain', 'Heart Health', 'Diabetes Care', 'Bacterial Infections', 'Vitamins & Minerals'].map(cat => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          disabled={!!substituteFilter}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-black cursor-pointer tracking-wider transition-all duration-200 border ${
                            substituteFilter
                              ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-[#0c0f17] text-slate-400 border-transparent'
                              : selectedCategory === cat
                              ? 'bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-500/10'
                              : 'bg-white dark:bg-[#080b11] hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-900'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setShowInStockOnly(prev => !prev)}
                      disabled={!!substituteFilter}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-black tracking-wider transition-all cursor-pointer border self-start sm:self-auto shrink-0 ${
                        substituteFilter
                          ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-[#0c0f17] text-slate-400 border-transparent'
                          : showInStockOnly
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                          : 'bg-white dark:bg-[#080b11] hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-900'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${showInStockOnly ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400 dark:bg-slate-700'}`} />
                      In Stock Only
                    </button>
                  </div>
                </div>
              </div>

              {filteredMeds.length === 0 ? (
                <div className="bg-white dark:bg-[#080b11] border border-slate-200 dark:border-slate-900 rounded-[24px] p-12 text-center flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400">
                    <ShoppingCart size={24} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-white">No Medicines Found</h3>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-[260px] mx-auto">
                      We couldn't find any medicines matching your active search, category, or stock filters.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setMedSearch('');
                      setSelectedCategory('All');
                      setShowInStockOnly(false);
                      setSubstituteFilter(null);
                    }}
                    className="px-4 py-2 bg-sky-500 text-white text-[10px] font-black rounded-xl cursor-pointer hover:bg-sky-600 transition-all shadow-md mt-2"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredMeds.map(med => (
                    <div key={med.id} className="bg-white dark:bg-[#080b11] border border-slate-200 dark:border-slate-900 rounded-[18px] p-4 flex flex-col justify-between gap-3 shadow-sm hover:border-sky-500/30 transition-all">
                      <div>
                        {/* Product Image */}
                        <div className="h-32 w-full bg-slate-50 dark:bg-slate-950/40 rounded-xl overflow-hidden mb-3 relative flex items-center justify-center p-3">
                          <ProductImage med={med} />
                          {!med.inStock && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
                              <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest border border-rose-500/30 bg-rose-950/40 px-2.5 py-1 rounded-full">Out of Stock</span>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-start">
                          <p className="text-xs font-black text-slate-800 dark:text-white leading-tight">{med.name}</p>
                          <span className="text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full shrink-0 ml-2">{med.category}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">{med.desc}</p>
                        <p className="text-[10px] text-slate-400">{med.quantity}</p>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-900/60">
                        <div className="flex flex-col">
                          <span className="text-base font-black text-slate-800 dark:text-white leading-none">₹{med.price}</span>
                          <span className="text-[8px] text-slate-400 font-bold mt-1">Generic: {med.substituteType}</span>
                        </div>
                        {med.inStock ? (() => {
                          const cartItem = cartItems.find(i => i.id === med.id);
                          if (cartItem) {
                            return (
                              <div className="flex items-center gap-1.5 bg-sky-500 text-white px-2 py-1 rounded-lg border border-sky-500 shadow-md">
                                <button
                                  onClick={() => setCartItems(prev =>
                                    prev.map(i => i.id === med.id ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0)
                                  )}
                                  className="w-5 h-5 flex items-center justify-center font-black hover:bg-white/20 rounded cursor-pointer leading-none text-xs"
                                >
                                  &minus;
                                </button>
                                <span className="text-[10px] font-black w-4 text-center select-none">{cartItem.qty}</span>
                                <button
                                  onClick={() => setCartItems(prev =>
                                    prev.map(i => i.id === med.id ? { ...i, qty: i.qty + 1 } : i)
                                  )}
                                  className="w-5 h-5 flex items-center justify-center font-black hover:bg-white/20 rounded cursor-pointer leading-none text-xs"
                                >
                                  +
                                </button>
                              </div>
                            );
                          }
                          return (
                            <button onClick={() => addToCart(med)} className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-[10px] font-black rounded-lg cursor-pointer transition-all shadow-md">
                              + Add
                            </button>
                          );
                        })() : (
                          <button onClick={() => setSubstituteFilter(med)} className="px-2.5 py-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-black rounded-lg cursor-pointer hover:bg-amber-500/20 transition-all">
                            Find Alternates
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* ══ TAB 9: MEDICINE CART PAGE ═════════════════════════════════════ */}
          {activeTab === 9 && (
            checkoutStatus ? (
              <div className="max-w-2xl mx-auto bg-white dark:bg-[#080b11] border border-slate-200 dark:border-slate-900 rounded-[28px] p-8 text-center space-y-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                
                {/* Success Icon */}
                <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 animate-bounce">
                  <Check size={32} strokeWidth={3} />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-800 dark:text-white">Order Confirmed!</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Your payment of ₹{checkoutStatus.totalAmount.toFixed(2)} was received successfully.</p>
                </div>

                {/* Summary Info Card */}
                <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 text-left space-y-3.5 text-xs">
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 border-b border-slate-200/50 dark:border-slate-800/50 pb-3">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Order ID</p>
                      <p className="font-bold text-slate-800 dark:text-white mt-0.5">{checkoutStatus.orderId}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Payment ID</p>
                      <p className="font-bold text-slate-800 dark:text-white mt-0.5 truncate">{checkoutStatus.paymentId}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Delivery ETA</p>
                      <p className="font-bold text-emerald-500 mt-0.5">🚀 25 Minutes (MediGrid Quick)</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Amount Paid</p>
                      <p className="font-bold text-slate-800 dark:text-white mt-0.5">₹{checkoutStatus.totalAmount.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Purchased list */}
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-2">Purchased Items</p>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {checkoutStatus.items.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                          <span>{item.name} <span className="text-[10px] text-slate-400 font-bold">x{item.qty}</span></span>
                          <span className="font-semibold">₹{(item.price * item.qty).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {checkoutStatus.savings > 0 && (
                    <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/50 text-center font-bold text-emerald-500">
                      🎉 Total Premium Savings: ₹{checkoutStatus.savings.toFixed(2)}
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => { setCheckoutStatus(null); setActiveTab(4); }}
                    className="flex-1 py-3 bg-gradient-to-r from-sky-500 to-cyan-500 text-white text-xs font-black rounded-xl cursor-pointer shadow-lg shadow-sky-500/20 hover:opacity-95 transition-all"
                  >
                    Continue Shopping
                  </button>
                  <button
                    onClick={() => alert(`Invoice copy generated for ${checkoutStatus.orderId} & sent to gaurav@medigrid.ai`)}
                    className="flex-1 py-3 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer"
                  >
                    Download Invoice
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Back Button */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setActiveTab(4)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-black text-slate-500 hover:text-sky-500 transition-colors cursor-pointer border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#080b11]"
                  >
                    &larr; Back to Medicine Store
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                      Secure Checkout
                    </span>
                  </div>
                </div>

                {/* Main 2-Column Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  
                  {/* Left Column: Cart Items List */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white dark:bg-[#080b11] border border-slate-200 dark:border-slate-900 rounded-[24px] p-6 shadow-sm">
                      <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-900 pb-4 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                          <ShoppingCart size={18} />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-800 dark:text-white leading-none">Your Shopping Cart</h3>
                          <p className="text-[10px] text-slate-400 mt-1">Review your medicines and adjust quantities</p>
                        </div>
                      </div>

                      {cartItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400">
                            <ShoppingCart size={32} />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-800 dark:text-white">Your Cart is Empty</h4>
                            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                              Looks like you haven't added any medicines yet. Go back to our store and browse generic alternates.
                            </p>
                          </div>
                          <button
                            onClick={() => setActiveTab(4)}
                            className="px-5 py-2.5 bg-sky-500 text-white text-xs font-black rounded-xl cursor-pointer hover:bg-sky-600 transition-all shadow-md"
                          >
                            Go to Medicine Store
                          </button>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-900">
                          {cartItems.map(item => {
                            const IS_PREMIUM = isPremium;
                            const PREMIUM_DISCOUNT = 0.20;
                            return (
                              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                                {/* Product Details info */}
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950/40 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-slate-100 dark:border-slate-900 shrink-0">
                                    <ProductImage med={item} />
                                  </div>
                                  <div className="min-w-0 text-left">
                                    <h4 className="text-xs font-black text-slate-800 dark:text-white leading-tight truncate">{item.name}</h4>
                                    <p className="text-[10px] text-slate-400 mt-1">{item.category} &middot; {item.quantity}</p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                      {IS_PREMIUM && (
                                        <span className="text-[10px] text-slate-400 line-through">₹{(item.price * item.qty).toFixed(2)}</span>
                                      )}
                                      <span className="text-xs font-black text-sky-500">
                                        ₹{IS_PREMIUM
                                          ? (item.price * item.qty * (1 - PREMIUM_DISCOUNT)).toFixed(2)
                                          : (item.price * item.qty).toFixed(2)}
                                      </span>
                                      {IS_PREMIUM && (
                                        <span className="text-[8px] font-black text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">-20% Member Offer</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Quantity Selector & Action buttons */}
                                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/60 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                                    <button
                                      onClick={() => setCartItems(prev =>
                                        prev.map(i => i.id === item.id ? { ...i, qty: Math.max(1, i.qty - 1) } : i)
                                      )}
                                      className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-sm font-black hover:bg-sky-500 hover:text-white transition-all cursor-pointer shadow-sm border border-slate-100 dark:border-slate-800/50"
                                    >
                                      &minus;
                                    </button>
                                    <span className="text-xs font-black text-slate-800 dark:text-white w-6 text-center">{item.qty}</span>
                                    <button
                                      onClick={() => setCartItems(prev =>
                                        prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
                                      )}
                                      className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-sm font-black hover:bg-sky-500 hover:text-white transition-all cursor-pointer shadow-sm border border-slate-100 dark:border-slate-800/50"
                                    >
                                      +
                                    </button>
                                  </div>
                                  
                                  <button
                                    onClick={() => setCartItems(prev => prev.filter(i => i.id !== item.id))}
                                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all cursor-pointer"
                                    title="Delete item"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Order Summary */}
                  {cartItems.length > 0 && (() => {
                    const IS_PREMIUM       = isPremium; // User has Premium Health Account
                    const PREMIUM_DISCOUNT = 0.20; // 20% off for premium members
                    const GST_RATE         = 0.12; // 12% GST on medicines
                    const DELIVERY_FEE     = 49;   // Flat delivery fee
                    const FREE_DELIVERY_ABOVE = 199; // Free delivery threshold

                    const subtotal        = cartItems.reduce((a, i) => a + i.price * i.qty, 0);
                    const discountAmt     = IS_PREMIUM ? parseFloat((subtotal * PREMIUM_DISCOUNT).toFixed(2)) : 0;
                    const afterDiscount   = parseFloat((subtotal - discountAmt).toFixed(2));
                    const gstAmt          = parseFloat((afterDiscount * GST_RATE).toFixed(2));
                    const deliveryAmt     = afterDiscount >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE;
                    const grandTotal      = parseFloat((afterDiscount + gstAmt + deliveryAmt).toFixed(2));
                    const totalSavings    = parseFloat((discountAmt + (DELIVERY_FEE - deliveryAmt)).toFixed(2));

                    return (
                      <div className="space-y-4">
                        {/* Premium Savings Banner */}
                        {IS_PREMIUM && (
                          <div className="bg-gradient-to-r from-sky-500/10 to-cyan-500/10 border border-sky-500/20 rounded-[20px] p-4 flex items-start gap-3">
                            <ShieldCheck size={18} className="text-sky-500 shrink-0 mt-0.5" />
                            <div className="text-left">
                              <p className="text-xs font-black text-sky-500">Premium Account Benefit</p>
                              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                                You get flat 20% off on all medicines. You saved extra ₹{discountAmt.toFixed(2)} on this order!
                              </p>
                            </div>
                          </div>
                        )}

                        {!IS_PREMIUM && (
                          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-[20px] p-4 flex items-start gap-3 mt-4 text-left">
                            <Sparkles size={18} className="text-amber-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-black text-amber-500">Save 20% on this order!</p>
                              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                                Upgrade to Premium for just ₹499 to unlock member pricing and save ₹{(subtotal * 0.2).toFixed(2)} right now.
                              </p>
                              <button
                                onClick={handleUpgradePayment}
                                className="mt-2.5 px-3 py-1 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-lg text-[9px] font-black tracking-wider uppercase transition-all hover:scale-105 cursor-pointer"
                              >
                                Upgrade Now
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Order Summary Details Card */}
                        <div className="bg-white dark:bg-[#080b11] border border-slate-200 dark:border-slate-900 rounded-[24px] p-5 shadow-sm space-y-4 text-left">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Order Summary</h4>
                          
                          <div className="space-y-2 text-xs border-b border-slate-100 dark:border-slate-900 pb-3">
                            <div className="flex justify-between">
                              <span className="text-slate-500 dark:text-slate-400">Subtotal ({cartItems.reduce((a, i) => a + i.qty, 0)} items)</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">₹{subtotal.toFixed(2)}</span>
                            </div>
                            
                            {IS_PREMIUM && (
                              <div className="flex justify-between text-emerald-500">
                                <span>Premium Discount (20%)</span>
                                <span className="font-bold">−₹{discountAmt.toFixed(2)}</span>
                              </div>
                            )}

                            <div className="flex justify-between">
                              <span className="text-slate-500 dark:text-slate-400">GST (12%)</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">+₹{gstAmt.toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 dark:text-slate-400">Delivery Fee</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {deliveryAmt === 0 ? (
                                  <span className="text-emerald-500 font-black">FREE</span>
                                ) : (
                                  `₹${DELIVERY_FEE}`
                                )}
                              </span>
                            </div>

                            {/* Free delivery progress */}
                            {deliveryAmt > 0 && (
                              <div className="pt-1.5">
                                <p className="text-[9px] text-slate-400 mb-1 leading-none">
                                  Add ₹{(FREE_DELIVERY_ABOVE - afterDiscount).toFixed(0)} more for free delivery
                                </p>
                                <div className="h-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 transition-all duration-500"
                                    style={{ width: `${Math.min(100, (afterDiscount / FREE_DELIVERY_ABOVE) * 100)}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Grand Total */}
                          <div className="flex justify-between items-center py-1">
                            <span className="text-sm font-black text-slate-800 dark:text-white">Grand Total</span>
                            <span className="text-lg font-black text-slate-800 dark:text-white">₹{grandTotal.toFixed(2)}</span>
                          </div>

                          {/* Order Action Button */}
                          <button
                            onClick={() => handleRazorpayPayment(grandTotal, totalSavings)}
                            className="w-full py-3 bg-gradient-to-r from-sky-500 to-cyan-500 text-white text-xs font-black rounded-xl cursor-pointer shadow-lg shadow-sky-500/20 hover:opacity-90 transition-all text-center"
                          >
                            Place Order &middot; ₹{grandTotal.toFixed(2)}
                          </button>

                          <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-400">
                            <ShieldCheck size={11} className="text-emerald-500" />
                            <span>100% Safe Payment &middot; Generic Substitutes Guaranteed</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                </div>
              </div>
            )
          )}

          {/* ══ TAB 5: NEARBY HOSPITALS ═══════════════════════════════════════ */}
          {activeTab === 5 && (
            <NearbyHospitals isDark={isDark} />
          )}

          {/* ══ TAB 6: AI HEALTH PLANNER ═════════════════════════════════════ */}
          {activeTab === 6 && (
            <AIHealthPlanner
              isDark={isDark}
              activePlanRecord={activePlan}
              profileData={healthProfile}
              refreshActivePlan={fetchCurrentPlan}
              refreshUserProfile={fetchUserProfileFromBackend}
              refreshVitalsHistory={fetchVitalsFromBackend}
              refreshAllData={refreshAllData}
            />
          )}

          {/* ══ TAB 7: EMERGENCY SOS ══════════════════════════════════════════ */}
          {activeTab === 7 && (
            <EmergencySOS
              userProfile={{
                name: profileName,
                email: profileEmail,
                phone: profilePhone,
                emergencyName: profileEmergencyName,
                emergencyPhone: profileEmergencyPhone,
                age: profileAge,
                gender: profileGender,
                bloodGroup: profileBloodGroup,
                allergies: profileAllergies,
                medicalConditions: profileMedicalConditions,
                currentMedicines: profileCurrentMedicines
              }}
              theme={theme}
              isDark={isDark}
            />
          )}

          {/* ══ TAB 8: AI HEALTH ASSISTANT ════════════════════════════════════ */}
          {activeTab === 8 && (
            <div className="max-w-3xl mx-auto bg-white dark:bg-[#080b11] border border-slate-200 dark:border-slate-900 rounded-[24px] shadow-xl flex flex-col h-[calc(100vh-14rem)]">
              <div className="p-5 border-b border-slate-100 dark:border-slate-900 flex items-center gap-2">
                <Sparkles size={16} className="text-sky-500 animate-pulse" />
                <span className="font-black text-sm text-slate-800 dark:text-white">MediGrid AI Health Assistant</span>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-3 text-[11px] leading-relaxed font-semibold shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-sky-500 text-white rounded-br-none'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200/40 dark:border-slate-700'
                    }`}>
                      {formatMarkdown(msg.content)}
                    </div>
                  </div>
                ))}
                {aiThinking && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-none p-3 text-[11px] flex items-center gap-1.5 text-slate-500">
                      <RefreshCw className="animate-spin text-sky-500" size={12} />
                      <span>AI is thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/20">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Suggested Questions</span>
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                  {['Show my vitals', 'Medication reminders', 'Book appointment', 'Analyze my glucose', 'What foods to avoid?'].map(q => (
                    <button key={q} onClick={() => handleSendAiMessage(q)}
                      className="text-[9px] font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-sky-500 rounded-lg px-2 py-1 transition-all cursor-pointer hover:border-sky-500/30">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-3 border-t border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-900/20">
                <form onSubmit={(e) => { e.preventDefault(); handleSendAiMessage(); }}
                  className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl">
                  <input type="text" placeholder="Ask anything about your health..."
                    value={chatInput} onChange={e => setChatInput(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs w-full text-slate-800 dark:text-slate-100 placeholder-slate-400" />
                  <button type="button" className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"><Mic size={14} /></button>
                  <button type="submit" className="p-1 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-all cursor-pointer flex items-center justify-center shadow-md">
                    <Send size={12} />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ══ TAB 10: ACCOUNT SETTINGS ══════════════════════════════════════ */}
          {activeTab === 10 && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Premium Header Card */}
              <div className="bg-gradient-to-r from-slate-900 via-[#0b101b] to-slate-900 border border-slate-800 rounded-[28px] p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex items-center gap-5 text-left relative z-10">
                  {profilePictureUrl ? (
                    <img src={profilePictureUrl} alt="Profile" className={`w-16 h-16 rounded-2xl object-cover shadow-lg shadow-sky-500/20 ${isPremium ? 'border-4 border-amber-450 ring-4 ring-amber-400/40 ring-offset-2 dark:ring-offset-slate-900' : ''}`} style={isPremium ? { borderColor: '#fbbf24' } : {}} />
                  ) : (
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-sky-500/20 ${isPremium ? 'border-4 border-amber-455 ring-4 ring-amber-400/40 ring-offset-2 dark:ring-offset-slate-900' : ''}`} style={isPremium ? { borderColor: '#fbbf24' } : {}}>
                      {profileName ? profileName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-black text-white leading-tight">{profileName || 'MediGrid User'}</h3>
                    <p className="text-xs text-slate-400 mt-1">{profileEmail || 'no-email@medigrid.ai'} &middot; {profilePhone || 'No Phone'}</p>
                    <div className="mt-2.5 flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full border border-sky-500/20 bg-sky-500/5 text-[9px] font-bold text-sky-400 uppercase tracking-wider">Verified Profile</span>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 shrink-0">
                  {isPremium ? (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400 font-extrabold text-xs shadow-sm">
                      <ShieldCheck size={15} className="text-amber-400" />
                      <span>MediGrid Premium Active</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleUpgradePayment}
                      className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 hover:scale-[1.03] transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Sparkles size={14} className="animate-pulse text-slate-950" />
                      <span>Upgrade to Premium</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Sub-tab Navigation */}
              <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-900 rounded-2xl max-w-xl">
                {[
                  { id: 'account', label: 'Account Info', icon: <User size={13} /> },
                  { id: 'health', label: 'Health Database', icon: <Activity size={13} /> },
                  { id: 'preferences', label: 'System Preferences', icon: <Settings size={13} /> }
                ].map(subTab => (
                  <button
                    key={subTab.id}
                    onClick={() => setSettingsSubTab(subTab.id)}
                    className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                      settingsSubTab === subTab.id
                        ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-md border border-slate-200/50 dark:border-slate-800/80'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {subTab.icon}
                    <span>{subTab.label}</span>
                  </button>
                ))}
              </div>

              {settingsSaved && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl p-4 flex items-center gap-3 animate-fade-in text-left">
                  <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-xs font-black">Changes Saved Successfully</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Your settings have been synced with the EMR grid.</p>
                  </div>
                </div>
              )}

              {/* TAB CONTENT */}
              <div className="space-y-6">

                {/* SUBTAB 1: ACCOUNT INFO */}
                {settingsSubTab === 'account' && (
                  <div className="space-y-6">
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      setSettingsSaved(true);
                      setTimeout(() => setSettingsSaved(false), 4000);

                      try {
                        await fetch(`${BACKEND_URL}/api/user/profile`, {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                            'x-user-email': profileEmail
                          },
                          body: JSON.stringify({
                            name: profileName,
                            email: profileEmail,
                            phone: profilePhone,
                            emergencyName: profileEmergencyName,
                            emergencyPhone: profileEmergencyPhone,
                            age: profileAge,
                            gender: profileGender,
                            bloodGroup: profileBloodGroup,
                            allergies: profileAllergies,
                            medicalConditions: profileMedicalConditions,
                            currentMedicines: profileCurrentMedicines,
                            settingsAutoSync,
                            settingsSmsWarnings,
                            settingsEForward,
                            settingsAnomalyScan
                          })
                        });
                      } catch (err) {
                        console.warn('Profile save sync error:', err);
                      }
                    }} className="space-y-6">
                      <div className="max-w-4xl mx-auto">
                        {/* Personal Details */}
                        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-900 rounded-[24px] p-6 shadow-xl space-y-4 text-left">
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-400">Personal Details</h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Basic contact information for your MediGrid account.</p>
                          </div>

                          {/* Profile Photo Upload Row */}
                          <div className="flex flex-col sm:flex-row items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div className="relative group">
                              {uploadingPhoto ? (
                                <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-md">
                                  <Loader2 className="w-6 h-6 text-sky-500 animate-spin" />
                                </div>
                              ) : profilePictureUrl ? (
                                <img src={profilePictureUrl} alt="Profile" className={`w-16 h-16 rounded-2xl object-cover shadow-md transition-transform duration-300 group-hover:scale-[1.03] ${isPremium ? 'border-4 border-amber-400 ring-4 ring-amber-400/40 ring-offset-2 dark:ring-offset-slate-900' : 'border border-slate-200 dark:border-slate-800'}`} style={isPremium ? { borderColor: '#fbbf24' } : {}} />
                              ) : (
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white font-black text-xl shadow-md transition-transform duration-300 group-hover:scale-[1.03] ${isPremium ? 'border-4 border-amber-400 ring-4 ring-amber-400/40 ring-offset-2 dark:ring-offset-slate-900' : ''}`} style={isPremium ? { borderColor: '#fbbf24' } : {}}>
                                  {profileName ? profileName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                                </div>
                              )}
                            </div>
                            <div className="text-center sm:text-left space-y-1.5 flex-1">
                              <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Profile Picture</h5>
                              <div className="flex flex-wrap items-center gap-2">
                                <label className="cursor-pointer px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white font-bold text-[10px] rounded-lg shadow-sm transition-colors block">
                                  {uploadingPhoto ? 'Uploading...' : 'Choose Photo'}
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    disabled={uploadingPhoto}
                                    onChange={async (e) => {
                                      const file = e.target.files[0];
                                      if (!file) return;
                                      
                                      setUploadingPhoto(true);
                                      const uploadData = new FormData();
                                      uploadData.append('photo', file);
                                      
                                      const token = localStorage.getItem('authToken');
                                      try {
                                        const response = await fetch(`${BACKEND_URL}/api/user/upload-photo`, {
                                          method: 'POST',
                                          headers: {
                                            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                                          },
                                          body: uploadData
                                        });
                                        if (response.ok) {
                                          const result = await response.json();
                                          if (result.success && result.photoUrl) {
                                            setProfilePictureUrl(result.photoUrl);
                                            localStorage.setItem('profilePicture', result.photoUrl);
                                            showToast('Profile photo updated successfully!', 'success');
                                          }
                                        } else {
                                          showToast('Failed to upload profile photo.', 'error');
                                        }
                                      } catch (err) {
                                        console.error('Photo upload error:', err);
                                        showToast('Error uploading photo.', 'error');
                                      } finally {
                                        setUploadingPhoto(false);
                                      }
                                    }} 
                                  />
                                </label>
                                {profilePictureUrl && !uploadingPhoto && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      setProfilePictureUrl('');
                                      localStorage.removeItem('profilePicture');
                                      const token = localStorage.getItem('authToken');
                                      try {
                                        await fetch(`${BACKEND_URL}/api/user/profile`, {
                                          method: 'PUT',
                                          headers: {
                                            'Content-Type': 'application/json',
                                            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                                          },
                                          body: JSON.stringify({ profilePicture: '' })
                                        });
                                        showToast('Profile photo removed.', 'success');
                                      } catch (err) {
                                        console.warn('Remove photo error:', err);
                                      }
                                    }}
                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                              <p className="text-[9px] text-slate-400 font-medium">Supports JPG, PNG or GIF. Max size 5MB.</p>
                            </div>
                          </div>
                          
                          <div className="space-y-3.5 pt-2">
                            <div>
                              <label className="text-[9px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-wider block mb-1">Full Name</label>
                              <input type="text" value={profileName} onChange={e => setProfileName(e.target.value)} required
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 transition-all" />
                            </div>
                            <div>
                              <label className="text-[9px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-wider block mb-1">Email Address</label>
                              <input type="email" value={profileEmail} onChange={e => setProfileEmail(e.target.value)} required
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 transition-all" />
                            </div>
                            <div>
                              <label className="text-[9px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-wider block mb-1">Phone Number</label>
                              <input type="text" value={profilePhone} onChange={e => setProfilePhone(e.target.value)} required
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 transition-all" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2 max-w-4xl mx-auto">
                        <button type="submit"
                          className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-sky-500/20 hover:scale-[1.01]"
                        >
                          Save Account Details
                        </button>
                      </div>
                    </form>

                    {/* Change Password Card */}
                    <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-900 rounded-[24px] p-6 shadow-xl space-y-4 text-left">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-400 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                          Change Password
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Update your account credentials to keep it secure.</p>
                      </div>

                      {passwordError && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          {passwordError}
                        </div>
                      )}

                      {passwordSuccess && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-xl flex items-center gap-1.5">
                          <Check className="w-4 h-4 shrink-0" />
                          Password changed successfully!
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                        <div>
                          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Old Password</label>
                          <input type="password" value={settingsOldPassword} onChange={e => setSettingsOldPassword(e.target.value)}
                            placeholder="••••••"
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 transition-all" />
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">New Password</label>
                          <input type="password" value={settingsNewPassword} onChange={e => setSettingsNewPassword(e.target.value)}
                            placeholder="Min 6 chars"
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 transition-all" />
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Confirm New Password</label>
                          <input type="password" value={settingsConfirmPassword} onChange={e => setSettingsConfirmPassword(e.target.value)}
                            placeholder="Confirm password"
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 transition-all" />
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          disabled={isChangingPassword}
                          onClick={async () => {
                            setPasswordError('');
                            setPasswordSuccess(false);

                            if (!settingsNewPassword || settingsNewPassword.length < 6) {
                              setPasswordError('New password must be at least 6 characters.');
                              return;
                            }
                            if (settingsNewPassword !== settingsConfirmPassword) {
                              setPasswordError('Passwords do not match.');
                              return;
                            }

                            setIsChangingPassword(true);
                            try {
                              const res = await fetch(`${BACKEND_URL}/api/user/change-password`, {
                                method: 'PUT',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                                },
                                body: JSON.stringify({
                                  oldPassword: settingsOldPassword,
                                  newPassword: settingsNewPassword
                                })
                              });
                              const data = await res.json();
                              if (!res.ok) throw new Error(data.error || 'Failed to change password.');
                              
                              setPasswordSuccess(true);
                              setSettingsOldPassword('');
                              setSettingsNewPassword('');
                              setSettingsConfirmPassword('');
                            } catch (err) {
                              setPasswordError(err.message);
                            } finally {
                              setIsChangingPassword(false);
                            }
                          }}
                          className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-sky-500/20 hover:scale-[1.01] disabled:opacity-60"
                        >
                          {isChangingPassword ? 'Updating...' : 'Update Password'}
                        </button>
                      </div>
                    </div>

                    {/* Delete Account Card */}
                    <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-900 rounded-[24px] p-6 shadow-xl space-y-4 text-left border-rose-200 dark:border-rose-955/45 bg-gradient-to-r from-white to-rose-50/50 dark:from-slate-950 dark:to-rose-950/10">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                          <Trash2 className="w-3.5 h-3.5 text-rose-650 dark:text-rose-500" />
                          Danger Zone
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Permanently delete your account and remove all related medical & health records.</p>
                      </div>

                      <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl">
                        <p className="text-xs text-rose-400 font-bold">This action is irreversible.</p>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                          Once confirmed, your profile details, vitals history logs, tasks list, analyzed reports, and active AI health plans will be permanently purged from the database.
                        </p>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => setShowDeleteModal(true)}
                          className="px-6 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-600 dark:text-rose-450 text-xs font-black rounded-xl transition-all shadow-lg hover:scale-[1.01]"
                        >
                          Delete My Account
                        </button>
                      </div>

                      {showDeleteModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm">
                          <div className="w-full max-w-[450px] bg-white dark:bg-[#090b0d] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-left">
                            <div className="flex justify-between items-start">
                              <h4 className="text-sm font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                                <Trash2 className="w-4 h-4 text-rose-500" />
                                Delete Account Confirmation
                              </h4>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowDeleteModal(false);
                                  setDeletePassword('');
                                  setDeleteError('');
                                }}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                              You are about to permanently delete your MediGrid account. This will completely purge:
                            </p>
                            
                            <ul className="text-[10px] space-y-1.5 pl-4 list-disc text-slate-500 dark:text-slate-400 font-bold">
                              <li>Your basic health profile and demographics.</li>
                              <li>Personalized AI Care Plans and meal/workout schedules.</li>
                              <li>All clinical telemetry history and vitals logging.</li>
                              <li>Uploaded medical records and AI analyses.</li>
                            </ul>

                            <div className="p-3.5 bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/10 dark:border-rose-500/20 rounded-2xl">
                              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold leading-normal">
                                This is irreversible. If you understand the consequences, please confirm your password to proceed.
                              </p>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Confirm Password</label>
                              <input
                                type="password"
                                required
                                value={deletePassword}
                                onChange={e => setDeletePassword(e.target.value)}
                                placeholder="Enter your account password"
                                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-200 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 transition-all font-bold"
                              />
                            </div>

                            {deleteError && (
                              <p className="text-[10px] text-rose-550 font-bold">⚠️ {deleteError}</p>
                            )}

                            <div className="flex justify-end gap-2.5 pt-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowDeleteModal(false);
                                  setDeletePassword('');
                                  setDeleteError('');
                                }}
                                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700/80 transition-all cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={isDeletingAccount || !deletePassword}
                                onClick={async () => {
                                  setIsDeletingAccount(true);
                                  setDeleteError('');
                                  try {
                                    const res = await fetch(`${BACKEND_URL}/api/user/account`, {
                                      method: 'DELETE',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                                      },
                                      body: JSON.stringify({ password: deletePassword })
                                    });
                                    const data = await res.json().catch(() => ({}));
                                    if (!res.ok) {
                                      throw new Error(data.error || 'Failed to delete account.');
                                    }

                                    // Clear local storage and log out
                                    localStorage.clear();
                                    navigate('/login', { replace: true });
                                  } catch (err) {
                                    setDeleteError(err.message || 'Incorrect password.');
                                    setIsDeletingAccount(false);
                                  }
                                }}
                                className="px-5 py-2 bg-rose-650 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-rose-500/10 disabled:opacity-60 cursor-pointer"
                              >
                                {isDeletingAccount ? 'Deleting...' : 'Permanently Delete'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SUBTAB 2: HEALTH PROFILE */}
                {settingsSubTab === 'health' && (
                  <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-900 rounded-[28px] p-6 shadow-xl text-left">
                    <HealthProfileSettings onProfileUpdate={handleHealthProfileUpdate} />
                  </div>
                )}

                {/* SUBTAB 3: PREFERENCES & SYSTEM */}
                {settingsSubTab === 'preferences' && (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setSettingsSaved(true);
                    setTimeout(() => setSettingsSaved(false), 4000);

                    try {
                      await fetch(`${BACKEND_URL}/api/user/profile`, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                          'x-user-email': profileEmail
                        },
                        body: JSON.stringify({
                          name: profileName,
                          email: profileEmail,
                          phone: profilePhone,
                          emergencyName: profileEmergencyName,
                          emergencyPhone: profileEmergencyPhone,
                          age: profileAge,
                          gender: profileGender,
                          bloodGroup: profileBloodGroup,
                          allergies: profileAllergies,
                          medicalConditions: profileMedicalConditions,
                          currentMedicines: profileCurrentMedicines,
                          settingsAutoSync,
                          settingsSmsWarnings,
                          settingsEForward,
                          settingsAnomalyScan
                        })
                      });
                    } catch (err) {
                      console.warn('Preferences save sync error:', err);
                    }
                  }} className="space-y-6">
                    <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-900 rounded-[28px] p-6 shadow-xl space-y-5 text-left">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-400">Sync & Security Preferences</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Control how your telemetry data and AI anomaly detections are handled.</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { state: settingsAutoSync, setter: setSettingsAutoSync, title: 'Auto-sync Health Telemetry', desc: 'Allows background sync of smartwatch vitals (BP, Heart Rate, Glucose) hourly.' },
                          { state: settingsSmsWarnings, setter: setSettingsSmsWarnings, title: 'SMS SOS Alerts', desc: 'Send direct SMS warnings to emergency contacts when vitals cross hazard levels.' },
                          { state: settingsEForward, setter: setSettingsEForward, title: 'E-Prescriptions forwarding', desc: 'Automatically forward newly generated e-prescriptions to nearby pharmacy partner grids.' },
                          { state: settingsAnomalyScan, setter: setSettingsAnomalyScan, title: 'AI Anomaly Detection', desc: 'Run continuous heuristic scans on logged telemetry metrics to notify of warning trends.' }
                        ].map((pref, i) => (
                          <div key={i} className="flex items-start gap-3.5 p-4 rounded-2xl border border-slate-800/80 bg-slate-950/20 hover:border-slate-700/50 transition-all">
                            <input type="checkbox" checked={pref.state} onChange={e => pref.setter(!pref.state)} id={`pref-${i}`}
                              className="mt-1 rounded border-slate-800 text-sky-500 focus:ring-sky-500/20 bg-slate-900 cursor-pointer" />
                            <label htmlFor={`pref-${i}`} className="cursor-pointer select-none">
                              <span className="text-xs font-bold text-slate-200 block">{pref.title}</span>
                              <span className="text-[10px] text-slate-400 block mt-1 leading-snug">{pref.desc}</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button type="submit"
                        className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-sky-500/20 hover:scale-[1.01]"
                      >
                        Save Preferences
                      </button>
                    </div>
                  </form>
                )}

              </div>
            </div>
          )}

        </div>
      </main>

      {/* ─── RIGHT AI PANEL (Sliding Drawer) ─────────────────────────────────── */}
      <aside className={`bg-white/95 dark:bg-[#080a0f]/90 backdrop-blur-xl border-l border-slate-200 dark:border-slate-900/60 flex flex-col justify-between transition-all duration-300 z-40 h-full ${
        aiPanelOpen ? 'w-full max-w-xs md:w-80' : 'w-0 overflow-hidden'
      } fixed md:relative top-0 right-0`}>
        {/* Panel Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 dark:border-slate-900/50 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-sky-500 animate-pulse" />
            <span className="font-extrabold text-sm text-slate-900 dark:text-white">Health Assistant</span>
          </div>
          <button onClick={() => setAiPanelOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-left">
          {chatMessages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-2.5 px-3 text-[10px] leading-relaxed font-semibold shadow-sm ${
                msg.role === 'user'
                  ? 'bg-sky-500 text-white rounded-br-none'
                  : 'bg-slate-100 dark:bg-slate-800/60 border border-slate-200/40 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none'
              }`}>
                {formatMarkdown(msg.content)}
              </div>
            </div>
          ))}
          {aiThinking && (
            <div className="flex justify-start">
              <div className="bg-slate-100 dark:bg-slate-800/60 rounded-2xl rounded-bl-none p-2.5 px-3 text-[10px] flex items-center gap-1.5 text-slate-500">
                <RefreshCw className="animate-spin text-sky-500" size={12} />
                <span>AI is thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Suggested Prompts */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-900/40 bg-slate-50/50 dark:bg-slate-950/20 text-left">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Suggested Prompts</span>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            {['Show my vitals', 'Medication reminders', 'Book appointment', 'Glucose trend', 'Foods to avoid'].map(q => (
              <button key={q} onClick={() => handleSendAiMessage(q)}
                className="text-[9px] font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-sky-500 rounded-lg px-2 py-1 transition-all cursor-pointer hover:border-sky-500/30">
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Input */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-900/20 bg-white dark:bg-slate-900/20">
          <form onSubmit={(e) => { e.preventDefault(); handleSendAiMessage(); }}
            className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl">
            <input type="text" placeholder="Ask about your health..."
              value={chatInput} onChange={e => setChatInput(e.target.value)}
              className="bg-transparent border-none outline-none focus:ring-0 text-xs w-full text-slate-800 dark:text-slate-100 placeholder-slate-400" />
            <button type="button" className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"><Mic size={14} /></button>
            <button type="submit" className="p-1 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-all cursor-pointer shadow-md flex items-center justify-center">
              <Send size={12} />
            </button>
          </form>
        </div>
      </aside>

      {/* ─── FLOATING AI BUTTON ──────────────────────────────────────────────── */}
      {!aiPanelOpen && activeTab !== 9 && (
        <button
          onClick={() => setAiPanelOpen(true)}
          className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 hover:scale-105 transition-all duration-300 text-white flex items-center justify-center shadow-xl shadow-sky-500/25 z-40 cursor-pointer"
          title="Open AI Health Assistant"
        >
          <Sparkles size={20} className="animate-pulse" />
        </button>
      )}

      {/* Toast Notifications Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-3 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-300 text-white ${
              t.type === 'error' ? 'bg-red-500/95 border border-red-500' :
              t.type === 'success' ? 'bg-emerald-500/95 border border-emerald-500' :
              'bg-sky-500/95 border border-sky-500'
            } backdrop-blur-md`}
          >
            {t.type === 'error' && <AlertCircle size={14} />}
            {t.type === 'success' && <Check size={14} />}
            {t.type === 'info' && <Bell size={14} />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

    </div>
  );
};

export default Dashboard;
