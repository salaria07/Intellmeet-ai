import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Video,
  Plus,
  Calendar,
  Clock,
  Users,
  Sparkles,
  Copy,
  Check,
  Compass,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Radio,
  X,
  ArrowRight,
  AlertCircle,
  Share2,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getMeetingInviteUrl } from '../utils/meetingUtils';

const MeetingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'all');
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [meetingSummary, setMeetingSummary] = useState(null);
  const [meetingTranscript, setMeetingTranscript] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(
    searchParams.get('action') === 'schedule'
  );
  const [isSummaryGenerating, setIsSummaryGenerating] = useState(false);
  const [isInstantLoading, setIsInstantLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state for scheduling
  const [scheduleData, setScheduleData] = useState({
    title: '',
    description: '',
    scheduledStartTime: '',
    durationMinutes: 45,
    invitedEmails: '',
  });

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/meetings');
      if (res.data?.success) {
        setMeetings(res.data.meetings || []);

        // Check if there's a code in search params to auto-open
        const codeParam = searchParams.get('code');
        if (codeParam) {
          const match = (res.data.meetings || []).find(
            (m) => m.meetingCode === codeParam || m._id === codeParam
          );
          if (match) {
            handleOpenDetails(match);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching meetings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  useEffect(() => {
    if (searchParams.get('action') === 'schedule') {
      setIsScheduleModalOpen(true);
    }
  }, [searchParams]);

  const handleOpenDetails = async (meeting) => {
    setSelectedMeeting(meeting);
    setIsDetailsOpen(true);
    setMeetingSummary(null);
    setMeetingTranscript(null);

    try {
      const res = await api.get(`/meetings/${meeting.meetingCode}`);
      if (res.data?.success) {
        setSelectedMeeting(res.data.meeting);
        setMeetingTranscript(res.data.transcript);
        setMeetingSummary(res.data.summary);
      }
    } catch (err) {
      console.error('Error fetching meeting details:', err);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: scheduleData.title,
        description: scheduleData.description,
        scheduledStartTime: scheduleData.scheduledStartTime,
        durationMinutes: Number(scheduleData.durationMinutes),
        invitedEmails: scheduleData.invitedEmails
          ? scheduleData.invitedEmails.split(',').map((s) => s.trim())
          : [],
      };

      const res = await api.post('/meetings/schedule', payload);
      if (res.data?.success) {
        setIsScheduleModalOpen(false);
        setScheduleData({
          title: '',
          description: '',
          scheduledStartTime: '',
          durationMinutes: 45,
          invitedEmails: '',
        });
        fetchMeetings();
      }
    } catch (err) {
      alert('Could not schedule meeting: ' + err.message);
    }
  };

  const handleInstantMeeting = async () => {
    if (isInstantLoading) return;
    setIsInstantLoading(true);
    try {
      const res = await api.post('/meetings/instant', {
        title: `${user?.name || 'Quick'}'s Instant Meeting`,
      });
      if (res.data?.success && res.data?.meeting) {
        navigate(`/meeting/${res.data.meeting.meetingCode}`);
      }
    } catch (err) {
      alert('Could not create instant meeting: ' + err.message);
    } finally {
      setIsInstantLoading(false);
    }
  };

  const handleGenerateSummary = async (meetingCode) => {
    setIsSummaryGenerating(true);
    try {
      const res = await api.post(`/meetings/${meetingCode}/summary`);
      if (res.data?.success && res.data?.summary) {
        setMeetingSummary(res.data.summary);
        // Refresh meetings list to reflect hasSummary flag
        fetchMeetings();
      }
    } catch (err) {
      alert('Error generating AI summary: ' + err.message);
    } finally {
      setIsSummaryGenerating(false);
    }
  };

  const handleConvertActionItem = async (actionItem) => {
    try {
      await api.post('/tasks/convert-action-item', {
        summaryId: meetingSummary?._id,
        actionItemId: actionItem._id,
        title: actionItem.title,
        description: actionItem.description,
        assigneeName: actionItem.assigneeName,
        priority: actionItem.priority,
        dueDate: actionItem.dueDate,
        sourceMeetingCode: selectedMeeting?.meetingCode,
        sourceMeetingTitle: selectedMeeting?.title,
      });

      // Mark local action item as converted
      setMeetingSummary((prev) => ({
        ...prev,
        actionItems: prev.actionItems.map((item) =>
          item._id === actionItem._id ? { ...item, convertedToTask: true } : item
        ),
      }));
    } catch (err) {
      alert('Could not convert action item: ' + err.message);
    }
  };

  const handleCancelMeeting = async (meetingId) => {
    if (!window.confirm('Are you sure you want to cancel this scheduled meeting?')) return;
    try {
      await api.delete(`/meetings/${meetingId}`);
      setIsDetailsOpen(false);
      fetchMeetings();
    } catch (err) {
      alert('Could not cancel meeting: ' + err.message);
    }
  };

  const copyInviteLink = (code) => {
    const link = getMeetingInviteUrl(code);
    navigator.clipboard.writeText(link);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Filter meetings
  const filteredMeetings = meetings.filter((m) => {
    if (activeTab === 'upcoming') return m.status === 'scheduled';
    if (activeTab === 'live') return m.status === 'live';
    if (activeTab === 'past') return m.status === 'ended' || m.status === 'cancelled';
    return true;
  }).filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      m.meetingCode.toLowerCase().includes(q) ||
      (m.description && m.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Meetings & Collaboration
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Host ultra-low latency WebRTC video conferences, review automatic transcripts, and extract AI action items.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-brand-blue/40 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-brand-gold" />
            <span>Schedule Meeting</span>
          </button>

          <button
            onClick={handleInstantMeeting}
            disabled={isInstantLoading}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-blue via-brand-indigo to-blue-600 hover:from-blue-600 hover:to-indigo-600 shadow-glow-blue transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <Plus className="w-4 h-4" />
            <span>{isInstantLoading ? 'Launching Room...' : 'New Instant Meeting'}</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-2.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {['all', 'upcoming', 'live', 'past'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSearchParams({ tab });
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-brand-blue text-white shadow-glow-blue'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {tab === 'live' ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live ({meetings.filter((m) => m.status === 'live').length})
                </span>
              ) : (
                tab
              )}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search meetings by code or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs glass-input text-slate-200 placeholder-slate-500"
          />
        </div>
      </div>

      {/* Meeting Cards Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 animate-pulse">
          Loading meeting schedules and live sessions...
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="p-12 text-center rounded-3xl glass-panel border border-slate-800">
          <Video className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No meetings found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            There are currently no meetings matching this filter. Schedule a new sync or launch an instant video room.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMeetings.map((mtg) => {
            const isLive = mtg.status === 'live';
            const isScheduled = mtg.status === 'scheduled';
            const isEnded = mtg.status === 'ended';

            return (
              <div
                key={mtg._id}
                className={`glass-panel rounded-3xl p-5 border transition-all flex flex-col justify-between group ${
                  isLive
                    ? 'border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                    : 'border-slate-800/80 hover:border-brand-blue/30'
                }`}
              >
                <div>
                  {/* Status & Code Row */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-brand-electric border border-slate-700/80">
                      {mtg.meetingCode}
                    </span>

                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        isLive
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : isScheduled
                          ? 'bg-brand-blue/20 text-brand-electric border border-brand-blue/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
                      {mtg.status}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-bold text-base text-white group-hover:text-brand-electric transition-colors line-clamp-1 mb-1">
                    {mtg.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                    {mtg.description || 'Intelligent enterprise collaboration session.'}
                  </p>

                  {/* Timing & Participants */}
                  <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-800/60 pt-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(mtg.scheduledStartTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span>•</span>
                      <span>{new Date(mtg.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{mtg.durationMinutes || 45} minutes planned</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>{mtg.participants?.length || 1} participant(s)</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenDetails(mtg)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Details & AI</span>
                  </button>

                  {isLive ? (
                    <button
                      onClick={() => navigate(`/meeting/${mtg.meetingCode}`)}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
                    >
                      <Radio className="w-3.5 h-3.5" />
                      <span>Join Live</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`/meeting/${mtg.meetingCode}`)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-brand-blue hover:bg-blue-600 text-white shadow-glow-blue transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Start Room</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Meeting Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl relative">
            <button
              onClick={() => setIsScheduleModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-brand-blue/20 border border-brand-blue/40 flex items-center justify-center text-brand-electric">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Schedule New Meeting</h3>
                <p className="text-xs text-slate-400">Configure room details and generate meeting link</p>
              </div>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Meeting Title</label>
                <input
                  type="text"
                  placeholder="e.g. Q4 AI Architecture & Sprint Review"
                  value={scheduleData.title}
                  onChange={(e) => setScheduleData({ ...scheduleData, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description & Agenda</label>
                <textarea
                  rows={2}
                  placeholder="Summary of meeting topics..."
                  value={scheduleData.description}
                  onChange={(e) => setScheduleData({ ...scheduleData, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl glass-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={scheduleData.scheduledStartTime}
                    onChange={(e) => setScheduleData({ ...scheduleData, scheduledStartTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-navy-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Duration</label>
                  <select
                    value={scheduleData.durationMinutes}
                    onChange={(e) => setScheduleData({ ...scheduleData, durationMinutes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-navy-900"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>1 Hour</option>
                    <option value={90}>1.5 Hours</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Invite Team Emails (comma separated)</label>
                <input
                  type="text"
                  placeholder="sarah.j@intellmeet.ai, david.chen@intellmeet.ai"
                  value={scheduleData.invitedEmails}
                  onChange={(e) => setScheduleData({ ...scheduleData, invitedEmails: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-blue to-brand-indigo hover:from-blue-600 hover:to-indigo-600 shadow-glow-blue transition-all"
                >
                  Create Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Meeting Details & AI Intelligence Drawer */}
      {isDetailsOpen && selectedMeeting && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-navy-900 border-l border-slate-800 h-full p-6 md:p-8 overflow-y-auto flex flex-col justify-between relative shadow-2xl">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-blue/20 border border-brand-blue/30 flex items-center justify-center text-brand-electric">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white leading-tight">
                      {selectedMeeting.title}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Code: {selectedMeeting.meetingCode}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsDetailsOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Invitation Link Box */}
              <div className="p-4 rounded-2xl bg-navy-950 border border-slate-800 flex items-center justify-between gap-3 mb-6">
                <div className="truncate">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Meeting URL
                  </p>
                  <p className="text-xs font-mono text-brand-electric truncate mt-0.5">
                    {getMeetingInviteUrl(selectedMeeting.meetingCode)}
                  </p>
                </div>

                <button
                  onClick={() => copyInviteLink(selectedMeeting.meetingCode)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-blue/20 text-brand-electric hover:bg-brand-blue/30 border border-brand-blue/40 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* AI Summary Section */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-gold" />
                    <h4 className="font-bold text-sm text-white">AI Meeting Intelligence</h4>
                  </div>

                  <button
                    onClick={() => handleGenerateSummary(selectedMeeting.meetingCode)}
                    disabled={isSummaryGenerating}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-gold/20 text-brand-gold hover:bg-brand-gold/30 border border-brand-gold/40 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{isSummaryGenerating ? 'Synthesizing...' : 'Re-Generate AI Summary'}</span>
                  </button>
                </div>

                {meetingSummary ? (
                  <div className="space-y-4 p-5 rounded-2xl bg-navy-950/70 border border-brand-gold/20">
                    {meetingSummary.demoNotice && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{meetingSummary.demoNotice}</span>
                      </div>
                    )}

                    <div>
                      <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Executive Overview
                      </h5>
                      <p className="text-xs text-slate-200 leading-relaxed bg-navy-900/60 p-3 rounded-xl border border-slate-800">
                        {meetingSummary.overview}
                      </p>
                    </div>

                    {meetingSummary.discussionPoints?.length > 0 && (
                      <div>
                        <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Discussion Points
                        </h5>
                        <ul className="space-y-1.5">
                          {meetingSummary.discussionPoints.map((dp, i) => (
                            <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-blue flex-shrink-0 mt-1.5" />
                              <span>{dp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {meetingSummary.decisions?.length > 0 && (
                      <div>
                        <h5 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1.5">
                          Agreed Decisions
                        </h5>
                        <ul className="space-y-1.5">
                          {meetingSummary.decisions.map((dec, i) => (
                            <li key={i} className="text-xs text-slate-200 flex items-start gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <span>{dec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {meetingSummary.actionItems?.length > 0 && (
                      <div>
                        <h5 className="text-[11px] font-bold text-brand-electric uppercase tracking-wider mb-2">
                          Smart Extracted Action Items
                        </h5>
                        <div className="space-y-2">
                          {meetingSummary.actionItems.map((item) => (
                            <div
                              key={item._id}
                              className="p-3 rounded-xl bg-navy-900 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                            >
                              <div>
                                <p className="font-semibold text-white">{item.title}</p>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                                  <span>Assignee: {item.assigneeName}</span>
                                  <span>•</span>
                                  <span className="text-amber-400 font-semibold">{item.priority}</span>
                                </div>
                              </div>

                              {item.convertedToTask ? (
                                <span className="px-2 py-1 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  <span>Task Created</span>
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleConvertActionItem(item)}
                                  className="px-2.5 py-1 rounded-lg bg-brand-blue/20 hover:bg-brand-blue/30 text-brand-electric border border-brand-blue/30 text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer"
                                >
                                  Convert to Task
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-navy-950/40 border border-slate-800 text-center">
                    <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">No summary has been generated yet.</p>
                    <button
                      onClick={() => handleGenerateSummary(selectedMeeting.meetingCode)}
                      disabled={isSummaryGenerating}
                      className="mt-3 px-4 py-2 rounded-xl text-xs font-bold bg-brand-gold/20 text-brand-gold border border-brand-gold/40 hover:bg-brand-gold/30 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isSummaryGenerating ? 'Processing...' : 'Generate AI Summary Now'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Participants List */}
              <div className="space-y-3 mb-6">
                <h4 className="font-bold text-sm text-white">Participants</h4>
                <div className="space-y-2">
                  {(selectedMeeting.participants || []).map((p, i) => (
                    <div
                      key={p._id || i}
                      className="p-3 rounded-xl bg-navy-950 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={
                            p.avatar ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                              p.name || 'User'
                            )}`
                          }
                          alt={p.name}
                          className="w-7 h-7 rounded-lg object-cover"
                        />
                        <span className="font-semibold text-slate-200">{p.name}</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {p.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
              {selectedMeeting.status === 'scheduled' && (
                <button
                  onClick={() => handleCancelMeeting(selectedMeeting._id)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Cancel Meeting</span>
                </button>
              )}

              <div className="flex items-center gap-3 ml-auto">
                <button
                  onClick={() => setIsDetailsOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Close
                </button>
                <button
                  onClick={() => navigate(`/meeting/${selectedMeeting.meetingCode}`)}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-brand-blue hover:bg-blue-600 shadow-glow-blue transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Launch Meeting Room</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingsPage;
