import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Sparkles, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(`/auth/reset-password/${token}`, { password });
      if (res.data?.success) {
        setSuccess(true);
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } catch (err) {
      setError(err.message || 'Password reset failed or token expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col justify-between p-4 md:p-8 relative overflow-hidden bg-grid-mesh">
      <div className="ambient-orb-blue top-[-100px] left-[-100px] opacity-40" />

      <header className="container mx-auto py-2">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-brand-blue flex items-center justify-center shadow-glow-blue">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">
            Intell<span className="text-brand-electric">Meet</span> AI
          </span>
        </Link>
      </header>

      <div className="container mx-auto max-w-md my-auto relative z-10">
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-brand-blue/30 shadow-2xl">
          <h2 className="text-2xl font-bold text-white tracking-tight">Set new password</h2>
          <p className="text-xs text-slate-400 mt-1 mb-6">
            Enter your new secure password below.
          </p>

          {success ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Password reset successful! Redirecting to dashboard...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-brand-blue to-brand-indigo hover:from-blue-600 hover:to-indigo-600 shadow-glow-blue transition-all disabled:opacity-60 cursor-pointer"
              >
                {loading ? 'Updating Password...' : 'Save New Password'}
              </button>
            </form>
          )}
        </div>
      </div>

      <footer className="text-center text-xs text-slate-500 py-2">
        © 2026 IntellMeet AI Inc.
      </footer>
    </div>
  );
};

export default ResetPasswordPage;
