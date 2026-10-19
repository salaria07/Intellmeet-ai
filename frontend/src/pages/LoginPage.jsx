import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles,
  Video,
  FileText,
  Users,
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Layers,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('alex@intellmeet.ai');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex relative overflow-hidden bg-grid-mesh">
      {/* Ambient Radial Glowing Lights */}
      <div className="ambient-orb-blue top-[-100px] left-[-100px] opacity-60" />
      <div className="ambient-orb-gold bottom-[-100px] right-[-100px] opacity-40" />
      <div className="ambient-orb-violet top-[30%] left-[25%] opacity-30" />

      {/* Orbital Ring Background SVG Graphics */}
      <div className="absolute inset-0 pointer-events-none opacity-20 flex items-center justify-center">
        <div className="w-[850px] h-[850px] rounded-full border border-brand-blue/30 animate-spin-slow" />
        <div className="absolute w-[600px] h-[600px] rounded-full border border-dashed border-brand-indigo/30 animate-pulse-subtle" />
        <div className="absolute w-[1100px] h-[1100px] rounded-full border border-brand-electric/15" />
      </div>

      <div className="container mx-auto px-4 md:px-8 py-8 flex flex-col justify-between min-h-screen relative z-10">
        {/* Top Header Branding */}
        <header className="flex items-center justify-between py-2">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-blue via-brand-indigo to-brand-electric flex items-center justify-center shadow-glow-blue ring-1 ring-white/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-2xl tracking-tight text-white">
                  Intell<span className="text-brand-electric">Meet</span>
                </span>
                <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-brand-blue/20 text-brand-electric border border-brand-blue/40">
                  AI
                </span>
              </div>
              <p className="text-[11px] font-medium tracking-wide text-brand-gold">
                Meet smarter. Move faster.
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-navy-900/80 px-3 py-1.5 rounded-full border border-slate-800">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Enterprise SOC-2 Type II Verified</span>
            </span>
            <Link
              to="/register"
              className="text-xs font-semibold px-4 py-2 rounded-xl text-brand-electric hover:text-white bg-slate-900/60 hover:bg-slate-800/80 border border-brand-blue/30 transition-all"
            >
              Request Access
            </Link>
          </div>
        </header>

        {/* Main Split-Screen Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto py-8">
          {/* Left Column: Headline, Highlights, and Product Preview Mockup */}
          <div className="lg:col-span-7 space-y-7">
            {/* Enterprise Badges */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-blue/15 text-brand-electric border border-brand-blue/30">
                <Cpu className="w-3.5 h-3.5 text-brand-electric" />
                Next-Gen Meeting Intelligence
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                <Zap className="w-3 h-3 text-amber-400" />
                Zero-Latency WebRTC
              </span>
            </div>

            {/* Main Headline */}
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
                Every meeting.{' '}
                <span className="bg-gradient-to-r from-brand-electric via-indigo-300 to-amber-300 bg-clip-text text-transparent">
                  One intelligent workspace.
                </span>
              </h1>
              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                Video meetings, live collaboration, AI-generated summaries, transcription, and smart
                action items—all in one place.
              </p>
            </div>

            {/* Three Feature Highlights with Curated Color Accents */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
              <div className="p-4 rounded-2xl glass-card border-brand-blue/20 bg-gradient-to-b from-brand-blue/10 to-transparent">
                <div className="w-9 h-9 rounded-xl bg-brand-blue/20 flex items-center justify-center text-brand-electric mb-3 border border-brand-blue/30">
                  <Video className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-white mb-1">HD Video Meetings</h3>
                <p className="text-xs text-slate-400 leading-normal">
                  Ultra-low latency WebRTC audio, video, screen share, and group chat.
                </p>
              </div>

              <div className="p-4 rounded-2xl glass-card border-brand-gold/20 bg-gradient-to-b from-amber-500/10 to-transparent">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-brand-gold mb-3 border border-amber-500/30">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-white mb-1">AI Summaries</h3>
                <p className="text-xs text-slate-400 leading-normal">
                  Automated transcripts, key decisions, takeaways, and action items.
                </p>
              </div>

              <div className="p-4 rounded-2xl glass-card border-brand-indigo/20 bg-gradient-to-b from-brand-indigo/10 to-transparent">
                <div className="w-9 h-9 rounded-xl bg-brand-indigo/20 flex items-center justify-center text-indigo-300 mb-3 border border-brand-indigo/30">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-white mb-1">Team Workspace</h3>
                <p className="text-xs text-slate-400 leading-normal">
                  Role-based permissions, Kanban task boards, and member directories.
                </p>
              </div>
            </div>

            {/* Interactive Live Product Preview Mockup */}
            <div className="relative rounded-2xl p-1 bg-gradient-to-r from-brand-blue/40 via-indigo-500/30 to-amber-500/40 shadow-glow-blue">
              <div className="rounded-[14px] bg-navy-900/90 backdrop-blur-xl p-4 border border-slate-800">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    <span className="text-slate-400 font-mono text-[11px] ml-2">
                      intellmeet.ai/workspace/live
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Room Active
                  </span>
                </div>

                <div className="grid grid-cols-12 gap-3">
                  {/* Left Mock: Video Stream Preview */}
                  <div className="col-span-7 bg-navy-950 rounded-xl p-3 border border-slate-800 relative overflow-hidden">
                    <div className="aspect-video rounded-lg bg-slate-900/80 flex items-center justify-center relative overflow-hidden">
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
                        alt="Speaker preview"
                        className="w-full h-full object-cover opacity-80"
                      />
                      <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/60 backdrop-blur-md text-[10px] font-medium text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        Alex Morgan (Host)
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                      <span>4 Participants Connected</span>
                      <span className="text-brand-electric font-mono">1080p 60fps</span>
                    </div>
                  </div>

                  {/* Right Mock: Live AI Summary Panel */}
                  <div className="col-span-5 bg-navy-850/80 rounded-xl p-3 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-brand-gold text-[11px] font-bold mb-1.5">
                        <Sparkles className="w-3 h-3" />
                        <span>AI Executive Summary</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        "Team agreed on Q4 architecture milestones and completed STUN/TURN failover
                        testing."
                      </p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-800 space-y-1">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">
                        Extracted Action Items
                      </span>
                      <div className="p-1.5 rounded bg-navy-950 text-[10px] text-slate-200 border border-slate-800 flex items-center justify-between">
                        <span className="truncate">Deploy WebRTC audio pipeline</span>
                        <span className="text-[9px] px-1 rounded bg-brand-blue/30 text-brand-electric">
                          High
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Premium Blue-and-Gold Glassmorphism Login Card */}
          <div className="lg:col-span-5">
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-brand-blue/30 shadow-2xl relative overflow-hidden">
              {/* Subtle Ambient Card Glow */}
              <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-b from-brand-blue/20 to-transparent rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-36 h-36 bg-gradient-to-t from-brand-gold/15 to-transparent rounded-full blur-2xl pointer-events-none" />

              {/* Card Header */}
              <div className="mb-6 relative z-10">
                <span className="text-xs font-bold tracking-wider uppercase text-brand-electric px-2.5 py-1 rounded-full bg-brand-blue/10 border border-brand-blue/20 inline-block mb-2">
                  Enterprise Authentication
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Welcome back
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Sign in to your IntellMeet AI organization workspace
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">Password</label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-brand-electric hover:text-white transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl glass-input text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Sign In CTA */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-brand-blue via-brand-indigo to-blue-600 hover:from-blue-600 hover:to-indigo-600 shadow-glow-blue transition-all flex items-center justify-center gap-2 group disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <span>Signing In...</span>
                  ) : (
                    <>
                      <span>Sign In to IntellMeet</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                {/* Single-Click Demo Quick Fill Buttons */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                    <span>Quick Fill Demo Credentials:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => fillDemoCredentials('alex@intellmeet.ai', 'Password123!')}
                      className="px-2.5 py-1.5 rounded-lg bg-navy-850 hover:bg-slate-800 border border-slate-700/80 text-[11px] text-slate-300 text-left truncate transition-colors"
                    >
                      👑 Alex (Admin)
                    </button>
                    <button
                      type="button"
                      onClick={() => fillDemoCredentials('sarah.j@intellmeet.ai', 'Password123!')}
                      className="px-2.5 py-1.5 rounded-lg bg-navy-850 hover:bg-slate-800 border border-slate-700/80 text-[11px] text-slate-300 text-left truncate transition-colors"
                    >
                      👩‍💻 Sarah (Member)
                    </button>
                  </div>
                </div>

                {/* Enterprise Security Guarantee */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>256-Bit TLS End-to-End Encrypted Session</span>
                </div>
              </form>

              {/* Registration Link Footer */}
              <div className="mt-5 text-center text-xs text-slate-400 relative z-10">
                New to IntellMeet AI?{' '}
                <Link
                  to="/register"
                  className="font-semibold text-brand-electric hover:text-white transition-colors ml-1"
                >
                  Create an account
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-4 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <p>© 2026 IntellMeet AI Inc. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-300 cursor-pointer">Security Whitepaper</span>
            <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-300 cursor-pointer">System Status</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LoginPage;
