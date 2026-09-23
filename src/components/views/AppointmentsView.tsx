import React, { useState, useEffect, useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import { api } from '../../lib/api';
import { Appointment, AppointmentStatus } from '../../types/crm';
import {
  Calendar as CalendarIcon,
  Search,
  Plus,
  Clock,
  Video,
  MapPin,
  CheckCircle2,
  XCircle,
  Building,
  UserCheck,
  X,
  Trash2,
} from 'lucide-react';

export const AppointmentsView: React.FC = () => {
  const { openQuickCreate, showToast, triggerRefresh, refreshKey } = useCrm();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    setLoading(true);
    api.getAppointments()
      .then(setAppointments)
      .catch((err) => showToast({ type: 'error', title: 'Failed to fetch appointments', message: err.message }))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        (a.customerName && a.customerName.toLowerCase().includes(q)) ||
        (a.employeeName && a.employeeName.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [appointments, searchQuery, statusFilter]);

  const handleUpdateStatus = async (id: string, newStatus: AppointmentStatus) => {
    try {
      await api.updateAppointment(id, { status: newStatus });
      showToast({ type: 'success', title: 'Appointment Updated', message: `Marked as ${newStatus}` });
      triggerRefresh();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Update failed', message: err.message });
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Cancel and delete appointment "${title}"?`)) return;
    try {
      await api.deleteAppointment(id);
      showToast({ type: 'info', title: 'Appointment Deleted' });
      triggerRefresh();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to delete appointment', message: err.message });
    }
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30';
      case 'scheduled': return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'cancelled': return 'bg-neutral-500/15 text-neutral-400 border-neutral-500/30';
      case 'no_show': return 'bg-rose-500/15 text-rose-500 border-rose-500/30';
    }
  };

  return (
    <div className="space-y-4">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <span>Client Appointments & Bookings</span>
            <span className="px-2 py-0.5 text-xs font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-md">
              {appointments.length}
            </span>
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Coordinate enterprise product walkthroughs, onboarding sessions, and executive strategy calls
          </p>
        </div>

        <button
          onClick={() => openQuickCreate('appointment')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs shadow-blue-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Book Appointment</span>
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
            placeholder="Search appointments by meeting title, account, or staff..."
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>
        </div>
      </div>

      {/* Appointments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAppointments.length === 0 ? (
          <div className="col-span-full py-12 text-center text-neutral-400 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-xs">
            No appointments found.
          </div>
        ) : (
          filteredAppointments.map((appt) => (
            <div
              key={appt.id}
              className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border ${getStatusBadge(appt.status)}`}>
                    {appt.status.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-semibold">
                    {appt.type}
                  </span>
                </div>

                <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 mt-2">
                  {appt.title}
                </h3>

                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                  Client: <strong className="text-neutral-800 dark:text-neutral-200">{appt.customerName}</strong>
                </div>

                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Host: {appt.employeeName}
                </div>

                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 mt-2 font-mono">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{appt.date} · {appt.startTime} – {appt.endTime}</span>
                </div>

                {appt.location && (
                  <div className="text-[11px] text-blue-500 flex items-center gap-1 mt-1 font-mono">
                    <Video className="w-3 h-3" />
                    <span>{appt.location}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  {appt.status === 'scheduled' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(appt.id, 'completed')}
                        className="px-2 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded transition-colors"
                      >
                        Completed
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(appt.id, 'no_show')}
                        className="px-2 py-1 text-[11px] font-medium text-rose-500 hover:bg-rose-500/10 rounded transition-colors"
                      >
                        No Show
                      </button>
                    </>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(appt.id, appt.title)}
                  className="p-1 rounded text-neutral-400 hover:text-rose-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
