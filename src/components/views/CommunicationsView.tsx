import React, { useState, useEffect } from 'react';
import { useCrm } from '../../context/CrmContext';
import { api } from '../../lib/api';
import { CommunicationLog, Customer } from '../../types/crm';
import {
  MessageSquare,
  Search,
  Plus,
  Mail,
  Phone,
  MessageCircle,
  Users,
  Send,
  Calendar,
  X,
} from 'lucide-react';

export const CommunicationsView: React.FC = () => {
  const { showToast, triggerRefresh, refreshKey, allUsers } = useCrm();
  const [logs, setLogs] = useState<CommunicationLog[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Communication Form
  const [newLog, setNewLog] = useState({
    customerId: '',
    channel: 'email' as any,
    subject: '',
    content: '',
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getCommunications(), api.getCustomers()])
      .then(([commList, custList]) => {
        setLogs(commList);
        setCustomers(custList);
        if (custList.length > 0) {
          setNewLog((prev) => ({ ...prev, customerId: prev.customerId || custList[0].id }));
        }
      })
      .catch((err) => showToast({ type: 'error', title: 'Communications fetch failed', message: err.message }))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const filteredLogs = logs.filter((log) => {
    const q = searchQuery.toLowerCase();
    const customer = log.customerName || log.recipientName || '';
    const matchesSearch =
      !q ||
      log.subject.toLowerCase().includes(q) ||
      customer.toLowerCase().includes(q) ||
      log.content.toLowerCase().includes(q);

    const ch = log.channel || log.type || 'call';
    const matchesChannel = channelFilter === 'all' || ch === channelFilter;
    return matchesSearch && matchesChannel;
  });

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLog.customerId || !newLog.subject || !newLog.content) {
      showToast({ type: 'warning', title: 'Please complete all fields' });
      return;
    }
    const targetCust = customers.find((c) => c.id === newLog.customerId);
    try {
      await api.createCommunication({
        ...newLog,
        customerName: targetCust?.company || 'Account',
      });
      showToast({ type: 'success', title: 'Communication Logged' });
      setIsModalOpen(false);
      setNewLog({ customerId: customers[0]?.id || '', channel: 'email', subject: '', content: '' });
      triggerRefresh();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Log failed', message: err.message });
    }
  };

  const getChannelIcon = (ch: string) => {
    switch (ch) {
      case 'email': return <Mail className="w-3.5 h-3.5 text-blue-500" />;
      case 'call': return <Phone className="w-3.5 h-3.5 text-emerald-500" />;
      case 'whatsapp': return <MessageCircle className="w-3.5 h-3.5 text-cyan-500" />;
      case 'meeting': return <Users className="w-3.5 h-3.5 text-purple-500" />;
      default: return <MessageSquare className="w-3.5 h-3.5 text-neutral-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <span>Omnichannel Communications Hub</span>
            <span className="px-2 py-0.5 text-xs font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-md">
              {logs.length}
            </span>
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Complete audit trail of inbound and outbound customer touchpoints (Emails, Calls, WhatsApp, and Meetings)
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs shadow-blue-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Log Communication</span>
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
            placeholder="Search communications by subject, customer, or message content..."
            className="w-full text-xs bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 focus:outline-none"
          >
            <option value="all">All Channels</option>
            <option value="email">Email</option>
            <option value="call">Phone Call</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="meeting">Meeting</option>
          </select>
        </div>
      </div>

      {/* Communications Stream */}
      <div className="space-y-3">
        {filteredLogs.map((log) => (
          <div
            key={log.id}
            className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs space-y-2 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                  {getChannelIcon(log.channel || log.type || 'note')}
                </div>
                <div>
                  <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                    {log.customerName || log.recipientName || 'Client'}
                  </span>
                  <span className="text-[10px] text-neutral-400 uppercase font-mono ml-2">
                    via {log.channel || log.type || 'note'}
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-mono text-neutral-400">
                {new Date(log.timestamp || log.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
              </span>
            </div>

            <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              {log.subject}
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/40 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 leading-relaxed">
              {log.content}
            </p>

            <div className="flex items-center justify-between pt-1 text-[11px] text-neutral-400">
              <span>Logged by: {log.userName}</span>
            </div>
          </div>
        ))}
      </div>

      {/* LOG MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Log Customer Interaction
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLog} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Customer Account *
                </label>
                <select
                  required
                  value={newLog.customerId}
                  onChange={(e) => setNewLog({ ...newLog, customerId: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company} ({c.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Channel
                </label>
                <select
                  value={newLog.channel}
                  onChange={(e) => setNewLog({ ...newLog, channel: e.target.value as any })}
                  className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                >
                  <option value="email">Email</option>
                  <option value="call">Phone Call</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="meeting">In-Person / Video Meeting</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={newLog.subject}
                  onChange={(e) => setNewLog({ ...newLog, subject: e.target.value })}
                  placeholder="e.g. Contract review feedback session"
                  className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Summary / Conversation Transcript *
                </label>
                <textarea
                  rows={4}
                  required
                  value={newLog.content}
                  onChange={(e) => setNewLog({ ...newLog, content: e.target.value })}
                  placeholder="Details discussed, client requirements, next action items..."
                  className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
