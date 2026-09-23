import React from 'react';
import { useCrm } from '../../context/CrmContext';
import {
  LayoutDashboard,
  UserCheck,
  Users,
  Briefcase,
  GitPullRequest,
  CheckSquare,
  PhoneCall,
  Calendar,
  Clock,
  Package,
  FileText,
  CreditCard,
  MessageSquare,
  FolderOpen,
  BarChart3,
  ShieldCheck,
  Bot,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const { activeView, setActiveView, setSelectedCustomerId, setSelectedLeadId } = useCrm();

  const handleNav = (viewId: string) => {
    setSelectedCustomerId(null);
    setSelectedLeadId(null);
    setActiveView(viewId);
    setMobileOpen(false);
  };

  const navGroups = [
    {
      title: 'Core',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'CRM & Pipeline',
      items: [
        { id: 'leads', label: 'Leads', icon: UserCheck },
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'deals', label: 'Deals', icon: Briefcase },
        { id: 'pipeline', label: 'Pipeline Board', icon: GitPullRequest },
      ],
    },
    {
      title: 'Activities',
      items: [
        { id: 'tasks', label: 'Tasks', icon: CheckSquare },
        { id: 'follow-ups', label: 'Follow-ups', icon: PhoneCall },
        { id: 'calendar', label: 'Calendar', icon: Calendar },
        { id: 'appointments', label: 'Appointments', icon: Clock },
      ],
    },
    {
      title: 'Finance & Sales',
      items: [
        { id: 'products', label: 'Products & Services', icon: Package },
        { id: 'invoices', label: 'Invoices', icon: FileText },
        { id: 'payments', label: 'Payments', icon: CreditCard },
      ],
    },
    {
      title: 'Workspace',
      items: [
        { id: 'communications', label: 'Communications', icon: MessageSquare },
        { id: 'documents', label: 'Documents', icon: FolderOpen },
      ],
    },
    {
      title: 'Intelligence & Management',
      items: [
        { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
        { id: 'team', label: 'Team & RBAC', icon: ShieldCheck },
        { id: 'ai-assistant', label: 'AI Assistant', icon: Bot, highlight: true },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Main Sidebar Shell */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 lg:z-20 shrink-0 flex flex-col h-full bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 transition-all duration-200 ease-in-out ${
          collapsed ? 'w-[72px]' : 'w-64'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
          <div
            onClick={() => handleNav('dashboard')}
            className="flex items-center gap-3 cursor-pointer select-none overflow-hidden"
          >
            {/* Elegant Geometric ORVEXA Icon */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/20 shrink-0">
              O
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight text-neutral-900 dark:text-white font-mono">
                  ORVEXA<span className="text-blue-500 dark:text-blue-400 font-sans ml-1 text-xs">CRM</span>
                </span>
                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 -mt-0.5 tracking-wide">
                  Enterprise Suite
                </span>
              </div>
            )}
          </div>

          {/* Collapse Toggle for Desktop */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Item Scrollable Area */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5 scrollbar-thin">
          {navGroups.map((group) => (
            <div key={group.title}>
              {!collapsed && (
                <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 select-none">
                  {group.title}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id)}
                      title={collapsed ? item.label : undefined}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group relative ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-600/15 dark:text-blue-400 font-semibold shadow-xs'
                          : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800/60'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-blue-500 rounded-r" />
                      )}

                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? 'text-blue-600 dark:text-blue-400'
                            : item.highlight
                            ? 'text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300'
                            : 'text-neutral-400 group-hover:text-neutral-700 dark:text-neutral-400 dark:group-hover:text-neutral-200'
                        }`}
                      />

                      {!collapsed && (
                        <span className="truncate flex-1 text-left flex items-center justify-between">
                          <span>{item.label}</span>
                          {item.highlight && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[9px] font-mono font-medium text-indigo-600 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-500/20 rounded">
                              <Sparkles className="w-2.5 h-2.5" />
                              AI
                            </span>
                          )}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer with Live Connection Status */}
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 shrink-0">
          <div
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-200 dark:border-neutral-800/60 text-xs text-neutral-600 dark:text-neutral-400 ${
              collapsed ? 'justify-center' : 'justify-between'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              {!collapsed && <span className="text-[11px] font-mono text-neutral-700 dark:text-neutral-300">Live DB Sync</span>}
            </div>
            {!collapsed && (
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">v1.0</span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
