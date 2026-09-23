import React, { useState, useEffect } from 'react';
import { useCrm } from '../../context/CrmContext';
import { api } from '../../lib/api';
import { User, Role } from '../../types/crm';
import {
  ShieldCheck,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  UserCheck,
  Mail,
  Building,
  Key,
  X,
  Lock,
  ArrowRight,
} from 'lucide-react';

export const TeamView: React.FC = () => {
  const { allUsers, currentUser, showToast, triggerRefresh, refreshKey } = useCrm();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Member Form
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: 'sales_executive' as Role,
    title: 'Senior Account Executive',
    department: 'Sales',
  });

  useEffect(() => {
    setLoading(true);
    api.getUsers()
      .then(setUsers)
      .catch((err: any) => showToast({ type: 'error', title: 'Failed to fetch team members', message: err.message }))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.includes(q) || u.department.toLowerCase().includes(q);
  });

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name || !newMember.email) {
      showToast({ type: 'warning', title: 'Name and email are required' });
      return;
    }
    try {
      await api.createUser({
        ...newMember,
        active: true,
      });
      showToast({ type: 'success', title: 'Team Member Added', message: newMember.name });
      setIsModalOpen(false);
      setNewMember({ name: '', email: '', role: 'sales_executive', title: 'Senior Account Executive', department: 'Sales' });
      triggerRefresh();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to add member', message: err.message });
    }
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'super_admin': return 'bg-rose-500/15 text-rose-500 border-rose-500/30';
      case 'admin': return 'bg-amber-500/15 text-amber-500 border-amber-500/30';
      case 'manager': return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'sales_executive': return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'accountant': return 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30';
      case 'support_agent': return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
    }
  };

  const permissionsMatrix = [
    { module: 'Leads & Inbound', super: 'Full', admin: 'Full', mgr: 'Full', sales: 'Assigned', acct: 'View', supp: 'View' },
    { module: 'Customers 360', super: 'Full', admin: 'Full', mgr: 'Full', sales: 'Full', acct: 'View', supp: 'View' },
    { module: 'Deals & Pipeline', super: 'Full', admin: 'Full', mgr: 'Full', sales: 'Assigned', acct: 'View', supp: 'None' },
    { module: 'Invoices & Billing', super: 'Full', admin: 'Full', mgr: 'View', sales: 'Create', acct: 'Full', supp: 'None' },
    { module: 'Payments Ledger', super: 'Full', admin: 'Full', mgr: 'View', sales: 'View', acct: 'Full', supp: 'None' },
    { module: 'Reports & Analytics', super: 'Full', admin: 'Full', mgr: 'Full', sales: 'Team', acct: 'Financial', supp: 'None' },
    { module: 'Team & RBAC Management', super: 'Full', admin: 'Full', mgr: 'None', sales: 'None', acct: 'None', supp: 'None' },
  ];

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <span>Team Directory & Role-Based Access Control (RBAC)</span>
            <span className="px-2 py-0.5 text-xs font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-md">
              {users.length} Users
            </span>
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Manage corporate access policies, security tiers, department assignments, and live identity switching
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs shadow-blue-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Team Member</span>
        </button>
      </div>

      {/* Team Members Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-950/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-3">Role Tier</th>
                <th className="py-3.5 px-3">Department</th>
                <th className="py-3.5 px-3">Title</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-4 text-right">Account Session</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
              {filteredUsers.map((u) => {
                const isCurrent = u.id === currentUser?.id;

                return (
                  <tr key={u.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-neutral-800 text-neutral-200 flex items-center justify-center font-bold text-xs font-mono">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                            <span>{u.name}</span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 text-[9px] bg-blue-500/10 text-blue-500 font-mono font-semibold rounded">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-neutral-400">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border ${getRoleBadge(u.role)}`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-neutral-700 dark:text-neutral-300">
                      {u.department}
                    </td>

                    <td className="py-3.5 px-3 text-neutral-500 dark:text-neutral-400">
                      {u.title}
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1 text-emerald-500 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {isCurrent ? (
                        <span className="px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 rounded-lg inline-flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Active Session</span>
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400 font-mono">
                          Password Protected
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RBAC Permission Matrix Card */}
      <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-500" />
              <span>Granular Role Permission Matrix</span>
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Enforced access control tiers across sensitive CRM financial, pipeline, and administrative records
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-950/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 text-[10px] uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-4">Module</th>
                <th className="py-2.5 px-3">Super Admin</th>
                <th className="py-2.5 px-3">Admin</th>
                <th className="py-2.5 px-3">Manager</th>
                <th className="py-2.5 px-3">Sales Exec</th>
                <th className="py-2.5 px-3">Accountant</th>
                <th className="py-2.5 px-3">Support</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80 font-mono text-[11px]">
              {permissionsMatrix.map((row) => (
                <tr key={row.module} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                  <td className="py-2.5 px-4 font-sans font-medium text-neutral-900 dark:text-neutral-100">
                    {row.module}
                  </td>
                  <td className="py-2.5 px-3 text-emerald-500 font-bold">{row.super}</td>
                  <td className="py-2.5 px-3 text-emerald-500">{row.admin}</td>
                  <td className="py-2.5 px-3 text-blue-500">{row.mgr}</td>
                  <td className="py-2.5 px-3 text-cyan-500">{row.sales}</td>
                  <td className="py-2.5 px-3 text-amber-500">{row.acct}</td>
                  <td className="py-2.5 px-3 text-neutral-400">{row.supp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MEMBER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Provision Team Member
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  placeholder="e.g. David Vance"
                  className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Work Email *
                </label>
                <input
                  type="email"
                  required
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  placeholder="david@orvexa.io"
                  className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Role Tier
                  </label>
                  <select
                    value={newMember.role}
                    onChange={(e) => setNewMember({ ...newMember, role: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="sales_executive">Sales Executive</option>
                    <option value="accountant">Accountant</option>
                    <option value="support_agent">Support Agent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={newMember.department}
                    onChange={(e) => setNewMember({ ...newMember, department: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  value={newMember.title}
                  onChange={(e) => setNewMember({ ...newMember, title: e.target.value })}
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
                  Confirm Provisioning
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
