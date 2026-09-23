import React, { useState, useEffect, useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import { api } from '../../lib/api';
import { Invoice, InvoiceStatus } from '../../types/crm';
import {
  FileText,
  Search,
  Plus,
  CreditCard,
  Printer,
  CheckCircle2,
  AlertCircle,
  Download,
  Building,
  Calendar,
  X,
} from 'lucide-react';

export const InvoicesView: React.FC = () => {
  const { openQuickCreate, showToast, triggerRefresh, refreshKey } = useCrm();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Preview Modal
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    setLoading(true);
    api.getInvoices()
      .then(setInvoices)
      .catch((err) => showToast({ type: 'error', title: 'Failed to fetch invoices', message: err.message }))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid': return 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30';
      case 'partially_paid': return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'sent': return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
      case 'draft': return 'bg-neutral-500/15 text-neutral-400 border-neutral-500/30';
      case 'overdue': return 'bg-rose-500/15 text-rose-500 border-rose-500/30';
      case 'cancelled': return 'bg-neutral-500/15 text-neutral-400 border-neutral-500/30';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <span>Invoices & Accounts Receivable</span>
            <span className="px-2 py-0.5 text-xs font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-md">
              {invoices.length}
            </span>
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Issue enterprise tax invoices, track payment milestones, and monitor collection aging
          </p>
        </div>

        <button
          onClick={() => openQuickCreate('invoice')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs shadow-blue-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Invoice</span>
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
            placeholder="Search invoices by invoice number or customer name..."
            className="w-full text-xs bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 focus:outline-none"
          >
            <option value="all">All Invoices</option>
            <option value="sent">Sent</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-950/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-3">Billed Customer</th>
                <th className="py-3.5 px-3">Issue Date</th>
                <th className="py-3.5 px-3">Due Date</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3">Total Amount</th>
                <th className="py-3.5 px-3">Amount Paid</th>
                <th className="py-3.5 px-3">Balance Due</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                    {inv.invoiceNumber}
                  </td>

                  <td className="py-3.5 px-3 font-medium text-neutral-800 dark:text-neutral-200">
                    {inv.customerName}
                  </td>

                  <td className="py-3.5 px-3 font-mono text-neutral-500 dark:text-neutral-400">
                    {inv.issueDate}
                  </td>

                  <td className="py-3.5 px-3 font-mono text-neutral-500 dark:text-neutral-400">
                    {inv.dueDate}
                  </td>

                  <td className="py-3.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border ${getStatusBadge(inv.status)}`}>
                      {inv.status.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                    ${inv.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>

                  <td className="py-3.5 px-3 font-mono text-emerald-600 dark:text-emerald-400">
                    ${inv.amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>

                  <td className="py-3.5 px-3 font-mono font-bold text-rose-600 dark:text-rose-400">
                    ${inv.balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {inv.balanceDue > 0 && (
                        <button
                          onClick={() => openQuickCreate('payment')}
                          className="px-2 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded transition-colors"
                          title="Record payment toward this invoice"
                        >
                          Record Pay
                        </button>
                      )}

                      <button
                        onClick={() => setPreviewInvoice(inv)}
                        className="px-2 py-1 text-[11px] font-medium text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors"
                      >
                        Preview
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* INVOICE PREVIEW MODAL */}
      {previewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar with Print Button */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center font-mono">
                  O
                </div>
                <span className="font-bold text-sm font-mono tracking-tight text-neutral-900 dark:text-neutral-100">
                  ORVEXA CRM INVOICE
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button onClick={() => setPreviewInvoice(null)} className="text-neutral-400 hover:text-neutral-600 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Invoice Meta */}
            <div className="grid grid-cols-2 gap-6 text-xs">
              <div>
                <span className="text-neutral-400 block mb-1">Billed To:</span>
                <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                  {previewInvoice.customerName}
                </h4>
                <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {previewInvoice.customerEmail}
                </p>
                <p className="text-neutral-500 dark:text-neutral-400">
                  {previewInvoice.customerAddress}
                </p>
              </div>

              <div className="text-right space-y-1">
                <div>
                  <span className="text-neutral-400">Invoice No:</span>{' '}
                  <strong className="font-mono text-neutral-900 dark:text-neutral-100">{previewInvoice.invoiceNumber}</strong>
                </div>
                <div>
                  <span className="text-neutral-400">Issue Date:</span>{' '}
                  <span className="font-mono text-neutral-700 dark:text-neutral-300">{previewInvoice.issueDate}</span>
                </div>
                <div>
                  <span className="text-neutral-400">Due Date:</span>{' '}
                  <span className="font-mono text-neutral-700 dark:text-neutral-300">{previewInvoice.dueDate}</span>
                </div>
                <div>
                  <span className="text-neutral-400">Status:</span>{' '}
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border ${getStatusBadge(previewInvoice.status)}`}>
                    {previewInvoice.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 text-[10px] uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Item Description</th>
                    <th className="py-2.5 px-3 text-right">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {previewInvoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-3 px-4 font-medium text-neutral-900 dark:text-neutral-100">
                        {item.description}
                      </td>
                      <td className="py-3 px-3 text-right font-mono">{item.quantity}</td>
                      <td className="py-3 px-3 text-right font-mono">${item.unitPrice.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold">${item.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations Breakdown */}
            <div className="flex justify-end text-xs">
              <div className="w-64 space-y-2 border-t border-neutral-200 dark:border-neutral-800 pt-3">
                <div className="flex justify-between text-neutral-500">
                  <span>Subtotal:</span>
                  <span className="font-mono">${previewInvoice.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Tax:</span>
                  <span className="font-mono">${previewInvoice.taxTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-neutral-900 dark:text-neutral-100 border-t border-neutral-200 dark:border-neutral-800 pt-2">
                  <span>Total Amount:</span>
                  <span className="font-mono">${previewInvoice.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-emerald-500 font-semibold">
                  <span>Amount Paid:</span>
                  <span className="font-mono">${previewInvoice.amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-rose-500 font-bold border-t border-dashed border-neutral-200 dark:border-neutral-800 pt-1">
                  <span>Balance Due:</span>
                  <span className="font-mono">${previewInvoice.balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
