import React, { useState, useEffect } from 'react';
import { useCrm } from '../../context/CrmContext';
import { api } from '../../lib/api';
import { Deal, DealStage } from '../../types/crm';
import {
  GitPullRequest,
  Plus,
  DollarSign,
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Building,
  UserCheck,
  Calendar,
  Filter,
} from 'lucide-react';

export const PipelineView: React.FC = () => {
  const { openQuickCreate, showToast, triggerRefresh, refreshKey } = useCrm();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  // Close Win / Loss Dialog State
  const [closeDealTarget, setCloseDealTarget] = useState<{ deal: Deal; targetStage: 'won' | 'lost' } | null>(null);
  const [closeReason, setCloseReason] = useState('');

  const stages: { id: DealStage; label: string; color: string; border: string }[] = [
    { id: 'new', label: 'New Inquiries', color: 'bg-neutral-500/10 text-neutral-400', border: 'border-neutral-500/20' },
    { id: 'qualified', label: 'Discovery / Qualified', color: 'bg-blue-500/10 text-blue-400', border: 'border-blue-500/20' },
    { id: 'proposal', label: 'Proposal Submitted', color: 'bg-indigo-500/10 text-indigo-400', border: 'border-indigo-500/20' },
    { id: 'negotiation', label: 'Contract Negotiation', color: 'bg-purple-500/10 text-purple-400', border: 'border-purple-500/20' },
    { id: 'won', label: 'Closed Won', color: 'bg-emerald-500/10 text-emerald-400', border: 'border-emerald-500/20' },
    { id: 'lost', label: 'Closed Lost', color: 'bg-rose-500/10 text-rose-400', border: 'border-rose-500/20' },
  ];

  useEffect(() => {
    setLoading(true);
    api.getDeals()
      .then(setDeals)
      .catch((err) => showToast({ type: 'error', title: 'Failed to fetch deals', message: err.message }))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const handleMoveStage = async (deal: Deal, newStage: DealStage) => {
    if (newStage === 'won' || newStage === 'lost') {
      setCloseDealTarget({ deal, targetStage: newStage });
      setCloseReason('');
      return;
    }

    try {
      await api.updateDealStage(deal.id, newStage);
      showToast({ type: 'success', title: 'Deal Updated', message: `Moved to ${newStage.toUpperCase()}` });
      triggerRefresh();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to move deal', message: err.message });
    }
  };

  const handleConfirmClose = async () => {
    if (!closeDealTarget) return;
    try {
      await api.updateDealStage(closeDealTarget.deal.id, closeDealTarget.targetStage, closeReason || undefined);
      showToast({
        type: closeDealTarget.targetStage === 'won' ? 'success' : 'info',
        title: closeDealTarget.targetStage === 'won' ? 'Deal Won!' : 'Deal Closed Lost',
        message: closeDealTarget.deal.name,
      });
      setCloseDealTarget(null);
      triggerRefresh();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to close deal', message: err.message });
    }
  };

  const totalPipelineCapital = deals
    .filter((d) => d.stage !== 'lost')
    .reduce((sum, d) => sum + d.value, 0);

  const totalWeightedCapital = deals
    .filter((d) => d.stage !== 'lost')
    .reduce((sum, d) => sum + (d.value * (d.probability / 100)), 0);

  return (
    <div className="space-y-4">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <span>Visual Pipeline Board</span>
            <span className="px-2 py-0.5 text-xs font-mono bg-blue-500/10 text-blue-500 rounded-md">
              {deals.length} Active Deals
            </span>
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Total Pipeline: <strong className="font-mono text-neutral-900 dark:text-neutral-100">${totalPipelineCapital.toLocaleString()}</strong> · Weighted Forecast: <strong className="font-mono text-neutral-900 dark:text-neutral-100">${Math.round(totalWeightedCapital).toLocaleString()}</strong>
          </p>
        </div>

        <button
          onClick={() => openQuickCreate('deal')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs shadow-blue-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Deal</span>
        </button>
      </div>

      {/* Kanban Board Container (Horizontal Scroll) */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 items-start min-h-[600px] scrollbar-thin">
        {stages.map((col) => {
          const colDeals = deals.filter((d) => d.stage === col.id);
          const colSum = colDeals.reduce((sum, d) => sum + d.value, 0);

          return (
            <div
              key={col.id}
              className="w-76 shrink-0 bg-neutral-100/70 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-3 flex flex-col max-h-[80vh]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-neutral-200/60 dark:border-neutral-800/80">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${col.color}`}>
                    {colDeals.length}
                  </span>
                  <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                    {col.label}
                  </span>
                </div>
                <div className="text-[11px] font-mono font-bold text-neutral-700 dark:text-neutral-300">
                  ${colSum.toLocaleString()}
                </div>
              </div>

              {/* Deals Cards in Column */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                {colDeals.length === 0 ? (
                  <div className="py-8 text-center text-xs text-neutral-400 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
                    No deals in this stage
                  </div>
                ) : (
                  colDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="p-3.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 rounded-xl shadow-xs transition-all space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 leading-snug group-hover:text-blue-500 transition-colors">
                          {deal.name}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                        <Building className="w-3 h-3 text-neutral-400 shrink-0" />
                        <span className="truncate">{deal.customerName}</span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-neutral-100 dark:border-neutral-800 text-xs">
                        <div className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                          ${deal.value.toLocaleString()}
                        </div>
                        <div className="text-[10px] font-mono text-neutral-400">
                          {deal.probability}% Prob.
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                        <span>Due: {deal.expectedCloseDate}</span>
                        <span>{deal.assignedUserName}</span>
                      </div>

                      {/* Quick Stage Transitions */}
                      <div className="pt-2 flex items-center justify-between gap-1 border-t border-neutral-100 dark:border-neutral-800">
                        {col.id !== 'new' && (
                          <button
                            onClick={() => {
                              const currIdx = stages.findIndex((s) => s.id === col.id);
                              if (currIdx > 0) handleMoveStage(deal, stages[currIdx - 1].id);
                            }}
                            className="text-[10px] text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 font-medium px-1.5 py-0.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            title="Move back"
                          >
                            ← Prev
                          </button>
                        )}

                        <div className="flex items-center gap-1 ml-auto">
                          {col.id !== 'won' && col.id !== 'lost' && (
                            <button
                              onClick={() => {
                                const currIdx = stages.findIndex((s) => s.id === col.id);
                                if (currIdx < stages.length - 2) handleMoveStage(deal, stages[currIdx + 1].id);
                              }}
                              className="text-[10px] text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 font-medium px-2 py-0.5 rounded"
                            >
                              Advance →
                            </button>
                          )}

                          {col.id !== 'won' && (
                            <button
                              onClick={() => handleMoveStage(deal, 'won')}
                              className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded"
                              title="Mark Won"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {col.id !== 'lost' && (
                            <button
                              onClick={() => handleMoveStage(deal, 'lost')}
                              className="p-1 text-rose-500 hover:bg-rose-500/10 rounded"
                              title="Mark Lost"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CLOSE WON / LOST DIALOG */}
      {closeDealTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              {closeDealTarget.targetStage === 'won' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Close Deal as Won!</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-rose-500" />
                  <span>Close Deal as Lost</span>
                </>
              )}
            </h3>

            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Contract: <strong>{closeDealTarget.deal.name}</strong> (${closeDealTarget.deal.value.toLocaleString()})
            </p>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {closeDealTarget.targetStage === 'won' ? 'Winning Factor / SLA Notes' : 'Loss Reason / Competitor Info'}
              </label>
              <textarea
                rows={3}
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
                placeholder={closeDealTarget.targetStage === 'won' ? 'e.g. Competitive pricing, security audit pass, executive sponsorship' : 'e.g. Budget cut, delayed to next fiscal year, chose incumbent'}
                className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCloseDealTarget(null)}
                className="px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClose}
                className={`px-4 py-1.5 text-white text-xs font-semibold rounded-lg ${
                  closeDealTarget.targetStage === 'won' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                Confirm Stage Transition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
