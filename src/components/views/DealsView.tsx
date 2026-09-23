import React, { useState, useEffect, useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import { api } from '../../lib/api';
import { Deal, DealStage } from '../../types/crm';
import {
  Briefcase,
  Search,
  Plus,
  GitPullRequest,
  CheckCircle2,
  XCircle,
  Building,
  UserCheck,
  Calendar,
  X,
  Trash2,
} from 'lucide-react';

export const DealsView: React.FC = () => {
  const { setActiveView, openQuickCreate, showToast, triggerRefresh, refreshKey } = useCrm();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');

  useEffect(() => {
    setLoading(true);
    api.getDeals()
      .then(setDeals)
      .catch((err) => showToast({ type: 'error', title: 'Failed to fetch deals', message: err.message }))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        deal.name.toLowerCase().includes(q) ||
        deal.customerName.toLowerCase().includes(q) ||
        (deal.assignedUserName && deal.assignedUserName.toLowerCase().includes(q));

      const matchesStage = stageFilter === 'all' || deal.stage === stageFilter;
      return matchesSearch && matchesStage;
    });
  }, [deals, searchQuery, stageFilter]);

  const handleDeleteDeal = async (id: string, name: string) => {
    if (!window.confirm(`Delete deal "${name}"?`)) return;
    try {
      await api.deleteDeal(id);
      showToast({ type: 'info', title: 'Deal Deleted', message: name });
      triggerRefresh();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to delete deal', message: err.message });
    }
  };

  const getStageBadge = (stage: DealStage) => {
    switch (stage) {
      case 'won': return 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30';
      case 'lost': return 'bg-rose-500/15 text-rose-500 border-rose-500/30';
      case 'negotiation': return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'proposal': return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
      case 'qualified': return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'new': return 'bg-neutral-500/15 text-neutral-400 border-neutral-500/30';
    }
  };

  return (
    <div className="space-y-4">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <span>Deals & Revenue Opportunities</span>
            <span className="px-2 py-0.5 text-xs font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-md">
              {deals.length}
            </span>
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Track contract opportunities, stage milestones, probabilities, and revenue forecasts
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setActiveView('pipeline')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-lg text-xs font-medium transition-colors"
          >
            <GitPullRequest className="w-3.5 h-3.5 text-blue-500" />
            <span>Kanban Board</span>
          </button>

          <button
            onClick={() => openQuickCreate('deal')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs shadow-blue-600/20 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Deal</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-neutral-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search deals by deal name, customer account, or salesperson..."
            className="w-full text-xs bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-neutral-400 hover:text-neutral-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 focus:outline-none"
          >
            <option value="all">All Stages</option>
            <option value="new">New</option>
            <option value="qualified">Qualified</option>
            <option value="proposal">Proposal</option>
            <option value="negotiation">Negotiation</option>
            <option value="won">Closed Won</option>
            <option value="lost">Closed Lost</option>
          </select>
        </div>
      </div>

      {/* Deals Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-950/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Deal Title</th>
                <th className="py-3.5 px-3">Customer Account</th>
                <th className="py-3.5 px-3">Value</th>
                <th className="py-3.5 px-3">Stage</th>
                <th className="py-3.5 px-3">Win Prob.</th>
                <th className="py-3.5 px-3">Target Close</th>
                <th className="py-3.5 px-3">Owner</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
              {filteredDeals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400">
                    No deals match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredDeals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {deal.name}
                      </div>
                      {deal.notes && (
                        <div className="text-[11px] text-neutral-400 truncate max-w-xs mt-0.5">
                          {deal.notes}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="text-neutral-800 dark:text-neutral-200 font-medium">
                        {deal.customerName}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                      ${deal.value.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border ${getStageBadge(deal.stage)}`}>
                        {deal.stage}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 font-mono">
                      {deal.probability}%
                    </td>

                    <td className="py-3.5 px-3 font-mono text-neutral-500 dark:text-neutral-400">
                      {deal.expectedCloseDate}
                    </td>

                    <td className="py-3.5 px-3 text-neutral-700 dark:text-neutral-300">
                      {deal.assignedUserName}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteDeal(deal.id, deal.name)}
                        className="p-1 rounded text-neutral-400 hover:text-rose-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        title="Delete Deal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
