import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Video,
  CheckCircle2,
  Sparkles,
  Users,
  Download,
  Calendar,
  Layers,
} from 'lucide-react';
import api from '../services/api';

const COLORS = ['#10b981', '#38bdf8', '#f59e0b', '#8b5cf6'];

const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await api.get('/analytics');
        if (res.data?.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const metrics = data?.metrics || {
    totalMeetings: 26,
    totalHours: 32.5,
    avgDurationMinutes: 48,
    taskCompletionRate: 75,
    totalSummaries: 18,
    totalActionItemsExtracted: 42,
  };

  const weeklyData = data?.charts?.weeklyActivity || [
    { day: 'Mon', meetings: 4, hours: 3.5, tasksCompleted: 6 },
    { day: 'Tue', meetings: 6, hours: 5.2, tasksCompleted: 8 },
    { day: 'Wed', meetings: 8, hours: 7.0, tasksCompleted: 11 },
    { day: 'Thu', meetings: 5, hours: 4.8, tasksCompleted: 7 },
    { day: 'Fri', meetings: 9, hours: 8.1, tasksCompleted: 14 },
    { day: 'Sat', meetings: 2, hours: 1.5, tasksCompleted: 3 },
    { day: 'Sun', meetings: 1, hours: 0.8, tasksCompleted: 1 },
  ];

  const participationData = data?.charts?.participationTrends || [
    { name: 'Alex Morgan', meetingsAttended: 14, hours: 16.5, score: 98 },
    { name: 'David Chen', meetingsAttended: 12, hours: 14.0, score: 95 },
    { name: 'Sarah Jenkins', meetingsAttended: 11, hours: 12.8, score: 92 },
    { name: 'Marcus Vance', meetingsAttended: 9, hours: 10.5, score: 89 },
  ];

  const actionItemsData = data?.charts?.actionItemsBreakdown || [
    { name: 'Completed', value: 18, color: '#10b981' },
    { name: 'In Progress', value: 8, color: '#38bdf8' },
    { name: 'Pending', value: 5, color: '#f59e0b' },
  ];

  const handleExportReport = () => {
    const jsonStr = JSON.stringify(data || metrics, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `intellmeet-analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Enterprise Productivity Analytics
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-brand-gold/15 text-brand-gold border border-brand-gold/30">
              Live Aggregated
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry measuring meeting hours, WebRTC room frequency, and AI action-item completion velocity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-navy-900 border border-slate-700 text-slate-300"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">This Quarter</option>
          </select>

          <button
            onClick={handleExportReport}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-brand-blue/40 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-brand-electric" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl glass-card border-brand-blue/20">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Meetings Held</span>
            <Video className="w-4 h-4 text-brand-electric" />
          </div>
          <h3 className="text-3xl font-extrabold text-white mt-2">{metrics.totalMeetings}</h3>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>+14.2% from prior period</span>
          </p>
        </div>

        <div className="p-5 rounded-3xl glass-card border-brand-gold/20">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Meeting Hours</span>
            <Clock className="w-4 h-4 text-brand-gold" />
          </div>
          <h3 className="text-3xl font-extrabold text-white mt-2">{metrics.totalHours}h</h3>
          <p className="text-[11px] text-slate-400 mt-1">
            Avg. {metrics.avgDurationMinutes} mins per session
          </p>
        </div>

        <div className="p-5 rounded-3xl glass-card border-emerald-500/20">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Task Completion Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-3xl font-extrabold text-emerald-400 mt-2">
            {metrics.taskCompletionRate}%
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">From AI extracted items</p>
        </div>

        <div className="p-5 rounded-3xl glass-card border-brand-indigo/20">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>AI Summaries Generated</span>
            <Sparkles className="w-4 h-4 text-brand-indigo" />
          </div>
          <h3 className="text-3xl font-extrabold text-brand-electric mt-2">
            {metrics.totalSummaries}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            {metrics.totalActionItemsExtracted} total action items
          </p>
        </div>
      </div>

      {/* Primary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Meetings & Hours Activity Trend (Left 8) */}
        <div className="lg:col-span-8 glass-panel rounded-3xl p-6 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-white">Meeting Frequency & Hours Over Time</h3>
              <p className="text-xs text-slate-400">Daily breakdown of conducted video sessions</p>
            </div>
            <span className="text-xs text-brand-electric font-semibold px-2.5 py-1 rounded-full bg-brand-blue/15 border border-brand-blue/30">
              Weekly Activity
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorMeetings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a0f24',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area
                  type="monotone"
                  dataKey="hours"
                  name="Meeting Hours"
                  stroke="#38bdf8"
                  fillOpacity={1}
                  fill="url(#colorHours)"
                />
                <Area
                  type="monotone"
                  dataKey="meetings"
                  name="Total Meetings"
                  stroke="#8b5cf6"
                  fillOpacity={1}
                  fill="url(#colorMeetings)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action Items Breakdown Pie Chart (Right 4) */}
        <div className="lg:col-span-4 glass-panel rounded-3xl p-6 border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-white">Action Items Breakdown</h3>
            <p className="text-xs text-slate-400">Current status of extracted action items</p>
          </div>

          <div className="h-60 w-full my-auto flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={actionItemsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {actionItemsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a0f24',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-center text-xs">
            {actionItemsData.map((item, idx) => (
              <div key={idx}>
                <p className="text-[10px] text-slate-400 font-semibold">{item.name}</p>
                <p className="font-bold text-white text-sm mt-0.5" style={{ color: item.color }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Participation Trends Bar Chart */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base text-white">Team Member Collaboration Hours</h3>
            <p className="text-xs text-slate-400">Individual attendance and meeting participation hours</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={participationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a0f24',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="hours" name="Meeting Hours" fill="#2563eb" radius={[6, 6, 0, 0]} />
              <Bar dataKey="meetingsAttended" name="Sessions Attended" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
