import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import { api, setToken, setLoggedIn } from '../utils/api';
import InvoiceMaker from './dashboard/InvoiceMaker';
import CompanyProfile from './dashboard/CompanyProfile';
import Customers from './dashboard/Customers';
import Products from './dashboard/Products';
import Tasks from './dashboard/Tasks';
import Chat from './dashboard/Chat';
import Analytics from './dashboard/Analytics';
import Email from './dashboard/Email';
import Team from './dashboard/Team';
import InvoiceHistory from './dashboard/InvoiceHistory';
import AccountSettings from './dashboard/AccountSettings';
import {
  LayoutDashboard, Receipt, BarChart3, MessageSquare, CheckSquare,
  Mail, Users, Package, Share2, Bell, Search, Settings, HelpCircle,
  LogOut, Sun, Moon, ChevronLeft, ChevronRight, Menu, Plus, Sparkles,
  TrendingUp, Send, Mic, X, ArrowUpRight, ArrowDownRight, MoreVertical,
  ChevronDown, Check, Trash2, Video, DollarSign, Calendar, Clock,
  Briefcase, CheckCircle, Shield, Volume2, AlertCircle, RefreshCw,
  Award, Zap, Flame, Trophy, Activity, FileText
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();

  // ─── States ─────────────────────────────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Layout Controls
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Tab/Navigation (derived from pathname)
  const location = useLocation();
  const activeTab = location.pathname.split('/')[2] || 'dashboard';
  
  // Interactive Data States
  const [tasks, setTasks] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Fetch tasks, invoices and customers from MongoDB
  useEffect(() => {
    if (!user) return;
    const fetchDashboardData = async () => {
      try {
        const taskData = await api.get('/tasks');
        const invoiceData = await api.get('/invoices');
        const customerData = await api.get('/customers');
        setTasks(taskData.map(t => ({
          id: t._id,
          text: t.text,
          description: t.description || '',
          priority: t.priority || 'medium',
          done: t.done,
          deadline: t.deadline || 'Today',
          status: t.status || 'To Do'
        })));
        setInvoices(invoiceData);
        setCustomers(customerData);
      } catch (err) {
        console.error("Failed to load dashboard database data", err);
      }
    };
    fetchDashboardData();
  }, [user]);

  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');

  // AI Assistant Chat State
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Hello Gaurav! I am your Gemini-powered Business Copilot. How can I help optimize your sales and invoices today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [aiThinking, setAiThinking] = useState(false);

  // Notifications State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Payment Received', desc: '₹49,900 received from Acrux Enterprises.', time: '5m ago', read: false, type: 'payment' },
    { id: 2, title: 'Low Stock Alert', desc: 'Wireless Mouse stock is below threshold (4 left).', time: '1h ago', read: false, type: 'stock' },
    { id: 3, title: 'New Customer Registered', desc: 'Priya Sharma joined the premium tier.', time: '3h ago', read: true, type: 'customer' },
    { id: 4, title: 'AI Recommendation', desc: 'Weekend promo could yield up to 14% higher margins.', time: 'Yesterday', read: true, type: 'ai' }
  ]);

  // Global Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  // Time & Theme synchronization
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return document.documentElement.classList.contains('dark');
  });

  // ─── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await api.get('/user/me');
        if (active) {
          setUser(data);
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Unauthorized. Redirecting to login...');
          setToken(null);
          setLoggedIn(false);
          setTimeout(() => navigate('/login'), 1500);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    loadProfile();
    return () => { active = false; };
  }, [navigate]);

  // Sync dark mode state with HTML root class
  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', {}).catch(() => {});
    } finally {
      setToken(null);
      setLoggedIn(false);
      navigate('/login');
    }
  };

  const [upgrading, setUpgrading] = useState(false);
  const [logoBase64, setLogoBase64] = useState("");
  const [showDevicesModal, setShowDevicesModal] = useState(false);
  const [evictingSession, setEvictingSession] = useState(null);

  const handleEvictSession = async (sessionId) => {
    setEvictingSession(sessionId);
    try {
      await api.post('/user/sessions/evict', { sessionId });
      // Refresh user profile details to get updated activeSessions list
      const data = await api.get('/user/me');
      setUser(data);
    } catch (err) {
      alert(err.message || "Failed to terminate session.");
    } finally {
      setEvictingSession(null);
    }
  };

  useEffect(() => {
    const fetchLogoAsBase64 = async () => {
      try {
        const response = await fetch(encodeURI("/Assets/Logos/Logo (MAIN).png"));
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoBase64(reader.result);
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error("Failed to load logo as base64", err);
      }
    };
    fetchLogoAsBase64();
  }, []);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgradeToPremium = async () => {
    setUpgrading(true);
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        alert("Failed to load Razorpay payment SDK. Please check your connection.");
        return;
      }

      const orderRes = await api.post('/payment/create-order', { plan: 'Premium' });

      const options = {
        key: orderRes.keyId,
        amount: orderRes.amount,
        currency: orderRes.currency,
        name: "Smart Pilot",
        image: logoBase64 || encodeURI(window.location.origin + "/Assets/Logos/Logo (MAIN).png"),
        description: "Upgrade to Premium Subscription",
        order_id: orderRes.orderId,
        prefill: {
          name: orderRes.user?.name || "",
          email: orderRes.user?.email || ""
        },
        theme: {
          color: "#f97316"
        },
        handler: async function (response) {
          try {
            const verifyRes = await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: 'Premium'
            });
            if (verifyRes.success) {
              alert("Successfully upgraded to Premium Plan!");
              setUser(prev => ({ ...prev, plan: 'Premium', maxDevices: verifyRes.maxDevices }));
            } else {
              alert("Payment verification failed.");
            }
          } catch (verifyErr) {
            alert(verifyErr.message || "Payment verification failed.");
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert(err.message || "Checkout failed. Please try again.");
    } finally {
      setUpgrading(false);
    }
  };

  // ─── Interaction Handlers ────────────────────────────────────────────────────
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    try {
      const task = await api.post('/tasks', {
        text: newTaskText.trim(),
        priority: newTaskPriority,
        done: false,
        deadline: 'Today',
        description: 'Created from dashboard.'
      });
      setTasks(prev => [{
        id: task._id,
        text: task.text,
        description: task.description || '',
        priority: task.priority || 'medium',
        done: task.done,
        deadline: task.deadline || 'Today',
        status: task.status || 'To Do'
      }, ...prev]);
      setNewTaskText('');
    } catch (err) {
      console.error("Failed to add task", err);
    }
  };

  const toggleTask = async (id) => {
    const taskToToggle = tasks.find(t => t.id === id);
    if (!taskToToggle) return;
    try {
      const updated = await api.put(`/tasks/${id}`, { done: !taskToToggle.done });
      setTasks(prev => prev.map(t => t.id === id ? { ...t, done: updated.done } : t));
    } catch (err) {
      console.error("Failed to toggle task", err);
    }
  };

  const deleteTask = async (id) => {
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error("Failed to delete task", err);
    }
  };

  const formatMarkdown = (text) => {
    if (!text) return '';
    
    // Escape HTML to prevent injection
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Headings
    html = html.replace(/^### (.*$)/gim, '<h4 class="text-[10px] font-black text-zinc-900 dark:text-white mt-2 mb-0.5">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 class="text-xs font-black text-zinc-900 dark:text-white mt-3 mb-1">$1</h3>');
    html = html.replace(/^# (.*$)/gim, '<h2 class="text-sm font-black text-zinc-900 dark:text-white mt-4 mb-1.5">$1</h2>');

    // Bold (**text** or __text__)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-zinc-950 dark:text-white">$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong class="font-extrabold text-zinc-950 dark:text-white">$1</strong>');

    // Italic (*text* or _text_)
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    html = html.replace(/_(.*?)_/g, '<em class="italic">$1</em>');

    // Bullet Lists (lines starting with - or * or •)
    html = html.replace(/^\s*[-*•]\s+(.*)$/gm, '<li class="ml-3 list-disc my-0.5 text-zinc-600 dark:text-zinc-300">$1</li>');

    // Newlines conversion
    html = html.replace(/\n/g, '<br />');
    
    return <div dangerouslySetInnerHTML={{ __html: html }} className="space-y-0.5" />;
  };

  const handleSendAiMessage = async (textToSend) => {
    const text = textToSend || chatInput;
    if (!text.trim()) return;

    const userMessage = { role: 'user', content: text };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setAiThinking(true);

    try {
      const history = chatMessages.slice(-5).map(m => ({
        role: m.role,
        content: m.content
      }));

      const data = await api.post('/ai/chat', { message: text, history });
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err) {
      const errorMsg = err.message || "Failed to reach AI assistant. Please check your connection.";
      setChatMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Error: ${errorMsg}` }]);
    } finally {
      setAiThinking(false);
    }
  };

  const handleNotificationRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const totalSales = React.useMemo(() => {
    return invoices
      .filter(inv => inv.status === 'Paid')
      .reduce((sum, inv) => sum + inv.grandTotal, 0);
  }, [invoices]);

  const outstanding = React.useMemo(() => {
    return invoices
      .filter(inv => inv.status === 'Unpaid' || inv.status === 'Overdue')
      .reduce((sum, inv) => sum + inv.grandTotal, 0);
  }, [invoices]);

  // ── Month-over-Month growth calculations ────────────────────────────────────
  const growthStats = React.useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const prevMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const prevYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    const isThisMonth = (d) => { const dt = new Date(d); return dt.getMonth() === thisMonth && dt.getFullYear() === thisYear; };
    const isPrevMonth = (d) => { const dt = new Date(d); return dt.getMonth() === prevMonth && dt.getFullYear() === prevYear; };

    // Total sales growth (paid invoices)
    const thisPaid = invoices.filter(i => i.status === 'Paid' && isThisMonth(i.date)).reduce((s, i) => s + i.grandTotal, 0);
    const prevPaid = invoices.filter(i => i.status === 'Paid' && isPrevMonth(i.date)).reduce((s, i) => s + i.grandTotal, 0);
    const salesGrowth = prevPaid === 0 ? (thisPaid > 0 ? 100 : 0) : Math.round(((thisPaid - prevPaid) / prevPaid) * 1000) / 10;

    // Invoice count growth
    const thisCount = invoices.filter(i => isThisMonth(i.date)).length;
    const prevCount = invoices.filter(i => isPrevMonth(i.date)).length;
    const countGrowth = prevCount === 0 ? (thisCount > 0 ? 100 : 0) : Math.round(((thisCount - prevCount) / prevCount) * 1000) / 10;

    // Projected revenue growth (paid + outstanding, current vs previous)
    const thisProjOutstanding = invoices.filter(i => (i.status === 'Unpaid' || i.status === 'Overdue') && isThisMonth(i.date)).reduce((s, i) => s + i.grandTotal, 0);
    const prevProjOutstanding = invoices.filter(i => (i.status === 'Unpaid' || i.status === 'Overdue') && isPrevMonth(i.date)).reduce((s, i) => s + i.grandTotal, 0);
    const thisProj = thisPaid + thisProjOutstanding;
    const prevProj = prevPaid + prevProjOutstanding;
    const projGrowth = prevProj === 0 ? (thisProj > 0 ? 100 : 0) : Math.round(((thisProj - prevProj) / prevProj) * 1000) / 10;

    return { salesGrowth, countGrowth, projGrowth };
  }, [invoices]);

  const customerMap = React.useMemo(() => {
    const map = {};
    customers.forEach(c => {
      map[c._id || c.id] = c.name;
    });
    return map;
  }, [customers]);

  const dynamicActivities = React.useMemo(() => {
    const list = invoices.slice(0, 5).map(inv => {
      const clientName = customerMap[inv.customerId] || 'Client';
      const isPaid = inv.status === 'Paid';
      return {
        title: isPaid ? 'Payment Confirmed' : `Invoice ${inv.invoiceNo || 'Draft'} Created`,
        desc: isPaid 
          ? `₹${inv.grandTotal.toLocaleString('en-IN')} received from ${clientName}.` 
          : `₹${inv.grandTotal.toLocaleString('en-IN')} issued to ${clientName}.`,
        time: new Date(inv.date).toLocaleDateString(),
        color: isPaid ? 'bg-blue-500' : 'bg-orange-500'
      };
    });

    list.push({
      title: 'Autopilot agent checklist OK',
      desc: 'Auto-sync checked 18 background routines.',
      time: 'Today',
      color: 'bg-emerald-500'
    });

    return list;
  }, [invoices, customerMap]);

  const chartData = React.useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data = days.map(d => ({ day: d, val: 0, val2: 0 }));

    invoices.forEach(inv => {
      const d = new Date(inv.date);
      const dayName = days[d.getDay()];
      const match = data.find(item => item.day === dayName);
      if (match) {
        if (inv.status === 'Paid') {
          match.val2 += Number(inv.grandTotal || 0);
        } else {
          match.val += Number(inv.grandTotal || 0);
        }
      }
    });

    const maxVal = Math.max(...data.map(d => Math.max(d.val, d.val2)), 1);

    return data.map(d => ({
      day: d.day,
      val: Math.max(Math.round((d.val / maxVal) * 100), 10),
      val2: Math.max(Math.round((d.val2 / maxVal) * 100), 10)
    }));
  }, [invoices]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#07080d] flex items-center justify-center text-zinc-400 font-sans">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="animate-spin text-orange-500" size={36} />
          <p className="text-xs font-bold tracking-wider uppercase text-zinc-500">Loading Workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#07080d] flex items-center justify-center text-zinc-400 font-sans p-6">
        <div className="text-center p-8 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 rounded-3xl max-w-sm shadow-xl text-left">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={44} />
          <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Failed to load session profile</p>
          <p className="text-xs text-zinc-500 mt-2">{error || 'Please sign in again.'}</p>
          <button
            onClick={handleLogout}
            className="mt-6 w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer text-center"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const projectedRevenue = totalSales + outstanding;

  const paidInvoiceCount = invoices.filter(inv => inv.status === 'Paid').length;
  const unpaidInvoiceCount = invoices.filter(inv => inv.status === 'Unpaid' || inv.status === 'Overdue').length;

  // Get active greeting based on time of day
  const getGreeting = () => {
    const hr = currentTime.getHours();
    if (hr < 12) return 'GOOD MORNING';
    if (hr < 18) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#fafbfe] text-slate-800 dark:bg-black dark:text-zinc-150 transition-colors duration-300 font-sans relative">
      {/* Background Grids */}
      <div className="dashboard-gridlines" />
      <div className="dashboard-bg-glow" />

      {/* ─── LEFT SIDEBAR ──────────────────────────────────────────────────────── */}
      <aside className={`bg-white dark:bg-black border-r border-[#e8ecf4] dark:border-zinc-800/80 flex flex-col h-screen overflow-hidden transition-all duration-300 z-35 ${
        sidebarCollapsed ? 'w-18' : 'w-56'
      } hidden md:flex`}>
        {/* Section 1: Logo & Brand Info (Static) */}
        <div className="h-16 flex-shrink-0 flex items-center px-5 border-b border-[#e8ecf4] dark:border-zinc-800/50 justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <img
              src="/Assets/Logos/Logo (MAIN).png"
              alt="Smart Pilot Logo"
              className="h-8 w-auto object-contain block dark:hidden"
            />
            <img
              src="/Assets/Logos/Logo (White).png"
              alt="Smart Pilot Logo"
              className="h-8 w-auto object-contain hidden dark:block"
            />
            {!sidebarCollapsed && (
              <div className="text-left leading-none">
                <span className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50 tracking-tight block">
                  Smart Pilot
                </span>
                <span className="text-[9px] font-bold text-orange-500 uppercase tracking-wide">
                  AI Business OS
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Navigation Items (Scrollable) */}
        <div className="flex-1 overflow-y-auto min-h-0 py-4 space-y-1 text-left">
          {!sidebarCollapsed && (
            <div className="px-5 pb-2 text-[9px] font-black uppercase tracking-widest text-zinc-400">
              Workspace
            </div>
          )}
          <div className="px-3 space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'invoices', label: 'Invoice Maker', icon: Receipt },
              { id: 'invoice-history', label: 'Invoice History', icon: FileText },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'chat', label: 'AI Chat', icon: MessageSquare },
              { id: 'tasks', label: 'Tasks', icon: CheckSquare },
              { id: 'email', label: 'AI Email', icon: Mail },
              { id: 'team', label: 'Team Connect', icon: Share2 },
              { id: 'customers', label: 'Customers', icon: Users },
              { id: 'products', label: 'Product Manager', icon: Package },
              { id: 'profile', label: 'Company Profile', icon: Briefcase }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'dashboard') {
                    navigate('/dashboard');
                  } else {
                    navigate(`/dashboard/${item.id}`);
                  }
                }}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-slate-100/60 dark:hover:bg-zinc-800/40'
                } ${sidebarCollapsed ? 'justify-center' : 'text-left'}`}
              >
                <item.icon size={16} className="shrink-0" />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Settings, Logout & Collapse (Static, anchored to bottom) */}
        <div className="flex-shrink-0 border-t border-[#e8ecf4] dark:border-zinc-800/50 bg-white dark:bg-black">
          {/* Account and profile settings */}
          <div className="px-3 py-3 space-y-0.5">
            <button
              onClick={() => navigate('/dashboard/settings')}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${activeTab === 'settings' ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-slate-100/60 dark:hover:bg-zinc-800/40'} ${sidebarCollapsed ? 'justify-center' : 'text-left'}`}
            >
              <Settings size={15} className="shrink-0" />
              {!sidebarCollapsed && <span>Settings</span>}
            </button>
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-[13px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer ${sidebarCollapsed ? 'justify-center' : 'text-left'}`}
            >
              <LogOut size={15} className="shrink-0" />
              {!sidebarCollapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* ─── CENTER CONTAINER ─────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* ─── TOP NAVBAR ──────────────────────────────────────────────────────── */}
        <header className="h-16 bg-white dark:bg-black/60 backdrop-blur-md border-b border-[#e8ecf4] dark:border-zinc-800/60 px-6 flex items-center justify-between z-20 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              <Menu size={18} />
            </button>
            <h1 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
              Dashboard Overview
            </h1>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            {/* Systems Uptime */}
            <div className="flex items-center gap-1 bg-orange-50 dark:bg-orange-950/25 border border-orange-200/50 dark:border-orange-500/20 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full text-xs font-bold">
              <Activity size={13} className="text-orange-500" />
              <span>All Systems Normal</span>
            </div>

            {user.plan === 'Starter' && (
              <button
                onClick={handleUpgradeToPremium}
                disabled={upgrading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 disabled:opacity-50 text-white rounded-full text-[10px] font-black uppercase tracking-wider transition-all shadow-md shadow-orange-500/25 cursor-pointer shrink-0"
              >
                {upgrading ? (
                  <>
                    <RefreshCw size={10} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={11} className="animate-pulse" />
                    <span>Upgrade to Premium</span>
                  </>
                )}
              </button>
            )}

            {/* Plan indicator */}
            <div className="flex items-center gap-2 bg-[#FAF5FF] dark:bg-[#1a0e2e]/40 border border-[#E9D5FF] dark:border-[#8B5CF6]/20 px-3 py-1 rounded-full text-xs font-bold">
              <Zap size={13} className="text-[#8B5CF6]" />
              <span className="text-[#8B5CF6] text-[10px] flex items-center gap-1.5">
                <span>{user.plan} Account</span>
                {user.plan === 'Premium' && user.planExpiresAt && (
                  <span className="opacity-75 text-[9px] font-medium border-l border-[#8B5CF6]/30 pl-1.5">
                    Expires: {new Date(user.planExpiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
              </span>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              {isDark ? <Sun size={15} className="text-amber-500" /> : <Moon size={15} />}
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-655 cursor-pointer relative"
            >
              <Bell size={15} />
              {notifications.some(n => !n.read) && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>

            {/* Profile Avatar */}
            <div className="w-7 h-7 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-800 cursor-pointer">
              <img
                src={user.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80"}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 md:hidden cursor-pointer"
            >
              <Menu size={16} />
            </button>
          </div>
        </header>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs z-50 md:hidden flex justify-start">
            <div className="w-64 bg-white dark:bg-black h-full p-4 flex flex-col justify-between border-r border-[#e8ecf4] dark:border-zinc-800">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <span className="font-extrabold text-base text-zinc-850 dark:text-zinc-50">Smart Pilot</span>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-lg text-zinc-400"><X size={18} /></button>
                </div>
                <div className="space-y-1">
                  {[
                    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                    { id: 'invoices', label: 'Invoice Maker', icon: Receipt },
                    { id: 'invoice-history', label: 'Invoice History', icon: FileText },
                    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
                    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
                    { id: 'email', label: 'AI Email', icon: Mail },
                    { id: 'team', label: 'Team Connect', icon: Share2 },
                    { id: 'customers', label: 'Customers', icon: Users },
                    { id: 'products', label: 'Product Manager', icon: Package },
                    { id: 'profile', label: 'Company Profile', icon: Briefcase }
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.id === 'dashboard') {
                          navigate('/dashboard');
                        } else {
                          navigate(`/dashboard/${item.id}`);
                        }
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === item.id ? 'bg-orange-500 text-white' : 'text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      <item.icon size={16} />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleLogout} className="flex items-center gap-3 p-2.5 rounded-xl text-xs font-bold text-red-500 bg-red-50 dark:bg-red-950/20"><LogOut size={16} /> Logout</button>
            </div>
          </div>
        )}

        {/* ─── MAIN DASHBOARD CONTENT AREA ────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">

          <Routes>
            <Route path="/" element={
              <>
                {/* ─── LARGE MAIN HEADER BANNER ─────────────────────────────────────── */}
                <div className="bg-[#190f38] dark:bg-[#120a28] rounded-[24px] p-8 text-white relative z-10 overflow-hidden border border-[#5B5CEB]/20 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-xl">
                  {/* Banner gridlines */}
                  <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-[90px] pointer-events-none animate-pulse" />

                  <div className="space-y-4 relative z-10 max-w-xl">
                    <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest block">
                      {getGreeting()} 👋
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-none">
                      Welcome back, <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-300 bg-clip-text text-transparent">{user.name}</span>!
                    </h2>
                    <p className="text-xs text-zinc-350 leading-relaxed font-medium">
                      Smart Pilot Autopilot runs in the background. Currently syncing data streams, analyzing revenue projections, and checking client billing logs.
                    </p>
                    <div className="flex flex-wrap gap-3 pt-2">
                      <button 
                        onClick={() => navigate('/dashboard/invoices')}
                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-orange-500/20 cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus size={14} strokeWidth={2.5} />
                        <span>Create Invoice</span>
                      </button>
                      <button 
                        onClick={() => setAiPanelOpen(true)}
                        className="px-4 py-2 bg-[#ffffff]/10 hover:bg-[#ffffff]/15 text-white text-xs font-black rounded-xl transition-all border border-white/10 cursor-pointer flex items-center gap-1.5"
                      >
                        <Sparkles size={14} className="text-orange-400 animate-pulse" />
                        <span>Consult Autopilot</span>
                      </button>
                    </div>
                  </div>

                  {/* Stat Card */}
                  <div className="bg-[#ffffff]/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 w-full lg:w-64 text-left relative overflow-hidden shrink-0 shadow-lg">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-full blur-xl pointer-events-none" />
                    <p className="text-[10px] font-black uppercase text-orange-400 tracking-wider">Projected Revenue</p>
                    <h3 className="text-2xl font-black text-white mt-1">₹{projectedRevenue.toLocaleString('en-IN')}</h3>
                    <p className="text-[9px] font-bold text-zinc-400 mt-2 flex items-center gap-1">
                      <span className={`font-extrabold flex items-center gap-0.5 ${growthStats.projGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {growthStats.projGrowth >= 0 ? <TrendingUp size={10} /> : <ArrowDownRight size={10} />}
                        {growthStats.projGrowth >= 0 ? '+' : ''}{growthStats.projGrowth}%
                      </span> 
                      vs previous month
                    </p>
                  </div>
                </div>

                {/* ─── METRICS CARDS SECTION ───────────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Total Invoiced */}
                  <div className="bg-white dark:bg-zinc-950 border border-[#e8ecf4] dark:border-zinc-800/80 rounded-[24px] p-5 text-left relative overflow-hidden group hover:border-orange-500/30 transition-all shadow-2xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Total Sales</p>
                        <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50 mt-1">₹{totalSales.toLocaleString('en-IN')}</h3>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                        <TrendingUp size={16} />
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-50 dark:border-zinc-900 flex justify-between items-center text-[9px] font-bold text-zinc-500">
                      <span>{invoices.length} Invoices Issued</span>
                      <span className={`font-extrabold ${growthStats.countGrowth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {growthStats.countGrowth >= 0 ? '+' : ''}{growthStats.countGrowth}%
                      </span>
                    </div>
                  </div>

                  {/* Active Sessions */}
                  <div 
                    onClick={() => setShowDevicesModal(true)}
                    className="bg-white dark:bg-zinc-950 border border-[#e8ecf4] dark:border-zinc-800/80 rounded-[24px] p-5 text-left relative overflow-hidden group hover:border-orange-500/50 hover:shadow-sm transition-all shadow-2xs cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Active Devices</p>
                        <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50 mt-1">
                          {user.activeSessions?.length || 1} / {user.maxDevices || 1}
                        </h3>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <Activity size={16} />
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-50 dark:border-zinc-900 flex justify-between items-center text-[9px] font-bold text-zinc-500">
                      <span className="text-blue-500 hover:underline">Manage Sessions</span>
                      <span className="text-blue-500 font-black uppercase tracking-wider">{user.plan}</span>
                    </div>
                  </div>

                  {/* Unpaid balance */}
                  <div className="bg-white dark:bg-zinc-950 border border-[#e8ecf4] dark:border-zinc-800/80 rounded-[24px] p-5 text-left relative overflow-hidden group hover:border-orange-500/30 transition-all shadow-2xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Outstanding</p>
                        <h3 className="text-xl font-black text-rose-500 mt-1">₹{outstanding.toLocaleString('en-IN')}</h3>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                        <AlertCircle size={16} />
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-50 dark:border-zinc-900 flex justify-between items-center text-[9px] font-bold text-zinc-500">
                      <span>{unpaidInvoiceCount} pending payments</span>
                      <span className="text-rose-500 font-extrabold">Overdue</span>
                    </div>
                  </div>

                  {/* Autopilot efficiency */}
                  <div className="bg-white dark:bg-zinc-950 border border-[#e8ecf4] dark:border-zinc-800/80 rounded-[24px] p-5 text-left relative overflow-hidden group hover:border-orange-500/30 transition-all shadow-2xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">AI Operations</p>
                        <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-500 mt-1">99.8%</h3>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <Zap size={16} />
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-50 dark:border-zinc-900 flex justify-between items-center text-[9px] font-bold text-zinc-500">
                      <span>18 rules enforced</span>
                      <span className="text-emerald-500 font-extrabold">Active</span>
                    </div>
                  </div>
                </div>

                {/* ─── SECONDARY DOUBLE COLUMN SECTION (Charts & Activity) ─────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Sales performance chart placeholder */}
                  <div className="lg:col-span-8 bg-white dark:bg-zinc-950 border border-[#e8ecf4] dark:border-zinc-800/80 rounded-[20px] p-5 shadow-2xs text-left">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                          Sales Analytics
                        </h3>
                        <p className="text-[10px] text-zinc-400 font-bold mt-0.5">Projected vs actual billing values</p>
                      </div>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                        growthStats.salesGrowth >= 0
                          ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/50'
                          : 'text-rose-600 bg-rose-50 dark:bg-rose-950/20 border-rose-200/50'
                      }`}>
                        {growthStats.salesGrowth >= 0 ? '+' : ''}{growthStats.salesGrowth}% Growth
                      </span>
                    </div>

                    <div className="h-44 flex items-end justify-between gap-2.5 pt-4 border-b border-[#e8ecf4] dark:border-zinc-800/60 pb-1 relative">
                      {/* Simulated Grid lines */}
                      <div className="absolute inset-x-0 top-1/4 border-t border-dashed border-[#e8ecf4]/60 dark:border-zinc-800/40 pointer-events-none" />
                      <div className="absolute inset-x-0 top-2/4 border-t border-dashed border-[#e8ecf4]/60 dark:border-zinc-800/40 pointer-events-none" />
                      <div className="absolute inset-x-0 top-3/4 border-t border-dashed border-[#e8ecf4]/60 dark:border-zinc-800/40 pointer-events-none" />

                      {chartData.map((bar, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative z-10">
                          <div className="w-full flex justify-center gap-1 items-end h-32">
                            <div 
                              style={{ height: `${bar.val}%` }} 
                              className="w-2 sm:w-3.5 bg-orange-500/20 group-hover:bg-orange-500/35 rounded-t-sm transition-all duration-300 relative" 
                            />
                            <div 
                              style={{ height: `${bar.val2}%` }} 
                              className="w-2 sm:w-3.5 bg-gradient-to-t from-orange-500 to-amber-400 group-hover:opacity-90 rounded-t-sm transition-all duration-300 shadow-sm" 
                            />
                          </div>
                          <span className="text-[9px] font-black text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors">
                            {bar.day}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Real-time Autopilot Activity Log */}
                  <div className="lg:col-span-4 bg-white dark:bg-zinc-950 border border-[#e8ecf4] dark:border-zinc-800/80 rounded-[20px] p-5 shadow-2xs">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                          Autopilot Feed
                        </h3>
                        <p className="text-[10px] text-zinc-400 font-bold mt-0.5">Live background processes</p>
                      </div>
                      <span className="text-[9px] font-black text-zinc-400">Last 7 days</span>
                    </div>

                    <div className="space-y-4 max-h-[190px] overflow-y-auto pr-1">
                      {dynamicActivities.map((act, idx) => (
                        <div key={idx} className="flex gap-3 text-left">
                          <div className="flex flex-col items-center">
                            <span className={`w-2 h-2 rounded-full ${act.color} mt-1`} />
                            {idx !== dynamicActivities.length - 1 && <span className="w-0.5 h-10 bg-slate-100 dark:bg-zinc-800 mt-1" />}
                          </div>
                          <div className="leading-tight">
                            <p className="text-[11px] font-black text-zinc-800 dark:text-zinc-200">{act.title}</p>
                            <p className="text-[10px] text-zinc-400 mt-0.5 font-medium">{act.desc}</p>
                            <span className="text-[9px] text-zinc-500 font-bold block mt-1">{act.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ─── ACTIVE TASKS AND AI COPILOT SECTION ─────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Task Manager Panel */}
                  <div className="lg:col-span-6 bg-white dark:bg-zinc-950 border border-[#e8ecf4] dark:border-zinc-800/80 rounded-[20px] p-5 shadow-2xs">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                        Task Management
                      </h3>
                      <span className="text-[9px] font-black text-orange-500 bg-orange-50 dark:bg-orange-950/20 px-2 py-0.5 rounded-full border border-orange-200/50">
                        {tasks.filter(t => !t.done).length} Active
                      </span>
                    </div>

                    {/* Task Add Form */}
                    <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
                      <input
                        type="text"
                        placeholder="Add a task checklist..."
                        value={newTaskText}
                        onChange={(e) => setNewTaskText(e.target.value)}
                        className="bg-slate-50 dark:bg-zinc-900/60 border border-[#e8ecf4] dark:border-zinc-800 focus:outline-none focus:border-orange-500 rounded-xl px-3.5 py-2 text-xs font-semibold text-zinc-800 dark:text-zinc-100 w-full placeholder-zinc-400"
                      />
                      <button type="submit" className="bg-orange-500 text-white px-3.5 rounded-xl hover:bg-orange-600 transition-all cursor-pointer shadow-md shadow-orange-500/25 flex items-center justify-center shrink-0">
                        <Plus size={16} />
                      </button>
                    </form>

                    {/* Task Items */}
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                            task.done 
                              ? 'border-transparent bg-slate-50/50 dark:bg-zinc-950/20 opacity-60' 
                              : 'border-[#e8ecf4] dark:border-zinc-800 bg-white dark:bg-zinc-900/40'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleTask(task.id)}
                              className={`w-4.5 h-4.5 rounded-lg border flex items-center justify-center transition-all ${
                                task.done 
                                  ? 'bg-orange-500 border-orange-500 text-white' 
                                  : 'border-slate-350 dark:border-zinc-700 hover:border-orange-500'
                              }`}
                            >
                              {task.done && <Check size={12} strokeWidth={3} />}
                            </button>
                            <span className={`text-[10px] font-semibold text-left ${task.done ? 'line-through text-zinc-500' : 'text-zinc-800 dark:text-zinc-200'}`}>
                              {task.text}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full ${
                              task.priority === 'high' ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-500 border border-rose-200/50' :
                              task.priority === 'medium' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-500 border border-amber-200/50' :
                              'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                            }`}>
                              {task.priority}
                            </span>
                            <button onClick={() => deleteTask(task.id)} className="text-zinc-400 hover:text-red-500 transition-colors p-1">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Active Clients & Quick Actions Card */}
                  <div className="lg:col-span-6 bg-white dark:bg-zinc-950 border border-[#e8ecf4] dark:border-zinc-800/80 rounded-[20px] p-5 shadow-2xs">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                          Active Client Directory
                        </h3>
                        <button 
                          onClick={() => navigate('/dashboard/customers')} 
                          className="text-[8px] font-black text-orange-500 uppercase hover:underline cursor-pointer tracking-wider"
                        >
                          (Manage)
                        </button>
                      </div>
                      <span className="text-[9px] font-black text-orange-500 bg-orange-50 dark:bg-orange-950/20 px-2 py-0.5 rounded-full border border-orange-200/50">
                        {customers.length} Clients
                      </span>
                    </div>

                    {/* Customers List Feed */}
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {customers.length === 0 ? (
                        <div className="h-36 flex flex-col items-center justify-center text-zinc-400 text-center space-y-2">
                          <Users size={28} className="opacity-40 text-orange-500" />
                          <p className="text-[10px] font-bold">No registered clients yet</p>
                          <button
                            onClick={() => navigate('/dashboard/customers')}
                            className="text-[9px] font-black uppercase tracking-wider text-orange-500 border border-orange-500/20 px-3 py-1.5 rounded-lg hover:bg-orange-500/5 cursor-pointer"
                          >
                            Add New Client
                          </button>
                        </div>
                      ) : (
                        customers.slice(0, 3).map((client, idx) => {
                          // Initials for avatar
                          const initials = client.name ? client.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'C';
                          const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500'];
                          const bg = colors[idx % colors.length];

                          return (
                            <div key={client.id || idx} className="flex items-center justify-between p-3 rounded-xl border border-[#e8ecf4] dark:border-zinc-800 bg-white dark:bg-zinc-900/40 transition-all hover:bg-slate-50 dark:hover:bg-zinc-950/20">
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-lg ${bg} text-white font-black text-[9px] flex items-center justify-center shrink-0`}>
                                  {initials}
                                </div>
                                <span className="text-[10px] font-semibold text-zinc-850 dark:text-zinc-200">
                                  {client.name} <span className="text-[9px] font-medium text-zinc-500 dark:text-zinc-400 ml-1.5">{client.business || 'Individual client'}</span>
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => navigate('/dashboard/email')}
                                  className="text-zinc-400 hover:text-orange-500 transition-colors p-1 cursor-pointer"
                                  title="Send Email"
                                >
                                  <Mail size={13} />
                                </button>
                                <button
                                  onClick={() => navigate('/dashboard/invoices')}
                                  className="text-zinc-400 hover:text-orange-500 transition-colors p-1 cursor-pointer"
                                  title="Create Invoice"
                                >
                                  <Receipt size={13} />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </>
            } />
            
            <Route path="/invoices" element={
              <InvoiceMaker user={user} onBack={() => navigate('/dashboard')} />
            } />

            <Route path="/invoice-history" element={
              <InvoiceHistory user={user} onBack={() => navigate('/dashboard')} />
            } />
            
            <Route path="/profile" element={
              <CompanyProfile user={user} onUpdate={(updated) => setUser(updated)} />
            } />
            
            <Route path="/customers" element={
              <Customers user={user} onBack={() => navigate('/dashboard')} />
            } />

            <Route path="/products" element={
              <Products user={user} onBack={() => navigate('/dashboard')} />
            } />

            <Route path="/tasks" element={
              <Tasks user={user} onBack={() => navigate('/dashboard')} />
            } />

            <Route path="/chat" element={
              <Chat user={user} onBack={() => navigate('/dashboard')} />
            } />

            <Route path="/analytics" element={
              <Analytics user={user} onBack={() => navigate('/dashboard')} />
            } />

            <Route path="/email" element={
              <Email user={user} onBack={() => navigate('/dashboard')} />
            } />

            <Route path="/team" element={
              <Team user={user} onBack={() => navigate('/dashboard')} />
            } />

            <Route path="/settings" element={
              <AccountSettings
                user={user}
                onUpdate={(updated) => setUser(prev => ({ ...prev, ...updated }))}
                isDark={isDark}
                toggleTheme={toggleTheme}
              />
            } />
          </Routes>
        </div>
      </main>

      {/* ─── RIGHT AI SIDEBAR PANEL (Collapsible Drawer) ─────────────────────── */}
      <aside className={`bg-white/95 dark:bg-black/90 backdrop-blur-xl border-l border-[#e8ecf4] dark:border-zinc-800/60 flex flex-col justify-between transition-all duration-300 z-40 ${
        aiPanelOpen ? 'w-80 border-l' : 'w-0 border-l-0 overflow-hidden'
      } h-full relative`}>
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[#e8ecf4] dark:border-zinc-800/50">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-orange-500 animate-pulse" />
            <span className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">Gemini Assistant</span>
          </div>
          <button
            onClick={() => setAiPanelOpen(false)}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-650 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-left">
          {chatMessages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-2.5 px-3 text-[10px] leading-relaxed font-semibold shadow-2xs ${
                msg.role === 'user'
                  ? 'bg-orange-500 text-white rounded-br-none'
                  : 'bg-slate-100 dark:bg-zinc-800/60 border border-slate-200/40 dark:border-zinc-850 text-zinc-800 dark:text-zinc-200 rounded-bl-none'
              }`}>
                {formatMarkdown(msg.content)}
              </div>
            </div>
          ))}
          {aiThinking && (
            <div className="flex justify-start">
              <div className="bg-slate-100 dark:bg-zinc-800/60 border border-slate-200/40 dark:border-zinc-850 text-zinc-500 rounded-2xl rounded-bl-none p-2.5 px-3 text-[10px] flex items-center gap-1.5">
                <RefreshCw className="animate-spin text-orange-500" size={12} />
                <span>Gemini is thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Suggested Questions */}
        <div className="px-4 py-2 border-t border-[#e8ecf4] dark:border-zinc-800/40 bg-slate-50/50 dark:bg-zinc-950/20 text-left">
          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-2">Suggested Prompts</span>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            {[
              'How much profit this month?',
              'Show low stock products',
              'Create B2B GST invoice',
              'Summarize today\'s business',
              'Write customer email draft'
            ].map(q => (
              <button
                key={q}
                onClick={() => handleSendAiMessage(q)}
                className="text-[9px] font-bold border border-[#e8ecf4] dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-orange-500 dark:hover:text-zinc-200 rounded-lg px-2 py-1 transition-all cursor-pointer hover:border-orange-500/30"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input area */}
        <div className="p-3 border-t border-[#e8ecf4] dark:border-[#e8ecf4]/20 bg-white dark:bg-zinc-900/20">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendAiMessage(); }}
            className="flex items-center gap-2 bg-slate-100 dark:bg-zinc-950/40 border border-[#e8ecf4] dark:border-zinc-850 px-3 py-1.5 rounded-xl"
          >
            <input
              type="text"
              placeholder="Ask anything..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="bg-transparent border-none outline-none focus:ring-0 text-xs w-full text-zinc-800 dark:text-zinc-100 placeholder-zinc-400"
            />
            <button type="button" className="p-1 text-zinc-400 hover:text-zinc-650 cursor-pointer">
              <Mic size={14} />
            </button>
            <button type="submit" className="p-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all cursor-pointer shadow-md shadow-orange-500/25 flex items-center justify-center">
              <Send size={12} />
            </button>
          </form>
        </div>
      </aside>

      {/* ─── FLOATING AI COPILOT BUTTON ────────────────────────────────────────── */}
      {!aiPanelOpen && (
        <button
          onClick={() => setAiPanelOpen(true)}
          className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:scale-105 transition-all duration-300 text-white flex items-center justify-center shadow-xl shadow-orange-500/25 z-40 cursor-pointer"
          title="Open AI Assistant"
        >
          <Sparkles size={20} className="animate-pulse" />
        </button>
      )}

      {/* ─── DEVICES MODAL ──────────────────────────────────────────────────────── */}
      {showDevicesModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 max-w-md w-full text-left space-y-5 shadow-2xl relative overflow-hidden">
            <div>
              <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">Active Sessions & Devices</h3>
              <p className="text-2xs text-zinc-500 mt-1">Manage active workspace sessions. Logging out a device will instantly terminate its login session.</p>
            </div>
            
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {user.activeSessions && user.activeSessions.map((session) => (
                <div key={session.id} className="p-3 bg-slate-50/50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-900 rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-extrabold text-zinc-800 dark:text-zinc-250 flex items-center gap-1.5">
                      <span>{session.os || 'Unknown OS'}</span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold">({session.browser || 'Unknown Browser'})</span>
                    </h4>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold">IP: {session.ipAddress || 'Unknown'}</p>
                  </div>
                  
                  {session.isCurrent ? (
                    <span className="text-[9px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">Current</span>
                  ) : (
                    <button
                      onClick={() => handleEvictSession(session.id)}
                      disabled={evictingSession === session.id}
                      className="p-1.5 hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50 text-zinc-400 dark:text-zinc-500 rounded-lg transition-all cursor-pointer border border-transparent hover:border-red-500/20"
                      title="Logout Device"
                    >
                      {evictingSession === session.id ? (
                        <RefreshCw size={12} className="animate-spin text-orange-500" />
                      ) : (
                        <LogOut size={12} />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex justify-end pt-1">
              <button
                onClick={() => setShowDevicesModal(false)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}