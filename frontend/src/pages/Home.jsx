import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Activity, 
  Calendar, 
  Shield, 
  Zap, 
  TrendingUp, 
  Clock, 
  ArrowRight, 
  ChevronDown, 
  Users, 
  Building, 
  ShieldCheck,
  Sparkles,
  FileText,
  AlertTriangle,
  Pill,
  MapPin,
  Heart,
  Moon,
  Droplets,
  Flame,
  Check
} from 'lucide-react';
import heroImg from '../assets/hero.png';
import { LOGO_BASE64 } from '../components/logoBase64';
import { BACKEND_URL } from '../config/api';

function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [liveLatency, setLiveLatency] = useState(88);
  const [routedToday, setRoutedToday] = useState(12842);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [profileEmail, setProfileEmail] = useState('');
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const email = localStorage.getItem('userEmail') || '';
    setIsLoggedIn(!!token);
    setProfileEmail(email);
    setProfileName(localStorage.getItem('userName') || '');
    setIsPremium(localStorage.getItem('isPremium') === 'true');

    if (email) {
      fetch(`${BACKEND_URL}/api/user/profile`, {
        headers: { 'x-user-email': email }
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          const premiumStatus = !!data.user.isPremium;
          setIsPremium(premiumStatus);
          localStorage.setItem('isPremium', String(premiumStatus));
          if (data.user.name || data.user.fullName) {
            setProfileName(data.user.name || data.user.fullName);
          }
          if (data.user.phone) {
            setProfilePhone(data.user.phone);
          }
        }
      })
      .catch(err => console.error("Error fetching user profile:", err));
    }
  }, []);

  // Smooth scroll handler for landing page anchors and returning to top
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else if (location.pathname === '/') {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  }, [location]);

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
            alert("Congratulations! Your account has been upgraded to Premium successfully.");
            navigate('/dashboard/overview');
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

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveLatency(prev => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        return Math.min(95, Math.max(82, prev + delta));
      });
      setRoutedToday(prev => prev + Math.floor(Math.random() * 2) + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const stats = [
    { value: '99.8%', label: 'Analysis Accuracy', icon: ShieldCheck },
    { value: '2.5x', label: 'Goal Progression', icon: Zap },
    { value: '25k+', label: 'Daily Vitals Logged', icon: Activity },
  ];

  const features = [
    {
      title: 'AI Health Planner Autopilot',
      description: 'Configure and activate personalized wellness goals. Gemini AI generates custom daily diet recommendations, fitness targets, and hydration checkpoints tailored directly to your vitals.',
      icon: Sparkles,
      color: 'from-sky-500/10 to-indigo-500/5',
    },
    {
      title: 'Lab Report PDF Analyzer',
      description: 'Upload clinical lab reports or diagnostic PDFs. Our intelligent parser maps biological markers, evaluates key metrics, and flags high-risk values (Green/Yellow/Red) instantly.',
      icon: FileText,
      color: 'from-cyan-500/10 to-sky-500/5',
    },
    {
      title: 'Symptom Diagnostic Engine',
      description: 'Engage with our AI-driven clinical reasoning chat interface to evaluate symptoms, screen health indicators, and receive guided directions for provider consultation.',
      icon: Heart,
      color: 'from-emerald-500/10 to-teal-500/5',
    },
    {
      title: 'Unified Health Telemetry',
      description: 'Log and monitor daily biometric telemetry—heart rate, blood pressure, blood glucose levels, sleep logs, and water intake—visualized on an interactive metric index.',
      icon: Activity,
      color: 'from-blue-500/10 to-cyan-500/5',
    },
    {
      title: 'Emergency SOS Broadcast',
      description: 'Broadcast your live GPS coordinates, alert designated emergency contacts via SMS warnings, and execute automatic EMR logs scan for clinical anomalies.',
      icon: AlertTriangle,
      color: 'from-rose-500/10 to-red-500/5',
    },
    {
      title: 'Clinical Medicine Store',
      description: 'Browse prescription and wellness medications, access diagnostic reviews, and buy securely using Razorpay sandboxed gateways with a flat 20% Premium discount.',
      icon: Pill,
      color: 'from-amber-500/10 to-orange-500/5',
    },
    {
      title: 'Gemini Coaching Chatbot',
      description: 'Consult our conversational AI health assistant to ask clarifying questions about your telemetry history, habits progression, or personalized coaching guides.',
      icon: Sparkles,
      color: 'from-indigo-500/10 to-purple-500/5',
    },
    {
      title: 'Nearby Care Locators',
      description: 'Instantly view hospital coordinates, calculate real-time driving distances, and coordinate immediate emergency calls to local medical care networks.',
      icon: MapPin,
      color: 'from-teal-500/10 to-emerald-500/5',
    },
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Complete Onboarding',
      description: 'Input your core metrics, diet parameters, daily sleep goals, and target hydration inputs to initialize your health profile.',
    },
    {
      step: '02',
      title: 'Sync Your AI Plan',
      description: 'Activate automated checklist tasks for custom fitness and nutrition recommendations based on your telemetry targets.',
    },
    {
      step: '03',
      title: 'Track and Consult',
      description: 'Log daily vitals, scan laboratory PDF documents, order medications, and consult the AI coach on autopilot.',
    },
  ];

  const testimonials = [
    {
      quote: "The PDF Report Analyzer parsed my blood test results instantly, highlighting key warning flags that I was able to discuss with my doctor. Truly state-of-the-art.",
      author: "Aarav Mehta",
      role: "Premium Member since 2025",
    },
    {
      quote: "Having the Emergency SOS button automatically link to my EMR history and broadcast my coordinates gives my family absolute peace of mind.",
      author: "Emily Henderson",
      role: "Chronic Care Patient",
    },
  ];

  const faqs = [
    {
      question: "How does the AI Health Planner build recommendations?",
      answer: "MediGrid uses advanced Gemini models to evaluate your onboarding metrics, diet preferences, and daily vitals log. It then structures optimized target guidelines for calorie intake, sleep, hydration, and exercise.",
    },
    {
      question: "Is my medical data secure and private?",
      answer: "Yes. MediGrid encrypts all Protected Health Information (PHI) in transit and at rest, aligning strictly with industry-standard HIPAA privacy and security controls.",
    },
    {
      question: "How does the Report Analyzer extract clinical markers?",
      answer: "When you upload a lab report PDF or image, our built-in OCR and AI models process the text, mapping biological coordinates (like glucose or cholesterol) to standard reference ranges and flag anomalous results.",
    },
    {
      question: "Can I manage payments and orders?",
      answer: "Yes, the integrated Medicine Store allows users to order prescription medicines and check out securely using Razorpay sandboxed processing with integrated Premium benefits.",
    },
  ];

  return (
    <>
      {/* HERO SECTION */}
      <section id="home" className="flex flex-col items-center justify-center text-center pt-6 pb-8 min-h-[calc(100vh-140px)] relative">
        {/* Centered Glowing Status Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-sky-500/10 dark:bg-sky-500/10 text-sky-500 border border-sky-500/20 mb-4 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
          <span>MediGrid Personal AI OS is officially live</span>
        </div>

        {/* Centered Headline */}
        <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] mb-6 max-w-4xl text-slate-900 dark:text-white">
          Your Intelligent <br />
          <span className="bg-gradient-to-r from-sky-400 via-sky-500 to-indigo-500 bg-clip-text text-transparent">
            Personal Health Assistant
          </span>
        </h1>

        {/* Centered Description */}
        <p 
          style={{ marginBottom: '52px' }}
          className="text-base sm:text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed"
        >
          MediGrid synchronizes your daily vitals, parses clinical reports, builds custom health planners, and secures your wellness goals on autopilot.
        </p>

        {/* Centered Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center w-full max-w-md">
          <Link
            to="/signup"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-base font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 shadow-md shadow-sky-500/20 dark:shadow-sky-500/10 hover:shadow-sky-500/30 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
          >
            Get MediGrid Premium
          </Link>
          <a
            href="#features"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-base font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-all duration-300"
          >
            Explore Features
          </a>
        </div>
      </section>

      <div className="section-divider" />

      {/* ABOUT US SECTION */}
      <section id="about-us" className="scroll-mt-24 text-left">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-sm font-bold text-sky-500 dark:text-sky-400 uppercase tracking-widest block mb-3">
              About Our Vision
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-6 text-slate-800 dark:text-white">
              Unifying Clinical Telemetry and AI Health Coaching
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              MediGrid is engineered to resolve the functional disconnect in personal health management. Vitals are often scattered, lab PDFs sit unread, and custom fitness and diet plans require tedious manual entry.
            </p>
            <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              Our clinical operating system automates telemetry logs, matching daily parameters directly to smart Gemini targets, warning flags, and sandboxed medicine delivery scripts on autopilot.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 mt-6">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500 shrink-0">
                  <Building className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">Unified Health Hub</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Integrates reports, vitals, SOS, and store.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500 shrink-0">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">HIPAA Compliant</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Rest assured with end-to-end PHI encryption.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Showcase Image or Graphical Metric */}
          <div className="p-8 rounded-3xl border border-sky-500/25 dark:border-sky-500/15 bg-slate-50/50 dark:bg-slate-950/20 relative overflow-hidden flex flex-col justify-between items-center glass-card glow-border-card h-[400px]">
            <div className="absolute inset-0 bg-grid-pattern opacity-10" />
            
            {/* Header Details */}
            <div className="w-full flex items-center justify-between relative z-10 text-xs">
              <span className="flex items-center gap-1.5 font-bold text-sky-500 dark:text-sky-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                CLINICAL OS: SYNCHRONIZED
              </span>
              <span className="font-mono text-slate-400 dark:text-slate-500">
                SECURE MESH (HIPAA)
              </span>
            </div>

            {/* Live Routing Console Dashboard */}
            <div className="relative z-10 w-full max-w-[440px] flex-grow flex flex-col justify-center gap-2.5 my-4">
              <div className="flex flex-col gap-2 bg-slate-100/40 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-4.5 font-mono text-[11px] text-left">
                <div className="flex justify-between items-center text-slate-400 dark:text-slate-500 border-b border-slate-200/50 dark:border-slate-800/50 pb-2 mb-1.5 font-bold tracking-wider">
                  <span>VITAL TELEMETRY LOGS</span>
                  <span>STATUS</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-700 dark:text-slate-300">GLUCOSE: 95 mg/dL</span>
                  <span className="text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[10px]">NORMAL</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-700 dark:text-slate-300">BLOOD PRESSURE: 120/80</span>
                  <span className="text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[10px]">NORMAL</span>
                </div>
                <div className="flex justify-between items-center py-1 animate-pulse">
                  <span className="text-slate-700 dark:text-slate-300">HEART RATE: 72 BPM</span>
                  <span className="text-sky-500 font-bold bg-sky-500/10 px-2 py-0.5 rounded text-[10px]">EXCELLENT</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-700 dark:text-slate-300">BLOOD OXYGEN (SPO2): 99%</span>
                  <span className="text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[10px]">STABLE</span>
                </div>
              </div>
            </div>

            {/* Bottom Metrics Bar */}
            <div className="w-full grid grid-cols-2 gap-4 border-t border-slate-200/50 dark:border-slate-800/50 pt-4 relative z-10 font-mono">
              <div className="text-left">
                <div className="text-[10px] text-slate-400 dark:text-slate-500">HEALTH INDEX SCORE</div>
                <div className="text-base font-bold text-sky-500 dark:text-sky-400 tracking-tight transition-all duration-300">
                  {liveLatency}%
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 dark:text-slate-500">VITALS TRACKED</div>
                <div className="text-base font-bold text-indigo-500 dark:text-indigo-400 tracking-tight transition-all duration-300">
                  {routedToday.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* FEATURES BENTO GRID SECTION */}
      <section id="features" className="scroll-mt-24 text-left">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-bold text-sky-500 dark:text-sky-400 uppercase tracking-widest block mb-3">
            Platform Features
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white">
            Advanced Tools Built for Precision Care
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feat, i) => (
            <div
              key={i}
              className="p-6 sm:p-8 rounded-3xl backdrop-blur-sm transition-all duration-300 glass-card glow-border-card group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feat.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{feat.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">{feat.description}</p>

              </div>
              <div className="mt-8 flex items-center gap-1.5 text-xs font-bold text-sky-500 dark:text-sky-400 cursor-pointer hover:underline">
                Learn more
                <ArrowRight className="h-3 w-3" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="scroll-mt-24 text-left">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-bold text-sky-500 dark:text-sky-400 uppercase tracking-widest block mb-3">
            Process Mesh
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white">
            Integration in Three Steps
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {workflowSteps.map((step, i) => (
            <div 
              key={i} 
              className="flex flex-col items-start relative z-10 glass-card p-6 sm:p-8 rounded-3xl glow-border-card transition-all duration-300 hover:scale-[1.02] flex-grow"
            >
              <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-950 border border-sky-400 text-sky-500 font-black text-base flex items-center justify-center mb-6 shadow-md shadow-sky-500/10 timeline-dot">
                {step.step}
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3">{step.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      {/* PRICING SECTION */}
      <section id="pricing" className="scroll-mt-24 text-left">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-bold text-sky-500 dark:text-sky-400 uppercase tracking-widest block mb-3">
            Pricing Plans
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white">
            Choose the Perfect Plan for Your Health
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-3">
            Start with our complete free plan or unlock premium benefits with exclusive prescription savings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {/* Free Plan Card */}
          <div className="p-8 rounded-3xl backdrop-blur-sm relative flex flex-col justify-between glass-card border border-sky-500/10 dark:border-sky-500/5 transition-all duration-300 hover:scale-[1.02] flex-grow">
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Free Starter</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Essential personal health tracking</p>
              </div>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-extrabold text-slate-800 dark:text-white">₹0</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">/ forever</span>
              </div>

              <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2.5">
                  <Check className="h-4.5 w-4.5 text-sky-500 shrink-0 mt-0.5" />
                  <span>Basic AI Health Report Analysis (3 reports/month)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4.5 w-4.5 text-sky-500 shrink-0 mt-0.5" />
                  <span>Core Vitals & Telemetry Log</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4.5 w-4.5 text-sky-500 shrink-0 mt-0.5" />
                  <span>Standard SOS Emergency Alerts</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4.5 w-4.5 text-sky-500 shrink-0 mt-0.5" />
                  <span>Community Support</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-800/50">
              {isLoggedIn ? (
                <button
                  disabled
                  className="w-full py-3 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500 text-center cursor-not-allowed border border-slate-200 dark:border-slate-800"
                >
                  {isPremium ? "Free Plan" : "Current Plan"}
                </button>
              ) : (
                <Link
                  to="/signup"
                  className="w-full block py-3 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-center transition-colors duration-200"
                >
                  Get Started Free
                </Link>
              )}
            </div>
          </div>

          {/* Premium Plan Card */}
          <div className={`p-8 rounded-3xl backdrop-blur-sm relative flex flex-col justify-between glass-card transition-all duration-300 hover:scale-[1.02] flex-grow shadow-lg ${isPremium ? 'border-4 border-amber-400 shadow-amber-400/10' : 'border-2 border-sky-500/30'}`} style={isPremium ? { borderColor: '#fbbf24' } : {}}>
            {/* Top Accent Badge */}
            <div className="absolute -top-3 right-6 bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-extrabold text-[10px] tracking-wider uppercase px-3 py-1 rounded-full shadow-md">
              Most Popular
            </div>

            <div>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-1.5">
                  MediGrid Premium
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Complete healthcare synchronization suite</p>
              </div>

              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-extrabold text-slate-800 dark:text-white">₹499</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">/ one-time</span>
              </div>
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 mb-6">
                <Pill className="h-3 w-3 shrink-0" />
                <span>Flat 20% OFF on Medicines</span>
              </div>

              <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2.5">
                  <Check className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                  <span className="font-semibold text-slate-700 dark:text-slate-200">20% Off on Medicines (Razorpay Checkouts)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                  <span>Unlimited AI Lab Report PDF Analysis</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                  <span>Full AI Health Planner Sync (Autopilot)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                  <span>Live Vitals Telemetry & Biometrics Analytics</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                  <span>VIP SOS Broadcast & Direct Care Integration</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-800/50">
              {isPremium ? (
                <button
                  disabled
                  className="w-full py-3 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-center cursor-not-allowed"
                >
                  You have already subscribed
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (!isLoggedIn) {
                      navigate('/login');
                    } else {
                      handleUpgradePayment();
                    }
                  }}
                  className="w-full py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 shadow-md shadow-amber-500/20 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  Upgrade to Premium
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* TESTIMONIALS SECTION */}
      <section id="testimonials" className="scroll-mt-24 text-left">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-bold text-sky-500 dark:text-sky-400 uppercase tracking-widest block mb-3">
            Success Stories
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white">
            Trusted by Leading Clinical Operators
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((t, i) => (
            <div 
              key={i} 
              className="p-8 rounded-3xl backdrop-blur-sm shadow-sm relative flex flex-col justify-between glass-card glow-border-card"
            >
              <div className="flex justify-between items-center mb-6">
                <span className="text-4xl font-serif text-sky-500/20 leading-none">“</span>
                <div className="flex gap-0.5 text-amber-400">
                  {[...Array(5)].map((_, starIdx) => (
                    <svg key={starIdx} className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-base italic text-slate-700 dark:text-slate-300 mb-8 leading-relaxed relative z-10">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3 border-t border-slate-200/50 dark:border-slate-800/50 pt-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white font-extrabold text-sm uppercase">
                  {t.author.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm">{t.author}</h4>
                  <p className="text-xs text-sky-500 dark:text-sky-400 font-semibold mt-0.5">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      {/* FAQ SECTION */}
      <section id="faq" className="scroll-mt-24 text-left">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          <div className="lg:col-span-5 text-left">
            <span className="text-sm font-bold text-sky-500 dark:text-sky-400 uppercase tracking-widest block mb-3">
              Help & Support
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Have questions about EMR integrations, licensing configurations, or compliance details? Connect with our grid deployment support teams.
            </p>
          </div>

          <div className="lg:col-span-7 flex flex-col gap-4">
            {faqs.map((faq, i) => {
              const isOpen = openFaqIndex === i;
              return (
                <div
                  key={i}
                  className={`rounded-2xl transition-all duration-300 glass-card ${isOpen ? 'border-sky-500/40 dark:border-sky-500/30' : 'border-sky-500/10'}`}
                >
                  <button
                    onClick={() => toggleFaq(i)}
                    className="w-full flex items-center justify-between p-5 text-left font-semibold text-slate-800 dark:text-slate-200 hover:text-sky-500 dark:hover:text-sky-400 transition-colors focus:outline-none"
                  >
                    <span className="text-sm sm:text-base">{faq.question}</span>
                    <ChevronDown 
                      className={`h-4.5 w-4.5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-sky-500' : ''}`} 
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-0 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-200/50 dark:border-slate-800/50 mt-2 pt-4 animate-in fade-in duration-200">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      <div className="section-divider" />

      {/* FOUNDER SPOTLIGHT SECTION */}
      <section id="founder" className="scroll-mt-24 text-left">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16 items-center">
          
          {/* Left Column: Image wrapper with gradient aura */}
          <div className="md:col-span-5 flex justify-center">
            <div className="relative group">
              {/* Premium Gradient Aura backdrop (enhanced color intensity & pulse glow) */}
              <div className="absolute -inset-2.5 rounded-[36px] bg-gradient-to-tr from-sky-400 via-emerald-400 to-indigo-500 opacity-45 blur-2xl group-hover:opacity-75 transition duration-1000 group-hover:duration-300 animate-pulse-glow" />
              
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 lg:w-80 lg:h-80 rounded-[32px] overflow-hidden border border-slate-200/55 dark:border-slate-800/55 bg-slate-100 dark:bg-slate-900 shadow-2xl flex items-center justify-center p-1.5">
                <img 
                  src="/founder/Photo.png" 
                  alt="Gaurav Goswami - Founder" 
                  className="w-full h-full object-cover rounded-[26px] transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Bio details and Interactive socials */}
          <div className="md:col-span-7 space-y-6">
            <div>
              <span className="text-sm font-black text-sky-500 dark:text-sky-400 uppercase tracking-widest block mb-2">
                Creator & Architect
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-850 dark:text-white tracking-tight mb-2">
                Gaurav Goswami
              </h2>
              <p className="text-sm sm:text-base font-extrabold bg-gradient-to-r from-sky-500 via-emerald-500 to-indigo-500 bg-clip-text text-transparent select-none">
                MERN Stack & GenAI Developer
              </p>
            </div>

            <p className="text-slate-600 dark:text-slate-350 text-sm sm:text-base leading-relaxed max-w-2xl font-medium">
              As a developer specializing in MERN Stack and Generative AI integrations, Gaurav Goswami engineered MediGrid with a vision to automate clinical coordination meshes. By combining secure data exchange protocols (HIPAA-compliant principles) with cutting-edge LLM-driven intelligence, he created a premium care orchestration layer that simplifies routing, diagnostics, and patient triage pipelines.
            </p>

            <div className="flex flex-wrap gap-3.5 pt-2">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300 font-bold text-xs hover:text-slate-900 dark:hover:text-white hover:border-slate-400 hover:bg-slate-400/5 transition-all duration-300 hover:scale-[1.02] shadow-sm cursor-pointer"
              >
                <svg className="h-4 w-4 text-slate-600 dark:text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span>GitHub</span>
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl border border-blue-500/20 dark:border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400 font-bold text-xs hover:text-blue-500 hover:border-blue-500/50 hover:bg-blue-500/10 transition-all duration-300 hover:scale-[1.02] shadow-sm cursor-pointer"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                <span>LinkedIn</span>
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl border border-pink-500/20 dark:border-pink-500/20 bg-pink-500/5 text-pink-600 dark:text-pink-400 font-bold text-xs hover:text-pink-500 hover:border-pink-500/50 hover:bg-pink-500/10 transition-all duration-300 hover:scale-[1.02] shadow-sm cursor-pointer"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
                <span>Instagram</span>
              </a>
              <a 
                href="#" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl border border-emerald-500/20 dark:border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 font-bold text-xs hover:text-emerald-500 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all duration-300 hover:scale-[1.02] shadow-sm cursor-pointer"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                <span>Portfolio</span>
              </a>
            </div>
          </div>

        </div>
      </section>
    </>
  );
}

export default Home;
