import React, { useState, useEffect } from 'react';
import { useCrm } from '../../context/CrmContext';
import { api } from '../../lib/api';
import { X, UserPlus, Users, Briefcase, CheckSquare, PhoneCall, Calendar, FileText, CreditCard } from 'lucide-react';
import { Customer, Product, Priority, DealStage, TaskStatus, FollowUpType } from '../../types/crm';

export const QuickCreateModal: React.FC = () => {
  const { isQuickCreateOpen, setIsQuickCreateOpen, quickCreateDefaultTab, allUsers, showToast, triggerRefresh } = useCrm();
  const [activeTab, setActiveTab] = useState('lead');
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Forms State
  const [leadForm, setLeadForm] = useState({
    fullName: '',
    company: '',
    email: '',
    phone: '',
    source: 'Google Inbound',
    priority: 'medium' as Priority,
    expectedValue: 15000,
    assignedTo: '',
    notes: '',
  });

  const [customerForm, setCustomerForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    industry: 'Digital Agency',
    assignedTo: '',
    notes: '',
  });

  const [dealForm, setDealForm] = useState({
    name: '',
    customerId: '',
    value: 25000,
    stage: 'proposal' as DealStage,
    probability: 60,
    expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    assignedTo: '',
    notes: '',
  });

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as Priority,
    status: 'pending' as TaskStatus,
    dueDate: new Date().toISOString().split('T')[0],
    assignedTo: '',
    relatedCustomerId: '',
  });

  const [followUpForm, setFollowUpForm] = useState({
    title: '',
    type: 'call' as FollowUpType,
    relatedType: 'customer' as 'lead' | 'customer',
    relatedId: '',
    date: new Date().toISOString().split('T')[0],
    time: '14:00',
    assignedTo: '',
    notes: '',
  });

  const [appointmentForm, setAppointmentForm] = useState({
    title: '',
    customerId: '',
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:00',
    type: 'demo',
    location: 'Google Meet',
    notes: '',
  });

  const [invoiceForm, setInvoiceForm] = useState({
    customerId: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: 'Enterprise CRM Setup & Licensing',
    amount: 15000,
    taxRate: 8.5,
    notes: 'Net 14 payment terms.',
  });

  const [paymentForm, setPaymentForm] = useState({
    customerId: '',
    invoiceId: '',
    amount: 5000,
    paymentDate: new Date().toISOString().split('T')[0],
    method: 'bank_transfer',
    reference: 'WIRE-',
    notes: '',
  });

  useEffect(() => {
    if (isQuickCreateOpen) {
      if (quickCreateDefaultTab) setActiveTab(quickCreateDefaultTab);
      api.getCustomers().then(setCustomers).catch(() => {});
      api.getProducts().then(setProducts).catch(() => {});
      if (allUsers.length > 0) {
        const defaultUser = allUsers[0].id;
        setLeadForm((prev) => ({ ...prev, assignedTo: prev.assignedTo || defaultUser }));
        setCustomerForm((prev) => ({ ...prev, assignedTo: prev.assignedTo || defaultUser }));
        setDealForm((prev) => ({ ...prev, assignedTo: prev.assignedTo || defaultUser }));
        setTaskForm((prev) => ({ ...prev, assignedTo: prev.assignedTo || defaultUser }));
        setFollowUpForm((prev) => ({ ...prev, assignedTo: prev.assignedTo || defaultUser }));
        setAppointmentForm((prev) => ({ ...prev, employeeId: prev.employeeId || defaultUser }));
      }
    }
  }, [isQuickCreateOpen, quickCreateDefaultTab, allUsers]);

  if (!isQuickCreateOpen) return null;

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.fullName || !leadForm.company) {
      showToast({ type: 'warning', title: 'Name and Company are required' });
      return;
    }
    setLoading(true);
    try {
      await api.createLead({
        ...leadForm,
        status: 'new',
        tags: ['New Inbound'],
        expectedValue: Number(leadForm.expectedValue),
      });
      showToast({ type: 'success', title: 'Lead Created', message: `${leadForm.fullName} was added to leads.` });
      triggerRefresh();
      setIsQuickCreateOpen(false);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Error creating lead', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.company || !customerForm.name) {
      showToast({ type: 'warning', title: 'Company and contact name are required' });
      return;
    }
    setLoading(true);
    try {
      await api.createCustomer({
        ...customerForm,
        status: 'active',
        lifetimeValue: 0,
        tags: ['Client'],
      });
      showToast({ type: 'success', title: 'Customer Account Created', message: `${customerForm.company} is now an active account.` });
      triggerRefresh();
      setIsQuickCreateOpen(false);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Error creating customer', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealForm.name || !dealForm.customerId) {
      showToast({ type: 'warning', title: 'Deal name and customer are required' });
      return;
    }
    setLoading(true);
    try {
      const selectedCust = customers.find((c) => c.id === dealForm.customerId);
      await api.createDeal({
        ...dealForm,
        customerName: selectedCust?.company || 'Enterprise Account',
        value: Number(dealForm.value),
        currency: 'USD',
        probability: Number(dealForm.probability),
        stage: dealForm.stage as any,
      });
      showToast({ type: 'success', title: 'Deal Created', message: `Deal added to pipeline: ${dealForm.name}` });
      triggerRefresh();
      setIsQuickCreateOpen(false);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Error creating deal', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title) {
      showToast({ type: 'warning', title: 'Task title is required' });
      return;
    }
    setLoading(true);
    try {
      const selectedCust = customers.find((c) => c.id === taskForm.relatedCustomerId);
      await api.createTask({
        ...taskForm,
        priority: taskForm.priority as any,
        status: taskForm.status as any,
        relatedCustomerName: selectedCust?.company,
      });
      showToast({ type: 'success', title: 'Task Created', message: `Task "${taskForm.title}" scheduled.` });
      triggerRefresh();
      setIsQuickCreateOpen(false);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Error creating task', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpForm.title || !followUpForm.relatedId) {
      showToast({ type: 'warning', title: 'Title and related customer are required' });
      return;
    }
    setLoading(true);
    try {
      const selectedCust = customers.find((c) => c.id === followUpForm.relatedId);
      await api.createFollowUp({
        ...followUpForm,
        type: followUpForm.type as any,
        relatedType: 'customer',
        relatedName: selectedCust?.company || 'Account',
        status: 'pending',
      });
      showToast({ type: 'success', title: 'Follow-up Scheduled', message: `Follow-up set for ${followUpForm.date}` });
      triggerRefresh();
      setIsQuickCreateOpen(false);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Error scheduling follow-up', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentForm.title || !appointmentForm.customerId) {
      showToast({ type: 'warning', title: 'Title and customer are required' });
      return;
    }
    setLoading(true);
    try {
      const selectedCust = customers.find((c) => c.id === appointmentForm.customerId);
      const selectedEmp = allUsers.find((u) => u.id === appointmentForm.employeeId);
      await api.createAppointment({
        ...appointmentForm,
        customerName: selectedCust?.company,
        employeeName: selectedEmp?.name || 'Staff',
        reminderMinutes: 30,
        status: 'scheduled',
        type: appointmentForm.type as any,
      });
      showToast({ type: 'success', title: 'Appointment Booked', message: `Meeting booked for ${appointmentForm.date} at ${appointmentForm.startTime}` });
      triggerRefresh();
      setIsQuickCreateOpen(false);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Error booking appointment', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.customerId) {
      showToast({ type: 'warning', title: 'Customer is required' });
      return;
    }
    setLoading(true);
    try {
      const selectedCust = customers.find((c) => c.id === invoiceForm.customerId);
      const subtotal = Number(invoiceForm.amount);
      const taxRate = Number(invoiceForm.taxRate);
      const taxTotal = subtotal * (taxRate / 100);
      const total = subtotal + taxTotal;

      await api.createInvoice({
        customerId: invoiceForm.customerId,
        customerName: selectedCust?.company || 'Client',
        customerEmail: selectedCust?.email || '',
        customerAddress: selectedCust?.address || '',
        issueDate: invoiceForm.issueDate,
        dueDate: invoiceForm.dueDate,
        items: [
          {
            id: 'item_custom_01',
            description: invoiceForm.description,
            quantity: 1,
            unitPrice: subtotal,
            discount: 0,
            taxRate,
            total,
          },
        ],
        subtotal,
        discountTotal: 0,
        taxTotal,
        total,
        amountPaid: 0,
        balanceDue: total,
        status: 'sent',
        notes: invoiceForm.notes,
      });
      showToast({ type: 'success', title: 'Invoice Issued', message: `Invoice for $${total.toLocaleString()} created.` });
      triggerRefresh();
      setIsQuickCreateOpen(false);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Error issuing invoice', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.customerId || !paymentForm.amount) {
      showToast({ type: 'warning', title: 'Customer and amount are required' });
      return;
    }
    setLoading(true);
    try {
      const selectedCust = customers.find((c) => c.id === paymentForm.customerId);
      await api.recordPayment({
        customerId: paymentForm.customerId,
        customerName: selectedCust?.company || 'Client',
        invoiceId: paymentForm.invoiceId || 'direct_payment',
        invoiceNumber: paymentForm.invoiceId ? 'Linked' : 'DIRECT-PAY',
        amount: Number(paymentForm.amount),
        paymentDate: paymentForm.paymentDate,
        method: paymentForm.method as any,
        reference: paymentForm.reference,
        notes: paymentForm.notes,
      });
      showToast({ type: 'success', title: 'Payment Recorded', message: `Received $${Number(paymentForm.amount).toLocaleString()} from ${selectedCust?.company}` });
      triggerRefresh();
      setIsQuickCreateOpen(false);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Error recording payment', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in">
      <div
        className="w-full max-w-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Quick Create Record
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Instantly create and link any CRM entity to the live database
            </p>
          </div>
          <button
            onClick={() => setIsQuickCreateOpen(false)}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 px-6 py-2.5 bg-neutral-50 dark:bg-neutral-900/60 border-b border-neutral-100 dark:border-neutral-800 overflow-x-auto text-xs">
          {[
            { id: 'lead', label: 'Lead', icon: UserPlus },
            { id: 'customer', label: 'Customer', icon: Users },
            { id: 'deal', label: 'Deal', icon: Briefcase },
            { id: 'task', label: 'Task', icon: CheckSquare },
            { id: 'followup', label: 'Follow-up', icon: PhoneCall },
            { id: 'appointment', label: 'Appointment', icon: Calendar },
            { id: 'invoice', label: 'Invoice', icon: FileText },
            { id: 'payment', label: 'Payment', icon: CreditCard },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200/50 dark:hover:bg-neutral-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* 1. LEAD FORM */}
          {activeTab === 'lead' && (
            <form onSubmit={handleSubmitLead} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Contact Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={leadForm.fullName}
                    onChange={(e) => setLeadForm({ ...leadForm, fullName: e.target.value })}
                    placeholder="e.g. Rachel Adams"
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={leadForm.company}
                    onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })}
                    placeholder="e.g. Apex Industrial Corp"
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    placeholder="rachel@apexindustrial.com"
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                    placeholder="+1 (415) 555-0199"
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Lead Source
                  </label>
                  <select
                    value={leadForm.source}
                    onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Google Inbound">Google Inbound</option>
                    <option value="Referral">Referral</option>
                    <option value="LinkedIn Campaign">LinkedIn Campaign</option>
                    <option value="Direct Inbound">Direct Inbound</option>
                    <option value="Webinar">Webinar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={leadForm.priority}
                    onChange={(e) => setLeadForm({ ...leadForm, priority: e.target.value as Priority })}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Expected Value ($)
                  </label>
                  <input
                    type="number"
                    value={leadForm.expectedValue}
                    onChange={(e) => setLeadForm({ ...leadForm, expectedValue: Number(e.target.value) })}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Assign Sales Representative
                </label>
                <select
                  value={leadForm.assignedTo}
                  onChange={(e) => setLeadForm({ ...leadForm, assignedTo: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                >
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.title} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Discovery & Engagement Notes
                </label>
                <textarea
                  rows={2}
                  value={leadForm.notes}
                  onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                  placeholder="Key requirements, budget considerations, next discussion points..."
                  className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuickCreateOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 rounded-lg transition-colors shadow-sm"
                >
                  {loading ? 'Creating...' : 'Create Lead'}
                </button>
              </div>
            </form>
          )}

          {/* 2. CUSTOMER FORM */}
          {activeTab === 'customer' && (
            <form onSubmit={handleSubmitCustomer} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerForm.company}
                    onChange={(e) => setCustomerForm({ ...customerForm, company: e.target.value })}
                    placeholder="e.g. Sterling Capital Group"
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Primary Contact Person *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                    placeholder="e.g. Jason Sterling"
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Corporate Email
                  </label>
                  <input
                    type="email"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    placeholder="jason@sterlingcap.com"
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    placeholder="+1 (212) 555-8822"
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Industry Domain
                  </label>
                  <select
                    value={customerForm.industry}
                    onChange={(e) => setCustomerForm({ ...customerForm, industry: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Real Estate">Real Estate</option>
                    <option value="Clinics & Healthcare">Clinics & Healthcare</option>
                    <option value="Gyms & Wellness">Gyms & Wellness</option>
                    <option value="Coaching & Education">Coaching & Education</option>
                    <option value="Automotive">Automotive</option>
                    <option value="Digital Agency">Digital Agency</option>
                    <option value="Professional Services">Professional Services</option>
                    <option value="General Commercial">General Commercial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Account Manager
                  </label>
                  <select
                    value={customerForm.assignedTo}
                    onChange={(e) => setCustomerForm({ ...customerForm, assignedTo: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                  >
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Billing Address
                </label>
                <input
                  type="text"
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                  placeholder="350 5th Ave, New York, NY 10118"
                  className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuickCreateOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 rounded-lg transition-colors shadow-sm"
                >
                  {loading ? 'Creating...' : 'Create Customer'}
                </button>
              </div>
            </form>
          )}

          {/* 3. DEAL FORM */}
          {activeTab === 'deal' && (
            <form onSubmit={handleSubmitDeal} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Deal Name *
                </label>
                <input
                  type="text"
                  required
                  value={dealForm.name}
                  onChange={(e) => setDealForm({ ...dealForm, name: e.target.value })}
                  placeholder="e.g. Nova Realty — 40-Seat Cloud Enterprise Expansion"
                  className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Related Customer *
                  </label>
                  <select
                    required
                    value={dealForm.customerId}
                    onChange={(e) => setDealForm({ ...dealForm, customerId: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select customer account...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company} ({c.name})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Deal Value ($ USD) *
                  </label>
                  <input
                    type="number"
                    required
                    value={dealForm.value}
                    onChange={(e) => setDealForm({ ...dealForm, value: Number(e.target.value) })}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Pipeline Stage
                  </label>
                  <select
                    value={dealForm.stage}
                    onChange={(e) => setDealForm({ ...dealForm, stage: e.target.value as DealStage })}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="new">New</option>
                    <option value="qualified">Qualified</option>
                    <option value="proposal">Proposal</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="won">Closed Won</option>
                    <option value="lost">Closed Lost</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Win Probability (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={dealForm.probability}
                    onChange={(e) => setDealForm({ ...dealForm, probability: Number(e.target.value) })}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Expected Close Date
                  </label>
                  <input
                    type="date"
                    value={dealForm.expectedCloseDate}
                    onChange={(e) => setDealForm({ ...dealForm, expectedCloseDate: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Assign Salesperson
                </label>
                <select
                  value={dealForm.assignedTo}
                  onChange={(e) => setDealForm({ ...dealForm, assignedTo: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                >
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuickCreateOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 rounded-lg transition-colors shadow-sm"
                >
                  {loading ? 'Creating...' : 'Create Deal'}
                </button>
              </div>
            </form>
          )}

          {/* 4. TASK FORM */}
          {activeTab === 'task' && (
            <form onSubmit={handleSubmitTask} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="e.g. Send revised SLA document to procurement"
                  className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as Priority })}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Assignee
                  </label>
                  <select
                    value={taskForm.assignedTo}
                    onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                  >
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Related Account
                  </label>
                  <select
                    value={taskForm.relatedCustomerId}
                    onChange={(e) => setTaskForm({ ...taskForm, relatedCustomerId: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">None (Internal task)</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuickCreateOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 rounded-lg transition-colors shadow-sm"
                >
                  {loading ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          )}

          {/* 5. FOLLOW UP FORM */}
          {activeTab === 'followup' && (
            <form onSubmit={handleSubmitFollowUp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Follow-up Action Summary *
                </label>
                <input
                  type="text"
                  required
                  value={followUpForm.title}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, title: e.target.value })}
                  placeholder="e.g. Check in on proposal feedback and next steps"
                  className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Channel / Type
                  </label>
                  <select
                    value={followUpForm.type}
                    onChange={(e) => setFollowUpForm({ ...followUpForm, type: e.target.value as FollowUpType })}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="call">Phone Call</option>
                    <option value="whatsapp">WhatsApp Message</option>
                    <option value="email">Email</option>
                    <option value="meeting">In-Person Meeting</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Customer Account *
                  </label>
                  <select
                    required
                    value={followUpForm.relatedId}
                    onChange={(e) => setFollowUpForm({ ...followUpForm, relatedId: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select customer...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company} ({c.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    value={followUpForm.date}
                    onChange={(e) => setFollowUpForm({ ...followUpForm, date: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Scheduled Time
                  </label>
                  <input
                    type="time"
                    value={followUpForm.time}
                    onChange={(e) => setFollowUpForm({ ...followUpForm, time: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuickCreateOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 rounded-lg transition-colors shadow-sm"
                >
                  {loading ? 'Scheduling...' : 'Schedule Follow-up'}
                </button>
              </div>
            </form>
          )}

          {/* 6. APPOINTMENT FORM */}
          {activeTab === 'appointment' && (
            <form onSubmit={handleSubmitAppointment} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Meeting / Appointment Title *
                </label>
                <input
                  type="text"
                  required
                  value={appointmentForm.title}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, title: e.target.value })}
                  placeholder="e.g. Architecture Demo & Security Compliance Walkthrough"
                  className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Client Account *
                  </label>
                  <select
                    required
                    value={appointmentForm.customerId}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, customerId: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select customer...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company} ({c.name})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Host Staff
                  </label>
                  <select
                    value={appointmentForm.employeeId}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, employeeId: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                  >
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={appointmentForm.date}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={appointmentForm.startTime}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, startTime: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={appointmentForm.endTime}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, endTime: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuickCreateOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 rounded-lg transition-colors shadow-sm"
                >
                  {loading ? 'Booking...' : 'Book Appointment'}
                </button>
              </div>
            </form>
          )}

          {/* 7. INVOICE FORM */}
          {activeTab === 'invoice' && (
            <form onSubmit={handleSubmitInvoice} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Billed Customer *
                  </label>
                  <select
                    required
                    value={invoiceForm.customerId}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, customerId: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select customer...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company} ({c.name})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Line Item Description
                  </label>
                  <input
                    type="text"
                    value={invoiceForm.description}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Subtotal ($)
                  </label>
                  <input
                    type="number"
                    value={invoiceForm.amount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: Number(e.target.value) })}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={invoiceForm.taxRate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, taxRate: Number(e.target.value) })}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Payment Due Date
                  </label>
                  <input
                    type="date"
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuickCreateOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 rounded-lg transition-colors shadow-sm"
                >
                  {loading ? 'Creating...' : 'Create & Send Invoice'}
                </button>
              </div>
            </form>
          )}

          {/* 8. PAYMENT FORM */}
          {activeTab === 'payment' && (
            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Customer Account *
                  </label>
                  <select
                    required
                    value={paymentForm.customerId}
                    onChange={(e) => setPaymentForm({ ...paymentForm, customerId: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select customer...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company} ({c.name})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Payment Amount ($) *
                  </label>
                  <input
                    type="number"
                    required
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="bank_transfer">Bank Transfer / Wire</option>
                    <option value="card">Corporate Credit Card</option>
                    <option value="upi">UPI / Instant Pay</option>
                    <option value="cash">Cash / Cheque</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Reference / Transaction ID
                  </label>
                  <input
                    type="text"
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                    placeholder="e.g. WIRE-883921"
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuickCreateOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-sm"
                >
                  {loading ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
