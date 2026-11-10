import React, { useState, useEffect } from 'react';
import { Award, Shield, User, ArrowRight, CheckCircle2 } from 'lucide-react';
import api from './api/client';

// Components
import MentorLogin from './components/mentor/MentorLogin';
import MentorDashboard from './components/mentor/MentorDashboard';
import StudentLogin from './components/student/StudentLogin';
import StudentDashboard from './components/student/StudentDashboard';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [currentPage, setCurrentPage] = useState('role-selection');
  const [authLoading, setAuthLoading] = useState(true);

  // Initialize session from sessionStorage on app mount
  useEffect(() => {
    const token = api.getToken();
    const user = api.getUser();

    if (token && user) {
      setCurrentUser(user);
      setUserRole(user.role);
      setCurrentPage(user.role === 'mentor' ? 'mentor-dashboard' : 'student-dashboard');
    } else {
      setCurrentPage('role-selection');
    }

    setAuthLoading(false);

    // Event listener for token expiration
    const handleExpired = () => {
      setCurrentUser(null);
      setUserRole(null);
      setCurrentPage('role-selection');
    };

    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  const handleLoginSuccess = (token, user) => {
    setCurrentUser(user);
    setUserRole(user.role);
    setCurrentPage(user.role === 'mentor' ? 'mentor-dashboard' : 'student-dashboard');
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // Ignored if network fails
    }
    api.clearSession();
    setCurrentUser(null);
    setUserRole(null);
    setCurrentPage('role-selection');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F3F5FB] flex items-center justify-center text-[#1F2937]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#7652F6] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#6B7280] font-medium text-sm">Verifying Session...</p>
        </div>
      </div>
    );
  }

  // Active Dashboards
  if (currentPage === 'student-dashboard') {
    return <StudentDashboard user={currentUser} onLogout={handleLogout} />;
  }

  if (currentPage === 'mentor-dashboard') {
    return <MentorDashboard user={currentUser} onLogout={handleLogout} />;
  }

  // Login screens
  if (currentPage === 'student-login') {
    return (
      <div className="relative">
        <button
          onClick={() => setCurrentPage('role-selection')}
          className="fixed top-5 left-5 px-4 py-2 bg-white text-[#374151] hover:text-[#7652F6] rounded-xl text-xs font-bold border border-[#E5E7EB] shadow-xs z-50 transition-colors flex items-center gap-1.5"
        >
          ← Back to Role Selection
        </button>
        <StudentLogin onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  if (currentPage === 'mentor-login') {
    return (
      <div className="relative">
        <button
          onClick={() => setCurrentPage('role-selection')}
          className="fixed top-5 left-5 px-4 py-2 bg-white text-[#374151] hover:text-[#7652F6] rounded-xl text-xs font-bold border border-[#E5E7EB] shadow-xs z-50 transition-colors flex items-center gap-1.5"
        >
          ← Back to Role Selection
        </button>
        <MentorLogin onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  // Role Selection Landing Page (Light College PC(D)P Portal Theme)
  return (
    <div className="min-h-screen bg-[#F3F5FB] flex items-center justify-center p-4 font-sans text-[#1F2937]">
      <div className="w-full max-w-2xl bg-white border border-[#E5E7EB] rounded-3xl shadow-sm p-8 md:p-12">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#F3F0FE] border border-[#E9E3FE] flex items-center justify-center mx-auto mb-4 text-[#7652F6] shadow-xs">
            <Award size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-[#1F2937] tracking-tight">
            Mentor–Mentee Management System
          </h1>
          <p className="text-[#6B7280] text-sm mt-2">
            Select your portal to continue
          </p>
        </div>

        {/* Two Dedicated Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-5">
          {/* Student Portal Card */}
          <button
            onClick={() => setCurrentPage('student-login')}
            className="group p-6 bg-[#F8FAFC] hover:bg-white border border-[#E2E8F0] hover:border-[#7652F6] rounded-2xl text-left transition-all duration-300 hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#F3F0FE] border border-[#E9E3FE] flex items-center justify-center text-[#7652F6] mb-4 group-hover:scale-105 transition-transform">
                <User size={24} />
              </div>
              <h2 className="text-base font-bold text-[#1F2937] mb-1">Student Portal</h2>
              <p className="text-[#6B7280] text-xs leading-relaxed">
                Log in to enter your reward points, update attendance and CGPA, track ranking, and receive guidance directives from your mentor.
              </p>
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-xs font-bold text-[#7652F6] group-hover:text-[#633BF3]">
              <span>Sign in as Student</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Mentor Portal Card */}
          <button
            onClick={() => setCurrentPage('mentor-login')}
            className="group p-6 bg-[#F8FAFC] hover:bg-white border border-[#E2E8F0] hover:border-[#7652F6] rounded-2xl text-left transition-all duration-300 hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#F3F0FE] border border-[#E9E3FE] flex items-center justify-center text-[#7652F6] mb-4 group-hover:scale-105 transition-transform">
                <Shield size={24} />
              </div>
              <h2 className="text-base font-bold text-[#1F2937] mb-1">Faculty Mentor Portal</h2>
              <p className="text-[#6B7280] text-xs leading-relaxed">
                Monitor assigned mentees in real time, view official rankings, identify attendance shortages (&lt;75%), and send feedback messages.
              </p>
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-xs font-bold text-[#7652F6] group-hover:text-[#633BF3]">
              <span>Sign in as Mentor</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
