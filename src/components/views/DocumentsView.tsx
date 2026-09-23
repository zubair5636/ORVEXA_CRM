import React, { useState, useEffect } from 'react';
import { useCrm } from '../../context/CrmContext';
import { api } from '../../lib/api';
import { Document, Customer } from '../../types/crm';
import {
  FolderOpen,
  Search,
  Plus,
  FileText,
  FileCode,
  Download,
  Trash2,
  Calendar,
  Building,
  X,
} from 'lucide-react';

export const DocumentsView: React.FC = () => {
  const { showToast, triggerRefresh, refreshKey } = useCrm();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Document Form
  const [newDoc, setNewDoc] = useState({
    title: '',
    customerId: '',
    type: 'contract' as any,
    fileSize: '1.8 MB',
    tags: 'SLA, Signed, Enterprise',
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getDocuments(), api.getCustomers()])
      .then(([docList, custList]) => {
        setDocuments(docList);
        setCustomers(custList);
        if (custList.length > 0) {
          setNewDoc((prev) => ({ ...prev, customerId: prev.customerId || custList[0].id }));
        }
      })
      .catch((err) => showToast({ type: 'error', title: 'Failed to fetch documents', message: err.message }))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const filteredDocs = documents.filter((doc) => {
    const q = searchQuery.toLowerCase();
    const title = doc.title || doc.name || '';
    const cust = doc.customerName || doc.relatedName || '';
    const dtype = doc.type || doc.category || '';
    return (
      !q ||
      title.toLowerCase().includes(q) ||
      cust.toLowerCase().includes(q) ||
      dtype.toLowerCase().includes(q)
    );
  });

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.title || !newDoc.customerId) {
      showToast({ type: 'warning', title: 'Title and Customer are required' });
      return;
    }
    const targetCust = customers.find((c) => c.id === newDoc.customerId);
    try {
      await api.createDocument({
        title: newDoc.title,
        customerId: newDoc.customerId,
        customerName: targetCust?.company || 'Account',
        type: newDoc.type,
        fileSize: newDoc.fileSize,
        fileUrl: '#',
        tags: newDoc.tags.split(',').map((t) => t.trim()),
      });
      showToast({ type: 'success', title: 'Document Uploaded', message: newDoc.title });
      setIsModalOpen(false);
      setNewDoc({ title: '', customerId: customers[0]?.id || '', type: 'contract', fileSize: '2.1 MB', tags: 'SLA' });
      triggerRefresh();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Upload failed', message: err.message });
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete document "${title}"?`)) return;
    try {
      await api.deleteDocument(id);
      showToast({ type: 'info', title: 'Document Deleted' });
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
            <span>Enterprise Document Vault</span>
            <span className="px-2 py-0.5 text-xs font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-md">
              {documents.length}
            </span>
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Encrypted repository for enterprise MSAs, SLAs, NDAs, security compliance dossiers, and billing records
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs shadow-blue-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Upload Document</span>
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
            placeholder="Search documents by title, customer account, or document type..."
            className="w-full text-xs bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                  <FileText className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-semibold">
                  {doc.type}
                </span>
              </div>

              <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 mt-2 line-clamp-1">
                {doc.title}
              </h3>

              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                Account: <strong className="text-neutral-800 dark:text-neutral-200">{doc.customerName}</strong>
              </div>

              <div className="flex flex-wrap gap-1 mt-2">
                {(doc.tags || []).map((t: string) => (
                  <span key={t} className="px-1.5 py-0.2 text-[9px] bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded font-medium">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
              <span className="text-[10px] font-mono text-neutral-400">
                {doc.fileSize} · {new Date(doc.createdAt).toLocaleDateString()}
              </span>

              <div className="flex items-center gap-1.5">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    showToast({ type: 'info', title: 'File Download', message: `Downloading ${doc.title}...` });
                  }}
                  className="p-1 rounded text-neutral-400 hover:text-blue-500"
                  title="Download File"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => handleDelete(doc.id, doc.title || doc.name || 'Document')}
                  className="p-1 rounded text-neutral-400 hover:text-rose-500"
                  title="Delete Document"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* UPLOAD DOCUMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Upload Enterprise Document
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  value={newDoc.title}
                  onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                  placeholder="e.g. Master Services Agreement 2026"
                  className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Linked Customer Account *
                </label>
                <select
                  required
                  value={newDoc.customerId}
                  onChange={(e) => setNewDoc({ ...newDoc, customerId: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Document Type
                  </label>
                  <select
                    value={newDoc.type}
                    onChange={(e) => setNewDoc({ ...newDoc, type: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                  >
                    <option value="contract">Contract / MSA</option>
                    <option value="proposal">Commercial Proposal</option>
                    <option value="invoice">Invoice / Receipt</option>
                    <option value="other">Other / NDA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    File Size
                  </label>
                  <input
                    type="text"
                    value={newDoc.fileSize}
                    onChange={(e) => setNewDoc({ ...newDoc, fileSize: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={newDoc.tags}
                  onChange={(e) => setNewDoc({ ...newDoc, tags: e.target.value })}
                  placeholder="Enterprise, Signed, Legal"
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
                  Confirm Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
