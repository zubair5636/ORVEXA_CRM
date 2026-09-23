import React, { useState, useEffect } from 'react';
import { useCrm } from '../../context/CrmContext';
import { api } from '../../lib/api';
import { Product } from '../../types/crm';
import {
  Package,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Tag,
  DollarSign,
  X,
  Trash2,
} from 'lucide-react';

export const ProductsView: React.FC = () => {
  const { showToast, triggerRefresh, refreshKey } = useCrm();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Product Form
  const [newProd, setNewProd] = useState({
    name: '',
    sku: '',
    description: '',
    price: 999,
    type: 'product' as 'product' | 'service',
    category: 'Cloud SaaS',
  });

  useEffect(() => {
    setLoading(true);
    api.getProducts()
      .then(setProducts)
      .catch((err) => showToast({ type: 'error', title: 'Failed to fetch products', message: err.message }))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.name || !newProd.sku) {
      showToast({ type: 'warning', title: 'Name and SKU are required' });
      return;
    }
    try {
      await api.createProduct({
        ...newProd,
        price: Number(newProd.price),
        active: true,
      });
      showToast({ type: 'success', title: 'Product Added', message: newProd.name });
      setIsModalOpen(false);
      setNewProd({ name: '', sku: '', description: '', price: 999, type: 'product', category: 'Cloud SaaS' });
      triggerRefresh();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to add product', message: err.message });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete product "${name}"?`)) return;
    try {
      await api.deleteProduct(id);
      showToast({ type: 'info', title: 'Product Deleted' });
      triggerRefresh();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Delete failed', message: err.message });
    }
  };

  return (
    <div className="space-y-4">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <span>Products & Service Catalog</span>
            <span className="px-2 py-0.5 text-xs font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-md">
              {products.length}
            </span>
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Configure line items, pricing tiers, recurring software licenses, and billable service packages
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs shadow-blue-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Product</span>
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
            placeholder="Search products by SKU, name, or category..."
            className="w-full text-xs bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((p) => (
          <div
            key={p.id}
            className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                  {p.sku}
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 font-semibold">
                  {p.type.replace('_', ' ')}
                </span>
              </div>

              <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 mt-2">
                {p.name}
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                {p.description}
              </p>
            </div>

            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
              <div className="font-mono font-bold text-base text-neutral-900 dark:text-neutral-100">
                ${p.price.toLocaleString()}
                <span className="text-[10px] font-sans font-normal text-neutral-400 ml-1">
                  {p.type === 'service' ? '/mo subscription' : '/unit'}
                </span>
              </div>

              <button
                onClick={() => handleDelete(p.id, p.name)}
                className="p-1 rounded text-neutral-400 hover:text-rose-500 transition-colors"
                title="Delete Product"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Create Catalog Item
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Product / Service Name *
                </label>
                <input
                  type="text"
                  required
                  value={newProd.name}
                  onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                  placeholder="e.g. Enterprise Security Module"
                  className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProd.sku}
                    onChange={(e) => setNewProd({ ...newProd, sku: e.target.value })}
                    placeholder="SEC-ENT-01"
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Price ($ USD) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newProd.price}
                    onChange={(e) => setNewProd({ ...newProd, price: Number(e.target.value) })}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Billing Model
                  </label>
                  <select
                    value={newProd.type}
                    onChange={(e) => setNewProd({ ...newProd, type: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                  >
                    <option value="recurring">Recurring (Monthly/Annual)</option>
                    <option value="one_time">One-Time Fee</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={newProd.category}
                    onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                    placeholder="Cloud SaaS"
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newProd.description}
                  onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
                  placeholder="Included features, SLA response times, licensing terms..."
                  className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
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
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
