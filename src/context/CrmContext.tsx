import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Notification, CRMSettings } from '../types/crm';
import { api } from '../lib/api';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

interface CrmContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoadingSession: boolean;
  allUsers: User[];
  notifications: Notification[];
  unreadNotifCount: number;
  settings: CRMSettings | null;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  login: (credentials: { email: string; password: string; rememberMe?: boolean }) => Promise<User>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string; resetToken?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  updateProfile: (profile: { name?: string; phone?: string; title?: string; avatar?: string }) => Promise<void>;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  toasts: ToastMessage[];
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
  refreshKey: number;
  triggerRefresh: () => void;
  // Modals & Panels
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isQuickCreateOpen: boolean;
  setIsQuickCreateOpen: (open: boolean) => void;
  quickCreateDefaultTab?: string;
  openQuickCreate: (tab?: string) => void;
  // Navigation
  activeView: string;
  setActiveView: (view: string) => void;
  selectedCustomerId: string | null;
  setSelectedCustomerId: (id: string | null) => void;
  selectedLeadId: string | null;
  setSelectedLeadId: (id: string | null) => void;
}

const CrmContext = createContext<CrmContextType | undefined>(undefined);

const getInitialTheme = (): 'light' | 'dark' => {
  try {
    const saved = localStorage.getItem('orvexa_theme');
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  } catch (e) {}
  return 'dark';
};

export const CrmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<CRMSettings | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Global Controls
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [quickCreateDefaultTab, setQuickCreateDefaultTab] = useState<string | undefined>('lead');

  // Navigation
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('orvexa_theme', next);
      } catch (e) {}
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  }, []);

  // Sync initial theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('orvexa_theme', theme);
    } catch (e) {}
  }, [theme]);

  // Load user session on mount
  useEffect(() => {
    let isMounted = true;

    api.onUnauthorized(() => {
      if (isMounted) {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    });

    const token = api.getToken();
    if (!token) {
      if (isMounted) {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setIsLoadingSession(false);
      }
      return;
    }

    api.getCurrentUser()
      .then((data) => {
        if (!isMounted) return;
        setCurrentUser(data.user);
        setAllUsers(data.allUsers || []);
        setIsAuthenticated(true);
      })
      .catch((err) => {
        console.warn('[AUTH] Stored token invalid:', err);
        if (!isMounted) return;
        api.setToken(null);
        setCurrentUser(null);
        setIsAuthenticated(false);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingSession(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync settings and notifications once authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    api.getSettings()
      .then(setSettings)
      .catch((err) => console.error('Failed to load settings', err));

    api.getNotifications()
      .then(setNotifications)
      .catch((err) => console.error('Failed to load notifications', err));
  }, [isAuthenticated, refreshKey]);

  // Real Login
  const login = async (credentials: { email: string; password: string; rememberMe?: boolean }): Promise<User> => {
    const res = await api.login(credentials);
    setCurrentUser(res.user);
    setIsAuthenticated(true);

    // Refresh context data
    try {
      const meData = await api.getCurrentUser();
      setAllUsers(meData.allUsers || []);
    } catch (_) {}

    triggerRefresh();
    showToast({
      type: 'success',
      title: `Welcome back, ${res.user.name}`,
      message: `Signed in as ${res.user.role.replace('_', ' ').toUpperCase()} (${res.user.department})`,
    });

    return res.user;
  };

  // Real Logout
  const logout = async () => {
    try {
      await api.logout();
    } catch (_) {}
    setCurrentUser(null);
    setIsAuthenticated(false);
    showToast({
      type: 'info',
      title: 'Signed Out',
      message: 'You have been safely signed out of your workspace.',
    });
  };

  // Forgot Password
  const forgotPassword = async (email: string) => {
    return api.forgotPassword(email);
  };

  // Reset Password
  const resetPassword = async (token: string, newPassword: string) => {
    const res = await api.resetPassword(token, newPassword);
    showToast({
      type: 'success',
      title: 'Password Updated',
      message: 'You can now sign in with your new password.',
    });
    return res;
  };

  // Update Profile
  const updateProfile = async (profile: { name?: string; phone?: string; title?: string; avatar?: string }) => {
    const res = await api.updateProfile(profile);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      showToast({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your profile changes have been saved.',
      });
      triggerRefresh();
    }
  };

  const openQuickCreate = (tab?: string) => {
    setQuickCreateDefaultTab(tab || 'lead');
    setIsQuickCreateOpen(true);
  };

  // Keyboard shortcut for Cmd+K (Global Search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  return (
    <CrmContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isLoadingSession,
        allUsers,
        notifications,
        unreadNotifCount,
        settings,
        theme,
        toggleTheme,
        login,
        logout,
        forgotPassword,
        resetPassword,
        updateProfile,
        isProfileModalOpen,
        setIsProfileModalOpen,
        toasts,
        showToast,
        dismissToast,
        refreshKey,
        triggerRefresh,
        isSearchOpen,
        setIsSearchOpen,
        isQuickCreateOpen,
        setIsQuickCreateOpen,
        quickCreateDefaultTab,
        openQuickCreate,
        activeView,
        setActiveView,
        selectedCustomerId,
        setSelectedCustomerId,
        selectedLeadId,
        setSelectedLeadId,
      }}
    >
      {children}
    </CrmContext.Provider>
  );
};

export const useCrm = () => {
  const context = useContext(CrmContext);
  if (!context) throw new Error('useCrm must be used within a CrmProvider');
  return context;
};
