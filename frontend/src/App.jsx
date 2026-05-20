import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { BACKEND_URL } from './config/api';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import ForgotPassword from './pages/ForgotPassword';
import CreatePassword from './pages/CreatePassword';
import './App.css';

function Layout({ theme, setTheme }) {
  return (
    <div className="transition-theme min-h-screen relative overflow-hidden bg-white dark:bg-black text-slate-900 dark:text-slate-100">
      
      {/* Absolute Background Grid Layer with Mask */}
      <div className="bg-grid-pattern fixed-grid" />
      <div className="bg-grid-pattern-blurred fixed-grid" />
      
      {/* Background Glowing Ambient Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-sky-500/6 dark:bg-sky-500/6 blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute top-[40%] left-[-20%] w-[60vw] h-[60vw] rounded-full bg-indigo-500/4 dark:bg-indigo-500/4 blur-[150px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-cyan-500/4 dark:bg-cyan-500/4 blur-[120px] pointer-events-none animate-pulse-glow" />

      {/* Navbar Component */}
      <Navbar theme={theme} setTheme={setTheme} />

      {/* Main Page Content */}
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto flex flex-col gap-16">
        <Outlet />
      </main>

      {/* EXPANDED FOOTER */}
      <footer className="border-t border-slate-100 dark:border-slate-900 pt-16 pb-12 bg-slate-50/50 dark:bg-black/50 relative z-10 transition-colors duration-300 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-12">
            {/* Brand details */}
            <div className="lg:col-span-2 flex flex-col gap-5">
              <div className="flex items-center gap-2">
                <img 
                  src="/logos/Logo (MAIN).png" 
                  alt="MediGrid Logo" 
                  className="h-6 w-auto object-contain"
                />
                <span className="font-bold text-sm tracking-tight text-slate-800 dark:text-white">
                  MediGrid
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
                Next-generation medical coordination mesh automating patient routing, slot allocation, and directory interoperability for multi-facility clinical systems.
              </p>
              {/* HIPAA Security badge style */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-sky-500/10 bg-sky-500/5 text-sky-500 text-[10px] font-bold w-fit">
                <ShieldCheck className="h-3.5 w-3.5" />
                HIPAA COMPLIANT & SECURE
              </div>
            </div>

            {/* Link column 1 */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-4">Product</h4>
              <ul className="flex flex-col gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                <li><a href="#features" className="hover:text-sky-500 transition-colors">Features Grid</a></li>
                <li><a href="#triage" className="hover:text-sky-500 transition-colors">Live Routing</a></li>
                <li><a href="#integrations" className="hover:text-sky-500 transition-colors">EMR Connectors</a></li>
                <li><a href="#pricing" className="hover:text-sky-500 transition-colors">Enterprise Pricing</a></li>
              </ul>
            </div>

            {/* Link column 2 */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-4">Resources</h4>
              <ul className="flex flex-col gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                <li><a href="#docs" className="hover:text-sky-500 transition-colors">API Docs</a></li>
                <li><a href="#security" className="hover:text-sky-500 transition-colors">Security Whitepaper</a></li>
                <li><a href="#compliance" className="hover:text-sky-500 transition-colors">HIPAA Standards</a></li>
                <li><a href="#status" className="hover:text-sky-500 transition-colors">Network Status</a></li>
              </ul>
            </div>

            {/* Newsletter Column */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-4">Newsletter</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3.5 leading-relaxed">
                Stay updated with latest care orchestration releases.
              </p>
              <form className="flex gap-1.5" onSubmit={(e) => e.preventDefault()}>
                <input 
                  type="email" 
                  placeholder="name@clinic.com"
                  className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 w-full"
                />
                <button 
                  type="submit"
                  className="px-3 py-2 text-xs font-bold text-white bg-sky-500 hover:bg-sky-400 rounded-lg transition-colors shrink-0"
                >
                  Join
                </button>
              </form>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="border-t border-slate-100 dark:border-slate-900/60 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              © 2026 MediGrid Healthcare Infrastructure Systems. All rights reserved. Registered under HIPAA.
            </p>
            <div className="flex gap-4 text-[11px] text-slate-400 dark:text-slate-500">
              <a href="#privacy" className="hover:text-sky-500 transition-colors">Privacy Policy</a>
              <a href="#terms" className="hover:text-sky-500 transition-colors">Terms of Service</a>
              <a href="#hipaa" className="hover:text-sky-500 transition-colors">HIPAA Shield</a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}

// ─── Route Guard Components ───────────────────────────────────────────────────

function GuestRoute({ children }) {
  const token = localStorage.getItem('authToken');
  const onboardingCompleted = localStorage.getItem('onboardingCompleted') === 'true';
  if (token) {
    if (!onboardingCompleted) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function OnboardingGuard({ children }) {
  const token = localStorage.getItem('authToken');
  const onboardingCompleted = localStorage.getItem('onboardingCompleted') === 'true';

  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (!onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
}

function App() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme;
      return 'dark';
    }
    return 'dark';
  });

  // Sync theme with HTML element
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Sync onboarding status from backend on boot
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    
    fetch(`${BACKEND_URL}/api/health-profile/status`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => {
      if (res.status === 401) {
        localStorage.clear();
        window.location.href = '/login';
      }
      return res.json();
    })
    .then(data => {
      if (data && data.success) {
        localStorage.setItem('onboardingCompleted', String(data.onboardingCompleted || false));
        if (data.profile) {
          localStorage.setItem('healthProfile', JSON.stringify(data.profile));
        }
      }
    })
    .catch(err => console.error('Error syncing onboarding status:', err));
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout theme={theme} setTheme={setTheme} />}>
          <Route index element={<Home />} />
        </Route>
        
        {/* Guest only routes */}
        <Route path="/login" element={<GuestRoute><SignIn theme={theme} setTheme={setTheme} /></GuestRoute>} />
        <Route path="/signup" element={<GuestRoute><SignUp theme={theme} setTheme={setTheme} /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPassword theme={theme} setTheme={setTheme} /></GuestRoute>} />

        {/* Protected password setup route for OAuth users */}
        <Route path="/create-password" element={<ProtectedRoute><CreatePassword /></ProtectedRoute>} />

        {/* Onboarding Wizard - must be logged in */}
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding theme={theme} setTheme={setTheme} /></ProtectedRoute>} />

        {/* Dashboard routes - protected by onboarding guard */}
        <Route path="/dashboard" element={<OnboardingGuard><Dashboard theme={theme} setTheme={setTheme} /></OnboardingGuard>} />
        <Route path="/dashboard/:tab" element={<OnboardingGuard><Dashboard theme={theme} setTheme={setTheme} /></OnboardingGuard>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
