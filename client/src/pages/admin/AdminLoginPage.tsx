import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Coffee, Lock, User, ArrowLeft, Loader2, AlertCircle, KeyRound, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Mode: 'login' or 'change_password'
  const [mode, setMode] = useState<'login' | 'change_password'>('login');

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Change password form state
  const [changeUsername, setChangeUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await login({ username, password });
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please verify your username and password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!changeUsername.trim()) {
      setError('Please enter your admin username');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.changePasswordPublic({
        username: changeUsername.trim(),
        currentPassword: currentPassword.trim() || undefined,
        recoveryKey: currentPassword.trim() || undefined,
        newPassword,
      });

      setSuccessMessage(res.message || 'Password updated successfully! Please log in with your new password.');
      setUsername(changeUsername.trim());
      setPassword('');
      setChangeUsername('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Auto switch back to login mode after 2 seconds
      setTimeout(() => {
        setMode('login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode: 'login' | 'change_password') => {
    setError(null);
    setSuccessMessage(null);
    setMode(newMode);
    if (newMode === 'change_password' && username) {
      setChangeUsername(username);
    }
  };

  return (
    <div className="min-h-screen bg-roast-deep bg-dark-grain text-cream flex flex-col justify-between p-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-cream/70 hover:text-caramel transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Café Menu</span>
        </Link>

        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-caramel text-espresso flex items-center justify-center font-bold">
            <Coffee className="w-4 h-4" />
          </div>
          <span className="font-serif font-bold text-white text-base">BREW & BEAN</span>
        </div>
      </div>

      {/* Auth Card */}
      <div className="max-w-md w-full mx-auto my-12 bg-roast p-8 sm:p-10 rounded-3xl border border-roast-border shadow-2xl space-y-6">
        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-caramel/15 text-caramel flex items-center justify-center mx-auto border border-caramel/20">
            {mode === 'login' ? <Lock className="w-6 h-6" /> : <KeyRound className="w-6 h-6" />}
          </div>
          <h1 className="font-serif text-3xl font-bold text-white tracking-tight">
            {mode === 'login' ? 'Staff Portal' : 'Change Password'}
          </h1>
          <p className="text-xs text-cream/60">
            {mode === 'login'
              ? 'Log in to manage live orders, menu items, and Master QR.'
              : 'Enter your admin username to set a new password.'}
          </p>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-900/40 border border-emerald-500/50 text-emerald-200 text-xs flex items-center space-x-2.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-red-900/40 border border-red-500/50 text-red-200 text-xs flex items-center space-x-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. LOGIN FORM */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-cream/80 block mb-1">
                Username or Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-cream/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                  className="w-full bg-espresso border border-roast-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-cream/30 focus:outline-none focus:ring-2 focus:ring-caramel"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-cream/80 block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-cream/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full bg-espresso border border-roast-border rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-cream/30 focus:outline-none focus:ring-2 focus:ring-caramel"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/40 hover:text-cream p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-caramel hover:bg-caramel-dark text-espresso font-bold py-3 rounded-xl text-xs uppercase tracking-wider shadow-warm-md transition-all flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-espresso" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Sign In to Dashboard</span>
              )}
            </button>

            {/* Change Password Link */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => switchMode('change_password')}
                className="text-xs text-caramel hover:text-caramel-light font-medium inline-flex items-center space-x-1.5 transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5 text-caramel" />
                <span>Change or Reset Password?</span>
              </button>
            </div>
          </form>
        ) : (
          /* 2. CHANGE PASSWORD FORM */
          <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-cream/80 block mb-1">
                Admin Username <span className="text-caramel">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-cream/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={changeUsername}
                  onChange={(e) => setChangeUsername(e.target.value)}
                  placeholder="e.g. admin"
                  className="w-full bg-espresso border border-roast-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-cream/30 focus:outline-none focus:ring-2 focus:ring-caramel"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-cream/80 block mb-1">
                Current Password or Recovery Key <span className="text-caramel">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-cream/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Old password OR Recovery Key"
                  className="w-full bg-espresso border border-roast-border rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-cream/30 focus:outline-none focus:ring-2 focus:ring-caramel"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/40 hover:text-cream p-1"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-cream/50 mt-1">
                Forgot password? Enter your secret Admin Recovery Key (configured in your server/.env)
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-cream/80 block mb-1">
                New Password <span className="text-caramel">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-cream/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-espresso border border-roast-border rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-cream/30 focus:outline-none focus:ring-2 focus:ring-caramel"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/40 hover:text-cream p-1"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[10px] text-cream/50 mt-1 block">
                Minimum 6 characters
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-cream/80 block mb-1">
                Confirm New Password <span className="text-caramel">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-cream/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full bg-espresso border border-roast-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-cream/30 focus:outline-none focus:ring-2 focus:ring-caramel"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-caramel hover:bg-caramel-dark text-espresso font-bold py-3 rounded-xl text-xs uppercase tracking-wider shadow-warm-md transition-all flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-espresso" />
                  <span>Saving New Password...</span>
                </>
              ) : (
                <span>Save New Password</span>
              )}
            </button>

            {/* Back to Login */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-xs text-cream/70 hover:text-white font-medium inline-flex items-center space-x-1.5 transition-colors"
              >
                <span>&larr; Back to Sign In</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-cream/40">
        BREW & BEAN System Security • Authorized Café Staff Only
      </div>
    </div>
  );
};
