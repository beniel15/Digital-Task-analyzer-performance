import React, { useState } from 'react';
import { Shield, Lock, Mail, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';
import api from '../../api/client';

const MentorLogin = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('mentor@bitsathy.ac.in');
  const [password, setPassword] = useState('mentor123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Please enter your Faculty Mentor email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await api.login(identifier.trim(), password, 'mentor');
      api.setToken(response.token);
      api.setUser(response.user);
      onLoginSuccess(response.token, response.user);
    } catch (err) {
      setError(err.message || 'Mentor login failed. Please verify faculty credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F5FB] flex items-center justify-center p-4 font-sans text-[#1F2937]">
      <div className="w-full max-w-md">
        <div className="bg-white border border-[#E5E7EB] rounded-3xl shadow-sm p-8 md:p-10">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[#F3F0FE] border border-[#E9E3FE] rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#7652F6] shadow-xs">
              <Shield size={32} />
            </div>
            <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight">Faculty Mentor Login</h1>
            <p className="text-[#6B7280] text-sm mt-1">Supervise assigned mentees, track performance & send feedback</p>
            <div className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 bg-[#F3F0FE] border border-[#E9E3FE] text-[#7652F6] text-xs font-semibold rounded-full">
              <UserCheck size={14} /> Official Faculty Gateway
            </div>
          </div>

          {/* Demo Credentials Box */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 mb-5 text-xs text-[#4B5563]">
            <p className="font-bold text-[#7652F6] mb-1 flex items-center gap-1">
              🔑 Demo Mentor Credentials:
            </p>
            <div className="space-y-1 font-mono text-[#6B7280] mt-1">
              <div>Mentor 1: <strong className="text-[#1F2937]">mentor@bitsathy.ac.in</strong> / <strong className="text-[#1F2937]">mentor123</strong></div>
              <div>Mentor 2: <strong className="text-[#1F2937]">meena.mentor@bitsathy.ac.in</strong> / <strong className="text-[#1F2937]">mentor123</strong></div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm flex items-start gap-2.5">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                Faculty Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF]">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D1D5DB] rounded-xl text-[#1F2937] placeholder-[#9CA3AF] text-sm focus:outline-none focus:ring-2 focus:ring-[#7652F6] focus:border-transparent transition-all"
                  placeholder="mentor@bitsathy.ac.in"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF]">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D1D5DB] rounded-xl text-[#1F2937] placeholder-[#9CA3AF] text-sm focus:outline-none focus:ring-2 focus:ring-[#7652F6] focus:border-transparent transition-all"
                  placeholder="Enter mentor password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-[#7652F6] hover:bg-[#633BF3] text-white py-2.5 px-4 rounded-xl font-bold text-sm shadow-md shadow-[#7652F6]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Faculty Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In as Mentor</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MentorLogin;
