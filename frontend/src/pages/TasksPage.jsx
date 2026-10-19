import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  Circle,
  Video,
  Trash2,
  Edit2,
  X,
  Sparkles,
  LayoutGrid,
  List as ListIcon,
  Flag,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const priorityColors = {
  Low: 'text-slate-400 bg-slate-800/80 border-slate-700',
  Medium: 'text-brand-electric bg-brand-blue/15 border-brand-blue/30',
  High: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
  Critical: 'text-rose-400 bg-rose-500/15 border-rose-500/30',
};

const TasksPage = () => {
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assigneeName: user?.name || '',
    priority: 'Medium',
    dueDate: '',
  });

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const [tasksRes, statsRes, teamRes] = await Promise.allSettled([
        api.get('/tasks'),
        api.get('/tasks/stats'),
        api.get('/teams'),
      ]);

      if (tasksRes.status === 'fulfilled' && tasksRes.value.data?.success) {
        setTasks(tasksRes.value.data.tasks || []);
      }
      if (statsRes.status === 'fulfilled' && statsRes.value.data?.success) {
        setStats(statsRes.value.data.stats || null);
      }
      if (teamRes.status === 'fulfilled' && teamRes.value.data?.success) {
        setTeamMembers(teamRes.value.data.team?.members || []);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/tasks', taskForm);
      if (res.data?.success) {
        setIsCreateModalOpen(false);
        setTaskForm({
          title: '',
          description: '',
          assigneeName: user?.name || '',
          priority: 'Medium',
          dueDate: '',
        });
        fetchTasks();
      }
    } catch (err) {
      alert('Could not create task: ' + err.message);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
      );
      // Refresh stats
      const statsRes = await api.get('/tasks/stats');
      if (statsRes.data?.success) setStats(statsRes.data.stats);
    } catch (err) {
      alert('Could not update status: ' + err.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      const statsRes = await api.get('/tasks/stats');
      if (statsRes.data?.success) setStats(statsRes.data.stats);
    } catch (err) {
      alert('Could not delete task: ' + err.message);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority.toLowerCase() !== priorityFilter.toLowerCase())
      return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.assigneeName && t.assigneeName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const columns = ['To Do', 'In Progress', 'Completed'];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Action Items & Tasks
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Intelligent task boards linked directly to AI meeting transcript extractions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-navy-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-brand-blue text-white shadow-glow-blue'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Kanban Board View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'list'
                  ? 'bg-brand-blue text-white shadow-glow-blue'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="List View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-blue to-brand-indigo hover:from-blue-600 hover:to-indigo-600 shadow-glow-blue transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Task Statistics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl glass-card border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400 font-semibold uppercase">Total Tasks</p>
            <h3 className="text-xl font-extrabold text-white mt-0.5">{stats?.total || tasks.length}</h3>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
            <CheckSquare className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-2xl glass-card border-brand-blue/20 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400 font-semibold uppercase">In Progress</p>
            <h3 className="text-xl font-extrabold text-brand-electric mt-0.5">
              {stats?.inProgress ?? tasks.filter((t) => t.status === 'In Progress').length}
            </h3>
          </div>
          <div className="w-9 h-9 rounded-xl bg-brand-blue/20 flex items-center justify-center text-brand-electric">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-2xl glass-card border-emerald-500/20 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400 font-semibold uppercase">Completed</p>
            <h3 className="text-xl font-extrabold text-emerald-400 mt-0.5">
              {stats?.completed ?? tasks.filter((t) => t.status === 'Completed').length}
            </h3>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-2xl glass-card border-brand-gold/20 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400 font-semibold uppercase">Completion Rate</p>
            <h3 className="text-xl font-extrabold text-brand-gold mt-0.5">
              {stats?.completionRate || 75}%
            </h3>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-brand-gold">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-3 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks, descriptions, assignees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs glass-input"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg glass-input text-xs bg-navy-900"
            >
              <option value="all">All</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg glass-input text-xs bg-navy-900"
            >
              <option value="all">All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((colStatus) => {
            const columnTasks = filteredTasks.filter((t) => t.status === colStatus);

            return (
              <div key={colStatus} className="flex flex-col rounded-3xl glass-panel border border-slate-800 p-4">
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        colStatus === 'Completed'
                          ? 'bg-emerald-400'
                          : colStatus === 'In Progress'
                          ? 'bg-brand-electric'
                          : 'bg-slate-400'
                      }`}
                    />
                    <h3 className="font-bold text-sm text-white">{colStatus}</h3>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    {columnTasks.length}
                  </span>
                </div>

                {/* Column Tasks List */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-320px)]">
                  {columnTasks.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500 rounded-2xl border border-dashed border-slate-800/80">
                      No tasks in {colStatus}
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <div
                        key={task._id}
                        className="p-4 rounded-2xl bg-navy-900/90 border border-slate-800 hover:border-brand-blue/40 transition-all shadow-md group relative flex flex-col justify-between"
                      >
                        <div>
                          {/* Priority & Delete */}
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                                priorityColors[task.priority] || priorityColors.Medium
                              }`}
                            >
                              {task.priority}
                            </span>

                            <button
                              onClick={() => handleDeleteTask(task._id)}
                              className="text-slate-500 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <h4 className="font-bold text-sm text-white group-hover:text-brand-electric transition-colors leading-snug mb-1">
                            {task.title}
                          </h4>

                          {task.description && (
                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                              {task.description}
                            </p>
                          )}

                          {/* Source Meeting Link if AI extracted */}
                          {task.sourceMeetingTitle && (
                            <div className="mb-3">
                              <Link
                                to={`/meetings?code=${task.sourceMeetingCode}`}
                                className="inline-flex items-center gap-1.5 text-[10px] font-medium text-brand-electric bg-brand-blue/10 px-2 py-1 rounded-lg border border-brand-blue/20 hover:bg-brand-blue/20 transition-colors"
                              >
                                <Video className="w-3 h-3" />
                                <span className="truncate max-w-[180px]">
                                  From: {task.sourceMeetingTitle}
                                </span>
                              </Link>
                            </div>
                          )}
                        </div>

                        {/* Assignee & Status Toggle Dropdown */}
                        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                          <span className="flex items-center gap-1.5 truncate max-w-[140px]">
                            <User className="w-3 h-3 text-slate-500 flex-shrink-0" />
                            <span className="truncate">{task.assigneeName || 'Unassigned'}</span>
                          </span>

                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task._id, e.target.value)}
                            className="text-[10px] font-semibold bg-navy-950 border border-slate-700/80 rounded-lg px-2 py-0.5 text-slate-300"
                          >
                            <option value="To Do">To Do</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
          <div className="divide-y divide-slate-800/60">
            {filteredTasks.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">No tasks match criteria.</div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task._id}
                  className="p-4 hover:bg-slate-800/30 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 truncate">
                    <button
                      onClick={() =>
                        handleStatusChange(
                          task._id,
                          task.status === 'Completed' ? 'To Do' : 'Completed'
                        )
                      }
                      className="text-slate-400 hover:text-emerald-400"
                    >
                      {task.status === 'Completed' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                    <div className="truncate">
                      <p
                        className={`text-sm font-semibold truncate ${
                          task.status === 'Completed' ? 'line-through text-slate-500' : 'text-white'
                        }`}
                      >
                        {task.title}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span>Assignee: {task.assigneeName}</span>
                        {task.sourceMeetingTitle && (
                          <>
                            <span>•</span>
                            <span className="text-brand-electric">
                              Meeting: {task.sourceMeetingTitle}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                        priorityColors[task.priority] || priorityColors.Medium
                      }`}
                    >
                      {task.priority}
                    </span>

                    <button
                      onClick={() => handleDeleteTask(task._id)}
                      className="text-slate-400 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl relative">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-brand-blue/20 border border-brand-blue/40 flex items-center justify-center text-brand-electric">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Create New Task</h3>
                <p className="text-xs text-slate-400">Add an action item to the team workspace</p>
              </div>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Task Title</label>
                <input
                  type="text"
                  placeholder="e.g. Implement WebRTC packet loss metrics"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description</label>
                <textarea
                  rows={2}
                  placeholder="Detailed instructions or context..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl glass-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Assignee</label>
                  <input
                    type="text"
                    placeholder="Assignee name"
                    value={taskForm.assigneeName}
                    onChange={(e) => setTaskForm({ ...taskForm, assigneeName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-navy-900"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-blue to-brand-indigo hover:from-blue-600 hover:to-indigo-600 shadow-glow-blue transition-all"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
