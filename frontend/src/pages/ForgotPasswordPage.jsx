import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mail, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [demoToken, setDemoToken] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data?.success) {
        setSuccess(true);
        if (res.data.resetToken) {
          setDemoToken(res.data.resetToken);
        }
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
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
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Login</span>
          </Link>

          <h2 className="text-2xl font-bold text-white tracking-tight">Reset password</h2>
          <p className="text-xs text-slate-400 mt-1 mb-6">
            Enter your work email and we will generate a secure reset link.
          </p>

          {success ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                <div className="flex items-center gap-2 font-semibold mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Reset instructions issued</span>
                </div>
                <p className="text-slate-300">
                  A password reset token has been generated for <strong>{email}</strong>.
                </p>
              </div>

              {demoToken && (
                <div className="p-3 rounded-xl bg-navy-900 border border-slate-700 text-xs space-y-2">
                  <p className="text-slate-400">Development Demo Token:</p>
                  <code className="block bg-navy-950 p-2 rounded text-[11px] font-mono text-brand-electric break-all">
                    {demoToken}
                  </code>
                  <Link
                    to={`/reset-password/${demoToken}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-gold hover:underline pt-1"
                  >
                    <span>Proceed directly to Reset Page</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
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
                  Account Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@intellmeet.ai"
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
                {loading ? 'Processing...' : 'Send Reset Link'}
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

export default ForgotPasswordPage;
