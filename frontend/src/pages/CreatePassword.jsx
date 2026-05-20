import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Check, Sparkles, Loader2, KeyRound } from 'lucide-react';
import { BACKEND_URL } from '../config/api';

const BACKEND = BACKEND_URL;

const CreatePassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${BACKEND}/api/auth/set-oauth-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        // Remove needsPassword indicator locally so client knows it's set
        const authProvider = localStorage.getItem('authProvider') || 'oauth';
        localStorage.setItem('hasLocalPassword', 'true');
        setTimeout(() => navigate('/onboarding'), 2000);
      } else {
        setErrorMsg(data.error || 'Failed to save password.');
      }
    } catch (err) {
      console.error('[create-password]', err);
      setErrorMsg('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#030303] text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans transition-colors duration-300">
      {/* Background Orbs */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e915_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e915_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="absolute top-[20%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-sky-500/5 blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-[500px] rounded-[28px] overflow-hidden border border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#090b0d]/90 shadow-2xl shadow-sky-500/10 transition-colors duration-300 z-10 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex flex-col gap-2 mb-6">
          <div className="flex items-center gap-2">
            <img src="/logos/Logo (MAIN).png" alt="Logo" className="h-5 w-auto" />
            <span className="font-bold text-xs uppercase tracking-wider text-slate-400">MediGrid Onboarding</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">Create Account Password</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            For future flexibility and secure data verification, please set a local password for your MediGrid account.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-2xl mb-4 text-left">
            ⚠️ {errorMsg}
          </div>
        )}

        {success ? (
          <div className="py-6 flex flex-col items-center justify-center text-center gap-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <Check className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-black text-slate-900 dark:text-white">Password Created!</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Continuing to your Health Onboarding wizard...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Create Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 pl-10 pr-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 transition-all"
                />
                <Lock className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 pl-10 pr-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 transition-all"
                />
                <Lock className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
              Save & Continue
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreatePassword;
