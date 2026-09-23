import React, { useState, useEffect, useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import { api } from '../../lib/api';
import { Lead, LeadStatus, Priority, User } from '../../types/crm';
import {
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  ArrowUpDown,
  MoreHorizontal,
  CheckCircle2,
  UserCheck,
  Building,
  Mail,
  Phone,
  Flame,
  UserPlus,
  Trash2,
  Edit,
  Briefcase,
  X,
  FileSpreadsheet,
} from 'lucide-react';

export const LeadsView: React.FC = () => {
  const { allUsers, showToast, triggerRefresh, refreshKey, openQuickCreate, selectedLeadId, setSelectedLeadId } = useCrm();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  // Selection for Bulk Actions
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [bulkAssignUser, setBulkAssignUser] = useState<string>('');
  const [bulkStatus, setBulkStatus] = useState<LeadStatus>('contacted');
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [isBulkStatusOpen, setIsBulkStatusOpen] = useState(false);

  // Convert Modal State
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
  const [convertDealName, setConvertDealName] = useState('');
  const [convertDealValue, setConvertDealValue] = useState<number>(15000);
  const [createDealOnConvert, setCreateDealOnConvert] = useState(true);

  // Edit / Detail Drawer State
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [activeDetailLead, setActiveDetailLead] = useState<Lead | null>(null);

  useEffect(() => {
    setLoading(true);
    api.getLeads()
      .then((data) => {
        setLeads(data);
        if (selectedLeadId) {
          const target = data.find((l) => l.id === selectedLeadId);
          if (target) setActiveDetailLead(target);
        }
      })
      .catch((err) => showToast({ type: 'error', title: 'Failed to fetch leads', message: err.message }))
      .finally(() => setLoading(false));
  }, [refreshKey, selectedLeadId]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        lead.fullName.toLowerCase().includes(q) ||
        lead.company.toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q) ||
        lead.phone.includes(q);

      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || lead.priority === priorityFilter;
      const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesSource;
    });
  }, [leads, searchQuery, statusFilter, priorityFilter, sourceFilter]);

  // Bulk Selection
  const handleToggleSelectAll = () => {
    if (selectedLeadIds.length === filteredLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map((l) => l.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Bulk Actions
  const handleExecuteBulkAssign = async () => {
    if (!bulkAssignUser || selectedLeadIds.length === 0) return;
    try {
      const res = await api.bulkAssignLeads(selectedLeadIds, bulkAssignUser);
      showToast({ type: 'success', title: `Reassigned ${res.count} Leads` });
      setSelectedLeadIds([]);
      setIsBulkAssignOpen(false);
      triggerRefresh();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Bulk assign failed', message: err.message });
    }
  };

  const handleExecuteBulkStatus = async () => {
    if (!bulkStatus || selectedLeadIds.length === 0) return;
    try {
      const res = await api.bulkUpdateLeadStatus(selectedLeadIds, bulkStatus);
      showToast({ type: 'success', title: `Updated ${res.count} Leads to ${bulkStatus.toUpperCase()}` });
      setSelectedLeadIds([]);
      setIsBulkStatusOpen(false);
      triggerRefresh();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Bulk status update failed', message: err.message });
    }
  };

  // Convert Lead Handler
  const handleConvertLead = async () => {
    if (!convertingLead) return;
    try {
      const res = await api.convertLead(convertingLead.id, {
        createDeal: createDealOnConvert,
        dealName: convertDealName || `${convertingLead.company} — Commercial Contract`,
        dealValue: Number(convertDealValue),
      });
      showToast({
        type: 'success',
        title: 'Lead Converted!',
        message: `${convertingLead.company} is now an active Customer account${res.deal ? ' with a linked Deal.' : '.'}`,
      });
      setConvertingLead(null);
      triggerRefresh();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Conversion failed', message: err.message });
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['ID', 'Full Name', 'Company', 'Email', 'Phone', 'Source', 'Status', 'Priority', 'Lead Score', 'Assigned To', 'Expected Value', 'Created At'];
    const rows = filteredLeads.map((l) => [
      l.id,
      `"${l.fullName}"`,
      `"${l.company}"`,
      l.email,
      l.phone,
      `"${l.source}"`,
      l.status,
      l.priority,
      l.leadScore,
      `"${l.assignedUserName}"`,
      l.expectedValue,
      l.createdAt,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `orvexa_leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast({ type: 'info', title: `Exported ${filteredLeads.length} leads to CSV` });
  };

  // Delete Single Lead
  const handleDeleteLead = async (id: string, name: string) => {
    if (!window.confirm(`Delete lead "${name}"?`)) return;
    try {
      await api.deleteLead(id);
      showToast({ type: 'info', title: 'Lead deleted', message: name });
      if (activeDetailLead?.id === id) setActiveDetailLead(null);
      triggerRefresh();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to delete lead', message: err.message });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 60) return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    if (score >= 40) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-neutral-400 bg-neutral-500/10 border-neutral-500/20';
  };

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'won': return 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30';
      case 'negotiation': return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'proposal': return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
      case 'qualified': return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'contacted': return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
      case 'new': return 'bg-amber-500/15 text-amber-500 border-amber-500/30';
      case 'lost': return 'bg-neutral-500/15 text-neutral-400 border-neutral-500/30';
    }
  };

  const getPriorityIndicator = (priority: Priority) => {
    switch (priority) {
      case 'urgent': return 'text-rose-500 font-semibold';
      case 'high': return 'text-amber-500 font-medium';
      case 'medium': return 'text-blue-400';
      case 'low': return 'text-neutral-400';
    }
  };

  return (
    <div className="space-y-4">
      {/* View Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <span>Leads & Commercial Inquiries</span>
            <span className="px-2 py-0.5 text-xs font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-md">
              {leads.length}
            </span>
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Capture, qualify, score, and convert high-intent prospective business accounts
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-lg text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={() => openQuickCreate('lead')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs shadow-blue-600/20 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Lead</span>
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
            placeholder="Search leads by contact name, company, email, or phone..."
            className="w-full text-xs bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-neutral-400 hover:text-neutral-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="proposal">Proposal</option>
            <option value="negotiation">Negotiation</option>
            <option value="won">Closed Won</option>
            <option value="lost">Closed Lost</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 focus:outline-none"
          >
            <option value="all">All Sources</option>
            <option value="Google Inbound">Google Inbound</option>
            <option value="Referral">Referral</option>
            <option value="LinkedIn Campaign">LinkedIn Campaign</option>
            <option value="Product Hunt">Product Hunt</option>
            <option value="Direct Inbound">Direct Inbound</option>
            <option value="Webinar">Webinar</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Banner (shows when rows are selected) */}
      {selectedLeadIds.length > 0 && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
            <span>{selectedLeadIds.length} leads selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBulkAssignOpen(true)}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Assign Rep
            </button>
            <button
              onClick={() => setIsBulkStatusOpen(true)}
              className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Change Status
            </button>
            <button
              onClick={() => setSelectedLeadIds([])}
              className="px-2.5 py-1 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Main Leads Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-950/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedLeadIds.length > 0 && selectedLeadIds.length === filteredLeads.length}
                    onChange={handleToggleSelectAll}
                    className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="py-3.5 px-3">Lead & Company</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3">Score</th>
                <th className="py-3.5 px-3">Priority</th>
                <th className="py-3.5 px-3">Expected Value</th>
                <th className="py-3.5 px-3">Assigned Rep</th>
                <th className="py-3.5 px-3">Source</th>
                <th className="py-3.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-neutral-400">
                    No leads found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const isSelected = selectedLeadIds.includes(lead.id);

                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors ${
                        isSelected ? 'bg-blue-500/5 dark:bg-blue-500/5' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(lead.id)}
                          className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      <td className="py-3 px-3">
                        <button
                          onClick={() => setActiveDetailLead(lead)}
                          className="text-left font-semibold text-neutral-900 dark:text-neutral-100 hover:text-blue-500 transition-colors"
                        >
                          {lead.fullName}
                        </button>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 mt-0.5">
                          <span>{lead.company}</span>
                          <span>·</span>
                          <span>{lead.phone}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border ${getStatusBadge(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] border ${getScoreColor(lead.leadScore)}`}>
                            {lead.leadScore}
                          </span>
                          {lead.leadScore >= 80 && <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`capitalize text-xs ${getPriorityIndicator(lead.priority)}`}>
                          {lead.priority}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                        ${lead.expectedValue.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-neutral-700 dark:text-neutral-300">
                        {lead.assignedUserName || 'Unassigned'}
                      </td>

                      <td className="py-3 px-3 text-neutral-500 dark:text-neutral-400 text-[11px]">
                        {lead.source}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {lead.status !== 'won' && (
                            <button
                              onClick={() => {
                                setConvertingLead(lead);
                                setConvertDealName(`${lead.company} — Commercial Contract`);
                                setConvertDealValue(lead.expectedValue);
                              }}
                              className="px-2 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded transition-colors flex items-center gap-1"
                              title="Convert to Customer Account"
                            >
                              <UserPlus className="w-3 h-3" />
                              <span>Convert</span>
                            </button>
                          )}

                          <button
                            onClick={() => setActiveDetailLead(lead)}
                            className="p-1 rounded text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            title="View Lead Details"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONVERT LEAD MODAL */}
      {convertingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-emerald-500" />
                  <span>Convert Lead to Customer</span>
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Promote {convertingLead.fullName} ({convertingLead.company}) into an active client account.
                </p>
              </div>
              <button onClick={() => setConvertingLead(null)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl space-y-1 text-xs">
              <div className="text-neutral-500">Contact: <span className="font-semibold text-neutral-900 dark:text-neutral-100">{convertingLead.fullName}</span></div>
              <div className="text-neutral-500">Email: <span className="font-semibold text-neutral-900 dark:text-neutral-100">{convertingLead.email}</span></div>
              <div className="text-neutral-500">Industry: <span className="font-semibold text-neutral-900 dark:text-neutral-100">{convertingLead.industry || 'General Commercial'}</span></div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-2 text-xs font-medium text-neutral-800 dark:text-neutral-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createDealOnConvert}
                  onChange={(e) => setCreateDealOnConvert(e.target.checked)}
                  className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Also generate initial Deal opportunity in Pipeline</span>
              </label>

              {createDealOnConvert && (
                <div className="space-y-3 pl-5 border-l-2 border-neutral-200 dark:border-neutral-800">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Deal Name
                    </label>
                    <input
                      type="text"
                      value={convertDealName}
                      onChange={(e) => setConvertDealName(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Deal Value ($ USD)
                    </label>
                    <input
                      type="number"
                      value={convertDealValue}
                      onChange={(e) => setConvertDealValue(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setConvertingLead(null)}
                className="px-4 py-2 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConvertLead}
                className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-sm"
              >
                Confirm Conversion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK ASSIGN MODAL */}
      {isBulkAssignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Bulk Reassign {selectedLeadIds.length} Leads
            </h3>
            <select
              value={bulkAssignUser}
              onChange={(e) => setBulkAssignUser(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
            >
              <option value="">Select sales representative...</option>
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsBulkAssignOpen(false)}
                className="px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-700"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteBulkAssign}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg"
              >
                Apply Reassignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK STATUS MODAL */}
      {isBulkStatusOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Bulk Change Status for {selectedLeadIds.length} Leads
            </h3>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as LeadStatus)}
              className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="proposal">Proposal</option>
              <option value="negotiation">Negotiation</option>
              <option value="won">Closed Won</option>
              <option value="lost">Closed Lost</option>
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsBulkStatusOpen(false)}
                className="px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-700"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteBulkStatus}
                className="px-3 py-1.5 bg-neutral-800 text-white text-xs font-semibold rounded-lg"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEAD DETAIL DRAWER */}
      {activeDetailLead && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 h-full overflow-y-auto p-6 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                    {activeDetailLead.fullName}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {activeDetailLead.company}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActiveDetailLead(null);
                    setSelectedLeadId(null);
                  }}
                  className="p-1 rounded text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status and Score Badges */}
              <div className="flex items-center justify-between py-4 border-b border-neutral-100 dark:border-neutral-800">
                <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold uppercase border ${getStatusBadge(activeDetailLead.status)}`}>
                  {activeDetailLead.status}
                </span>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-neutral-400 font-mono">Lead Score:</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono border ${getScoreColor(activeDetailLead.leadScore)}`}>
                    {activeDetailLead.leadScore}/100
                  </span>
                </div>
              </div>

              {/* Key Contact Info */}
              <div className="space-y-3 py-4 border-b border-neutral-100 dark:border-neutral-800 text-xs">
                <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                  <Mail className="w-4 h-4 text-neutral-400 shrink-0" />
                  <a href={`mailto:${activeDetailLead.email}`} className="hover:underline">{activeDetailLead.email}</a>
                </div>
                <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                  <Phone className="w-4 h-4 text-neutral-400 shrink-0" />
                  <a href={`tel:${activeDetailLead.phone}`} className="hover:underline">{activeDetailLead.phone}</a>
                </div>
                <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                  <Building className="w-4 h-4 text-neutral-400 shrink-0" />
                  <span>Industry: {activeDetailLead.industry || 'Commercial B2B'}</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300 font-mono">
                  <Briefcase className="w-4 h-4 text-neutral-400 shrink-0" />
                  <span>Expected Value: ${activeDetailLead.expectedValue.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                  <UserCheck className="w-4 h-4 text-neutral-400 shrink-0" />
                  <span>Assigned: {activeDetailLead.assignedUserName}</span>
                </div>
              </div>

              {/* Notes */}
              <div className="py-4 border-b border-neutral-100 dark:border-neutral-800">
                <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                  Engagement Notes
                </h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed bg-neutral-50 dark:bg-neutral-800/40 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800">
                  {activeDetailLead.notes || 'No notes logged yet.'}
                </p>
              </div>

              {/* Tags */}
              <div className="py-4">
                <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                  Tags & Segments
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeDetailLead.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded font-medium">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-3">
              <button
                onClick={() => handleDeleteLead(activeDetailLead.id, activeDetailLead.fullName)}
                className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                title="Delete Lead"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {activeDetailLead.status !== 'won' && (
                <button
                  onClick={() => {
                    setConvertingLead(activeDetailLead);
                    setConvertDealName(`${activeDetailLead.company} — Commercial Contract`);
                    setConvertDealValue(activeDetailLead.expectedValue);
                    setActiveDetailLead(null);
                  }}
                  className="flex-1 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors text-center shadow-sm"
                >
                  Convert to Customer
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
