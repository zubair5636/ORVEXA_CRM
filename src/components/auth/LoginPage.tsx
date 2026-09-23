import React, { useState, useEffect } from 'react';
import { useCrm } from '../../context/CrmContext';
import { api } from '../../lib/api';
import { Role } from '../../types/crm';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Sun,
  Moon,
  KeyRound,
  RotateCcw,
  UserCheck,
  Building,
} from 'lucide-react';

interface DemoUserItem {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  department: string;
}

export const LoginPage: React.FC = () => {
  const { login, forgotPassword, resetPassword, theme, toggleTheme } = useCrm();

  // Mode: 'login' | 'forgot' | 'reset'
  const [authMode, setAuthMode] = useState<'login' | 'forgot' | 'reset'>('login');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Password Reset fields
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successInfo, setSuccessInfo] = useState('');

  // Demo accounts catalogue
  const [demoAccounts, setDemoAccounts] = useState<DemoUserItem[]>([]);
  const [selectedDemoUser, setSelectedDemoUser] = useState<string | null>(null);

  useEffect(() => {
    api.getDemoAccounts()
      .then((users) => setDemoAccounts(users))
      .catch(() => {
        // Fallback demo users if network is momentarily disconnected
        setDemoAccounts([
          { id: 'usr_super_admin', name: 'Marcus Vance', email: 'marcus.vance@orvexa.io', role: 'super_admin', title: 'Chief Executive Officer', department: 'Executive Leadership' },
          { id: 'usr_admin', name: 'Elena Rostova', email: 'elena.rostova@orvexa.io', role: 'admin', title: 'VP of Business Operations', department: 'Operations' },
          { id: 'usr_manager', name: 'David Chen', email: 'david.chen@orvexa.io', role: 'manager', title: 'Head of Commercial Sales', department: 'Sales & Revenue' },
          { id: 'usr_sales_exec', name: 'Sarah Jenkins', email: 'sarah.jenkins@orvexa.io', role: 'sales_executive', title: 'Senior Account Executive', department: 'Sales & Revenue' },
          { id: 'usr_support', name: 'Alex Rivera', email: 'alex.rivera@orvexa.io', role: 'support_agent', title: 'Customer Success Specialist', department: 'Customer Success' },
          { id: 'usr_accountant', name: 'Michael Torres', email: 'michael.torres@orvexa.io', role: 'accountant', title: 'Financial Controller', department: 'Finance & Accounting' },
        ]);
      });
  }, []);

  const handleSelectDemoUser = (demoUser: DemoUserItem) => {
    setSelectedDemoUser(demoUser.id);
    setEmail(demoUser.email);
    setPassword('Orvexa2026!');
    setErrorMessage('');
    setSuccessInfo(`Selected ${demoUser.name} (${demoUser.role.replace('_', ' ').toUpperCase()})`);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessInfo('');

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login({
        email: email.trim(),
        password,
        rememberMe,
      });
      // Navigation is automatically handled in App.tsx via isAuthenticated
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessInfo('');

    if (!email.trim()) {
      setErrorMessage('Please enter your email address to request a reset link.');
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPassword(email.trim());
      if (res.resetToken) {
        setResetToken(res.resetToken);
        setSuccessInfo(`Reset token generated for evaluation: ${res.resetToken}`);
        setAuthMode('reset');
      } else {
        setSuccessInfo('If an account exists, password reset instructions have been issued.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!resetToken.trim()) {
      setErrorMessage('Reset token is required.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(resetToken.trim(), newPassword);
      setResetSuccessMessage('Your password has been successfully reset. Please log in.');
      setPassword(newPassword);
      setAuthMode('login');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: Role) => {
    switch (role) {
      case 'super_admin': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'admin': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'manager': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'sales_executive': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'support_agent': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'accountant': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col justify-between bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans selection:bg-blue-500/20 selection:text-blue-500 transition-colors duration-200">
      {/* Top Bar with Brand & Theme Toggle */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-neutral-200/70 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold font-mono shadow-md shadow-blue-600/20">
            OX
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <span>ORVEXA CRM</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20">
                Enterprise
              </span>
            </div>
            <div className="text-[11px] text-neutral-400 font-mono">
              Secure Multi-Tenant Auth Core
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-neutral-100 dark:bg-neutral-800/60 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700/60">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>PBKDF2 SHA-512 Encrypted</span>
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 transition-colors"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-600" />}
          </button>
        </div>
      </header>

      {/* Main Login Workspace */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Sign In Card */}
          <div className="lg:col-span-7 bg-white dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-neutral-950/5 dark:shadow-none backdrop-blur-xl relative overflow-hidden">
            {/* Subtle glow effect */}
            <div className="absolute -top-24 -right-24 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header info */}
            <div className="mb-6 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60 mb-3">
                <Sparkles className="w-3 h-3 text-blue-500" />
                <span>ORVEXA Enterprise Suite</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                {authMode === 'login' && 'Welcome back'}
                {authMode === 'forgot' && 'Reset your password'}
                {authMode === 'reset' && 'Set new password'}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                {authMode === 'login' && 'Sign in to access your CRM workspace and customer pipeline.'}
                {authMode === 'forgot' && 'Enter your verified account email to generate a password reset token.'}
                {authMode === 'reset' && 'Choose a secure password for your workspace account.'}
              </p>
            </div>

            {/* Error Message Banner */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Info Banner */}
            {(successInfo || resetSuccessMessage) && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                <span className="font-mono">{resetSuccessMessage || successInfo}</span>
              </div>
            )}

            {/* MODE: LOGIN */}
            {authMode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4 relative z-10">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@orvexa.io"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-300 dark:border-neutral-700/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('forgot');
                        setErrorMessage('');
                        setSuccessInfo('');
                      }}
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full pl-10 pr-11 py-2.5 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-300 dark:border-neutral-700/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors p-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 bg-neutral-50 dark:bg-neutral-800"
                    />
                    <span className="text-xs text-neutral-600 dark:text-neutral-400">
                      Remember this session (30 days)
                    </span>
                  </label>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In to Workspace</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* MODE: FORGOT PASSWORD */}
            {authMode === 'forgot' && (
              <form onSubmit={handleForgotSubmit} className="space-y-4 relative z-10">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Account Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@orvexa.io"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-300 dark:border-neutral-700/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-neutral-900 dark:text-neutral-100"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? 'Processing...' : 'Send Reset Link / Token'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setErrorMessage('');
                    }}
                    className="py-2.5 px-4 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-medium transition-colors"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {/* MODE: RESET PASSWORD */}
            {authMode === 'reset' && (
              <form onSubmit={handleResetSubmit} className="space-y-4 relative z-10">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Reset Token
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      placeholder="Paste reset token here"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-300 dark:border-neutral-700/80 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 text-neutral-900 dark:text-neutral-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-300 dark:border-neutral-700/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-neutral-900 dark:text-neutral-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-300 dark:border-neutral-700/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-neutral-900 dark:text-neutral-100"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? 'Updating...' : 'Save New Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setErrorMessage('');
                    }}
                    className="py-2.5 px-4 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                <span>Protected by Server-Enforced RBAC</span>
              </span>
              <span>ORVEXA v2.4</span>
            </div>
          </div>

          {/* Right Column: Verified Database Demo Accounts */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white/80 dark:bg-neutral-900/60 border border-neutral-200/90 dark:border-neutral-800/80 rounded-3xl p-5 sm:p-6 backdrop-blur-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-500" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                    Seeded Enterprise Accounts
                  </h2>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20">
                  Ready to test
                </span>
              </div>

              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4 leading-relaxed">
                Click any real database user to autofill verified credentials and test their specific RBAC security tier:
              </p>

              <div className="space-y-2">
                {demoAccounts.map((user) => {
                  const isSelected = selectedDemoUser === user.id || email === user.email;
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectDemoUser(user)}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between group ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 shadow-xs'
                          : 'border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/60 dark:bg-neutral-800/40 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 flex items-center justify-center text-xs font-bold font-mono shrink-0">
                          {user.name.charAt(0)}
                        </div>
                        <div className="min-w-0 text-left">
                          <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                            {user.name}
                          </div>
                          <div className="text-[10px] text-neutral-400 font-mono truncate">
                            {user.email}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-2">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-mono border uppercase tracking-wider font-semibold ${getRoleBadgeColor(user.role)}`}>
                          {user.role.replace('_', ' ')}
                        </span>
                        <div className="text-[9px] text-neutral-400 truncate mt-0.5">
                          {user.department}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                <span>Default Password:</span>
                <span className="font-bold text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                  Orvexa2026!
                </span>
              </div>
            </div>

            {/* Architecture Card */}
            <div className="bg-blue-500/5 dark:bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 text-xs text-neutral-600 dark:text-neutral-400">
              <div className="font-semibold text-neutral-900 dark:text-neutral-200 mb-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-blue-500" />
                <span>Multi-User Organization Workspace</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                All authenticated staff belong to ORVEXA Enterprise Suite. Sessions persist across browser reloads and are invalidated immediately upon logout.
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-6 py-3 border-t border-neutral-200/70 dark:border-neutral-800/80 text-center text-xs text-neutral-400 font-mono">
        © 2026 ORVEXA CRM System · Enterprise Grade Architecture
      </footer>
    </div>
  );
};
