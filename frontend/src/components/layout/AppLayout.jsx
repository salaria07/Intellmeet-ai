import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Video,
  Users,
  CheckSquare,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Sun,
  Moon,
  Plus,
  Compass,
  Search,
  Sparkles,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  Shield,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Meetings', path: '/meetings', icon: Video },
  { name: 'Team', path: '/team', icon: Users },
  { name: 'Tasks', path: '/tasks', icon: CheckSquare },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const AppLayout = () => {
  const { user, logout, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [quickJoinCode, setQuickJoinCode] = useState('');
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isInstantLoading, setIsInstantLoading] = useState(false);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        if (res.data?.success) {
          setNotifications(res.data.notifications || []);
        }
      } catch (err) {
        // Silently fallback
      }
    };
    fetchNotifications();
  }, []);

  const handleInstantMeeting = async () => {
    setIsInstantLoading(true);
    try {
      const res = await api.post('/meetings/instant', { title: 'Quick Sync' });
      if (res.data?.success && res.data?.meeting) {
        navigate(`/meeting/${res.data.meeting.meetingCode}`);
      }
    } catch (err) {
      alert('Could not start instant meeting: ' + err.message);
    } finally {
      setIsInstantLoading(false);
    }
  };

  const handleQuickJoin = (e) => {
    e.preventDefault();
    if (!quickJoinCode.trim()) return;
    const cleanCode = quickJoinCode.trim().toLowerCase();
    setIsJoinModalOpen(false);
    setQuickJoinCode('');
    navigate(`/meeting/${cleanCode}`);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col md:flex-row relative overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="ambient-orb-blue top-[-100px] left-[-100px] opacity-40 fixed pointer-events-none" />
      <div className="ambient-orb-gold bottom-[-150px] right-[-100px] opacity-30 fixed pointer-events-none" />
      <div className="ambient-orb-violet top-[40%] right-[10%] opacity-20 fixed pointer-events-none" />

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-800/80 bg-navy-900/90 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-blue via-brand-indigo to-brand-electric flex items-center justify-center shadow-glow-blue">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-sky-300 bg-clip-text text-transparent">
            IntellMeet AI
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 text-slate-400 hover:text-white relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-slate-400 hover:text-white"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 md:w-72 bg-navy-900/95 border-r border-slate-800/80 backdrop-blur-xl flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:static md:h-screen md:sticky md:top-0`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-blue via-brand-indigo to-brand-electric flex items-center justify-center shadow-glow-blue ring-1 ring-white/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xl tracking-tight text-white">
                  Intell<span className="text-brand-electric">Meet</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-brand-blue/20 text-brand-electric border border-brand-blue/30">
                  AI
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400">Enterprise Workspace</p>
            </div>
          </div>
        </div>

        {/* Team / Workspace Selector Pill */}
        <div className="px-4 py-3 mx-4 mt-4 rounded-xl bg-navy-850/80 border border-slate-800/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">Core Platform & AI</p>
              <p className="text-[10px] text-slate-400">4 Active Members</p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
            {user?.role || 'Member'}
          </span>
        </div>

        {/* Primary Navigation - Six Tabs */}
        <nav className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Main Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-blue/20 to-brand-indigo/15 text-white border border-brand-blue/30 shadow-glow-blue/50'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-brand-blue text-white shadow-glow-blue'
                      : 'text-slate-400 group-hover:text-brand-electric group-hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="flex-1 tracking-wide">{item.name}</span>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-electric shadow-glow-blue" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Quick Launch Button */}
        <div className="px-4 py-3">
          <button
            onClick={handleInstantMeeting}
            disabled={isInstantLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-blue to-brand-indigo hover:from-blue-600 hover:to-indigo-600 text-white font-semibold text-sm shadow-glow-blue transition-all flex items-center justify-center gap-2 group disabled:opacity-60"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
            <span>{isInstantLoading ? 'Starting Room...' : 'Start Instant Meeting'}</span>
          </button>
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-slate-800/70 bg-navy-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="relative">
                <img
                  src={
                    user?.avatar ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                      user?.name || 'User'
                    )}`
                  }
                  alt={user?.name}
                  className="w-9 h-9 rounded-xl object-cover border border-slate-700"
                />
                <span className="absolute bottom-[-1px] right-[-1px] w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-navy-900" />
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-100 truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.jobTitle || user?.email}</p>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Desktop Navigation Bar */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-slate-800/80 bg-navy-900/60 backdrop-blur-xl sticky top-0 z-30">
          {/* Search Bar / Quick Action */}
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search meetings, AI transcripts, action items, or team..."
                className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-navy-850/80 border border-slate-800 focus:border-brand-blue/50 text-slate-200 placeholder-slate-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Top Actions: Join Meeting, Instant Meeting, Theme Toggle, Notifications */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsJoinModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 transition-all flex items-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5 text-brand-electric" />
              <span>Join with Code</span>
            </button>

            <button
              onClick={handleInstantMeeting}
              disabled={isInstantLoading}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-brand-blue to-brand-indigo hover:from-blue-600 hover:to-indigo-600 shadow-glow-blue/50 transition-all flex items-center gap-1.5"
            >
              <Video className="w-3.5 h-3.5" />
              <span>New Meeting</span>
            </button>

            <div className="h-5 w-[1px] bg-slate-800 mx-1" />

            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-400" />
              )}
            </button>

            {/* Notifications Menu Toggle */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors relative"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
                )}
              </button>

              {/* Notifications Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 rounded-2xl bg-navy-900 border border-slate-800 shadow-2xl backdrop-blur-2xl z-50 overflow-hidden animate-fadeIn">
                  <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">Notifications</span>
                    <span className="text-[10px] font-medium text-brand-electric">
                      {unreadCount} Unread
                    </span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/50">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          className={`p-3.5 hover:bg-slate-800/40 transition-colors text-xs ${
                            !n.read ? 'bg-brand-blue/5' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-slate-200">{n.title}</p>
                            <span className="text-[9px] text-slate-400">recent</span>
                          </div>
                          <p className="text-slate-400 mt-1 text-[11px] leading-relaxed">
                            {n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Routed Page Content */}
        <main className="flex-1 p-4 md:p-8 relative z-10 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Join Meeting Modal */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-slate-700/80 shadow-2xl relative">
            <button
              onClick={() => setIsJoinModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-blue/20 border border-brand-blue/40 flex items-center justify-center text-brand-electric">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Join Meeting</h3>
                <p className="text-xs text-slate-400">Enter a meeting code or invitation URL</p>
              </div>
            </div>

            <form onSubmit={handleQuickJoin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Meeting Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. mtg-q4-deploy"
                  value={quickJoinCode}
                  onChange={(e) => setQuickJoinCode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-mono placeholder-slate-500"
                  autoFocus
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsJoinModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-brand-blue to-brand-indigo hover:from-blue-600 hover:to-indigo-600 text-white shadow-glow-blue transition-all"
                >
                  Join Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppLayout;
