import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Check, Activity, Sun, Moon, Loader2, Sparkles } from 'lucide-react';
import { launchOAuthPopup } from '../utils/oauthHelper';
import { getHealthProfileStatus } from '../utils/healthProfileApi';
import { BACKEND_URL } from '../config/api';

const BACKEND = BACKEND_URL;

const CLIENT_IDS = {
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  githubClientId: import.meta.env.VITE_GITHUB_CLIENT_ID,
  microsoftClientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID
};

const SignIn = ({ theme, setTheme }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeProvider, setActiveProvider] = useState(null);

  const toggleTheme = () => {
    if (setTheme) setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const saveSession = async (data, providerName) => {
    if (data.token) localStorage.setItem('authToken', data.token);
    if (data.user?.email) localStorage.setItem('userEmail', data.user.email);
    if (data.user?.name || data.user?.fullName)
      localStorage.setItem('userName', data.user.name || data.user.fullName);
    if (data.user?.profilePicture) localStorage.setItem('userPicture', data.user.profilePicture);
    if (data.user?.authProvider) localStorage.setItem('authProvider', data.user.authProvider);

    // Save onboarding status locally
    localStorage.setItem('onboardingCompleted', String(data.user?.onboardingCompleted || false));

    const displayName = data.user?.name || data.user?.fullName || 'User';
    setSuccessToast(`Welcome back, ${displayName}! Signed in via ${providerName}.`);

    setTimeout(() => {
      if (data.needsPassword) {
        navigate('/create-password');
      } else if (!data.user?.onboardingCompleted) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    }, 1200);
  };

  // ── Email / Password login ──────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        saveSession(data, 'Email');
      } else {
        setErrorMsg(data.error || 'Login failed. Please check your credentials.');
        setLoading(false);
      }
    } catch (err) {
      console.error('[login]', err);
      setErrorMsg('Unable to connect to server. Please check your internet connection.');
      setLoading(false);
    }
  };

  // ── Social OAuth login ──────────────────────────────────────────────────────
  const handleSocialAuth = async (provider) => {
    setErrorMsg('');
    setActiveProvider(provider);
    setLoading(true);

    try {
      // Step 1: Launch popup and wait for OAuth redirect
      const result = await launchOAuthPopup(provider, CLIENT_IDS);

      // Step 2: Send the credential to the backend
      let res, data;

      if (provider === 'GitHub') {
        // Authorization Code flow — send code to backend for server-side exchange
        res = await fetch(`${BACKEND}/api/auth/github/callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: result.value })
        });
      } else {
        // Implicit/Token flow — send access_token to backend for verification
        res = await fetch(`${BACKEND}/api/auth/social-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider, token: result.value })
        });
      }

      data = await res.json();

      if (res.ok && data.success) {
        saveSession(data, provider);
      } else {
        setErrorMsg(data.error || `${provider} sign-in failed. Please try again.`);
        setLoading(false);
      }
    } catch (err) {
      // err.message comes from launchOAuthPopup (cancelled, timeout, etc.)
      setErrorMsg(err.message || `${provider} sign-in failed.`);
      setLoading(false);
    } finally {
      setActiveProvider(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#030303] text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans transition-colors duration-300">

      {/* Success Toast */}
      {successToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs shadow-2xl shadow-emerald-500/30 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300">
          <Sparkles className="h-4 w-4 text-emerald-200 animate-pulse" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e915_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e915_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="absolute top-[20%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-sky-500/5 blur-[120px] pointer-events-none" />

      {/* Card */}
      <div className="relative w-full max-w-[1100px] min-h-[500px] grid grid-cols-1 md:grid-cols-12 rounded-[28px] overflow-hidden border border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#090b0d]/90 shadow-2xl shadow-sky-500/10 transition-colors duration-300 z-10">
        <div className="absolute inset-0 rounded-[28px] pointer-events-none border border-sky-500/20" />

        {/* Left Column */}
        <div className="hidden md:flex md:col-span-5 bg-slate-100/90 dark:bg-[#0e1115] p-6 md:p-8 flex-col justify-between border-r border-slate-200 dark:border-slate-800/60 relative overflow-hidden transition-colors duration-300">
          <div className="absolute -left-[30%] -top-[30%] w-[80%] h-[80%] rounded-full bg-sky-500/5 blur-[80px]" />

          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <img src="/logos/Logo (MAIN).png" alt="MediGrid Logo" className="h-7 w-auto object-contain" />
              <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white">MediGrid</span>
            </div>

            <div className="rounded-2xl border border-sky-500/20 dark:border-sky-500/10 bg-sky-50/80 dark:bg-sky-950/20 p-4 flex flex-col gap-3 text-left">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 tracking-wider uppercase">System Health</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400">Operational</span>
              </div>
              <div className="flex flex-col gap-2 mt-1">
                {['EMR Webhook Active', 'Hospital Roster Synced', 'Clinic Schedules Connected'].map(item => (
                  <div key={item} className="flex gap-2 items-center">
                    <div className="w-4 h-4 rounded-full bg-sky-500/10 text-sky-500 dark:text-sky-400 flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3" />
                    </div>
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{item}</span>
                  </div>
                ))}
                <div className="mt-2 p-3 rounded-xl border border-sky-500/20 bg-sky-500/10 dark:bg-sky-500/5">
                  <div className="flex justify-between items-center text-[10px] font-bold text-sky-600 dark:text-sky-400 mb-1.5">
                    <span>AI Patient Routing Grid</span><span>ACTIVE</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-11/12 bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full" />
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-800/80 pt-2.5 mt-1 flex justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                <span>Avg API Speed:</span>
                <span className="font-bold text-sky-600 dark:text-sky-400">120ms</span>
              </div>
            </div>

            <div className="flex gap-3 items-start p-3 rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/10 text-left">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 dark:text-sky-400 shrink-0">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-0.5">Pre-Reserve Slots</h4>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Instantly claim open calendar slots for emergency patients.
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 text-[10px] text-slate-500 font-medium text-left">
            © 2026 MediGrid Healthcare Systems.
          </div>
        </div>

        {/* Right Column — Form */}
        <div className="col-span-1 md:col-span-7 p-6 md:p-10 flex flex-col justify-center relative bg-white dark:bg-[#090b0d] transition-colors duration-300">
          <div className="absolute right-[10%] bottom-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[100px]" />

          <div className="relative z-10 max-w-[420px] mx-auto w-full text-left">
            <div className="flex justify-between items-center mb-6">
              <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to home
              </Link>
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-sky-400 hover:text-sky-500 dark:hover:text-sky-400 transition-all focus:outline-none"
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4 text-sky-400" /> : <Moon className="h-4 w-4 text-sky-600" />}
              </button>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
              Welcome back
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Enter your credentials to access your dashboard.
            </p>
            <div className="h-4" />

            {/* Social Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-6">
              {/* Google */}
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSocialAuth('Google')}
                className="flex items-center justify-center py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-100/80 dark:bg-[#0e1115] text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60 shadow-sm"
              >
                {activeProvider === 'Google' ? (
                  <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-2 shrink-0" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                    </svg>
                    Google
                  </>
                )}
              </button>

              {/* GitHub */}
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSocialAuth('GitHub')}
                className="flex items-center justify-center py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-100/80 dark:bg-[#0e1115] text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60 shadow-sm"
              >
                {activeProvider === 'GitHub' ? (
                  <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-2 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                    </svg>
                    GitHub
                  </>
                )}
              </button>

              {/* Microsoft */}
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSocialAuth('Microsoft')}
                className="flex items-center justify-center py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-100/80 dark:bg-[#0e1115] text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60 shadow-sm"
              >
                {activeProvider === 'Microsoft' ? (
                  <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-2 shrink-0" viewBox="0 0 23 23">
                      <path d="M0 0h11v11H0z" fill="#F25022" />
                      <path d="M12 0h11v11H12z" fill="#7FBA00" />
                      <path d="M0 12h11v11H0z" fill="#00A4EF" />
                      <path d="M12 12h11v11H12z" fill="#FFB900" />
                    </svg>
                    Microsoft
                  </>
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="h-px bg-slate-200 dark:bg-slate-800/80 flex-grow" />
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest shrink-0">or sign in with email</span>
              <div className="h-px bg-slate-200 dark:bg-slate-800/80 flex-grow" />
            </div>

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="flex flex-col">
              <div className="flex flex-col gap-1.5 mb-5">
                <label className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 bg-slate-50 dark:bg-[#0e1115] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-sky-500/80 focus:ring-1 focus:ring-sky-500/20 rounded-xl outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 mb-6">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Password</label>
                  <Link to="/forgot-password" className="text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:text-sky-500 transition-colors">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 bg-slate-50 dark:bg-[#0e1115] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-sky-500/80 focus:ring-1 focus:ring-sky-500/20 rounded-xl outline-none transition-all"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="mb-4 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold text-center">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 shadow-md shadow-sky-500/20 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && !activeProvider ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Verifying Credentials...</>
                ) : 'Sign In'}
              </button>
            </form>

            <div className="h-4" />
            <p className="text-center text-xs text-slate-600 dark:text-slate-400">
              Don't have an account?{' '}
              <Link to="/signup" className="font-bold text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 transition-colors">
                Get Started free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
