import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Check, Sparkles, Loader2, KeyRound } from 'lucide-react';
import { BACKEND_URL } from '../config/api';

const BACKEND = BACKEND_URL;

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');

  // Resend OTP Cooldown
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(c => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Request Reset OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email) return;
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND}/api/auth/forgot-password-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStep(2);
        setCooldown(60);
      } else {
        setErrorMsg(data.error || 'Failed to send OTP.');
      }
    } catch (err) {
      console.error('[forgot-password-request]', err);
      setErrorMsg('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Verify Reset OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) return;
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND}/api/auth/verify-reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResetToken(data.resetToken);
        setStep(3);
      } else {
        setErrorMsg(data.error || 'Invalid or expired OTP.');
      }
    } catch (err) {
      console.error('[verify-reset-otp]', err);
      setErrorMsg('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'reset' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCooldown(60);
      } else {
        setErrorMsg(data.error || 'Failed to resend OTP.');
      }
    } catch (err) {
      console.error('[resend-otp]', err);
      setErrorMsg('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset Password (Submit)
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resetToken, newPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStep(4);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setErrorMsg(data.error || 'Failed to reset password.');
      }
    } catch (err) {
      console.error('[reset-password]', err);
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
            <span className="font-bold text-xs uppercase tracking-wider text-slate-400">MediGrid Security</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {step === 1 && 'Reset Password'}
            {step === 2 && 'Verify Reset OTP'}
            {step === 3 && 'Create New Password'}
            {step === 4 && 'Password Reset Successful'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {step === 1 && 'Enter your email address to receive a secure password reset verification code.'}
            {step === 2 && `We sent a 6-digit OTP code to ${email}.`}
            {step === 3 && 'Set a new strong password for your account.'}
            {step === 4 && 'Your password has been reset. Redirecting you to login...'}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-2xl mb-4 text-left">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* STEP 1: ENTER EMAIL */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4 text-left">
            <div>
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 pl-10 pr-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 transition-all"
                />
                <Mail className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
              Send Verification OTP
            </button>
          </form>
        )}

        {/* STEP 2: ENTER OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 text-left">
            <div>
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Verification OTP</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="6-digit code"
                className="w-full text-center tracking-widest text-lg font-black rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 transition-all"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500 dark:text-slate-400">Didn't receive a code?</span>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={cooldown > 0 || loading}
                className="text-sky-500 font-bold hover:underline disabled:text-slate-500 disabled:no-underline"
              >
                {cooldown > 0 ? `Resend Code (${cooldown}s)` : 'Resend OTP'}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Verify OTP Code
            </button>
          </form>
        )}

        {/* STEP 3: CREATE NEW PASSWORD */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4 text-left">
            <div>
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">New Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 pl-10 pr-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 transition-all"
                />
                <Lock className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Confirm New Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
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
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Update Password
            </button>
          </form>
        )}

        {/* STEP 4: SUCCESS BANNER */}
        {step === 4 && (
          <div className="py-6 flex flex-col items-center justify-center text-center gap-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <Check className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-black text-slate-900 dark:text-white">New Password Set!</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Please wait while we redirect you to login.</p>
            </div>
          </div>
        )}

        {/* Footer Link */}
        {step !== 4 && (
          <div className="mt-5 border-t border-slate-100 dark:border-slate-900 pt-4 flex items-center justify-center">
            <Link to="/login" className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
