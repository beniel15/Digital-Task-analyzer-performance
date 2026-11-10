import React, { useState } from 'react';
import { Award, Lock, User, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import api from '../../api/client';

const StudentLogin = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('7376231CS102');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Please enter both your Roll Number / Email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await api.login(identifier.trim(), password, 'student');
      api.setToken(response.token);
      api.setUser(response.user);
      onLoginSuccess(response.token, response.user);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F5FB] flex items-center justify-center p-4 font-sans text-[#1F2937]">
      <div className="w-full max-w-md">
        {/* Card Header */}
        <div className="bg-white border border-[#E5E7EB] rounded-3xl shadow-sm p-8 md:p-10">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[#F3F0FE] border border-[#E9E3FE] rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#7652F6] shadow-xs">
              <Award size={32} />
            </div>
            <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight">Student Portal Login</h1>
            <p className="text-[#6B7280] text-sm mt-1">Access your reward points, CGPA, and attendance dashboard</p>
            <div className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 bg-[#F3F0FE] border border-[#E9E3FE] text-[#7652F6] text-xs font-semibold rounded-full">
              <ShieldCheck size={14} /> Official College Student Portal
            </div>
          </div>

          {/* Demo Credentials Box */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 mb-5 text-xs text-[#4B5563]">
            <p className="font-bold text-[#7652F6] mb-1 flex items-center gap-1">
              🔑 Demo Student Credentials:
            </p>
            <div className="flex justify-between text-[#6B7280] font-mono mt-1">
              <span>Roll: <strong className="text-[#1F2937]">7376231CS102</strong></span>
              <span>Pass: <strong className="text-[#1F2937]">password123</strong></span>
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
                Roll Number or College Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF]">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D1D5DB] rounded-xl text-[#1F2937] placeholder-[#9CA3AF] text-sm focus:outline-none focus:ring-2 focus:ring-[#7652F6] focus:border-transparent transition-all"
                  placeholder="e.g. 7376231CS102"
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
                  placeholder="Enter your password"
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
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In as Student</span>
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

export default StudentLogin;
