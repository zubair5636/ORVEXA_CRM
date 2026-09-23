import React, { useState, useEffect, useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import { api } from '../../lib/api';
import { Payment } from '../../types/crm';
import {
  CreditCard,
  Search,
  Plus,
  ArrowUpRight,
  Building,
  Calendar,
  CheckCircle2,
  DollarSign,
  X,
} from 'lucide-react';

export const PaymentsView: React.FC = () => {
  const { openQuickCreate, showToast, refreshKey } = useCrm();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    api.getPayments()
      .then(setPayments)
      .catch((err) => showToast({ type: 'error', title: 'Failed to fetch payments', message: err.message }))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const q = searchQuery.toLowerCase();
      return (
        !q ||
        p.customerName.toLowerCase().includes(q) ||
        p.invoiceNumber.toLowerCase().includes(q) ||
        (p.reference && p.reference.toLowerCase().includes(q))
      );
    });
  }, [payments, searchQuery]);

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-4">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <span>Payments & Collections Ledger</span>
            <span className="px-2 py-0.5 text-xs font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-md">
              {payments.length}
            </span>
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Total Settled Collections: <strong className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">${totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
          </p>
        </div>

        <button
          onClick={() => openQuickCreate('payment')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs shadow-emerald-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Record Payment</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <Search className="w-4 h-4 text-neutral-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search payments by customer, invoice number, or wire reference..."
            className="w-full text-xs bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-950/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Receipt Date</th>
                <th className="py-3.5 px-3">Payer Account</th>
                <th className="py-3.5 px-3">Linked Invoice</th>
                <th className="py-3.5 px-3">Amount</th>
                <th className="py-3.5 px-3">Settlement Method</th>
                <th className="py-3.5 px-3">Transaction Reference</th>
                <th className="py-3.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-neutral-700 dark:text-neutral-300">
                    {p.paymentDate}
                  </td>

                  <td className="py-3.5 px-3 font-semibold text-neutral-900 dark:text-neutral-100">
                    {p.customerName}
                  </td>

                  <td className="py-3.5 px-3 font-mono text-neutral-500 dark:text-neutral-400">
                    {p.invoiceNumber}
                  </td>

                  <td className="py-3.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    ${p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>

                  <td className="py-3.5 px-3 uppercase font-mono text-[10px] text-neutral-600 dark:text-neutral-300">
                    {p.method.replace('_', ' ')}
                  </td>

                  <td className="py-3.5 px-3 font-mono text-neutral-400">
                    {p.reference || 'DIRECT-CLEAR'}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-500 font-semibold border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Settled</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
