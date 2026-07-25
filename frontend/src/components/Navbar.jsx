import React, { useState, useEffect } from 'react';
import { Sun, Moon, Menu, X, ArrowRight, LayoutDashboard, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = ({ theme, setTheme }) => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('authToken'));
  }, []);

  // Monitor scroll for subtle style enhancements
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const handleLogout = (e) => {
    if (e) e.preventDefault();
    localStorage.clear();
    setIsLoggedIn(false);
    setMobileMenuOpen(false);
    navigate('/');
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About Us', href: '/#about-us' },
    { name: 'Features', href: '/#features' },
    { name: 'How It Works', href: '/#how-it-works' },
    { name: 'Pricing', href: '/#pricing' },
    { name: 'Testimonials', href: '/#testimonials' },
    { name: 'FAQ', href: '/#faq' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full px-4 sm:px-6 lg:px-8 pt-4 transition-all duration-300">
      {/* Floating Capsule Nav */}
      <nav 
        className={`mx-auto max-w-7xl px-6 h-16 flex items-center justify-between rounded-2xl transition-all duration-300 navbar-gradient-border ${
          scrolled 
            ? 'navbar-scrolled shadow-lg shadow-sky-500/10 backdrop-blur-md bg-white/90 dark:bg-black/90' 
            : 'shadow-md shadow-sky-500/5 backdrop-blur-sm bg-white/80 dark:bg-black/40'
        }`}
      >
        {/* Left Side: Logo and Brand Name */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <Link to="/" className="flex items-center gap-2.5 focus:outline-none group">
            <img 
              src="/logos/Logo (MAIN).png" 
              alt="MediGrid Logo" 
              className="h-8 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <span className="font-bold text-base tracking-tight text-slate-800 dark:text-white transition-colors duration-300 group-hover:text-sky-500">
              MediGrid
            </span>
          </Link>
        </div>

        {/* Center: Navigation Links */}
        <div className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => 
            link.to ? (
              <Link
                key={link.name}
                to={link.to}
                className="px-3.5 py-1.5 rounded-full text-[13px] font-bold text-sky-500 dark:text-sky-400 hover:bg-sky-50/50 dark:hover:bg-sky-950/30 transition-all duration-200"
              >
                {link.name}
              </Link>
            ) : (
              <a
                key={link.name}
                href={link.href}
                className="px-3.5 py-1.5 rounded-full text-[13px] font-medium text-slate-600 dark:text-slate-300 hover:text-sky-500 dark:hover:text-sky-400 hover:bg-sky-50/50 dark:hover:bg-sky-950/30 transition-all duration-200"
              >
                {link.name}
              </a>
            )
          )}
        </div>

        {/* Right Side: Actions matching reference layout */}
        <div className="hidden md:flex items-center gap-4">
          {/* Circular Theme Toggle Icon */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-9 h-9 rounded-full border border-sky-100 dark:border-sky-900/50 text-slate-500 dark:text-slate-400 hover:border-sky-400 hover:text-sky-500 dark:hover:border-sky-500 dark:hover:text-sky-400 hover:bg-sky-50/50 dark:hover:bg-sky-950/30 transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4.5 w-4.5 transition-transform hover:rotate-45 duration-300 text-sky-400" />
            ) : (
              <Moon className="h-4.5 w-4.5 transition-transform hover:-rotate-12 duration-300 text-sky-500" />
            )}
          </button>

          {isLoggedIn ? (
            <>
              {/* Dashboard Link */}
              <Link
                to="/dashboard"
                className="text-[13px] font-semibold text-slate-800 dark:text-white hover:text-sky-500 dark:hover:text-sky-455 transition-colors duration-200 flex items-center gap-1.5"
              >
                <LayoutDashboard className="h-4 w-4 text-sky-500" />
                Dashboard
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="px-5.5 py-2 rounded-xl text-[13px] font-semibold text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 shadow-md shadow-red-500/15 dark:shadow-red-500/5 hover:shadow-lg transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </>
          ) : (
            <>
              {/* Sign In (Plain Text Link) */}
              <Link
                to="/login"
                className="text-[13px] font-medium text-slate-600 dark:text-slate-300 hover:text-sky-500 dark:hover:text-sky-400 transition-colors duration-200"
              >
                Sign In
              </Link>

              {/* Get Started (Solid Light Blue/Indigo Gradient Pill Button) */}
              <Link
                to="/signup"
                className="px-5.5 py-2 rounded-xl text-[13px] font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 shadow-md shadow-sky-500/15 dark:shadow-sky-500/5 hover:shadow-lg hover:shadow-sky-500/35 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] flex items-center gap-1"
              >
                Get Started
                <ArrowRight className="h-3.5 w-3.5 transition-transform hover:translate-x-0.5 duration-200" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button and theme controls */}
        <div className="flex md:hidden items-center gap-2">
          {/* Mobile Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-8 h-8 rounded-full border border-sky-100 dark:border-sky-900/50 text-slate-500 dark:text-slate-400"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-sky-400" />
            ) : (
              <Moon className="h-4 w-4 text-sky-500" />
            )}
          </button>

          {/* Hamburger Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:text-sky-500 dark:hover:text-sky-400 focus:outline-none"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5.5 w-5.5" />
            ) : (
              <Menu className="h-5.5 w-5.5" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 mx-auto max-w-7xl px-2 max-h-[calc(100vh-85px)] overflow-y-auto z-50 pb-4">
          <div className="flex flex-col gap-4 p-5 rounded-3xl border border-sky-200/60 dark:border-sky-900/40 bg-white/95 dark:bg-black/95 backdrop-blur-md shadow-xl shadow-sky-500/5 animate-in fade-in slide-in-from-top-4 duration-200">
            {/* Mobile Nav Links */}
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => 
                link.to ? (
                  <Link
                    key={link.name}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold text-sky-500 dark:text-sky-400 hover:bg-sky-50/50 dark:hover:bg-sky-950/30 transition-all text-left"
                  >
                    {link.name}
                  </Link>
                ) : (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-sky-500 dark:hover:text-sky-400 hover:bg-sky-50/50 dark:hover:bg-sky-950/30 transition-all text-left"
                  >
                    {link.name}
                  </a>
                )
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-100 dark:bg-slate-800/80 my-1" />

            {/* Mobile Actions */}
            <div className="flex flex-col gap-3">
              {isLoggedIn ? (
                <>
                  {/* Dashboard Button */}
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-sky-50/50 dark:hover:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <LayoutDashboard className="h-4.5 w-4.5 text-sky-500" />
                    Dashboard
                  </Link>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="w-full text-center px-4 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 shadow-md shadow-red-500/20 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  {/* Sign In Link */}
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-sky-50/50 dark:hover:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 transition-all duration-200"
                  >
                    Sign In
                  </Link>

                  {/* Get Started Button */}
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center px-4 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 shadow-md shadow-sky-500/20 transition-all duration-300 flex items-center justify-center gap-1.5"
                  >
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
