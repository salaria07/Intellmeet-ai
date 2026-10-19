import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Video,
  Plus,
  Compass,
  Calendar,
  Sparkles,
  Clock,
  Users,
  CheckCircle2,
  Circle,
  ArrowRight,
  TrendingUp,
  FileText,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [recentSummary, setRecentSummary] = useState(null);
  const [joinCode, setJoinCode] = useState('');
  const [isInstantLoading, setIsInstantLoading] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [meetingsRes, tasksRes, analyticsRes] = await Promise.allSettled([
          api.get('/meetings'),
          api.get('/tasks'),
          api.get('/analytics'),
        ]);

        if (meetingsRes.status === 'fulfilled' && meetingsRes.value.data?.success) {
          const list = meetingsRes.value.data.meetings || [];
          setMeetings(list);

          // Find the most recent meeting with an AI summary
          const summaryMeeting = list.find((m) => m.hasSummary || m.status === 'ended');
          if (summaryMeeting) {
            try {
              const sumRes = await api.get(`/meetings/${summaryMeeting.meetingCode}`);
              if (sumRes.data?.summary) {
                setRecentSummary({
                  ...sumRes.data.summary,
                  meetingTitle: summaryMeeting.title,
                });
              }
            } catch (e) {
              // Ignore summary error
            }
          }
        }

        if (tasksRes.status === 'fulfilled' && tasksRes.value.data?.success) {
          setTasks(tasksRes.value.data.tasks || []);
        }

        if (analyticsRes.status === 'fulfilled' && analyticsRes.value.data?.success) {
          setStats(analyticsRes.value.data.metrics || null);
        }
      } catch (err) {
        console.error('Error fetching dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleStartInstant = async () => {
    setIsInstantLoading(true);
    try {
      const res = await api.post('/meetings/instant', {
        title: `${user?.name || 'Quick'}'s Instant Meeting`,
      });
      if (res.data?.success && res.data?.meeting) {
        navigate(`/meeting/${res.data.meeting.meetingCode}`);
      }
    } catch (err) {
      alert('Could not start instant meeting: ' + err.message);
    } finally {
      setIsInstantLoading(false);
    }
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    navigate(`/meeting/${joinCode.trim().toLowerCase()}`);
  };

  const toggleTaskStatus = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'Completed' ? 'To Do' : 'Completed';
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      console.error('Task update error:', err);
    }
  };

  const liveMeetings = meetings.filter((m) => m.status === 'live');
  const upcomingMeetings = meetings.filter((m) => m.status === 'scheduled');
  const pastMeetings = meetings.filter((m) => m.status === 'ended');

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Personalized Welcome Banner */}
      <div className="relative rounded-3xl p-6 md:p-8 glass-panel border border-brand-blue/30 overflow-hidden shadow-glow-blue/20">
        <div className="ambient-orb-blue top-[-100px] right-[-100px] opacity-40" />
        <div className="ambient-orb-gold bottom-[-80px] left-[-80px] opacity-20" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-blue/15 text-brand-electric border border-brand-blue/30">
              <Sparkles className="w-3.5 h-3.5 text-brand-electric" />
              <span>IntellMeet Intelligence Hub</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Welcome back, <span className="text-brand-electric">{user?.name || 'Alex'}</span>
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Your AI workspace has processed <strong>{stats?.totalSummaries || 2}</strong> meeting
              summaries and synchronized <strong>{tasks.length}</strong> active action items for
              your team today.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleStartInstant}
              disabled={isInstantLoading}
              className="py-3 px-5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-brand-blue via-brand-indigo to-blue-600 hover:from-blue-600 hover:to-indigo-600 shadow-glow-blue transition-all flex items-center gap-2 group cursor-pointer disabled:opacity-60"
            >
              <Video className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>{isInstantLoading ? 'Launching...' : 'Start New Meeting'}</span>
            </button>

            <Link
              to="/meetings?action=schedule"
              className="py-3 px-5 rounded-2xl font-semibold text-sm text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-brand-blue/40 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-brand-gold" />
              <span>Schedule Meeting</span>
            </Link>
          </div>
        </div>

        {/* Quick Join Bar */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <form onSubmit={handleJoin} className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Compass className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter meeting code (e.g. mtg-q4-deploy)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl text-xs glass-input font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-blue/20 hover:bg-brand-blue/30 text-brand-electric border border-brand-blue/40 transition-colors whitespace-nowrap"
            >
              Join Room
            </button>
          </form>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Live Rooms: <strong>{liveMeetings.length}</strong></span>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-electric" />
              <span>Upcoming: <strong>{upcomingMeetings.length}</strong></span>
            </span>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl glass-card border-brand-blue/20 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Total Meetings</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">
              {stats?.totalMeetings || meetings.length}
            </h3>
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3 h-3" />
              <span>+18% this month</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center text-brand-electric shadow-glow-blue">
            <Video className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-card border-brand-gold/20 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Total Meeting Hours</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">
              {stats?.totalHours || 32.5}h
            </h3>
            <p className="text-[11px] text-brand-gold mt-1 font-medium">
              Avg. {stats?.avgDurationMinutes || 48} min / call
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-brand-gold">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-card border-emerald-500/20 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Tasks Completed</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">
              {stats?.completedTasks ?? tasks.filter((t) => t.status === 'Completed').length}
            </h3>
            <p className="text-[11px] text-emerald-400 mt-1 font-medium">
              {stats?.taskCompletionRate || 75}% completion rate
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-card border-brand-indigo/20 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">AI Intelligence Summaries</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">
              {stats?.totalSummaries || 2}
            </h3>
            <p className="text-[11px] text-brand-electric mt-1 font-medium">
              100% action extraction
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-indigo/15 border border-brand-indigo/30 flex items-center justify-center text-brand-indigo">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Split: Meetings (Left 7) & AI Intelligence / Action Items (Right 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upcoming & Live Meetings */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Live Rooms Alert */}
          {liveMeetings.length > 0 && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                    Live Meeting In Progress
                  </span>
                </div>
                <Link
                  to={`/meeting/${liveMeetings[0].meetingCode}`}
                  className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-colors flex items-center gap-1"
                >
                  <span>Join Live</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <h4 className="text-sm font-bold text-white mt-2">{liveMeetings[0].title}</h4>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Code: {liveMeetings[0].meetingCode}
              </p>
            </div>
          )}

          {/* Upcoming Meetings List */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-brand-electric" />
                <h3 className="font-bold text-base text-white">Upcoming Meetings</h3>
              </div>
              <Link
                to="/meetings"
                className="text-xs font-medium text-brand-electric hover:text-white transition-colors flex items-center gap-1"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {upcomingMeetings.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-navy-900/50 border border-slate-800/80">
                  <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-300">No scheduled meetings</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Schedule a future session or start an instant meeting anytime.
                  </p>
                </div>
              ) : (
                upcomingMeetings.slice(0, 3).map((mtg) => (
                  <div
                    key={mtg._id}
                    className="p-4 rounded-2xl bg-navy-900/70 hover:bg-slate-800/40 border border-slate-800 transition-all flex items-center justify-between gap-4 group"
                  >
                    <div className="space-y-1 truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-blue/15 text-brand-electric border border-brand-blue/30">
                          {mtg.meetingCode}
                        </span>
                        <h4 className="font-semibold text-sm text-white truncate group-hover:text-brand-electric transition-colors">
                          {mtg.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {new Date(mtg.scheduledStartTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span>•</span>
                        <span>{mtg.durationMinutes || 45} mins</span>
                      </div>
                    </div>

                    <Link
                      to={`/meeting/${mtg.meetingCode}`}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-blue hover:bg-blue-600 text-white shadow-glow-blue transition-all flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join</span>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Past Meetings */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <h3 className="font-bold text-base text-white">Recent Meetings</h3>
              </div>
              <Link
                to="/meetings?tab=past"
                className="text-xs font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-1"
              >
                <span>Full history</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {pastMeetings.slice(0, 3).map((mtg) => (
                <div
                  key={mtg._id}
                  className="p-3.5 rounded-2xl bg-navy-900/40 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div className="truncate">
                    <p className="font-semibold text-slate-200 truncate">{mtg.title}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span>{new Date(mtg.scheduledStartTime).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{mtg.durationMinutes || 60} mins</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {mtg.hasSummary && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-gold/15 text-brand-gold border border-brand-gold/30 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        Summary Ready
                      </span>
                    )}
                    <Link
                      to={`/meetings?code=${mtg.meetingCode}`}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: AI Meeting Intelligence & Assigned Tasks */}
        <div className="lg:col-span-5 space-y-6">
          {/* Recent AI Summary Card */}
          <div className="glass-panel rounded-3xl p-6 border border-brand-gold/25 relative overflow-hidden bg-gradient-to-b from-amber-500/5 to-transparent">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-brand-gold">
                <Sparkles className="w-4 h-4" />
                <h3 className="font-bold text-sm text-white">Latest AI Intelligence</h3>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-brand-gold/15 text-brand-gold border border-brand-gold/30">
                GPT-4o-mini
              </span>
            </div>

            {recentSummary ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-300 leading-relaxed italic bg-navy-900/60 p-3 rounded-xl border border-slate-800/80">
                  "{recentSummary.overview}"
                </p>

                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Key Decisions & Takeaways
                  </h4>
                  <ul className="space-y-1">
                    {(recentSummary.decisions || recentSummary.takeaways || []).slice(0, 2).map((item, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Source: {recentSummary.meetingTitle || 'Engineering All-Hands'}
                  </span>
                  <Link
                    to={`/meetings?code=${recentSummary.meetingCode}`}
                    className="text-xs font-semibold text-brand-electric hover:underline flex items-center gap-1"
                  >
                    <span>Inspect Summary</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p>No meeting summaries generated yet.</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Summaries will appear automatically as meetings complete.
                </p>
              </div>
            )}
          </div>

          {/* Assigned Action Items */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-base text-white">Assigned Action Items</h3>
              </div>
              <Link
                to="/tasks"
                className="text-xs font-medium text-brand-electric hover:text-white transition-colors"
              >
                Go to Tasks ({tasks.length})
              </Link>
            </div>

            <div className="space-y-2.5">
              {tasks.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No tasks pending.</p>
              ) : (
                tasks.slice(0, 4).map((task) => {
                  const isDone = task.status === 'Completed';

                  return (
                    <div
                      key={task._id}
                      className="p-3 rounded-xl bg-navy-900/60 hover:bg-slate-800/40 border border-slate-800 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <button
                          onClick={() => toggleTaskStatus(task._id, task.status)}
                          className="flex-shrink-0 text-slate-400 hover:text-emerald-400 transition-colors"
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                        <div className="truncate">
                          <p
                            className={`text-xs font-medium truncate ${
                              isDone ? 'line-through text-slate-500' : 'text-slate-200'
                            }`}
                          >
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span>{task.assigneeName || 'Unassigned'}</span>
                            <span>•</span>
                            <span
                              className={`font-semibold ${
                                task.priority === 'Critical'
                                  ? 'text-rose-400'
                                  : task.priority === 'High'
                                  ? 'text-amber-400'
                                  : 'text-slate-400'
                              }`}
                            >
                              {task.priority}
                            </span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                          isDone
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : task.status === 'In Progress'
                            ? 'bg-brand-blue/15 text-brand-electric'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
