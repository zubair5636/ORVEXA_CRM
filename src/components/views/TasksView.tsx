import React, { useState, useEffect, useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import { api } from '../../lib/api';
import { Task, TaskStatus, Priority } from '../../types/crm';
import {
  CheckSquare,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Building,
  UserCheck,
  X,
  Trash2,
} from 'lucide-react';

export const TasksView: React.FC = () => {
  const { openQuickCreate, showToast, triggerRefresh, refreshKey, allUsers } = useCrm();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  useEffect(() => {
    setLoading(true);
    api.getTasks()
      .then(setTasks)
      .catch((err) => showToast({ type: 'error', title: 'Failed to fetch tasks', message: err.message }))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        (t.relatedCustomerName && t.relatedCustomerName.toLowerCase().includes(q)) ||
        (t.assignedUserName && t.assignedUserName.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter]);

  const handleToggleTaskStatus = async (task: Task) => {
    const newStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await api.updateTask(task.id, { status: newStatus });
      showToast({
        type: 'success',
        title: newStatus === 'completed' ? 'Task Completed' : 'Task Reopened',
        message: task.title,
      });
      triggerRefresh();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to update task', message: err.message });
    }
  };

  const handleDeleteTask = async (id: string, title: string) => {
    if (!window.confirm(`Delete task "${title}"?`)) return;
    try {
      await api.deleteTask(id);
      showToast({ type: 'info', title: 'Task Deleted' });
      triggerRefresh();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to delete task', message: err.message });
    }
  };

  const getPriorityBadge = (p: Priority) => {
    switch (p) {
      case 'urgent': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'high': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'medium': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'low': return 'text-neutral-400 bg-neutral-500/10 border-neutral-500/20';
    }
  };

  return (
    <div className="space-y-4">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <span>Operational Tasks & Queue</span>
            <span className="px-2 py-0.5 text-xs font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-md">
              {tasks.length}
            </span>
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Manage team assignments, SLA milestones, customer action items, and deliverable deadlines
          </p>
        </div>

        <button
          onClick={() => openQuickCreate('task')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs shadow-blue-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Task</span>
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
            placeholder="Search tasks by title, customer, or assignee..."
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
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-950/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5 w-10 text-center">Status</th>
                <th className="py-3.5 px-3">Task Title & Details</th>
                <th className="py-3.5 px-3">Related Account</th>
                <th className="py-3.5 px-3">Priority</th>
                <th className="py-3.5 px-3">Due Date</th>
                <th className="py-3.5 px-3">Assignee</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    No tasks match the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const isDone = task.status === 'completed';

                  return (
                    <tr
                      key={task.id}
                      className={`hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors ${
                        isDone ? 'opacity-60 bg-neutral-50/50 dark:bg-neutral-900/40' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleToggleTaskStatus(task)}
                          className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                            isDone
                              ? 'bg-emerald-500 text-white'
                              : 'border border-neutral-300 dark:border-neutral-700 hover:border-blue-500'
                          }`}
                          title={isDone ? 'Mark Pending' : 'Mark Completed'}
                        >
                          {isDone && <CheckCircle2 className="w-4 h-4" />}
                        </button>
                      </td>

                      <td className="py-3 px-3">
                        <div className={`font-semibold text-neutral-900 dark:text-neutral-100 ${isDone ? 'line-through text-neutral-400' : ''}`}>
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">
                            {task.description}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-neutral-700 dark:text-neutral-300">
                        {task.relatedCustomerName || <span className="text-neutral-400 italic">Internal</span>}
                      </td>

                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border ${getPriorityBadge(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono text-neutral-500 dark:text-neutral-400">
                        {task.dueDate}
                      </td>

                      <td className="py-3 px-3 text-neutral-700 dark:text-neutral-300">
                        {task.assignedUserName}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteTask(task.id, task.title)}
                          className="p-1 rounded text-neutral-400 hover:text-rose-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          title="Delete Task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
