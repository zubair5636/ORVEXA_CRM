import React, { useState } from 'react';
import { useCrm } from '../../context/CrmContext';
import { api } from '../../lib/api';
import {
  X,
  User as UserIcon,
  Mail,
  Shield,
  Building,
  Phone,
  Calendar,
  Lock,
  CheckCircle2,
  AlertCircle,
  LogOut,
} from 'lucide-react';

export const UserProfileModal: React.FC = () => {
  const { currentUser, isProfileModalOpen, setIsProfileModalOpen, updateProfile, logout, showToast } = useCrm();

  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [title, setTitle] = useState(currentUser?.title || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Security tab
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [securityMessage, setSecurityMessage] = useState('');
  const [securityError, setSecurityError] = useState('');

  if (!isProfileModalOpen || !currentUser) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({ name, phone, title });
      showToast({ type: 'success', title: 'Profile Updated', message: 'User details have been saved.' });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to update profile', message: err.message });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError('');
    setSecurityMessage('');

    if (newPassword.length < 6) {
      setSecurityError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityError('Passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      // Use forgot/reset flow or direct profile reset token
      const forgotRes = await api.forgotPassword(currentUser.email);
      if (forgotRes.resetToken) {
        await api.resetPassword(forgotRes.resetToken, newPassword);
        setSecurityMessage('Password changed successfully.');
        setNewPassword('');
        setConfirmPassword('');
        showToast({ type: 'success', title: 'Password Changed', message: 'Your password has been securely updated.' });
      }
    } catch (err: any) {
      setSecurityError(err.message || 'Failed to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const getRoleBadge = () => {
    const role = currentUser.role;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div
        className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center font-bold text-sm font-mono">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                {currentUser.name}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`px-2 py-0.5 text-[10px] font-mono rounded-md border font-semibold uppercase tracking-wider ${getRoleBadge()}`}>
                  {currentUser.role.replace('_', ' ')}
                </span>
                <span className="text-xs text-neutral-400">· {currentUser.department}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsProfileModalOpen(false)}
            className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-100 dark:border-neutral-800 px-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 text-xs font-semibold border-b-2 mr-6 transition-colors ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
            }`}
          >
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'security'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
            }`}
          >
            Security & Password
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'profile' ? (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                    User ID
                  </label>
                  <div className="px-3 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded-xl text-xs font-mono select-all">
                    {currentUser.id}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                    Account Status
                  </label>
                  <div className="px-3 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl text-xs font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Active Staff Member</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-neutral-900 dark:text-neutral-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Verified Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="email"
                    value={currentUser.email}
                    disabled
                    className="w-full pl-9 pr-3 py-2 bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/50 rounded-xl text-xs text-neutral-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-neutral-900 dark:text-neutral-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-neutral-900 dark:text-neutral-100"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-neutral-400 font-mono">
                  Created: {new Date(currentUser.createdAt).toLocaleDateString()}
                </span>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
                >
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              {securityMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>{securityMessage}</span>
                </div>
              )}

              {securityError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  <span>{securityError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-neutral-900 dark:text-neutral-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-neutral-900 dark:text-neutral-100"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
                >
                  {savingPassword ? 'Updating Password...' : 'Change Password'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer with Logout action */}
        <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-950/60 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <button
            onClick={() => {
              setIsProfileModalOpen(false);
              logout();
            }}
            className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Workspace</span>
          </button>

          <button
            onClick={() => setIsProfileModalOpen(false)}
            className="px-4 py-1.5 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
