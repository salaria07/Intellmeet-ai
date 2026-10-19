import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Video,
  FileText,
  Users,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Lock,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col justify-between relative overflow-hidden bg-grid-mesh">
      {/* Ambient Lighting Orbs */}
      <div className="ambient-orb-blue top-[-100px] left-[-100px] opacity-50" />
      <div className="ambient-orb-gold bottom-[-100px] right-[-100px] opacity-40" />
      <div className="ambient-orb-violet top-[40%] right-[20%] opacity-25" />

      {/* Orbital Graphics in Background */}
      <div className="absolute inset-0 pointer-events-none opacity-20 flex items-center justify-center">
        <div className="w-[900px] h-[900px] rounded-full border border-brand-blue/30 animate-spin-slow" />
        <div className="absolute w-[650px] h-[650px] rounded-full border border-dashed border-brand-indigo/30 animate-pulse-subtle" />
      </div>

      {/* Header */}
      <header className="container mx-auto px-6 py-6 flex items-center justify-between relative z-20">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-blue via-brand-indigo to-brand-electric flex items-center justify-center shadow-glow-blue ring-1 ring-white/20">
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
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-brand-blue hover:bg-blue-600 text-white shadow-glow-blue transition-all flex items-center gap-2"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-brand-blue via-brand-indigo to-blue-600 hover:from-blue-600 hover:to-indigo-600 text-white shadow-glow-blue transition-all"
              >
                Request Access
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-12 my-auto relative z-10 text-center max-w-4xl space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-brand-blue/15 text-brand-electric border border-brand-blue/30 shadow-glow-blue/40">
          <Sparkles className="w-3.5 h-3.5 text-brand-electric" />
          <span>Next-Generation Enterprise AI Video & Collaboration Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] text-white">
          Every meeting.{' '}
          <span className="bg-gradient-to-r from-brand-electric via-indigo-300 to-amber-300 bg-clip-text text-transparent">
            One intelligent workspace.
          </span>
        </h1>

        <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Video meetings, live collaboration, AI-generated summaries, transcription, and smart
          action items—all in one place.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            to="/login"
            className="py-3.5 px-8 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-brand-blue via-brand-indigo to-blue-600 hover:from-blue-600 hover:to-indigo-600 shadow-glow-blue transition-all flex items-center gap-2 group cursor-pointer"
          >
            <span>Launch IntellMeet Experience</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            to="/login"
            className="py-3.5 px-7 rounded-2xl font-semibold text-sm text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-brand-blue/40 transition-all"
          >
            Sign In with Demo Credentials
          </Link>
        </div>

        {/* Three Core Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-8 text-left">
          <div className="p-6 rounded-3xl glass-card border-brand-blue/20 bg-gradient-to-b from-brand-blue/10 to-transparent">
            <div className="w-10 h-10 rounded-xl bg-brand-blue/20 flex items-center justify-center text-brand-electric mb-4 border border-brand-blue/30">
              <Video className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white mb-1.5">HD Video Meetings</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time WebRTC audio & video with screen sharing, participant controls, and instant chat.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-card border-brand-gold/20 bg-gradient-to-b from-amber-500/10 to-transparent">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-brand-gold mb-4 border border-amber-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white mb-1.5">AI-Powered Summaries</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automatic transcripts, key decisions, takeaways, unresolved questions, and smart action items.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-card border-brand-indigo/20 bg-gradient-to-b from-brand-indigo/10 to-transparent">
            <div className="w-10 h-10 rounded-xl bg-brand-indigo/20 flex items-center justify-center text-indigo-300 mb-4 border border-brand-indigo/30">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white mb-1.5">Intelligent Collaboration</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Shared team workspaces, role-based permissions, Kanban task boards, and telemetry analytics.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3 relative z-20">
        <p>© 2026 IntellMeet AI Inc. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <span className="hover:text-slate-300">Privacy Policy</span>
          <span className="hover:text-slate-300">Terms of Service</span>
          <span className="hover:text-slate-300">Security Verification</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
