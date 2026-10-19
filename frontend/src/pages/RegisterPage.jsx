import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Shield,
  User,
  Mail,
  Lock,
  Briefcase,
  Layers,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Member',
    jobTitle: '',
    department: 'Engineering & Product',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await register(formData);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col justify-between p-4 md:p-8 relative overflow-hidden bg-grid-mesh">
      <div className="ambient-orb-blue top-[-100px] left-[-100px] opacity-50" />
      <div className="ambient-orb-gold bottom-[-100px] right-[-100px] opacity-40" />

      {/* Header */}
      <header className="flex items-center justify-between py-2 container mx-auto">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-blue via-brand-indigo to-brand-electric flex items-center justify-center shadow-glow-blue">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">
            Intell<span className="text-brand-electric">Meet</span> <span className="text-xs uppercase bg-brand-blue/20 text-brand-electric px-1.5 py-0.5 rounded border border-brand-blue/40">AI</span>
          </span>
        </Link>
        <Link
          to="/login"
          className="text-xs font-semibold px-4 py-2 rounded-xl text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/80 transition-all"
        >
          Sign In Instead
        </Link>
      </header>

      {/* Main Registration Card */}
      <div className="container mx-auto max-w-xl my-8 relative z-10">
        <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-brand-blue/30 shadow-2xl relative">
          <div className="mb-6">
            <span className="text-xs font-bold tracking-wider uppercase text-brand-electric px-2.5 py-1 rounded-full bg-brand-blue/10 border border-brand-blue/20 inline-block mb-2">
              Workspace Access
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Create your enterprise account
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Join your team on IntellMeet AI for intelligent collaboration.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Elena Rostova"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Work Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="elena@company.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Job Title</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleChange}
                    placeholder="Staff Software Engineer"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Role Permission</label>
                <div className="relative">
                  <Layers className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm bg-navy-900"
                  >
                    <option value="Member">Team Member</option>
                    <option value="Manager">Team Manager</option>
                    <option value="Admin">Administrator</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-brand-blue via-brand-indigo to-blue-600 hover:from-blue-600 hover:to-indigo-600 shadow-glow-blue transition-all flex items-center justify-center gap-2 group disabled:opacity-60 cursor-pointer mt-4"
            >
              {loading ? 'Creating Account...' : 'Complete Registration'}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-electric hover:text-white transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>

      <footer className="text-center text-xs text-slate-500 py-2">
        © 2026 IntellMeet AI Inc. All rights reserved.
      </footer>
    </div>
  );
};

export default RegisterPage;
