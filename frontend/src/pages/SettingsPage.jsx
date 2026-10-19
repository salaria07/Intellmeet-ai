import React, { useState } from 'react';
import {
  User,
  Lock,
  Bell,
  Sun,
  Moon,
  Video,
  Mic,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Camera,
  Key,
  Globe,
  Sliders,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const avatarOptions = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80',
];

const SettingsPage = () => {
  const { user, updateProfile, theme, toggleTheme, logout } = useAuth();

  const [activeSection, setActiveSection] = useState('profile'); // 'profile' | 'security' | 'meetings' | 'notifications'

  // Profile Form
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    jobTitle: user?.jobTitle || '',
    department: user?.department || '',
    avatar: user?.avatar || avatarOptions[0],
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password Form
  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');

  // Meeting Defaults & Notifications
  const [meetingDefaults, setMeetingDefaults] = useState({
    cameraDefault: user?.settings?.cameraDefault ?? true,
    micDefault: user?.settings?.micDefault ?? true,
    soundEnabled: user?.settings?.soundEnabled ?? true,
    emailNotifications: user?.settings?.emailNotifications ?? true,
    meetingReminders: user?.settings?.meetingReminders ?? true,
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileLoading(true);

    try {
      await updateProfile(profileData);
      setProfileSuccess('Profile successfully updated.');
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err) {
      setProfileError(err.message || 'Could not update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (passData.newPassword.length < 6) {
      setPassError('New password must be at least 6 characters.');
      return;
    }

    if (passData.newPassword !== passData.confirmPassword) {
      setPassError('New passwords do not match.');
      return;
    }

    setPassLoading(true);
    try {
      const res = await api.put('/auth/password', {
        currentPassword: passData.currentPassword,
        newPassword: passData.newPassword,
      });

      if (res.data?.success) {
        setPassSuccess('Password updated successfully.');
        setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setPassSuccess(''), 3000);
      }
    } catch (err) {
      setPassError(err.message || 'Password update failed.');
    } finally {
      setPassLoading(false);
    }
  };

  const handleTogglePreference = async (key) => {
    const updated = { ...meetingDefaults, [key]: !meetingDefaults[key] };
    setMeetingDefaults(updated);
    try {
      await updateProfile({ settings: updated });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    } catch (err) {
      console.error('Settings update error:', err);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Settings & Workspace Preferences
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your personal profile, security credentials, meeting hardware defaults, and notification rules.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Section Navigation */}
        <div className="lg:col-span-3 space-y-1.5">
          {[
            { id: 'profile', name: 'Profile & Identity', icon: User },
            { id: 'security', name: 'Security & Password', icon: Lock },
            { id: 'meetings', name: 'Meeting Hardware Defaults', icon: Video },
            { id: 'notifications', name: 'Notifications & Alerts', icon: Bell },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-brand-blue text-white shadow-glow-blue'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </button>
            );
          })}

          <div className="pt-4 border-t border-slate-800 mt-4">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out Everywhere</span>
            </button>
          </div>
        </div>

        {/* Right Settings Form Container */}
        <div className="lg:col-span-9">
          {/* 1. Profile Section */}
          {activeSection === 'profile' && (
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
              <div>
                <h3 className="font-bold text-lg text-white">Profile Information</h3>
                <p className="text-xs text-slate-400">
                  Update your display name, corporate avatar, and department.
                </p>
              </div>

              {profileSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{profileSuccess}</span>
                </div>
              )}

              {profileError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>{profileError}</span>
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-6">
                {/* Avatar Picker */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Profile Avatar
                  </label>
                  <div className="flex items-center gap-3 flex-wrap">
                    {avatarOptions.map((avUrl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setProfileData({ ...profileData, avatar: avUrl })}
                        className={`relative rounded-2xl p-0.5 transition-all ${
                          profileData.avatar === avUrl
                            ? 'ring-2 ring-brand-blue scale-105'
                            : 'opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={avUrl}
                          alt="Avatar option"
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Account Email
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-sm bg-navy-900/60 opacity-60 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={profileData.jobTitle}
                      onChange={(e) =>
                        setProfileData({ ...profileData, jobTitle: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Department
                    </label>
                    <input
                      type="text"
                      value={profileData.department}
                      onChange={(e) =>
                        setProfileData({ ...profileData, department: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-blue to-brand-indigo hover:from-blue-600 hover:to-indigo-600 shadow-glow-blue transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{profileLoading ? 'Saving...' : 'Save Profile Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 2. Security Section */}
          {activeSection === 'security' && (
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
              <div>
                <h3 className="font-bold text-lg text-white">Password & Authentication</h3>
                <p className="text-xs text-slate-400">
                  Ensure your account is protected with a high-entropy password.
                </p>
              </div>

              {passSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{passSuccess}</span>
                </div>
              )}

              {passError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>{passError}</span>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Current Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={passData.currentPassword}
                    onChange={(e) =>
                      setPassData({ ...passData, currentPassword: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Min. 6 characters"
                    value={passData.newPassword}
                    onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={passData.confirmPassword}
                    onChange={(e) =>
                      setPassData({ ...passData, confirmPassword: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={passLoading}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-blue hover:bg-blue-600 shadow-glow-blue transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {passLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 3. Meeting Hardware Defaults */}
          {activeSection === 'meetings' && (
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
              <div>
                <h3 className="font-bold text-lg text-white">Meeting Hardware Defaults</h3>
                <p className="text-xs text-slate-400">
                  Configure default camera, microphone, and theme behaviors upon joining a room.
                </p>
              </div>

              {settingsSaved && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Preferences saved.</span>
                </div>
              )}

              <div className="space-y-4 max-w-xl">
                {/* Dark Theme Toggle */}
                <div className="p-4 rounded-2xl bg-navy-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
                      <span>Appearance Theme</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Currently using <strong>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</strong>
                    </p>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                  >
                    Toggle to {theme === 'dark' ? 'Light' : 'Dark'}
                  </button>
                </div>

                {/* Default Camera */}
                <div className="p-4 rounded-2xl bg-navy-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      <Video className="w-4 h-4 text-brand-electric" />
                      <span>Camera Enabled by Default</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Automatically turn on video camera when entering meetings.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={meetingDefaults.cameraDefault}
                    onChange={() => handleTogglePreference('cameraDefault')}
                    className="w-5 h-5 accent-brand-blue rounded cursor-pointer"
                  />
                </div>

                {/* Default Microphone */}
                <div className="p-4 rounded-2xl bg-navy-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      <Mic className="w-4 h-4 text-emerald-400" />
                      <span>Microphone Enabled by Default</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Automatically unmute audio when joining conference rooms.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={meetingDefaults.micDefault}
                    onChange={() => handleTogglePreference('micDefault')}
                    className="w-5 h-5 accent-brand-blue rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. Notifications */}
          {activeSection === 'notifications' && (
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
              <div>
                <h3 className="font-bold text-lg text-white">Notifications & Alerts</h3>
                <p className="text-xs text-slate-400">
                  Control how IntellMeet delivers meeting invites and AI summary alerts.
                </p>
              </div>

              <div className="space-y-4 max-w-xl">
                <div className="p-4 rounded-2xl bg-navy-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-white">Email Meeting Invitations</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Receive calendar updates and participant links via email.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={meetingDefaults.emailNotifications}
                    onChange={() => handleTogglePreference('emailNotifications')}
                    className="w-5 h-5 accent-brand-blue rounded cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-navy-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-white">Upcoming Meeting Reminders</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Send browser notifications 5 minutes prior to scheduled start times.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={meetingDefaults.meetingReminders}
                    onChange={() => handleTogglePreference('meetingReminders')}
                    className="w-5 h-5 accent-brand-blue rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
