import React, { useState, useEffect } from 'react';
import { useCrm } from '../../context/CrmContext';
import { api } from '../../lib/api';
import { Appointment, FollowUp } from '../../types/crm';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Video,
  MapPin,
  Phone,
} from 'lucide-react';

export const CalendarView: React.FC = () => {
  const { openQuickCreate, showToast, refreshKey } = useCrm();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getAppointments(), api.getFollowUps()])
      .then(([appts, fus]) => {
        setAppointments(appts);
        setFollowUps(fus);
      })
      .catch((err) => showToast({ type: 'error', title: 'Calendar sync failed', message: err.message }))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  // Calendar Date Math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Events on selected day
  const dayAppointments = appointments.filter((a) => a.date === selectedDay);
  const dayFollowUps = followUps.filter((f) => f.date === selectedDay);

  return (
    <div className="space-y-4">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <span>Corporate Schedule & Calendar</span>
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Synchronized calendar of client appointments, discovery demos, and scheduled check-ins
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => openQuickCreate('appointment')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs shadow-blue-600/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Book Appointment</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Calendar on Left, Selected Day Events on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid (2 cols on large screens) */}
        <div className="lg:col-span-2 p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 font-mono">
              {monthNames[month]} {year}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-2.5 py-1 text-xs font-medium border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-neutral-400 font-mono py-1">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Blank cells for offset */}
            {[...Array(firstDayOfMonth)].map((_, i) => (
              <div key={`empty-${i}`} className="h-20 sm:h-24 rounded-xl bg-neutral-50/50 dark:bg-neutral-950/20" />
            ))}

            {/* Day Cells */}
            {[...Array(daysInMonth)].map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isSelected = selectedDay === dateStr;
              const dayAppts = appointments.filter((a) => a.date === dateStr);
              const dayFus = followUps.filter((f) => f.date === dateStr);
              const totalEvents = dayAppts.length + dayFus.length;

              return (
                <div
                  key={dayNum}
                  onClick={() => setSelectedDay(dateStr)}
                  className={`h-20 sm:h-24 p-2 rounded-xl border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500/5 dark:bg-blue-500/10 shadow-xs'
                      : 'border-neutral-200/60 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-mono text-xs font-semibold ${isSelected ? 'text-blue-500' : 'text-neutral-700 dark:text-neutral-300'}`}>
                      {dayNum}
                    </span>
                    {totalEvents > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    )}
                  </div>

                  <div className="space-y-1 overflow-hidden">
                    {dayAppts.slice(0, 1).map((a) => (
                      <div
                        key={a.id}
                        className="text-[10px] font-medium bg-blue-500/15 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded truncate"
                      >
                        {a.title}
                      </div>
                    ))}
                    {dayFus.slice(0, 1).map((f) => (
                      <div
                        key={f.id}
                        className="text-[10px] font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 px-1.5 py-0.5 rounded truncate"
                      >
                        {f.title}
                      </div>
                    ))}
                    {totalEvents > 2 && (
                      <div className="text-[9px] text-neutral-400 font-mono">
                        +{totalEvents - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Agenda Sidebar */}
        <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Agenda for {selectedDay}
              </h3>
              <span className="text-xs font-mono text-neutral-400">
                {dayAppointments.length + dayFollowUps.length} Events
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Scheduled client appointments & touchpoint tasks
            </p>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-thin">
            {dayAppointments.length === 0 && dayFollowUps.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-400 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
                No events scheduled on this date.
              </div>
            ) : (
              <>
                {dayAppointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {appt.title}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500 text-white font-semibold uppercase">
                        {appt.type}
                      </span>
                    </div>

                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-neutral-400" />
                      <span>{appt.startTime} – {appt.endTime}</span>
                    </div>

                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Client: <strong>{appt.customerName}</strong> · Host: {appt.employeeName}
                    </div>

                    {appt.location && (
                      <div className="text-[11px] text-blue-500 flex items-center gap-1 font-mono">
                        <Video className="w-3 h-3" />
                        <span>{appt.location}</span>
                      </div>
                    )}
                  </div>
                ))}

                {dayFollowUps.map((fu) => (
                  <div
                    key={fu.id}
                    className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {fu.title}
                      </span>
                      <span className="text-[10px] font-mono uppercase text-neutral-500">
                        {fu.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-400 font-mono">
                      Time: {fu.time} · Client: {fu.relatedName}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
