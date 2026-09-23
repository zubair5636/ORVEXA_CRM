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
  allUsers: User[];
  notifications: Notification[];
  unreadNotifCount: number;
  settings: CRMSettings | null;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  switchRole: (userId: string) => Promise<void>;
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

  // Load user & session
  useEffect(() => {
    api.getCurrentUser()
      .then((data) => {
        setCurrentUser(data.user);
        setAllUsers(data.allUsers);
      })
      .catch((err) => console.error('Failed to load user session', err));

    api.getSettings()
      .then(setSettings)
      .catch((err) => console.error('Failed to load settings', err));

    api.getNotifications()
      .then(setNotifications)
      .catch((err) => console.error('Failed to load notifications', err));
  }, [refreshKey]);

  const switchRole = async (userId: string) => {
    try {
      const res = await api.switchRole(userId);
      if (res.success) {
        setCurrentUser(res.user);
        showToast({
          type: 'info',
          title: `Role switched to ${res.user.role.toUpperCase()}`,
          message: `Now acting as ${res.user.name} (${res.user.title})`,
        });
        triggerRefresh();
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to switch role', message: err.message });
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
        allUsers,
        notifications,
        unreadNotifCount,
        settings,
        theme,
        toggleTheme,
        switchRole,
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
