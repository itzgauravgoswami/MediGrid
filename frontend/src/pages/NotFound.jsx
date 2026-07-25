import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Home, FileQuestion } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('authToken');

  return (
    <div className="w-full min-h-[60vh] flex items-center justify-center py-12 px-4 relative z-10">
      <div className="max-w-md w-full flex flex-col items-center text-center">
        
        {/* Simple Icon Bubble */}
        <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-500 flex items-center justify-center mb-6 shadow-lg shadow-sky-500/5">
          <FileQuestion className="h-8 w-8" />
        </div>

        {/* 404 Number */}
        <h1 className="text-7xl sm:text-8xl font-black tracking-tight mb-2 text-slate-800 dark:text-white leading-none">
          404
        </h1>

        {/* Headline */}
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-3 text-slate-900 dark:text-slate-100">
          Page Not Found
        </h2>
        
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed max-w-xs">
          The page you requested does not exist or has been moved. Please check the URL or use the navigation below to get back on track.
        </p>

        {/* Simple Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center w-full">
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white/50 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" /> Go Back
          </button>
          
          <Link
            to={isLoggedIn ? "/dashboard" : "/"}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-500/20 text-center"
          >
            <Home className="h-4 w-4" /> 
            {isLoggedIn ? "Go to Dashboard" : "Return to Home"}
          </Link>
        </div>

      </div>
    </div>
  );
};

export default NotFound;
