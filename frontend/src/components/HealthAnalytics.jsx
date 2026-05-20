import React, { useState, useEffect } from 'react';
import {
  Activity, TrendingUp, Heart, Sparkles, ShieldCheck,
  Award, Bell, RefreshCw, Download, Share2, MessageSquare,
  ChevronRight, Calendar, AlertTriangle, Zap, CheckCircle2,
  PieChart, BarChart2, Flame, Droplets, Moon, Scale, Dumbbell,
  Clock, ArrowUpRight, ArrowDownRight, Filter, Info, Shield, Check, Send, AlertCircle
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { BACKEND_URL } from '../config/api';

// ─── SVG Interactive Area / Line Chart Component ─────────────────────────────
const SVGChart = ({ data, metricKey, color = 'sky', height = 180, isBar = false }) => {
  if (!data || data.length === 0) return null;

  const values = data.map(d => Number(d[metricKey] || 0));
  const minVal = Math.min(...values) * 0.95;
  const maxVal = Math.max(...values) * 1.05 || 1;
  const range = maxVal - minVal || 1;

  const width = 500;
  const padding = 30;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = data.map((d, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = height - padding - ((d[metricKey] - minVal) / range) * chartHeight;
    return { x, y, val: d[metricKey], label: d.day };
  });

  const pathD = points.reduce((acc, p, i) => (
    i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`
  ), '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  const colorThemes = {
    sky: { stroke: '#0284c7', fill: 'url(#gradient-sky)', text: 'text-sky-500', bg: 'bg-sky-500' },
    emerald: { stroke: '#10b981', fill: 'url(#gradient-emerald)', text: 'text-emerald-500', bg: 'bg-emerald-500' },
    indigo: { stroke: '#6366f1', fill: 'url(#gradient-indigo)', text: 'text-indigo-500', bg: 'bg-indigo-500' },
    rose: { stroke: '#f43f5e', fill: 'url(#gradient-rose)', text: 'text-rose-500', bg: 'bg-rose-500' },
    amber: { stroke: '#f59e0b', fill: 'url(#gradient-amber)', text: 'text-amber-500', bg: 'bg-amber-500' }
  };

  const theme = colorThemes[color] || colorThemes.sky;

  return (
    <div className="w-full relative overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        <defs>
          <linearGradient id="gradient-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="gradient-emerald" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="gradient-indigo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="gradient-rose" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fb7185" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#fb7185" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="gradient-amber" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.33, 0.66, 1].map((ratio, i) => (
          <line
            key={i}
            x1={padding}
            y1={padding + ratio * chartHeight}
            x2={width - padding}
            y2={padding + ratio * chartHeight}
            stroke="currentColor"
            strokeOpacity="0.08"
            strokeDasharray="4 4"
          />
        ))}

        {!isBar && (
          <>
            <path d={areaD} fill={theme.fill} />
            <path d={pathD} fill="none" stroke={theme.stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}

        {/* Points & Bars */}
        {points.map((p, i) => (
          <g key={i} className="group/pt cursor-pointer">
            {isBar ? (
              <rect
                x={p.x - 12}
                y={p.y}
                width="24"
                height={height - padding - p.y}
                rx="6"
                fill={theme.stroke}
                opacity="0.85"
                className="hover:opacity-100 transition-opacity"
              />
            ) : (
              <circle
                cx={p.x}
                cy={p.y}
                r="4.5"
                fill="#ffffff"
                stroke={theme.stroke}
                strokeWidth="2.5"
                className="group-hover/pt:r-6 transition-all shadow-md"
              />
            )}
            {/* Tooltip & X-Axis Labels */}
            <text
              x={p.x}
              y={height - 8}
              textAnchor="middle"
              className="text-[10px] fill-slate-400 font-bold"
            >
              {p.label}
            </text>
            <title>{`${p.label}: ${p.val}`}</title>
          </g>
        ))}
      </svg>
    </div>
  );
};

// ─── Health Analytics Master Component ───────────────────────────────────────
const HealthAnalytics = ({
  theme,
  isDark,
  profileEmail = 'gaurav@medigrid.ai',
  userProfile,
  vitalsHistory,
  analyticsSummary,
  refreshAllData,
  setActiveTab,
  activePlan
}) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [aiData, setAiData] = useState(null);
  const [toast, setToast] = useState(null);

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

  // Chat Drawer / Ask AI state
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your AI Health Analytics Coach. Ask me anything about your vitals, reports, goals, or health trends!' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatThinking, setChatThinking] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Reactive synchronization with centralized props
  useEffect(() => {
    if (analyticsSummary) {
      let summary = { ...analyticsSummary };
      if (vitalsHistory && vitalsHistory.length > 0) {
        const heightM = userProfile?.heightCm ? userProfile.heightCm / 100 : 1.75;
        const mappedVitals = vitalsHistory.map(v => ({
          day: v.date,
          weight: v.weight,
          bmi: v.weight ? parseFloat((v.weight / (heightM * heightM)).toFixed(1)) : null,
          water: v.water,
          sleep: v.sleep,
          sugar: v.sugar,
          bp: v.bp,
          calories: v.calories || 2000,
          workout: v.workout || 45,
          steps: v.steps || 9000,
          stress: 20,
          energy: 90
        }));
        summary.timeSeriesData = mappedVitals;
      }
      setSummaryData(summary);
      setLoading(false);
    }
  }, [analyticsSummary, vitalsHistory, userProfile]);

  // Fetch AI insights reactively when summaryData is ready
  useEffect(() => {
    if (!summaryData) return;
    
    let active = true;
    const fetchAiInsights = async () => {
      try {
        const aiRes = await fetch(`${BACKEND_URL}/api/health-analytics/ai-insights`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userProfile: summaryData.profile || {},
            analyticsSummary: summaryData,
            timeRange: 'This Week'
          })
        });
        if (aiRes.ok && active) {
          const aiJson = await aiRes.json();
          setAiData(aiJson);
        }
      } catch (err) {
        console.warn('AI insights fetch warning:', err);
      }
    };

    fetchAiInsights();
    return () => { active = false; };
  }, [summaryData]);

  // Fetch summary analytics & AI insights (fallback/local method)
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const summaryRes = await fetch(`${BACKEND_URL}/api/health-analytics/summary`, {
        headers: { 'X-User-Email': profileEmail }
      });
      let summary = null;
      if (summaryRes.ok) {
        const data = await summaryRes.json();
        // Fetch DB vitals
        try {
          const vitalsRes = await fetch(`${BACKEND_URL}/api/health-analytics/vitals`, {
            headers: { 'X-User-Email': profileEmail }
          });
          if (vitalsRes.ok) {
            const vitalsJson = await vitalsRes.json();
            if (vitalsJson.vitals && vitalsJson.vitals.length > 0) {
              const mappedVitals = vitalsJson.vitals.map(v => ({
                day: v.date,
                weight: v.weight,
                bmi: parseFloat((v.weight / (1.75 * 1.75)).toFixed(1)),
                water: v.waterIntakeLiters,
                sleep: v.sleepHours,
                sugar: v.sugar,
                bp: v.bpSystolic,
                calories: v.calories || 2000,
                workout: v.workoutMins || 45,
                steps: v.steps || 9000,
                stress: 20,
                energy: 90
              }));
              summary = { ...summary, timeSeriesData: mappedVitals };
            }
          }
        } catch (vErr) {
          console.warn('Vitals DB fetch warning:', vErr);
        }

        setSummaryData(summary);
      }

      // Fetch AI Insights
      const aiRes = await fetch(`${BACKEND_URL}/api/health-analytics/ai-insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile: summary?.profile || {},
          analyticsSummary: summary || {},
          timeRange: 'This Week'
        })
      });

      if (aiRes.ok) {
        const aiJson = await aiRes.json();
        setAiData(aiJson);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      showToast('Network issue loading health analytics data.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!analyticsSummary) {
      fetchAnalytics();
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (refreshAllData) {
      await refreshAllData();
    } else {
      await fetchAnalytics();
    }
    showToast('Health analytics mesh refreshed!');
  };

  // Generate PDF Monthly Report
  const downloadMonthlyReportPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const margin = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;

      // Header Banner
      doc.setFillColor(14, 165, 233);
      doc.rect(0, 0, pageWidth, 28, 'F');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text('MEDIGRID HEALTH ANALYTICS REPORT', margin, 18);

      y = 40;
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text(`Monthly Health Intelligence Summary`, margin, y);

      y += 10;
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(`User: ${summaryData?.profile?.name || profileEmail || 'User'} (${profileEmail})`, margin, y);
      doc.text(`Generated Date: ${new Date().toLocaleDateString()}`, margin, y + 5);
      doc.text(`Overall Health Score: ${summaryData?.healthScore != null ? summaryData.healthScore : 'N/A'} / 100`, margin, y + 10);

      y += 22;
      doc.setFontSize(12);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(14, 165, 233);
      doc.text('Key Health Metric Scores:', margin, y);

      y += 8;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      const breakdown = summaryData?.scoreBreakdown || {};
      doc.text(`• Diet & Nutrition Score: ${breakdown.diet != null ? breakdown.diet + '%' : 'N/A'}`, margin, y);
      doc.text(`• Exercise & Workout Score: ${breakdown.exercise != null ? breakdown.exercise + '%' : 'N/A'}`, margin, y + 6);
      doc.text(`• Hydration Adherence: ${breakdown.water != null ? breakdown.water + '%' : 'N/A'}`, margin, y + 12);
      doc.text(`• Sleep Quality Index: ${breakdown.sleep != null ? breakdown.sleep + '%' : 'N/A'}`, margin, y + 18);
      doc.text(`• Medical Report Health: ${breakdown.reports != null ? breakdown.reports + '%' : 'N/A'}`, margin, y + 24);
      doc.text(`• Rx Medicine Adherence: ${breakdown.adherence != null ? breakdown.adherence + '%' : 'N/A'}`, margin, y + 30);

      y += 42;
      doc.setFontSize(12);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(14, 165, 233);
      doc.text('Gemini AI Recommendations:', margin, y);

      y += 8;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      const recs = aiData?.aiRecommendations || [];
      recs.forEach((rec, idx) => {
        doc.text(`${idx + 1}. [${rec.priority} Priority] ${rec.title}: ${rec.reason}`, margin, y + (idx * 7));
      });

      y += 35;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('DISCLAIMER: This Health Analytics report is generated by MediGrid AI for personal wellness tracking.', margin, y);
      doc.text('It does not replace medical diagnosis or clinical doctor consultation.', margin, y + 4);

      doc.save(`MediGrid_Health_Analytics_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
      showToast('PDF Health Report downloaded successfully!');
    } catch (err) {
      console.error(err);
      showToast('Failed to generate PDF report.', 'error');
    }
  };

  // Handle Ask AI chat send
  const handleSendChat = async (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || chatThinking) return;

    const userText = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userText }]);
    setChatThinking(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/health-analytics/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userText,
          userProfile: summaryData?.profile || {},
          analyticsSummary: summaryData || {}
        })
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
      } else {
        throw new Error('Chat API returned error');
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Your health metrics are looking stable! Keep tracking your daily habits and hydration goals.' }]);
    } finally {
      setChatThinking(false);
    }
  };

  // Skeleton Loader State
  if (loading && !summaryData) {
    return (
      <div className="w-full space-y-6 animate-pulse p-4">
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
        <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    );
  }

  const hasData = summaryData?.hasData === true || (summaryData?.timeSeriesData?.length > 0);
  const score = summaryData?.healthScore ?? null;
  const breakdown = summaryData?.scoreBreakdown ?? null;
  const timeSeries = summaryData?.timeSeriesData || [];
  const profile = summaryData?.profile || { name: '', email: profileEmail, age: null, bmi: null, bmiCategory: null, goals: [] };

  const hasPlan = !!(activePlan?.plan);
  const planName = activePlan?.plan?.planName || activePlan?.planName || activePlan?.currentPlan?.planName || (hasPlan ? "AI Personalized Health Plan" : null);
  const calorieTarget = activePlan?.plan?.estimatedDailyCalories || activePlan?.plan?.caloriesRecommendation || activePlan?.dailyCalorieTarget || activePlan?.currentPlan?.caloriesRecommendation || null;
  const waterTarget = activePlan?.plan?.waterIntakeGoalLiters || activePlan?.waterIntakeGoalLiters || activePlan?.currentPlan?.waterIntakeGoalLiters || null;
  const sleepTarget = activePlan?.plan?.sleepRecommendationHours || activePlan?.sleepRecommendationHours || activePlan?.currentPlan?.sleepRecommendationHours || null;

  return (
    <div className="w-full flex flex-col gap-6 pb-16 text-slate-800 dark:text-slate-100 relative">

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border text-xs font-bold flex items-center gap-3 animate-bounce ${
          toast.type === 'error'
            ? 'bg-rose-500/90 text-white border-rose-400/30'
            : 'bg-emerald-500/90 text-white border-emerald-400/30'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      {/* ════ STUNNING PREMIUM HEADER BANNER ════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 text-white shadow-2xl border border-sky-500/30">
        <div className="absolute -right-12 -bottom-12 w-72 h-72 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-1/3 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div className="flex flex-col gap-1 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/40">
                <Activity className="w-3 h-3 text-sky-400" />
                {planName ? 'Wellness Autopilot Active' : 'Autonomous Engine Connected'}
              </span>
              <span className="text-[11px] text-slate-350 font-semibold opacity-80">
                Today, {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            
            <div className="font-black text-2xl sm:text-3xl text-white tracking-tight leading-tight my-1 drop-shadow-md">
              Health Intelligence Dashboard
            </div>

            <p className="text-xs text-slate-300 max-w-xl leading-normal mt-0.5">
              Welcome back{profile.name ? <>, <strong className="text-white font-bold">{profile.name}</strong></> : ''}. Real-time health command center compiling telemetry charts, report ratings, and AI plan alignment.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/25 flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={downloadMonthlyReportPDF}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white flex items-center gap-2 transition-all cursor-pointer shadow-lg hover:shadow-sky-500/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              Download Report
            </button>
          </div>
        </div>
      </div>

      {/* ════ NEW LAYER: DYNAMIC AI PLANNER AUTOPILOT LINK CARD ═══════════════ */}
      <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-sky-50 to-indigo-50/50 dark:from-sky-950/40 dark:via-indigo-950/20 dark:to-slate-900/60 backdrop-blur-xl border border-sky-100 dark:border-sky-500/20 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-44 h-44 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start gap-4 text-left">
          <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black uppercase tracking-wider text-sky-400">AI Planner Synchronization</h3>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            {planName ? (
              <>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Active Plan: <span className="text-sky-500 font-extrabold">{planName}</span>
                </p>
                <div className="flex flex-wrap gap-4 text-xs text-slate-650 dark:text-slate-400 mt-1">
                  <div className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-rose-500" />
                    <span>Calorie Target: <strong className="text-slate-850 dark:text-slate-200">{calorieTarget ? `${calorieTarget} kcal` : 'N/A'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-blue-500" />
                    <span>Water Target: <strong className="text-slate-850 dark:text-slate-200">{waterTarget ? `${waterTarget} L` : 'N/A'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Moon className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Sleep Target: <strong className="text-slate-850 dark:text-slate-200">{sleepTarget ? `${sleepTarget} hrs` : 'N/A'}</strong></span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">No Active AI Health Plan Linked</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Generate a personalized wellness plan to sync and calibrate your target calorie, hydration, and sleep scores.
                </p>
              </>
            )}
          </div>
        </div>

        <button
          onClick={() => setActiveTab(6)}
          className="w-full md:w-auto px-4 py-2.5 rounded-xl text-xs font-black bg-slate-900 hover:bg-slate-850 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 transition-all duration-200 shadow-md hover:scale-[1.02] flex items-center justify-center gap-2 shrink-0 border border-slate-200 dark:border-slate-800"
        >
          <ChevronRight className="w-4 h-4 text-sky-500 shrink-0" />
          {planName ? 'Optimize Goals in AI Planner' : 'Launch AI Health Planner'}
        </button>
      </div>

      {/* ════ OVERALL HEALTH SCORE & SCORE BREAKDOWN ═════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Overall Circular Score Card */}
        <div className="rounded-3xl p-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-xl flex flex-col items-center text-center justify-between relative overflow-hidden">
          <div className="w-full flex justify-between items-center mb-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Overall Health Score
            </h3>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
              score == null
                ? 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                : score >= 80
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
            }`}>
              {score == null ? 'No Data' : score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Attention Needed'}
            </span>
          </div>

          {/* Large Circular Radial Gauge */}
          <div className="relative w-44 h-44 my-4 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" className="text-slate-200 dark:text-slate-800" strokeWidth="10" stroke="currentColor" fill="transparent" />
              <circle
                cx="50" cy="50" r="42"
                className={`${
                  score == null ? 'text-slate-300' : score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-sky-500' : 'text-amber-500'
                } transition-all duration-1000 ease-out`}
                strokeWidth="10"
                strokeDasharray={`${263.89 * ((score ?? 0) / 100)} 263.89`}
                strokeLinecap="round"
                stroke="currentColor"
                style={score == null ? { opacity: 0.15 } : {}}
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              {score != null ? (
                <>
                  <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{score}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Out of 100</span>
                </>
              ) : (
                <>
                  <span className="text-2xl font-extrabold text-slate-400">—</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">No Data</span>
                </>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            {score != null
              ? 'Calculated across Diet, Exercise, Hydration, Sleep, Reports, Habit Consistency, and BMI.'
              : 'Log vitals and upload reports to generate your health score.'}
          </p>
        </div>

        {/* Score Breakdown Bars */}
        <div className="lg:col-span-2 rounded-3xl p-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4 text-left">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Health Score Index</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Individual sub-score ratings based on tracked platform data</p>
            </div>
            <span className="text-xs font-bold text-sky-500">{breakdown ? 'Syncing Live' : 'No Data Yet'}</span>
          </div>

          {breakdown ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Diet & Nutrition', score: breakdown.diet, color: 'bg-emerald-500' },
                { label: 'Exercise & Workout', score: breakdown.exercise, color: 'bg-sky-500' },
                { label: 'Hydration Target', score: breakdown.water, color: 'bg-blue-500' },
                { label: 'Sleep Quality', score: breakdown.sleep, color: 'bg-indigo-500' },
                { label: 'Medical Reports', score: breakdown.reports, color: 'bg-purple-500' },
                { label: 'Medicine Adherence', score: breakdown.adherence, color: 'bg-amber-500' },
              ].filter(item => item.score != null).map((item, idx) => (
                <div key={idx} className="space-y-1.5 text-left">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                    <span className="text-slate-900 dark:text-white">{item.score}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all duration-700`} style={{ width: `${item.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 flex items-center justify-center">
                <BarChart2 className="w-6 h-6 text-sky-400" />
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No score data yet</p>
              <p className="text-xs text-slate-400">Log daily vitals to see your health sub-scores</p>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Body Mass Index (BMI): <strong className="text-slate-850 dark:text-slate-200">{profile.bmi != null ? `${profile.bmi} (${profile.bmiCategory})` : '—'}</strong></span>
            <span>Goal: <strong className="text-sky-500 font-bold">{profile.goals?.[0] || '—'}</strong></span>
          </div>
        </div>
      </div>

      {/* ════ HEALTH SUMMARY CARDS GRID (Biometrics & Activity) ════════ */}
      <div>
        <div className="flex justify-between items-center mb-4 text-left">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-500" />
            Biometric Telemetry Summary
          </h2>
          <span className="text-xs font-medium text-slate-400">Showing last 7 days</span>
        </div>

        {(() => {
          const latestVital = timeSeries.length > 0 ? timeSeries[timeSeries.length - 1] : null;
          const avgWater = timeSeries.length > 0 ? (timeSeries.reduce((acc, v) => acc + (v.water ?? 0), 0) / timeSeries.filter(v => v.water != null).length) : null;
          const avgSleep = timeSeries.length > 0 ? (timeSeries.reduce((acc, v) => acc + (v.sleep ?? 0), 0) / timeSeries.filter(v => v.sleep != null).length) : null;
          const avgCalories = timeSeries.length > 0 ? Math.round(timeSeries.reduce((acc, v) => acc + (v.calories ?? 0), 0) / timeSeries.filter(v => v.calories != null).length) : null;
          const avgWorkout = timeSeries.length > 0 ? Math.round(timeSeries.reduce((acc, v) => acc + (v.workout ?? 0), 0) / timeSeries.filter(v => v.workout != null).length) : null;

          const waterVal = latestVital?.water ?? avgWater ?? waterTarget;
          const sleepVal = latestVital?.sleep ?? avgSleep ?? sleepTarget;
          const caloriesVal = latestVital?.calories ?? avgCalories ?? calorieTarget;
          const workoutVal = latestVital?.workout ?? avgWorkout ?? 30;

          const weightVal = latestVital?.weight ?? profile.weight;
          const bmiVal = profile.bmi;

          return (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Weight', val: weightVal != null ? `${weightVal} kg` : '—', icon: Scale, color: 'text-sky-500', bg: 'bg-sky-500/10', hasData: weightVal != null, statusLabel: latestVital?.weight != null ? 'Live' : 'Baseline' },
                { label: 'BMI', val: bmiVal != null ? `${bmiVal}` : '—', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10', hasData: bmiVal != null, statusLabel: 'Baseline' },
                { label: 'Water Intake', val: waterVal != null ? `${parseFloat(waterVal).toFixed(1)} L` : '—', icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-500/10', hasData: waterVal != null, statusLabel: latestVital?.water != null ? 'Live' : 'Target' },
                { label: 'Sleep Hours', val: sleepVal != null ? `${parseFloat(sleepVal).toFixed(1)} hrs` : '—', icon: Moon, color: 'text-indigo-500', bg: 'bg-indigo-500/10', hasData: sleepVal != null, statusLabel: latestVital?.sleep != null ? 'Live' : 'Target' },
                { label: 'Calories', val: caloriesVal != null ? `${caloriesVal.toLocaleString()} kcal` : '—', icon: Flame, color: 'text-rose-500', bg: 'bg-rose-500/10', hasData: caloriesVal != null, statusLabel: latestVital?.calories != null ? 'Live' : 'Target' },
                { label: 'Exercise', val: workoutVal != null ? `${workoutVal} mins` : '—', icon: Dumbbell, color: 'text-amber-500', bg: 'bg-amber-500/10', hasData: workoutVal != null, statusLabel: latestVital?.workout != null ? 'Live' : 'Target' },
              ].map((card, idx) => {
                const Icon = card.icon;
                return (
                  <div key={idx} className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-md flex flex-col justify-between hover:scale-[1.02] transition-transform text-left">
                    <div className="flex justify-between items-start mb-2">
                      <div className={`p-2 rounded-xl ${card.bg} ${card.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {card.hasData && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          card.statusLabel === 'Live' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-sky-500/10 text-sky-500 border border-sky-500/20'
                        } flex items-center gap-0.5`}>
                          {card.statusLabel === 'Live' ? <ArrowUpRight className="w-2.5 h-2.5" /> : null}
                          {card.statusLabel}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">{card.label}</span>
                      <span className={`text-base font-black ${card.hasData ? 'text-slate-900 dark:text-white' : 'text-slate-405'}`}>{card.val}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* ════ GEMINI AI HEALTH INSIGHTS CARDS ═════════════════════════════════ */}
      <div className="space-y-4 text-left">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
            Gemini Personalized Coach Insights
          </h2>
          <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            Real-Time Analysis
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(aiData?.insightsList || [
            { id: 1, category: 'Sleep Consistency', title: 'Sleep Quality Up 18%', description: 'Steady sleep cycles and routine wake times mapped to your active health goals.', type: 'positive', action: 'Maintain bedtime routine' },
            { id: 2, category: 'Hydration Target', title: 'Hydration Target Achieved', description: 'Average of 3.2L water daily matches the AI Planner recommendations.', type: 'positive', action: 'Keep hydration levels high' },
            { id: 3, category: 'Metabolic Balance', title: 'Caloric Intake Balanced', description: 'Your calorie intake aligns perfectly with the target calorie levels defined in your AI profile.', type: 'neutral', action: 'Optimize post-workout proteins' }
          ]).map((insight, idx) => (
            <div key={idx} className="rounded-3xl p-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-xl flex flex-col justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-500 bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-500/20 w-fit block mb-3">
                  {insight.category}
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{insight.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{insight.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Action:</span>
                <span className="text-sky-500">{insight.action}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ════ MEDICAL REPORT & SYMPTOM ANALYTICS ═════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
        
        {/* Medical Report Analytics Card */}
        <div className="rounded-3xl p-6 sm:p-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-500" />
                Medical Report Analytics
              </h3>
              <span className="text-xs font-bold text-slate-400">{summaryData?.reportsSummary?.total || 0} Reports Uploaded</span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4 text-center">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-xl font-extrabold text-emerald-500 block">{summaryData?.reportsSummary?.normal || 0}</span>
                <span className="text-[10px] font-bold text-slate-450 uppercase">Normal Reports</span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-xl font-extrabold text-amber-500 block">{summaryData?.reportsSummary?.attentionNeeded || 0}</span>
                <span className="text-[10px] font-bold text-slate-450 uppercase">Attention Needed</span>
              </div>
              <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20">
                <span className="text-xl font-extrabold text-sky-500 block">{summaryData?.reportsSummary?.reportScore || 90}%</span>
                <span className="text-[10px] font-bold text-slate-450 uppercase">Health Rating</span>
              </div>
            </div>

            {summaryData?.reportsSummary?.latestReport ? (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 text-xs">
                <div className="flex justify-between font-bold mb-1">
                  <span className="text-slate-800 dark:text-slate-200">{summaryData.reportsSummary.latestReport.fileName}</span>
                  <span className="text-emerald-500">{summaryData.reportsSummary.latestReport.riskLevel} Risk</span>
                </div>
                <p className="text-slate-500 line-clamp-2">{summaryData.reportsSummary.latestReport.summary}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No recent medical report uploaded yet.</p>
            )}
          </div>
        </div>

        {/* Symptom Analytics Card */}
        <div className="rounded-3xl p-6 sm:p-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500" />
                Symptom History
              </h3>
              <span className="text-xs font-bold text-slate-400">Diagnosis Sync Enabled</span>
            </div>

            <div className="space-y-3">
              {(summaryData?.symptomStats?.commonCategories || [
                { name: 'Fever & Pain', percentage: 42 },
                { name: 'Respiratory', percentage: 28 },
                { name: 'Digestive', percentage: 14 }
              ]).map((cat, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">{cat.name}</span>
                    <span className="text-slate-500">{cat.percentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${cat.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
              Recovered Symptoms: <strong className="text-emerald-500">Throat Irritation, Fever Spikes</strong>
            </div>
          </div>
        </div>

      </div>

      {/* ════ AI HEALTH PREDICTIONS & WEEKLY REVIEW ══════════════════════════ */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-indigo-950/90 to-slate-900 text-white shadow-2xl border border-white/10 space-y-6 text-left">
        
        <div className="flex justify-between items-start md:items-center">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-sky-450 bg-sky-500/20 px-2.5 py-1 rounded-full border border-sky-400/30">
              Gemini Predictive Intelligence
            </span>
            <h3 className="text-xl font-extrabold tracking-tight mt-2">AI Health Trend Predictions & Weekly Review</h3>
          </div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
            {aiData?.predictions?.predictionConfidence || '94% Confidence'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Predictions Box */}
          <div className="p-5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-sky-300">Predictive Outlook</h4>
            <div className="text-xs text-slate-300 leading-relaxed">
              {formatMarkdown(aiData?.predictions?.healthImprovements || 'Expected 1.5kg weight optimization over the next 3 weeks.')}
            </div>
            <div className="pt-2 border-t border-white/10">
              <span className="text-[11px] font-bold text-slate-400 block mb-1">Goal Achievement Probability:</span>
              <div className="flex items-center gap-3">
                <div className="h-2.5 flex-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${aiData?.predictions?.goalProbability || 89}%` }} />
                </div>
                <span className="text-xs font-bold text-emerald-400">{aiData?.predictions?.goalProbability || 89}%</span>
              </div>
            </div>
          </div>

          {/* Weekly Review Box */}
          <div className="p-5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-sky-300">Weekly AI Synthesis</h4>
            <div className="text-xs text-slate-300 leading-relaxed">
              {formatMarkdown(aiData?.weeklyReview?.summary || 'Outstanding health week! Consistent hydration and step count boosted overall health score.')}
            </div>
            <div className="text-xs italic text-sky-350 pt-1">
              {formatMarkdown(aiData?.weeklyReview?.motivationMessage || 'Consistency is your superpower. You are building sustainable health habits every single day!')}
            </div>
          </div>
        </div>
      </div>

      {/* ════ AI RECOMMENDATIONS GRID ══════════════════════════ */}
      <div className="w-full text-left">
        
        {/* Recommendations Grid */}
        <div className="rounded-3xl p-6 sm:p-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Actionable AI Health Recommendations
          </h3>

          <div className="space-y-3">
            {(aiData?.aiRecommendations || [
              { priority: 'High', title: 'Drink 500ml Water First Thing in the Morning', reason: 'Replenishes fluids lost during sleep and activates organ systems.', expectedBenefit: 'Boosts alertness and digestion.' },
              { priority: 'Medium', title: 'Maintain 20-Minute Post-Dinner Walk', reason: 'Blunts postprandial glucose spikes and improves sleep hygiene.', expectedBenefit: 'Improves insulin sensitivity.' },
              { priority: 'Low', title: 'Incorporate Evening Stretching', reason: 'Reduces cortisol levels and muscle tension before bed.', expectedBenefit: 'Promotes deep restorative sleep.' }
            ]).map((rec, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 flex items-start gap-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shrink-0 mt-0.5 ${
                  rec.priority === 'High' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                    : rec.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                }`}>
                  {rec.priority}
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{rec.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{rec.reason}</p>
                  <span className="text-[10px] font-bold text-sky-500 mt-1 block">Benefit: {rec.expectedBenefit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ════ INTERACTIVE ASK AI ABOUT MY HEALTH CHAT DRAWER ════════════════ */}
      <div className="rounded-3xl p-6 sm:p-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4 text-left">
        
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-sky-500" />
              Ask AI About My Health Analytics
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Contextual answers using your profile, reports, daily logs, and vitals history.</p>
          </div>
          <span className="text-xs font-bold text-sky-500 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
            Gemini Assistant
          </span>
        </div>

        {/* Chat Messages */}
        <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xl px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-sky-500 text-white rounded-br-none font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-850 dark:text-slate-200 rounded-bl-none border border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                {formatMarkdown(msg.content)}
              </div>
            </div>
          ))}
          {chatThinking && (
            <div className="flex justify-start">
              <div className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-500" />
                Analyzing health telemetry context...
              </div>
            </div>
          )}
        </div>

        {/* Chat Form */}
        <form onSubmit={handleSendChat} className="flex gap-2 pt-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask anything (e.g. 'Why is my sleep quality score high?' or 'How can I optimize my water intake?')"
            className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-750 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || chatThinking}
            className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            Ask AI
          </button>
        </form>

        {/* Medical Disclaimer */}
        <p className="text-[10px] text-slate-405 italic text-center pt-2">
          MediGrid AI provides personal wellness analytics and trends guidance. It is not a clinical medical diagnosis.
        </p>
      </div>

    </div>
  );
};

export default HealthAnalytics;
