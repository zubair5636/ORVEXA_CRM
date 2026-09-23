import React, { useState, useEffect, useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import { api } from '../../lib/api';
import { Customer, Deal, Invoice, Payment, Task, Appointment, Document, CommunicationLog, Activity } from '../../types/crm';
import {
  Users,
  Search,
  Plus,
  Building,
  Mail,
  Phone,
  Briefcase,
  FileText,
  CreditCard,
  CheckSquare,
  Calendar,
  FolderOpen,
  MessageSquare,
  ArrowRight,
  DollarSign,
  ChevronLeft,
  X,
  Trash2,
  Clock,
  Sparkles,
} from 'lucide-react';

export const CustomersView: React.FC = () => {
  const {
    allUsers,
    showToast,
    triggerRefresh,
    refreshKey,
    openQuickCreate,
    selectedCustomerId,
    setSelectedCustomerId,
  } = useCrm();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');

  // Customer 360 Profile State
  const [active360Id, setActive360Id] = useState<string | null>(selectedCustomerId);
  const [customer360, setCustomer360] = useState<{
    customer: Customer;
    deals: Deal[];
    invoices: Invoice[];
    payments: Payment[];
    tasks: Task[];
    appointments: Appointment[];
    documents: Document[];
    communications: CommunicationLog[];
    activities: Activity[];
    financialSummary: { totalInvoiced: number; totalPaid: number; totalOutstanding: number };
  } | null>(null);

  const [loading360, setLoading360] = useState(false);
  const [activeTab360, setActiveTab360] = useState<'overview' | 'deals' | 'invoices' | 'payments' | 'tasks' | 'appointments' | 'documents' | 'timeline'>('overview');

  useEffect(() => {
    setLoading(true);
    api.getCustomers()
      .then(setCustomers)
      .catch((err) => showToast({ type: 'error', title: 'Failed to fetch customers', message: err.message }))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  useEffect(() => {
    if (selectedCustomerId) {
      setActive360Id(selectedCustomerId);
    }
  }, [selectedCustomerId]);

  // Load 360 profile whenever active360Id changes
  useEffect(() => {
    if (!active360Id) {
      setCustomer360(null);
      return;
    }
    setLoading360(true);
    api.getCustomer360(active360Id)
      .then(setCustomer360)
      .catch((err) => {
        showToast({ type: 'error', title: 'Failed to load Customer 360', message: err.message });
        setActive360Id(null);
        setSelectedCustomerId(null);
      })
      .finally(() => setLoading360(false));
  }, [active360Id, refreshKey]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        cust.company.toLowerCase().includes(q) ||
        cust.name.toLowerCase().includes(q) ||
        cust.email.toLowerCase().includes(q) ||
        cust.phone.includes(q);

      const matchesIndustry = industryFilter === 'all' || cust.industry === industryFilter;
      return matchesSearch && matchesIndustry;
    });
  }, [customers, searchQuery, industryFilter]);

  const handleDeleteCustomer = async (id: string, company: string) => {
    if (!window.confirm(`Delete customer account for "${company}"?`)) return;
    try {
      await api.deleteCustomer(id);
      showToast({ type: 'info', title: 'Customer Deleted', message: company });
      if (active360Id === id) {
        setActive360Id(null);
        setSelectedCustomerId(null);
      }
      triggerRefresh();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Delete failed', message: err.message });
    }
  };

  // If a customer is opened in Customer 360 mode, render the full 360 interactive profile!
  if (active360Id && customer360) {
    const { customer, deals, invoices, payments, tasks, appointments, documents, activities, financialSummary } = customer360;

    return (
      <div className="space-y-6">
        {/* Back Button & Account Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActive360Id(null);
                setSelectedCustomerId(null);
              }}
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors"
              title="Back to Customers Directory"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                  {customer.company}
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded">
                  {customer.status}
                </span>
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 flex items-center gap-2">
                <span>Contact: <strong className="text-neutral-800 dark:text-neutral-200">{customer.name}</strong></span>
                <span>·</span>
                <span>{customer.industry}</span>
                <span>·</span>
                <span>Rep: {customer.assignedUserName}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openQuickCreate('deal')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              + Create Deal
            </button>
            <button
              onClick={() => openQuickCreate('invoice')}
              className="px-3 py-1.5 bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-white text-white dark:text-neutral-900 rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              + Issue Invoice
            </button>
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
            <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">
              Total Invoiced
            </div>
            <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
              ${financialSummary.totalInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">Across {invoices.length} billing cycles</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
            <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">
              Total Paid
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              ${financialSummary.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">Verified wire & card receipts</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
            <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">
              Outstanding Balance
            </div>
            <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
              ${financialSummary.totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">Pending collection</div>
          </div>
        </div>

        {/* 360 Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto text-xs pb-px">
          {[
            { id: 'overview', label: 'Overview', icon: Building },
            { id: 'deals', label: `Deals (${deals.length})`, icon: Briefcase },
            { id: 'invoices', label: `Invoices (${invoices.length})`, icon: FileText },
            { id: 'payments', label: `Payments (${payments.length})`, icon: CreditCard },
            { id: 'tasks', label: `Tasks (${tasks.length})`, icon: CheckSquare },
            { id: 'appointments', label: `Appointments (${appointments.length})`, icon: Calendar },
            { id: 'documents', label: `Documents (${documents.length})`, icon: FolderOpen },
            { id: 'timeline', label: `Timeline (${activities.length})`, icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab360 === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab360(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 font-medium border-b-2 transition-all whitespace-nowrap ${
                  active
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="space-y-4">
          {/* TAB 1: OVERVIEW */}
          {activeTab360 === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs space-y-4">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Account Details & Operational Profile
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-neutral-400 block mb-0.5">Primary Contact:</span>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">{customer.name}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block mb-0.5">Corporate Email:</span>
                    <a href={`mailto:${customer.email}`} className="text-blue-500 hover:underline">{customer.email}</a>
                  </div>
                  <div>
                    <span className="text-neutral-400 block mb-0.5">Phone:</span>
                    <span className="font-mono text-neutral-900 dark:text-neutral-100">{customer.phone}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block mb-0.5">Address:</span>
                    <span className="text-neutral-900 dark:text-neutral-100">{customer.address || 'Address not listed'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block mb-0.5">Industry:</span>
                    <span className="text-neutral-900 dark:text-neutral-100">{customer.industry}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block mb-0.5">Account Manager:</span>
                    <span className="text-neutral-900 dark:text-neutral-100">{customer.assignedUserName}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <span className="text-neutral-400 block text-xs mb-1">Strategic Account Notes:</span>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/40 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 leading-relaxed">
                    {customer.notes || 'No detailed notes entered.'}
                  </p>
                </div>

                <div className="pt-2">
                  <span className="text-neutral-400 block text-xs mb-1.5">Tags & Classification:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {customer.tags.map((t) => (
                      <span key={t} className="px-2 py-0.5 text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar Quick Stats */}
              <div className="space-y-4">
                <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs space-y-3 text-xs">
                  <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">
                    Relationship Telemetry
                  </h4>
                  <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                    <span className="text-neutral-400">Client Since</span>
                    <span className="font-mono text-neutral-700 dark:text-neutral-300">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                    <span className="text-neutral-400">Deals Closed</span>
                    <span className="font-mono text-neutral-700 dark:text-neutral-300">
                      {deals.filter((d) => d.stage === 'won').length} won
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                    <span className="text-neutral-400">Total Payments</span>
                    <span className="font-mono text-emerald-500 font-semibold">{payments.length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DEALS */}
          {activeTab360 === 'deals' && (
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 dark:bg-neutral-950/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 text-[10px] uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Deal Name</th>
                    <th className="py-3 px-4">Value</th>
                    <th className="py-3 px-4">Stage</th>
                    <th className="py-3 px-4">Win Prob.</th>
                    <th className="py-3 px-4">Close Date</th>
                    <th className="py-3 px-4">Rep</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
                  {deals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-neutral-400">No deals created for this customer yet.</td>
                    </tr>
                  ) : (
                    deals.map((d) => (
                      <tr key={d.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                        <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-neutral-100">{d.name}</td>
                        <td className="py-3 px-4 font-mono font-bold text-neutral-900 dark:text-neutral-100">${d.value.toLocaleString()}</td>
                        <td className="py-3 px-4 capitalize">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-500 font-semibold uppercase">
                            {d.stage}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono">{d.probability}%</td>
                        <td className="py-3 px-4 text-neutral-400 font-mono">{d.expectedCloseDate}</td>
                        <td className="py-3 px-4">{d.assignedUserName}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: INVOICES */}
          {activeTab360 === 'invoices' && (
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 dark:bg-neutral-950/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 text-[10px] uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Amount Paid</th>
                    <th className="py-3 px-4">Balance Due</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-neutral-400">No invoices issued for this customer yet.</td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                        <td className="py-3 px-4 font-mono font-semibold text-neutral-900 dark:text-neutral-100">{inv.invoiceNumber}</td>
                        <td className="py-3 px-4 font-mono font-bold">${inv.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 font-mono text-emerald-500">${inv.amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 font-mono text-rose-500 font-semibold">${inv.balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 capitalize">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 uppercase">
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-neutral-400">{inv.dueDate}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: PAYMENTS */}
          {activeTab360 === 'payments' && (
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 dark:bg-neutral-950/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 text-[10px] uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Receipt Date</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Invoice Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-neutral-400">No payment receipts logged yet.</td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                        <td className="py-3 px-4 font-mono text-neutral-400">{p.paymentDate}</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-500">${p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 uppercase font-mono text-[11px]">{p.method.replace('_', ' ')}</td>
                        <td className="py-3 px-4 font-mono text-neutral-400">{p.reference || 'N/A'}</td>
                        <td className="py-3 px-4 font-mono">{p.invoiceNumber}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 5: TIMELINE */}
          {activeTab360 === 'timeline' && (
            <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs space-y-4">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Audited Interaction History
              </h3>
              <div className="space-y-3">
                {activities.length === 0 ? (
                  <div className="py-6 text-center text-xs text-neutral-400">No audit log entries for this account.</div>
                ) : (
                  activities.map((a) => (
                    <div key={a.id} className="flex items-start gap-3 text-xs pb-3 border-b border-neutral-100 dark:border-neutral-800/60 last:border-0">
                      <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                        <Clock className="w-3 h-3" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-neutral-900 dark:text-neutral-100">{a.title}</span>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {new Date(a.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">{a.description}</p>
                        <span className="text-[10px] text-neutral-400 mt-0.5 block">Logged by {a.performedByName}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // DIRECTORY TABLE VIEW (LIST OF ALL CUSTOMERS)
  return (
    <div className="space-y-4">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <span>Customer Accounts Directory</span>
            <span className="px-2 py-0.5 text-xs font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-md">
              {customers.length}
            </span>
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Manage active client accounts, contract values, cross-module relationships, and Customer 360 dossiers
          </p>
        </div>

        <button
          onClick={() => openQuickCreate('customer')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs shadow-blue-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Customer</span>
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
            placeholder="Search customer by company name, primary contact, email, or phone..."
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
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 focus:outline-none"
          >
            <option value="all">All Industries</option>
            <option value="Real Estate">Real Estate</option>
            <option value="Clinics & Healthcare">Clinics & Healthcare</option>
            <option value="Gyms & Wellness">Gyms & Wellness</option>
            <option value="Digital Agency">Digital Agency</option>
            <option value="Coaching & Education">Coaching & Education</option>
            <option value="General Commercial">General Commercial</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-950/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Company Account</th>
                <th className="py-3.5 px-3">Primary Contact</th>
                <th className="py-3.5 px-3">Industry</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3">Lifetime Value</th>
                <th className="py-3.5 px-3">Account Rep</th>
                <th className="py-3.5 px-4 text-right">Customer 360</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    No customers found matching query.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr
                    key={cust.id}
                    className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors cursor-pointer group"
                    onClick={() => setActive360Id(cust.id)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-500 transition-colors">
                        {cust.company}
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        {cust.address || cust.city || 'San Francisco, CA'}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="text-neutral-800 dark:text-neutral-200 font-medium">{cust.name}</div>
                      <div className="text-[11px] text-neutral-400">{cust.email}</div>
                    </td>

                    <td className="py-3.5 px-3 text-neutral-600 dark:text-neutral-300">
                      {cust.industry}
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-semibold">
                        {cust.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                      ${cust.lifetimeValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-3 text-neutral-700 dark:text-neutral-300">
                      {cust.assignedUserName || 'Assigned Staff'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActive360Id(cust.id);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <span>View 360</span>
                        <ArrowRight className="w-3 h-3" />
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
