import React, { useState, useEffect, useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import { api } from '../../lib/api';
import { FollowUp } from '../../types/crm';
import {
  PhoneCall,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  Phone,
  MessageCircle,
  Mail,
  Users,
  Calendar,
  X,
  Trash2,
} from 'lucide-react';

export const FollowUpsView: React.FC = () => {
  const { openQuickCreate, showToast, triggerRefresh, refreshKey } = useCrm();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    setLoading(true);
    api.getFollowUps()
      .then(setFollowUps)
      .catch((err) => showToast({ type: 'error', title: 'Failed to fetch follow-ups', message: err.message }))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const filteredFollowUps = useMemo(() => {
    return followUps.filter((fu) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        fu.title.toLowerCase().includes(q) ||
        fu.relatedName.toLowerCase().includes(q) ||
        (fu.assignedUserName && fu.assignedUserName.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'all' || fu.status === statusFilter;
      const matchesType = typeFilter === 'all' || fu.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [followUps, searchQuery, statusFilter, typeFilter]);

  const handleToggleStatus = async (fu: FollowUp) => {
    const nextStatus = fu.status === 'completed' ? 'pending' : 'completed';
    try {
      await api.updateFollowUp(fu.id, { status: nextStatus });
      showToast({
        type: 'success',
        title: nextStatus === 'completed' ? 'Follow-up Completed' : 'Follow-up Reopened',
        message: fu.title,
      });
      triggerRefresh();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to update follow-up', message: err.message });
    }
  };

  const handleDeleteFollowUp = async (id: string, title: string) => {
    if (!window.confirm(`Delete follow-up "${title}"?`)) return;
    try {
      await api.deleteFollowUp(id);
      showToast({ type: 'info', title: 'Follow-up deleted' });
      triggerRefresh();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to delete follow-up', message: err.message });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="w-3.5 h-3.5 text-blue-500" />;
      case 'whatsapp': return <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />;
      case 'email': return <Mail className="w-3.5 h-3.5 text-indigo-500" />;
      case 'meeting': return <Users className="w-3.5 h-3.5 text-purple-500" />;
      default: return <Clock className="w-3.5 h-3.5 text-neutral-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <span>Follow-up Management & Reminders</span>
            <span className="px-2 py-0.5 text-xs font-mono bg-blue-500/10 text-blue-500 rounded-md">
              {followUps.filter((f) => f.status === 'pending').length} Pending
            </span>
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Ensure zero deal slippage with automated check-in schedules, phone calls, and client touchpoints
          </p>
        </div>

        <button
          onClick={() => openQuickCreate('followup')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs shadow-blue-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Schedule Follow-up</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-neutral-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search follow-ups by subject, client name, or owner..."
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 focus:outline-none"
          >
            <option value="all">All Channels</option>
            <option value="call">Phone Call</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
            <option value="meeting">Meeting</option>
          </select>
        </div>
      </div>

      {/* Follow-ups Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFollowUps.length === 0 ? (
          <div className="col-span-full py-12 text-center text-neutral-400 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-xs">
            No follow-ups found.
          </div>
        ) : (
          filteredFollowUps.map((fu) => {
            const isCompleted = fu.status === 'completed';

            return (
              <div
                key={fu.id}
                className={`p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs transition-all flex flex-col justify-between space-y-3 ${
                  isCompleted ? 'opacity-60 bg-neutral-50/50 dark:bg-neutral-950/40' : 'hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                        {getTypeIcon(fu.type)}
                      </div>
                      <span className="text-[10px] font-mono uppercase font-semibold text-neutral-500">
                        {fu.type}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                        isCompleted
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-amber-500/10 text-amber-500'
                      }`}
                    >
                      {fu.status}
                    </span>
                  </div>

                  <h3 className={`text-xs font-bold text-neutral-900 dark:text-neutral-100 mt-2 ${isCompleted ? 'line-through text-neutral-400' : ''}`}>
                    {fu.title}
                  </h3>

                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                    Client: <strong className="text-neutral-800 dark:text-neutral-200">{fu.relatedName}</strong>
                  </div>

                  {fu.notes && (
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-2 bg-neutral-50 dark:bg-neutral-800/40 p-2 rounded-lg line-clamp-2">
                      {fu.notes}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
                  <div className="text-[11px] font-mono text-neutral-400">
                    <span>{fu.date}</span> at <span>{fu.time}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleStatus(fu)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                        isCompleted
                          ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isCompleted ? 'Reopen' : 'Done'}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteFollowUp(fu.id, fu.title)}
                      className="p-1 rounded text-neutral-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
