import React, { useState, useEffect } from 'react';
import { useCrm } from '../../context/CrmContext';
import { api } from '../../lib/api';
import { CompanySettings, CustomField } from '../../types/crm';
import {
  Settings,
  Building,
  Sliders,
  Database,
  RotateCcw,
  CheckCircle2,
  Save,
  Plus,
  Trash2,
  Layers,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { showToast, triggerRefresh, refreshKey } = useCrm();
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Industry Template Presets
  const industries = [
    { id: 'General Commercial', desc: 'Standard B2B SaaS, Professional Services, and Consulting' },
    { id: 'Real Estate', desc: 'Property listings, broker commissions, buyers & escrow tracking' },
    { id: 'Clinics & Healthcare', desc: 'Patient appointments, treatments, clinical intake & insurance' },
    { id: 'Gyms & Wellness', desc: 'Memberships, recurring plans, PT sessions, body assessments' },
    { id: 'Digital Agency', desc: 'Retainers, creative milestones, deliverable approvals, sprint billings' },
    { id: 'Coaching & Education', desc: 'Student enrollment, course batches, batch counseling, fee schedules' },
  ];

  // New Custom Field Form
  const [newField, setNewField] = useState({
    entity: 'lead' as 'lead' | 'customer' | 'deal',
    label: '',
    type: 'text' as 'text' | 'number' | 'dropdown' | 'date',
    required: false,
    options: '',
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getSettings() as Promise<any>, api.getCustomFields()])
      .then(([setts, cfs]) => {
        setSettings(setts);
        setCustomFields(cfs);
      })
      .catch((err) => showToast({ type: 'error', title: 'Settings load failed', message: err.message }))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const handleSaveCompanySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      await api.updateSettings(settings as any);
      showToast({ type: 'success', title: 'Settings Saved', message: 'Company profile updated' });
      triggerRefresh();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Save failed', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleAddCustomField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newField.label) {
      showToast({ type: 'warning', title: 'Field label is required' });
      return;
    }
    try {
      const created = await api.createCustomField({
        entity: newField.entity,
        label: newField.label,
        name: newField.label.toLowerCase().replace(/\s+/g, '_'),
        type: newField.type,
        required: newField.required,
        options: newField.options ? newField.options.split(',').map((o) => o.trim()) : undefined,
      });
      setCustomFields((prev) => [...prev, created]);
      showToast({ type: 'success', title: 'Custom Field Added', message: newField.label });
      setNewField({ entity: 'lead', label: '', type: 'text', required: false, options: '' });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to create field', message: err.message });
    }
  };

  const handleDeleteField = async (id: string, label: string) => {
    if (!window.confirm(`Delete custom field "${label}"?`)) return;
    try {
      await api.deleteCustomField(id);
      setCustomFields((prev) => prev.filter((f) => f.id !== id));
      showToast({ type: 'info', title: 'Custom Field Deleted' });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Delete failed', message: err.message });
    }
  };

  const handleResetDatabase = async () => {
    if (!window.confirm('Reset database to clean default seed state? This restores all enterprise demo data.')) return;
    try {
      await api.resetDatabase();
      showToast({ type: 'success', title: 'Database Reset', message: 'Loaded fresh multi-industry enterprise CRM data' });
      triggerRefresh();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Reset failed', message: err.message });
    }
  };

  if (!settings) {
    return <div className="py-12 text-center text-xs text-neutral-400">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <span>Corporate Settings & Industry Architecture</span>
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Configure enterprise tenant branding, custom schema fields, pipeline stages, and multi-industry presets
          </p>
        </div>

        <button
          onClick={handleResetDatabase}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-xs font-semibold transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Demo Data</span>
        </button>
      </div>

      {/* Main Settings Tabs / Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Organization Profile & Industry Presets */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Company Profile */}
          <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-500" />
              <span>Enterprise Organization Profile</span>
            </h3>

            <form onSubmit={handleSaveCompanySettings} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Company Legal Name
                  </label>
                  <input
                    type="text"
                    value={settings.companyName}
                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                  />
                </div>

                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Base Currency
                  </label>
                  <select
                    value={settings.currency}
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 font-mono"
                  >
                    <option value="USD">USD ($ - United States Dollar)</option>
                    <option value="EUR">EUR (€ - Euro)</option>
                    <option value="GBP">GBP (£ - British Pound)</option>
                    <option value="CAD">CAD ($ - Canadian Dollar)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Corporate Timezone
                  </label>
                  <input
                    type="text"
                    value={settings.timezone}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Standard Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    value={settings.taxRate}
                    onChange={(e) => setSettings({ ...settings, taxRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving Changes...' : 'Save Company Profile'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Industry Preset Switcher */}
          <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-500" />
                <span>Industry Adaptation Presets</span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Switch CRM core operational terminology, pipeline stages, and field schemas for different commercial verticals
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {industries.map((ind) => {
                const isSelected = settings.industry === ind.id;

                return (
                  <div
                    key={ind.id}
                    onClick={async () => {
                      const updated = { ...settings, industry: ind.id };
                      setSettings(updated);
                      await api.updateSettings(updated as any);
                      showToast({ type: 'success', title: 'Preset Activated', message: ind.id });
                    }}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all space-y-1.5 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/5 dark:bg-blue-500/10 shadow-xs'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-neutral-900 dark:text-neutral-100">
                        {ind.id}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                      {ind.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Custom Field Builder */}
        <div className="space-y-6">
          <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-500" />
                <span>Custom Schema Fields</span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Extend CRM tables with custom fields
              </p>
            </div>

            <form onSubmit={handleAddCustomField} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Target Entity
                </label>
                <select
                  value={newField.entity}
                  onChange={(e) => setNewField({ ...newField, entity: e.target.value as any })}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                >
                  <option value="lead">Leads</option>
                  <option value="customer">Customers</option>
                  <option value="deal">Deals</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Field Label *
                </label>
                <input
                  type="text"
                  required
                  value={newField.label}
                  onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                  placeholder="e.g. Budget Authority, Referral ID"
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Field Type
                </label>
                <select
                  value={newField.type}
                  onChange={(e) => setNewField({ ...newField, type: e.target.value as any })}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                >
                  <option value="text">Text String</option>
                  <option value="number">Numeric</option>
                  <option value="date">Date</option>
                  <option value="dropdown">Dropdown Selection</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom Field</span>
              </button>
            </form>

            {/* List of active custom fields */}
            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
                Active Schema Customizations ({customFields.length})
              </span>

              {customFields.map((cf) => (
                <div
                  key={cf.id}
                  className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {cf.label}
                    </span>
                    <div className="text-[10px] text-neutral-400 font-mono">
                      Target: {cf.entity.toUpperCase()} · Type: {cf.type}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteField(cf.id, cf.label)}
                    className="p-1 rounded text-neutral-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
