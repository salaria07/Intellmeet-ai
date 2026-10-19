import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Briefcase,
  X,
  MoreVertical,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const TeamPage = () => {
  const { user } = useAuth();

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('members'); // 'members' | 'activity'

  // Invite modal form
  const [inviteData, setInviteData] = useState({
    name: '',
    email: '',
    role: 'Member',
    jobTitle: '',
    department: 'Engineering & AI',
  });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await api.get(`/teams?${params.toString()}`);
      if (res.data?.success) {
        setTeam(res.data.team);
      }
    } catch (err) {
      console.error('Error fetching team:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTeam();
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    setInviteLoading(true);

    try {
      const res = await api.post('/teams/invite', inviteData);
      if (res.data?.success) {
        setInviteSuccess(res.data.message);
        setInviteData({
          name: '',
          email: '',
          role: 'Member',
          jobTitle: '',
          department: 'Engineering & AI',
        });
        fetchTeam();
        setTimeout(() => setIsInviteOpen(false), 1500);
      }
    } catch (err) {
      setInviteError(err.message || 'Could not send invite.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    try {
      const res = await api.put(`/teams/members/${memberId}/role`, { role: newRole });
      if (res.data?.success) {
        fetchTeam();
      }
    } catch (err) {
      alert('Role modification failed: ' + err.message);
    }
  };

  const isAdminOrManager = user?.role === 'Admin' || user?.role === 'Manager';
  const isAdmin = user?.role === 'Admin';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {team?.name || 'Core Platform & AI Systems'}
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-brand-blue/20 text-brand-electric border border-brand-blue/30">
              Verified Workspace
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            {team?.description ||
              'Collaborative team workspace with role-based access control, synchronized meeting histories, and member availability.'}
          </p>
        </div>

        {isAdminOrManager && (
          <button
            onClick={() => setIsInviteOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-blue to-brand-indigo hover:from-blue-600 hover:to-indigo-600 shadow-glow-blue transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Team Member</span>
          </button>
        )}
      </div>

      {/* Sub-Tabs: Member Directory vs Shared Workspace History */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'members'
              ? 'bg-brand-blue/20 text-brand-electric border border-brand-blue/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Members ({team?.members?.length || 4})
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'activity'
              ? 'bg-brand-blue/20 text-brand-electric border border-brand-blue/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Team Activity & Shared Summaries
        </button>
      </div>

      {activeTab === 'members' ? (
        <>
          {/* Search & Filters */}
          <div className="glass-panel p-3 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
            <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, email, or title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl text-xs glass-input"
              />
            </form>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Role:</span>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg glass-input text-xs bg-navy-900"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="member">Member</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg glass-input text-xs bg-navy-900"
                >
                  <option value="all">All Statuses</option>
                  <option value="online">Online</option>
                  <option value="in meeting">In Meeting</option>
                  <option value="away">Away</option>
                </select>
              </div>
            </div>
          </div>

          {/* Member Profile Cards Grid */}
          {loading ? (
            <div className="p-16 text-center text-slate-400 animate-pulse">
              Loading workspace team directory...
            </div>
          ) : (team?.members || []).length === 0 ? (
            <div className="p-12 text-center rounded-3xl glass-panel border border-slate-800">
              <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-300 font-semibold">No team members match this filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {(team?.members || []).map((member) => {
                const isOnline = member.status === 'Online';
                const isInMeeting = member.status === 'In Meeting';

                return (
                  <div
                    key={member._id}
                    className="glass-panel rounded-3xl p-5 border border-slate-800/80 hover:border-brand-blue/30 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Avatar & Status indicator */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="relative">
                          <img
                            src={
                              member.avatar ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                                member.name
                              )}`
                            }
                            alt={member.name}
                            className="w-14 h-14 rounded-2xl object-cover border border-slate-700 shadow-md"
                          />
                          <span
                            className={`absolute bottom-[-2px] right-[-2px] w-3.5 h-3.5 rounded-full ring-2 ring-navy-900 ${
                              isOnline
                                ? 'bg-emerald-400'
                                : isInMeeting
                                ? 'bg-amber-400 animate-pulse'
                                : 'bg-slate-500'
                            }`}
                          />
                        </div>

                        {/* Role Badge */}
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                            member.teamRole === 'Admin'
                              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                              : member.teamRole === 'Manager'
                              ? 'bg-brand-gold/15 text-brand-gold border border-brand-gold/30'
                              : 'bg-brand-blue/15 text-brand-electric border border-brand-blue/30'
                          }`}
                        >
                          {member.teamRole}
                        </span>
                      </div>

                      {/* Name & Title */}
                      <h3 className="font-bold text-base text-white group-hover:text-brand-electric transition-colors truncate">
                        {member.name}
                      </h3>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {member.jobTitle || 'Engineer'}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{member.email}</p>

                      <div className="mt-4 pt-3 border-t border-slate-800/60 space-y-1.5 text-xs text-slate-400">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Department:</span>
                          <span className="text-slate-300 font-medium truncate max-w-[120px]">
                            {member.department || 'Engineering'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Status:</span>
                          <span
                            className={`font-semibold ${
                              isOnline
                                ? 'text-emerald-400'
                                : isInMeeting
                                ? 'text-amber-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {member.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Admin Actions: Modify Role */}
                    {isAdmin && member._id !== user?._id && (
                      <div className="mt-4 pt-3 border-t border-slate-800/80">
                        <select
                          value={member.teamRole}
                          onChange={(e) => handleRoleChange(member._id, e.target.value)}
                          className="w-full px-2 py-1 rounded-lg text-[11px] font-semibold bg-navy-950 border border-slate-700 text-slate-300 hover:border-brand-blue/40 transition-colors"
                        >
                          <option value="Admin">Role: Admin</option>
                          <option value="Manager">Role: Manager</option>
                          <option value="Member">Role: Member</option>
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Team Activity & Shared Meeting Summaries */
        <div className="space-y-4">
          <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-gold" />
              <span>Workspace Collaborative Meeting Knowledge</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              All team members have shared access to AI meeting summaries, automatic transcripts, and
              derived action items generated within this workspace.
            </p>

            <div className="p-4 rounded-2xl bg-navy-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-brand-electric">
                  Weekly Engineering All-Hands & Sprint Planning
                </span>
                <span className="text-slate-500">Processed 2 days ago</span>
              </div>
              <p className="text-xs text-slate-300">
                "The team aligned on Q4 architecture milestones, WebRTC low latency benchmarks, and
                structured AI summary extraction pipelines."
              </p>
              <div className="pt-2 flex items-center gap-2 text-[11px] text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>3 Action Items Extracted & Assigned to Team</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl relative">
            <button
              onClick={() => setIsInviteOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-brand-blue/20 border border-brand-blue/40 flex items-center justify-center text-brand-electric">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Invite Member</h3>
                <p className="text-xs text-slate-400">Add a new collaborator to the team workspace</p>
              </div>
            </div>

            {inviteSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                {inviteSuccess}
              </div>
            )}

            {inviteError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {inviteError}
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Member Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Jordan Hayes"
                  value={inviteData.name}
                  onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Work Email
                </label>
                <input
                  type="email"
                  placeholder="jordan@company.com"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Job Title
                  </label>
                  <input
                    type="text"
                    placeholder="ML Engineer"
                    value={inviteData.jobTitle}
                    onChange={(e) => setInviteData({ ...inviteData, jobTitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Assigned Role
                  </label>
                  <select
                    value={inviteData.role}
                    onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-navy-900"
                  >
                    <option value="Member">Member</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-blue to-brand-indigo hover:from-blue-600 hover:to-indigo-600 shadow-glow-blue transition-all disabled:opacity-50"
                >
                  {inviteLoading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamPage;
