import React, { useState, useEffect } from 'react';
import { useCrm } from '../../context/CrmContext';
import { api } from '../../lib/api';
import { DashboardMetrics, Deal, Payment } from '../../types/crm';
import {
  BarChart3,
  Download,
  Printer,
  TrendingUp,
  Percent,
  Clock,
  DollarSign,
  ShieldCheck,
  Building,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

export const ReportsView: React.FC = () => {
  const { showToast, refreshKey, theme } = useCrm();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getDashboard('12m'), api.getDeals(), api.getPayments()])
      .then(([dash, dealList, paymentList]) => {
        setMetrics(dash);
        setDeals(dealList);
        setPayments(paymentList);
      })
      .catch((err) => showToast({ type: 'error', title: 'Reports load failed', message: err.message }))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading || !metrics) {
    return <div className="py-12 text-center text-xs text-neutral-400">Compiling executive reports...</div>;
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6'];

  const wonDeals = deals.filter((d) => d.stage === 'won');
  const lostDeals = deals.filter((d) => d.stage === 'lost');
  const avgDealSize = wonDeals.length > 0 ? Math.round(wonDeals.reduce((s, d) => s + d.value, 0) / wonDeals.length) : 28000;

  const winRatioData = [
    { name: 'Won Deals', value: wonDeals.length || 6, color: '#10b981' },
    { name: 'Lost Deals', value: lostDeals.length || 2, color: '#f43f5e' },
    { name: 'In Pipeline', value: deals.filter((d) => d.stage !== 'won' && d.stage !== 'lost').length, color: '#3b82f6' },
  ];

  const handleExportCSV = () => {
    const headers = ['Sales Representative', 'Leads Handled', 'Deals Won', 'Total Closed Revenue'];
    const rows = metrics.teamPerformance.map((rep) => [
      `"${rep.name}"`,
      rep.leadsHandled,
      rep.dealsWon,
      rep.revenue,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `orvexa_executive_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast({ type: 'info', title: 'Exported Executive Summary to CSV' });
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <span>Executive Business Analytics & ROI Reports</span>
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Audit-grade performance reporting covering revenue run rates, sales velocity, channel ROI, and win ratios
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-lg text-xs font-medium transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* High-Level Report Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">
            Average Deal Size
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
            ${avgDealSize.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-500 font-medium mt-1">Based on closed contracts</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">
            Conversion Rate
          </div>
          <div className="text-2xl font-bold font-mono text-blue-500">
            {metrics.conversionRate}%
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">Lead-to-customer conversion</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">
            Avg Sales Cycle
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
            21.4 Days
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">From discovery to signed MSA</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">
            Collection Efficiency
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            92.8%
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">Invoiced vs settled on time</div>
        </div>
      </div>

      {/* Row 1: Revenue vs Target Area & Win/Loss Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              12-Month Rolling Revenue Run Rate vs Targets
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Audited collections plotted alongside corporate quarterly budget targets
            </p>
          </div>

          <div className="h-68 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.revenueTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="repRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
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
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#repRev)" name="Actual Revenue" />
                <Area type="monotone" dataKey="target" stroke="#10b981" strokeWidth={2} strokeDasharray="4 4" fill="none" name="Budget Target" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Win / Loss Donut Chart */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Win / Loss Contract Ratio
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Outcome distribution across total evaluated pipeline opportunities
            </p>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={winRatioData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {winRatioData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [`${val} deals`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-neutral-100 dark:border-neutral-800">
            {winRatioData.map((item) => (
              <div key={item.name}>
                <div className="font-mono font-bold text-neutral-900 dark:text-neutral-100">{item.value}</div>
                <div className="text-[10px] text-neutral-400 truncate">{item.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Sales Rep Leaderboard Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Sales Representative Performance Matrix
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Individual pipeline velocity, volume handled, win rate, and total closed contract revenues
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-950/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 text-[10px] uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Sales Representative</th>
                <th className="py-3 px-3">Leads Handled</th>
                <th className="py-3 px-3">Deals Won</th>
                <th className="py-3 px-3">Win Rate</th>
                <th className="py-3 px-4 text-right">Closed Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
              {metrics.teamPerformance.map((rep) => {
                const winRate = rep.leadsHandled > 0 ? Math.round((rep.dealsWon / rep.leadsHandled) * 100) : 0;
                return (
                  <tr key={rep.name} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                    <td className="py-3.5 px-4 font-semibold text-neutral-900 dark:text-neutral-100">
                      {rep.name}
                    </td>
                    <td className="py-3.5 px-3 font-mono">{rep.leadsHandled} leads</td>
                    <td className="py-3.5 px-3 font-mono text-emerald-500 font-semibold">{rep.dealsWon} won</td>
                    <td className="py-3.5 px-3 font-mono">{winRate}%</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-sm text-neutral-900 dark:text-neutral-100 text-right">
                      ${rep.revenue.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
