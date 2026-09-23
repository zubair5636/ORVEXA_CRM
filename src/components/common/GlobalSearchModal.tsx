import React, { useState, useEffect, useRef } from 'react';
import { useCrm } from '../../context/CrmContext';
import { api } from '../../lib/api';
import { Search, UserCheck, Users, Briefcase, CheckSquare, FileText, Package, ArrowRight, X } from 'lucide-react';
import { Lead, Customer, Deal, Task, Invoice, Product } from '../../types/crm';

export const GlobalSearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, setActiveView, setSelectedCustomerId, setSelectedLeadId } = useCrm();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    leads: Lead[];
    customers: Customer[];
    deals: Deal[];
    tasks: Task[];
    invoices: Invoice[];
    products: Product[];
  }>({
    leads: [],
    customers: [],
    deals: [],
    tasks: [],
    invoices: [],
    products: [],
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const handleClose = () => {
    setIsSearchOpen(false);
  };

  useEffect(() => {
    if (isSearchOpen) {
      triggerRef.current = document.activeElement as HTMLElement | null;
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults({ leads: [], customers: [], deals: [], tasks: [], invoices: [], products: [] });

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          setIsSearchOpen(false);
        }
      };

      window.addEventListener('keydown', handleKeyDown, true);
      return () => {
        window.removeEventListener('keydown', handleKeyDown, true);
      };
    } else if (triggerRef.current) {
      triggerRef.current.focus?.();
    }
  }, [isSearchOpen, setIsSearchOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ leads: [], customers: [], deals: [], tasks: [], invoices: [], products: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.search(query);
        setResults(res);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isSearchOpen) return null;

  const totalResults =
    results.leads.length +
    results.customers.length +
    results.deals.length +
    results.tasks.length +
    results.invoices.length +
    results.products.length;

  const handleSelectLead = (id: string) => {
    setSelectedLeadId(id);
    setActiveView('leads');
    setIsSearchOpen(false);
  };

  const handleSelectCustomer = (id: string) => {
    setSelectedCustomerId(id);
    setActiveView('customers');
    setIsSearchOpen(false);
  };

  const handleSelectDeal = () => {
    setActiveView('deals');
    setIsSearchOpen(false);
  };

  const handleSelectTask = () => {
    setActiveView('tasks');
    setIsSearchOpen(false);
  };

  const handleSelectInvoice = () => {
    setActiveView('invoices');
    setIsSearchOpen(false);
  };

  const handleSelectProduct = () => {
    setActiveView('products');
    setIsSearchOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Global Search"
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-neutral-100 dark:border-neutral-800/80 gap-3">
          <Search className="w-5 h-5 text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search leads, customers, deals, invoices, tasks, products..."
            className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Escape') handleClose();
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 px-1.5 py-0.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Clear search text"
            >
              Clear
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-medium text-neutral-400 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded select-none">
            ESC
          </kbd>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ml-0.5"
            aria-label="Close search"
            title="Close search (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {loading && (
            <div className="py-8 text-center text-xs text-neutral-400">
              Searching ORVEXA database...
            </div>
          )}

          {!loading && query && totalResults === 0 && (
            <div className="py-8 text-center">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                No matching records found for "{query}"
              </p>
            </div>
          )}

          {!loading && !query && (
            <div className="py-6 px-3 text-center">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Type keywords like <span className="font-semibold text-neutral-700 dark:text-neutral-300">"Rahul"</span>, <span className="font-semibold text-neutral-700 dark:text-neutral-300">"Nova"</span>, or <span className="font-semibold text-neutral-700 dark:text-neutral-300">"INV-2026"</span> to search across all CRM entities.
              </p>
            </div>
          )}

          {/* LEADS GROUP */}
          {results.leads.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold tracking-wider uppercase text-neutral-400 px-3 mb-1.5 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                Leads
              </div>
              <div className="space-y-1">
                {results.leads.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => handleSelectLead(lead.id)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/70 flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                        {lead.fullName}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                        <span>{lead.company}</span>
                        <span>·</span>
                        <span className="capitalize">{lead.status}</span>
                        <span>·</span>
                        <span className="font-mono">${lead.expectedValue.toLocaleString()}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CUSTOMERS GROUP */}
          {results.customers.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold tracking-wider uppercase text-neutral-400 px-3 mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-500" />
                Customers
              </div>
              <div className="space-y-1">
                {results.customers.map((cust) => (
                  <button
                    key={cust.id}
                    onClick={() => handleSelectCustomer(cust.id)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/70 flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                        {cust.company}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                        <span>Contact: {cust.name}</span>
                        <span>·</span>
                        <span>{cust.industry}</span>
                        <span>·</span>
                        <span className="font-mono">LTV: ${cust.lifetimeValue.toLocaleString()}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* DEALS GROUP */}
          {results.deals.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold tracking-wider uppercase text-neutral-400 px-3 mb-1.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                Deals
              </div>
              <div className="space-y-1">
                {results.deals.map((deal) => (
                  <button
                    key={deal.id}
                    onClick={handleSelectDeal}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/70 flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                        {deal.name}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                        <span>{deal.customerName}</span>
                        <span>·</span>
                        <span className="capitalize">{deal.stage}</span>
                        <span>·</span>
                        <span className="font-mono font-medium">${deal.value.toLocaleString()}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* INVOICES GROUP */}
          {results.invoices.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold tracking-wider uppercase text-neutral-400 px-3 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                Invoices
              </div>
              <div className="space-y-1">
                {results.invoices.map((inv) => (
                  <button
                    key={inv.id}
                    onClick={handleSelectInvoice}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/70 flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                        {inv.invoiceNumber} — {inv.customerName}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                        <span className="capitalize">{inv.status}</span>
                        <span>·</span>
                        <span className="font-mono">${inv.total.toLocaleString()}</span>
                        <span>·</span>
                        <span className="text-rose-400 font-mono">Due: ${inv.balanceDue.toLocaleString()}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TASKS GROUP */}
          {results.tasks.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold tracking-wider uppercase text-neutral-400 px-3 mb-1.5 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-cyan-500" />
                Tasks
              </div>
              <div className="space-y-1">
                {results.tasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={handleSelectTask}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/70 flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                        {task.title}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                        <span className="capitalize">{task.status}</span>
                        <span>·</span>
                        <span>Due: {task.dueDate}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PRODUCTS GROUP */}
          {results.products.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold tracking-wider uppercase text-neutral-400 px-3 mb-1.5 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-purple-500" />
                Products & Services
              </div>
              <div className="space-y-1">
                {results.products.map((prod) => (
                  <button
                    key={prod.id}
                    onClick={handleSelectProduct}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/70 flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                        {prod.name} ({prod.sku})
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                        <span className="capitalize">{prod.type}</span>
                        <span>·</span>
                        <span className="font-mono">${prod.price.toLocaleString()}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
