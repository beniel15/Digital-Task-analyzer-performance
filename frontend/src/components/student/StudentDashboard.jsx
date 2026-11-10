import React, { useState, useEffect } from 'react';
import {
  Award, CheckCircle2, User, BookOpen, Send, Bell, MessageSquare, LogOut,
  RefreshCw, Sparkles, Check, AlertCircle, ShieldCheck
} from 'lucide-react';
import api from '../../api/client';

const StudentDashboard = ({ onLogout }) => {
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview | points | attendance | feedback
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Core data states (all start empty from database)
  const [pointsData, setPointsData] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [feedbackList, setFeedbackList] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Update Details Form / Modal
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    points_to_add: '',
    attendance_percentage: '',
    cgpa: '',
    skill_completed: '',
    description: ''
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateMsg, setUpdateMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [prof, pts, att, fb, notifs] = await Promise.all([
        api.getStudentProfile(),
        api.getStudentRewardPoints(),
        api.getStudentAttendance(),
        api.getStudentFeedback(),
        api.getStudentNotifications()
      ]);

      setProfile(prof);
      setPointsData(pts);
      setAttendanceData(att);
      setFeedbackList(fb || []);
      setNotifications(notifs || []);
    } catch (err) {
      console.error('Failed to load student dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAllData();
  };

  // Submit direct details update
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!updateForm.points_to_add && !updateForm.attendance_percentage && !updateForm.cgpa) {
      setUpdateMsg({ text: 'Please fill in at least one field to update.', type: 'error' });
      return;
    }

    try {
      setUpdateLoading(true);
      setUpdateMsg({ text: '', type: '' });

      const payload = {
        description: updateForm.description || updateForm.skill_completed || 'Academic details update'
      };

      if (updateForm.points_to_add !== '') {
        payload.points_to_add = parseInt(updateForm.points_to_add) || 0;
      }
      if (updateForm.attendance_percentage !== '') {
        payload.attendance_percentage = parseFloat(updateForm.attendance_percentage);
      }
      if (updateForm.cgpa !== '') {
        payload.cgpa = parseFloat(updateForm.cgpa);
      }
      if (updateForm.skill_completed) {
        payload.skill_completed = updateForm.skill_completed;
      }

      const res = await api.updateStudentDetails(payload);

      setUpdateMsg({
        text: res.message || 'Details updated successfully! Reflected in Mentor Dashboard.',
        type: 'success'
      });

      setTimeout(() => {
        setShowUpdateModal(false);
        setUpdateForm({
          points_to_add: '',
          attendance_percentage: '',
          cgpa: '',
          skill_completed: '',
          description: ''
        });
        setUpdateMsg({ text: '', type: '' });
        loadAllData();
      }, 1200);

    } catch (err) {
      setUpdateMsg({ text: err.message || 'Failed to update details.', type: 'error' });
    } finally {
      setUpdateLoading(false);
    }
  };

  // Mark notification read
  const handleMarkNotificationRead = async (id) => {
    try {
      await api.markStudentNotificationRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadNotifCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F5FB] flex items-center justify-center text-[#1F2937]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#7652F6] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#6B7280] font-medium text-sm">Loading Student Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F5FB] text-[#1F2937] flex flex-col md:flex-row font-sans">
      {/* White Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-[#E5E7EB] flex flex-col shrink-0 shadow-sm">
        {/* Portal Branding */}
        <div className="p-6 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F3F0FE] border border-[#E9E3FE] flex items-center justify-center text-[#7652F6] font-bold shadow-sm">
              <Award size={22} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1F2937] tracking-tight">Student Portal</h2>
              <p className="text-[11px] text-[#6B7280]">Academic Dashboard</p>
            </div>
          </div>
        </div>

        {/* Student Mini Profile Card */}
        <div className="p-4 mx-4 my-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#7652F6] to-[#9B82FB] flex items-center justify-center font-bold text-white text-sm shadow">
              {profile?.name?.charAt(0) || 'S'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-[#1F2937] truncate">{profile?.name}</p>
              <p className="text-[11px] font-mono text-[#6B7280] truncate">{profile?.roll_number}</p>
            </div>
          </div>
          {profile?.mentor_name && (
            <div className="mt-3 pt-2.5 border-t border-[#E2E8F0] text-[11px] text-[#6B7280] flex items-center justify-between">
              <span>Mentor:</span>
              <span className="text-[#7652F6] font-semibold truncate ml-1">{profile.mentor_name}</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'overview'
                ? 'bg-[#7652F6] text-white shadow-md shadow-[#7652F6]/25'
                : 'text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F3F5FB]'
            }`}
          >
            <User size={16} />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('points')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'points'
                ? 'bg-[#7652F6] text-white shadow-md shadow-[#7652F6]/25'
                : 'text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F3F5FB]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Sparkles size={16} />
              <span>Reward Points Ledger</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
              activeTab === 'points' ? 'bg-white/20 text-white' : 'bg-[#F3F5FB] text-[#6B7280]'
            }`}>
              {profile?.verified_points || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'attendance'
                ? 'bg-[#7652F6] text-white shadow-md shadow-[#7652F6]/25'
                : 'text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F3F5FB]'
            }`}
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 size={16} />
              <span>Attendance & CGPA</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
              activeTab === 'attendance' ? 'bg-white/20 text-white' : 'bg-[#F3F5FB] text-[#6B7280]'
            }`}>
              {profile?.verified_attendance || 0}%
            </span>
          </button>

          <button
            onClick={() => setActiveTab('feedback')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'feedback'
                ? 'bg-[#7652F6] text-white shadow-md shadow-[#7652F6]/25'
                : 'text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F3F5FB]'
            }`}
          >
            <div className="flex items-center gap-3">
              <MessageSquare size={16} />
              <span>Mentor Feedback</span>
            </div>
            {feedbackList.length > 0 && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                activeTab === 'feedback' ? 'bg-white/20 text-white' : 'bg-[#F3F0FE] text-[#7652F6]'
              }`}>
                {feedbackList.length}
              </span>
            )}
          </button>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-[#E5E7EB]">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#6B7280] hover:text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top White Navbar */}
        <header className="h-16 bg-white border-b border-[#E5E7EB] px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-[#1F2937]">
              {activeTab === 'overview' && 'Student Academic Dashboard'}
              {activeTab === 'points' && 'Reward Points Ledger & History'}
              {activeTab === 'attendance' && 'Attendance & CGPA Tracking'}
              {activeTab === 'feedback' && 'Mentor Feedback & Directives'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-xl text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F3F5FB] transition-colors"
              title="Refresh Data"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin text-[#7652F6]' : ''} />
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F3F5FB] transition-colors"
              >
                <Bell size={18} />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#7652F6] rounded-full animate-pulse" />
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl p-3 z-50">
                  <div className="flex justify-between items-center px-2 py-1 mb-2 border-b border-[#E5E7EB]">
                    <span className="text-xs font-bold text-[#1F2937]">Notifications ({unreadNotifCount} unread)</span>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-[11px] text-[#6B7280] hover:text-[#1F2937]"
                    >
                      Close
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-[#6B7280] text-center py-4">No notifications yet.</p>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => handleMarkNotificationRead(n.id)}
                          className={`p-2.5 rounded-xl text-xs cursor-pointer transition-colors ${
                            n.is_read ? 'bg-[#F8FAFC] text-[#6B7280]' : 'bg-[#F3F0FE] border border-[#E9E3FE] text-[#1F2937]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold truncate">{n.title}</span>
                            <span className="text-[10px] text-[#6B7280]">{new Date(n.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-[11px] text-[#4B5563] leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Update Button */}
            <button
              onClick={() => setShowUpdateModal(true)}
              className="bg-[#7652F6] hover:bg-[#633BF3] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-[#7652F6]/20 flex items-center gap-1.5 transition-all"
            >
              <Send size={14} />
              <span>Update Details</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Summary Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {/* 1. Verified Reward Points */}
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-medium text-[#6B7280]">Verified Reward Points</p>
                      <h3 className="text-3xl font-extrabold text-[#7652F6] mt-2 font-mono">
                        {pointsData?.verifiedPoints || 0} pts
                      </h3>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-[#F3F0FE] border border-[#E9E3FE] flex items-center justify-center text-[#7652F6]">
                      <Award size={22} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-[#6B7280]">
                    <span>Target: {pointsData?.targetPoints || 1000} pts</span>
                    <span className="text-[#7652F6] font-bold">{pointsData?.targetProgressPercentage || 0}%</span>
                  </div>
                  <div className="w-full bg-[#F3F5FB] h-2 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-[#7652F6] h-full rounded-full transition-all duration-500"
                      style={{ width: `${pointsData?.targetProgressPercentage || 0}%` }}
                    />
                  </div>
                </div>

                {/* 2. Attendance */}
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-medium text-[#6B7280]">Attendance Percentage</p>
                      <h3 className={`text-3xl font-extrabold mt-2 font-mono ${
                        (attendanceData?.currentAttendance || 0) === 0 ? 'text-[#1F2937]' :
                        (attendanceData?.currentAttendance || 0) < 75 ? 'text-red-600' : 'text-emerald-600'
                      }`}>
                        {attendanceData?.currentAttendance || 0}%
                      </h3>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                      <CheckCircle2 size={22} />
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-[#6B7280]">
                    Status: <strong className={
                      (attendanceData?.currentAttendance || 0) === 0 ? 'text-[#6B7280]' :
                      (attendanceData?.currentAttendance || 0) < 75 ? 'text-red-600 font-bold' : 'text-emerald-600'
                    }>
                      {(attendanceData?.currentAttendance || 0) === 0 ? 'Not updated yet' :
                       (attendanceData?.currentAttendance || 0) < 75 ? 'Shortage (< 75%)' : 'Eligible for Exams'}
                    </strong>
                  </div>
                </div>

                {/* 3. CGPA */}
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-medium text-[#6B7280]">Current CGPA</p>
                      <h3 className="text-3xl font-extrabold text-[#1F2937] mt-2 font-mono">
                        {profile?.cgpa ? Number(profile.cgpa).toFixed(2) : '0.00'}
                      </h3>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                      <BookOpen size={22} />
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-[#6B7280]">
                    Scale: <span className="text-[#1F2937] font-semibold">10.0 Maximum</span>
                  </div>
                </div>
              </div>

              {/* Student Academic Details & Action Section */}
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 shadow-xs">
                <div className="max-w-2xl mx-auto text-center space-y-4">
                  <div className="w-14 h-14 bg-[#F3F0FE] border border-[#E9E3FE] text-[#7652F6] rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                    <Sparkles size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-[#1F2937]">Academic Details Management</h3>
                  <p className="text-xs text-[#6B7280] leading-relaxed">
                    Enter your reward points, attendance percentage, and CGPA. Any information you update is immediately saved to your student profile and made available in your faculty mentor's dashboard.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => setShowUpdateModal(true)}
                      className="px-6 py-2.5 bg-[#7652F6] hover:bg-[#633BF3] text-white rounded-xl text-xs font-bold shadow-md shadow-[#7652F6]/20 transition-all inline-flex items-center gap-2"
                    >
                      <Send size={15} />
                      <span>Update Academic Details</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REWARD POINTS & HISTORY */}
          {activeTab === 'points' && (
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-[#E5E7EB]">
                <div>
                  <h3 className="text-sm font-bold text-[#1F2937]">Reward Points Ledger (Complete History)</h3>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    Continuous ledger of all points entered and accumulated towards your internal assessment marks.
                  </p>
                </div>
                <button
                  onClick={() => setShowUpdateModal(true)}
                  className="bg-[#7652F6] hover:bg-[#633BF3] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-[#7652F6]/20 flex items-center gap-1.5"
                >
                  <Send size={14} />
                  <span>Update Details</span>
                </button>
              </div>

              {(pointsData?.history || []).length === 0 ? (
                <div className="text-center py-16 text-[#6B7280] text-xs">
                  <div className="w-12 h-12 rounded-2xl bg-[#F3F0FE] text-[#7652F6] flex items-center justify-center mx-auto mb-3">
                    <Sparkles size={24} />
                  </div>
                  <p className="font-semibold text-[#1F2937] text-sm">No Reward Points Entries Yet</p>
                  <p className="text-[#6B7280] mt-1 max-w-sm mx-auto">
                    You have not entered any reward points yet. Click the "Update Details" button above to record your latest points.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E5E7EB] text-[#6B7280] uppercase tracking-wider text-[10px] bg-[#F8FAFC]">
                        <th className="py-3 px-4 font-bold">Date</th>
                        <th className="py-3 px-4 font-bold">Activity / Achievement Reason</th>
                        <th className="py-3 px-4 font-bold">Points Added</th>
                        <th className="py-3 px-4 font-bold">Total Verified Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {(pointsData?.history || []).map(h => (
                        <tr key={h.id} className="text-[#374151] hover:bg-[#F8FAFC] transition-colors">
                          <td className="py-3 px-4 font-mono text-[11px] text-[#6B7280]">
                            {new Date(h.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 font-medium text-[#1F2937]">{h.reason}</td>
                          <td className="py-3 px-4 font-mono font-bold text-[#7652F6]">+{h.points_change}</td>
                          <td className="py-3 px-4 font-mono font-bold text-[#1F2937]">{h.new_total} pts</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ATTENDANCE & CGPA */}
          {activeTab === 'attendance' && (
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-[#E5E7EB]">
                <div>
                  <h3 className="text-sm font-bold text-[#1F2937]">Attendance History & CGPA Tracking</h3>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    Track your verified attendance trajectory and semester CGPA.
                  </p>
                </div>
                <button
                  onClick={() => setShowUpdateModal(true)}
                  className="bg-[#7652F6] hover:bg-[#633BF3] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-[#7652F6]/20 flex items-center gap-1.5"
                >
                  <Send size={14} />
                  <span>Update Attendance / CGPA</span>
                </button>
              </div>

              {(attendanceData?.history || []).length === 0 ? (
                <div className="text-center py-16 text-[#6B7280] text-xs">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 size={24} />
                  </div>
                  <p className="font-semibold text-[#1F2937] text-sm">No Attendance Updates Yet</p>
                  <p className="text-[#6B7280] mt-1 max-w-sm mx-auto">
                    You have not entered any attendance records yet. Click "Update Attendance / CGPA" to enter your current percentage.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E5E7EB] text-[#6B7280] uppercase tracking-wider text-[10px] bg-[#F8FAFC]">
                        <th className="py-3 px-4 font-bold">Recorded Date</th>
                        <th className="py-3 px-4 font-bold">Previous Attendance</th>
                        <th className="py-3 px-4 font-bold">Updated Attendance</th>
                        <th className="py-3 px-4 font-bold">Attendance Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {(attendanceData?.history || []).map(h => (
                        <tr key={h.id} className="text-[#374151] hover:bg-[#F8FAFC]">
                          <td className="py-3 px-4 font-mono text-[11px] text-[#6B7280]">
                            {new Date(h.recorded_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 font-mono">{h.previous_attendance}%</td>
                          <td className="py-3 px-4 font-mono font-bold text-[#1F2937]">{h.new_attendance}%</td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              h.new_attendance < 75 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {h.new_attendance < 75 ? 'Attendance Shortage (<75%)' : 'Eligible for Exams'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MENTOR FEEDBACK */}
          {activeTab === 'feedback' && (
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-4">
              <div className="pb-3 border-b border-[#E5E7EB]">
                <h3 className="text-sm font-bold text-[#1F2937]">Mentor Feedback & Guidance Ledger</h3>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Guidance, appraisal messages, and action directives submitted by your faculty mentor.
                </p>
              </div>

              {feedbackList.length === 0 ? (
                <div className="text-center py-16 text-[#6B7280] text-xs">
                  <div className="w-12 h-12 rounded-2xl bg-[#F3F0FE] text-[#7652F6] flex items-center justify-center mx-auto mb-3">
                    <MessageSquare size={24} />
                  </div>
                  <p className="font-semibold text-[#1F2937] text-sm">No Mentor Feedback Yet</p>
                  <p className="text-[#6B7280] mt-1 max-w-sm mx-auto">
                    Your faculty mentor has not posted any feedback messages yet. Messages sent by your mentor will appear here in real time.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {feedbackList.map(fb => (
                    <div
                      key={fb.id}
                      className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#7652F6] uppercase tracking-wider px-2 py-0.5 bg-[#F3F0FE] border border-[#E9E3FE] rounded-full">
                          {fb.category}
                        </span>
                        <span className="text-[11px] text-[#6B7280] font-mono">
                          {new Date(fb.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-[#374151] leading-relaxed font-sans">{fb.message}</p>
                      <div className="text-[11px] text-[#6B7280] pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
                        <span>From: <strong className="text-[#1F2937]">{fb.mentor_name}</strong></span>
                        <span className="text-[10px] text-[#9CA3AF]">{fb.mentor_designation}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* UPDATE DETAILS MODAL */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-xl p-6 w-full max-w-lg text-[#1F2937]">
            <div className="flex justify-between items-center pb-3 border-b border-[#E5E7EB] mb-4">
              <h3 className="text-base font-bold text-[#1F2937] flex items-center gap-2">
                <Send size={18} className="text-[#7652F6]" />
                <span>Enter & Update Academic Details</span>
              </h3>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="text-[#6B7280] hover:text-[#1F2937]"
              >
                ✕
              </button>
            </div>

            {updateMsg.text && (
              <div className={`p-3 rounded-xl text-xs mb-4 flex items-center gap-2 ${
                updateMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {updateMsg.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                <span>{updateMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Points to Add (e.g. +100)
                </label>
                <input
                  type="number"
                  value={updateForm.points_to_add}
                  onChange={(e) => setUpdateForm({ ...updateForm, points_to_add: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-xl text-xs text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#7652F6] font-mono"
                  placeholder="e.g. 100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Attendance Percentage (0 - 100%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={updateForm.attendance_percentage}
                  onChange={(e) => setUpdateForm({ ...updateForm, attendance_percentage: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-xl text-xs text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#7652F6] font-mono"
                  placeholder={profile?.verified_attendance ? `Current: ${profile.verified_attendance}%` : 'e.g. 92.5'}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Current CGPA (0.0 - 10.0)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={updateForm.cgpa}
                  onChange={(e) => setUpdateForm({ ...updateForm, cgpa: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-xl text-xs text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#7652F6] font-mono"
                  placeholder={profile?.cgpa ? `Current: ${Number(profile.cgpa).toFixed(2)}` : 'e.g. 8.75'}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Skill / Activity Description (e.g. Java Challenge, SQL Assessment)
                </label>
                <textarea
                  rows={2}
                  value={updateForm.description}
                  onChange={(e) => setUpdateForm({ ...updateForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-xl text-xs text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#7652F6] resize-none"
                  placeholder="Enter details about what you completed..."
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="px-4 py-2 bg-[#F3F5FB] hover:bg-[#E5E7EB] text-[#374151] rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="px-5 py-2 bg-[#7652F6] hover:bg-[#633BF3] text-white rounded-xl text-xs font-bold shadow-md shadow-[#7652F6]/20 transition-all disabled:opacity-50"
                >
                  {updateLoading ? 'Saving...' : 'Save & Update Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
