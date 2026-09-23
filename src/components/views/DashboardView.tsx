import React, { useState, useEffect } from 'react';
import { useCrm } from '../../context/CrmContext';
import { api } from '../../lib/api';
import { DashboardMetrics, FollowUp, Invoice, Deal } from '../../types/crm';
import {
  DollarSign,
  TrendingUp,
  UserCheck,
  Percent,
  Briefcase,
  AlertCircle,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  Calendar,
  FileText,
  Activity as ActivityIcon,
  ChevronRight,
  Filter,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export const DashboardView: React.FC = () => {
  const { setActiveView, setSelectedCustomerId, openQuickCreate, showToast, triggerRefresh, refreshKey, theme } = useCrm();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    setLoading(true);
    api.getDashboard(timeRange)
      .then(setMetrics)
      .catch((err) => {
        console.error('Failed to fetch dashboard metrics:', err);
        showToast({ type: 'error', title: 'Error loading dashboard', message: err.message });
      })
      .finally(() => setLoading(false));
  }, [timeRange, refreshKey]);

  const handleCompleteFollowUp = async (fuId: string) => {
    try {
      await api.updateFollowUp(fuId, { status: 'completed' });
      showToast({ type: 'success', title: 'Follow-up Completed' });
      triggerRefresh();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to update follow-up', message: err.message });
    }
  };

  if (loading || !metrics) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-neutral-200 dark:bg-neutral-800 rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-neutral-200 dark:bg-neutral-800 rounded-xl"></div>
          <div className="h-80 bg-neutral-200 dark:bg-neutral-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Top Bar: Title & Time Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Executive Revenue & Operations Dashboard
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Real-time multi-industry telemetry across verified payments, sales pipeline, and client SLAs
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-xl text-xs border border-neutral-200 dark:border-neutral-700/60 self-start sm:self-auto">
          {[
            { id: 'today', label: 'Today' },
            { id: '7d', label: '7D' },
            { id: '30d', label: '30D' },
            { id: '3m', label: '3M' },
            { id: '12m', label: '12M' },
            { id: 'all', label: 'All' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeRange(t.id)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                timeRange === t.id
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid (8 Core Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Revenue Collected */}
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-neutral-100">
            ${metrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Verified settlements in ledger</span>
          </div>
        </div>

        {/* 2. Monthly Revenue */}
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Current Month</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-neutral-100">
            ${metrics.monthlyRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
            Against $75,000 monthly target
          </div>
        </div>

        {/* 3. Conversion Rate */}
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Lead Conversion</span>
            <Percent className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-neutral-100">
            {metrics.conversionRate}%
          </div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
            {metrics.qualifiedLeads} qualified of {metrics.totalLeads} total leads
          </div>
        </div>

        {/* 4. Active Pipeline */}
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Pipeline Value</span>
            <Briefcase className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-neutral-100">
            ${metrics.pipelineTotalValue.toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
            Weighted: <span className="font-mono text-neutral-700 dark:text-neutral-300">${metrics.weightedPipelineValue.toLocaleString()}</span> ({metrics.activeDeals} deals)
          </div>
        </div>

        {/* 5. Pending Receivables */}
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Pending Invoices</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-neutral-100">
            ${metrics.pendingPayments.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
            Outstanding receivables balance
          </div>
        </div>

        {/* 6. Total Leads */}
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Leads</span>
            <UserCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-neutral-100">
            {metrics.totalLeads}
          </div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
            Across 5 multi-industry presets
          </div>
        </div>

        {/* 7. Follow-ups Due Today */}
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Today's Follow-ups</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-neutral-100">
            {metrics.followupsToday}
          </div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
            Calls & client check-ins due
          </div>
        </div>

        {/* 8. Active Customer Accounts */}
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Active Deals</span>
            <Briefcase className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-neutral-100">
            {metrics.activeDeals}
          </div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
            Negotiation & proposal stage
          </div>
        </div>
      </div>

      {/* Row 1 Charts: Revenue Trend & Conversion Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Area Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Revenue Trajectory & Target Forecast
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Monthly verified collections vs executive budget targets
              </p>
            </div>
            <span className="text-xs font-mono text-neutral-400">$ USD</span>
          </div>

          <div className="h-68 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.revenueTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#262626' : '#e5e5e5'} opacity={0.6} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: theme === 'dark' ? '#737373' : '#a3a3a3' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: theme === 'dark' ? '#737373' : '#a3a3a3' }} tickFormatter={(val) => `$${val / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#171717' : '#ffffff',
                    borderColor: theme === 'dark' ? '#262626' : '#e5e5e5',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: theme === 'dark' ? '#f5f5f5' : '#171717',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" name="Actual Revenue" />
                <Area type="monotone" dataKey="target" stroke="#10b981" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorTarget)" name="Target" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Conversion Funnel */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Pipeline Stage Funnel
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Conversion drop-off across qualification milestones
            </p>
          </div>

          <div className="space-y-3.5 mt-2">
            {metrics.conversionFunnel.map((item, idx) => {
              const maxCount = metrics.conversionFunnel[0].count || 1;
              const percent = Math.round((item.count / maxCount) * 100);
              return (
                <div key={item.stage} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">{item.stage}</span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">{item.count}</span>
                      <span className="text-[11px] text-neutral-400">(${item.value.toLocaleString()})</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(8, percent)}%`, backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 2 Charts: Pipeline By Stage & Lead Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Value By Stage */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Pipeline Capital by Stage
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Dollar value distribution across active deal lifecycle
              </p>
            </div>
            <button
              onClick={() => setActiveView('pipeline')}
              className="text-xs text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1"
            >
              <span>Board View</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.pipelineByStage} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#262626' : '#e5e5e5'} opacity={0.6} />
                <XAxis dataKey="stage" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: theme === 'dark' ? '#737373' : '#a3a3a3' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: theme === 'dark' ? '#737373' : '#a3a3a3' }} tickFormatter={(val) => `$${val / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#171717' : '#ffffff',
                    borderColor: theme === 'dark' ? '#262626' : '#e5e5e5',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: theme === 'dark' ? '#f5f5f5' : '#171717',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Pipeline Value']}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Sources Distribution */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Lead Acquisition Channels
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Origin distribution for all pipeline inbound inquiries
              </p>
            </div>
            <button
              onClick={() => setActiveView('leads')}
              className="text-xs text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1"
            >
              <span>View Leads</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.leadsBySource} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme === 'dark' ? '#262626' : '#e5e5e5'} opacity={0.6} />
                <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: theme === 'dark' ? '#737373' : '#a3a3a3' }} />
                <YAxis dataKey="source" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: theme === 'dark' ? '#737373' : '#a3a3a3' }} width={90} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#171717' : '#ffffff',
                    borderColor: theme === 'dark' ? '#262626' : '#e5e5e5',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: theme === 'dark' ? '#f5f5f5' : '#171717',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(val: any) => [`${val} leads`, 'Count']}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3 Operational Modules: Today's Follow-ups + Outstanding Receivables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Follow-ups Queue */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <span>Priority Follow-ups Queue</span>
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-blue-500/10 text-blue-500 font-semibold rounded-full">
                    {metrics.todaysFollowups.length} Pending
                  </span>
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Client engagements and negotiation check-ins scheduled for today
                </p>
              </div>
              <button
                onClick={() => openQuickCreate('followup')}
                className="text-xs text-blue-500 hover:text-blue-600 font-medium"
              >
                + Schedule
              </button>
            </div>

            <div className="space-y-2 mt-3">
              {metrics.todaysFollowups.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-400">
                  All follow-up engagements are clear!
                </div>
              ) : (
                metrics.todaysFollowups.map((fu) => (
                  <div
                    key={fu.id}
                    className="p-3 rounded-xl border border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-950/40 flex items-center justify-between gap-3 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                          {fu.title}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                          {fu.type}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-2 mt-0.5">
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">{fu.relatedName}</span>
                        <span>·</span>
                        <span className="font-mono text-neutral-400">{fu.time}</span>
                        <span>·</span>
                        <span>Assigned: {fu.assignedUserName}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCompleteFollowUp(fu.id)}
                      className="px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors flex items-center gap-1 shrink-0"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Complete</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 mt-4 text-right">
            <button
              onClick={() => setActiveView('follow-ups')}
              className="text-xs text-blue-500 hover:text-blue-600 font-medium inline-flex items-center gap-1"
            >
              <span>Open Follow-ups Manager</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Outstanding Receivables / Invoices */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Outstanding Receivables
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Unsettled invoices with pending balances
                </p>
              </div>
              <button
                onClick={() => openQuickCreate('invoice')}
                className="text-xs text-blue-500 hover:text-blue-600 font-medium"
              >
                + Invoice
              </button>
            </div>

            <div className="space-y-2 mt-3">
              {metrics.outstandingInvoices.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-400">
                  No overdue or outstanding invoices.
                </div>
              ) : (
                metrics.outstandingInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3 rounded-xl border border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-950/40 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 font-mono">
                          {inv.invoiceNumber}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold ${
                            inv.status === 'overdue'
                              ? 'bg-rose-500/15 text-rose-500'
                              : 'bg-amber-500/15 text-amber-500'
                          }`}
                        >
                          {inv.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-2 mt-0.5">
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">{inv.customerName}</span>
                        <span>·</span>
                        <span>Due: {inv.dueDate}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold font-mono text-rose-600 dark:text-rose-400">
                        ${inv.balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <button
                        onClick={() => openQuickCreate('payment')}
                        className="text-[11px] text-blue-500 hover:text-blue-600 font-medium mt-0.5"
                      >
                        Record Pay
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 mt-4 text-right">
            <button
              onClick={() => setActiveView('invoices')}
              className="text-xs text-blue-500 hover:text-blue-600 font-medium inline-flex items-center gap-1"
            >
              <span>View All Invoices</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Row 4: Team Performance & Live Audit History Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Performance Table */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Sales Rep Performance
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Closed revenue & deals won per representative
            </p>
          </div>

          <div className="space-y-3">
            {metrics.teamPerformance.map((rep) => (
              <div key={rep.name} className="flex items-center justify-between text-xs pb-2 border-b border-neutral-100 dark:border-neutral-800/60 last:border-0">
                <div>
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100">{rep.name}</div>
                  <div className="text-[11px] text-neutral-400">
                    {rep.leadsHandled} leads handled · {rep.dealsWon} deals won
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    ${rep.revenue.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-neutral-400 font-mono">Revenue</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Activity Timeline */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <ActivityIcon className="w-4 h-4 text-blue-500" />
                <span>Live System Activity Stream</span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Audited timeline of deals, status changes, assignments, and payments
              </p>
            </div>
            <span className="text-[10px] font-mono text-emerald-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync
            </span>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto scrollbar-thin">
            {metrics.recentActivities.map((act) => (
              <div key={act.id} className="flex items-start gap-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 mt-0.5 text-neutral-500">
                  <ActivityIcon className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      {act.title}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                      {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {act.description}
                  </p>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">
                    By {act.performedByName} · Entity: {act.entityType.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
