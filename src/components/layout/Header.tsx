import React, { useState, useRef, useEffect } from 'react';
import { useCrm } from '../../context/CrmContext';
import { api } from '../../lib/api';
import {
  Menu,
  Search,
  Plus,
  Bell,
  Sun,
  Moon,
  CheckCircle2,
  ChevronDown,
  UserCheck,
  Briefcase,
  Users,
  CheckSquare,
  FileText,
  CreditCard,
  PhoneCall,
  Calendar,
  RotateCcw,
  Sparkles,
  User as UserIcon,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react';

interface HeaderProps {
  onToggleMobile: () => void;
  collapsed: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobile, collapsed }) => {
  const {
    activeView,
    setIsSearchOpen,
    openQuickCreate,
    notifications,
    unreadNotifCount,
    theme,
    toggleTheme,
    currentUser,
    logout,
    setIsProfileModalOpen,
    triggerRefresh,
    showToast,
  } = useCrm();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);
  const createRef = useRef<HTMLDivElement>(null);

  // Close popovers on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setIsRoleOpen(false);
      }
      if (createRef.current && !createRef.current.contains(e.target as Node)) {
        setIsCreateMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      triggerRefresh();
      showToast({ type: 'info', title: 'Notifications marked as read' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetData = async () => {
    if (!window.confirm('Reset ORVEXA CRM to initial seed data?')) return;
    setIsResetting(true);
    try {
      await api.resetDatabase();
      showToast({ type: 'success', title: 'Database Reset', message: 'Seed data restored to fresh state.' });
      triggerRefresh();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Reset Failed', message: err.message });
    } finally {
      setIsResetting(false);
    }
  };

  const getBreadcrumbTitle = () => {
    switch (activeView) {
      case 'dashboard': return 'Executive Dashboard';
      case 'leads': return 'Leads & Opportunities';
      case 'customers': return 'Customer Directory & Accounts';
      case 'deals': return 'Deals & Revenue Pipeline';
      case 'pipeline': return 'Interactive Pipeline Board';
      case 'tasks': return 'Tasks & Operational Queue';
      case 'follow-ups': return 'Follow-up Scheduler';
      case 'calendar': return 'Company Calendar';
      case 'appointments': return 'Client Appointments';
      case 'products': return 'Products & Services';
      case 'invoices': return 'Invoicing & Receivables';
      case 'payments': return 'Payments & Revenue Ledger';
      case 'communications': return 'Communications Hub';
      case 'documents': return 'Document Vault';
      case 'reports': return 'Reports & Analytics';
      case 'team': return 'Team Directory & Access Control';
      case 'ai-assistant': return 'AI Co-Pilot';
      case 'settings': return 'System Settings';
      default: return 'Overview';
    }
  };

  return (
    <header className="relative z-30 h-16 w-full shrink-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center justify-between h-full px-4 sm:px-6">
        {/* Left Section: Mobile Menu + Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobile}
            className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 lg:hidden"
            aria-label="Open mobile menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-xs">
            <span className="hidden sm:inline text-neutral-400 font-mono">ORVEXA</span>
            <span className="hidden sm:inline text-neutral-300 dark:text-neutral-700">/</span>
            <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
              {getBreadcrumbTitle()}
            </span>
          </div>
        </div>

        {/* Center / Global Search Trigger */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-1.5 bg-neutral-100/80 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/60 rounded-xl text-xs text-neutral-400 dark:text-neutral-400 transition-colors shadow-xs"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-neutral-400" />
              <span>Search leads, customers, deals, invoices...</span>
            </span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-medium text-neutral-400 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded shadow-xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Section: Quick Create + Notifications + Role Switcher + Theme */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Mobile Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="md:hidden p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            title="Global Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Quick Create Dropdown */}
          <div className="relative" ref={createRef}>
            <button
              onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs shadow-blue-600/20 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Create</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {isCreateMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 px-2.5 py-1">
                  Quick Create
                </div>
                {[
                  { id: 'lead', label: 'New Lead', icon: UserCheck },
                  { id: 'customer', label: 'New Customer', icon: Users },
                  { id: 'deal', label: 'New Deal', icon: Briefcase },
                  { id: 'task', label: 'New Task', icon: CheckSquare },
                  { id: 'followup', label: 'Schedule Follow-up', icon: PhoneCall },
                  { id: 'appointment', label: 'Book Appointment', icon: Calendar },
                  { id: 'invoice', label: 'Create Invoice', icon: FileText },
                  { id: 'payment', label: 'Record Payment', icon: CreditCard },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setIsCreateMenuOpen(false);
                        openQuickCreate(item.id);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors text-left"
                    >
                      <Icon className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reset Demo Data Button */}
          <button
            onClick={handleResetData}
            disabled={isResetting}
            title="Reset to fresh demo seed data"
            className="p-2 rounded-lg text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin text-blue-500' : ''}`} />
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-600" />}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2 relative rounded-lg text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                      Notifications
                    </span>
                    {unreadNotifCount > 0 && (
                      <span className="px-1.5 py-0.2 text-[10px] font-mono font-medium text-rose-400 bg-rose-500/10 rounded-full">
                        {unreadNotifCount} new
                      </span>
                    )}
                  </div>
                  {unreadNotifCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-blue-500 hover:text-blue-600 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto space-y-1.5 scrollbar-thin">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-neutral-400">
                      No notifications right now
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-2.5 rounded-xl border text-xs transition-colors ${
                          notif.read
                            ? 'bg-transparent border-neutral-100 dark:border-neutral-800/40 text-neutral-500'
                            : 'bg-blue-500/5 border-blue-500/20 text-neutral-900 dark:text-neutral-100'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="font-semibold text-xs leading-snug">{notif.title}</h5>
                          {!notif.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                          {notif.message}
                        </p>
                        <span className="text-[10px] text-neutral-400 font-mono mt-1 block">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Role Switcher & Active User Profile */}
          <div className="relative pl-1 border-l border-neutral-200 dark:border-neutral-800" ref={roleRef}>
            <button
              onClick={() => setIsRoleOpen(!isRoleOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 flex items-center justify-center text-xs font-semibold font-mono border border-neutral-300 dark:border-neutral-700">
                {currentUser ? currentUser.name.charAt(0) : 'U'}
              </div>
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 leading-tight">
                  {currentUser?.name}
                </span>
                <span className="text-[10px] text-neutral-400 font-mono capitalize">
                  {currentUser?.role.replace('_', ' ')}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>

            {isRoleOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in">
                {/* Authenticated User Summary */}
                <div className="px-3 py-2.5 border-b border-neutral-100 dark:border-neutral-800 mb-1.5">
                  <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    {currentUser?.name}
                  </div>
                  <div className="text-[11px] text-neutral-400 font-mono truncate">
                    {currentUser?.email}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-500 dark:text-blue-400 font-semibold border border-blue-500/20 capitalize">
                      <Shield className="w-3 h-3" />
                      {currentUser?.role.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-neutral-400 truncate max-w-[120px]">
                      {currentUser?.department}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-0.5">
                  <button
                    onClick={() => {
                      setIsRoleOpen(false);
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left font-medium"
                  >
                    <UserIcon className="w-4 h-4 text-neutral-400" />
                    <span>User Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsRoleOpen(false);
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left font-medium"
                  >
                    <Settings className="w-4 h-4 text-neutral-400" />
                    <span>Account Settings</span>
                  </button>

                  <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />

                  <button
                    onClick={() => {
                      setIsRoleOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors text-left font-semibold"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
