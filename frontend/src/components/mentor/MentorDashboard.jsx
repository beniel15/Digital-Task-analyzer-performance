import React, { useState, useEffect } from 'react';
import {
  Users, Award, Search, MessageSquare, Check, Eye, Bell, LogOut,
  RefreshCw, AlertCircle, Send, Shield, Megaphone
} from 'lucide-react';
import api from '../../api/client';

const MentorDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('mentees'); // mentees | feedback
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Core Data
  const [mentees, setMentees] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all | low_attendance | low_points | high_performers

  // General Broadcast Form state
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastBanner, setBroadcastBanner] = useState({ text: '', type: '' });

  // Mentee Detail Drawer
  const [selectedMentee, setSelectedMentee] = useState(null);
  const [menteeDetails, setMenteeDetails] = useState(null);
  const [loadingMenteeDetails, setLoadingMenteeDetails] = useState(false);

  // Feedback Modal
  const [feedbackModal, setFeedbackModal] = useState({
    isOpen: false,
    student: null, // null / 'all' = Broadcast to all mentees
    category: 'General',
    message: '',
    loading: false,
    error: '',
    success: ''
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [mList, fbList, nList] = await Promise.all([
        api.getAssignedMentees(),
        api.getMentorAllFeedback().catch(() => []),
        api.getMentorNotifications()
      ]);

      setMentees(mList || []);
      setFeedbackList(fbList || []);
      setNotifications(nList || []);
    } catch (err) {
      console.error('Failed to load mentor dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAllData();
  };

  // Broadcast General Message to All Mentees simultaneously
  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    if (!broadcastMsg.trim()) {
      setBroadcastBanner({ text: 'Please enter a message to broadcast.', type: 'error' });
      return;
    }

    try {
      setBroadcastLoading(true);
      setBroadcastBanner({ text: '', type: '' });
      const res = await api.sendGeneralBroadcast(broadcastMsg.trim(), 'General');
      setBroadcastBanner({
        text: res.message || `General message delivered to all ${mentees.length} assigned students simultaneously!`,
        type: 'success'
      });
      setBroadcastMsg('');
      loadAllData();
      setTimeout(() => {
        setBroadcastBanner({ text: '', type: '' });
      }, 4000);
    } catch (err) {
      setBroadcastBanner({ text: err.message || 'Failed to broadcast message.', type: 'error' });
    } finally {
      setBroadcastLoading(false);
    }
  };

  // View individual mentee details
  const handleViewMentee = async (student) => {
    setSelectedMentee(student);
    try {
      setLoadingMenteeDetails(true);
      const details = await api.getMenteeDetails(student.id);
      setMenteeDetails(details);
    } catch (err) {
      alert('Error fetching mentee details: ' + err.message);
    } finally {
      setLoadingMenteeDetails(false);
    }
  };

  // Submit feedback modal (supports individual student or all mentees)
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    const { student, category, message } = feedbackModal;
    if (!message.trim()) {
      setFeedbackModal(prev => ({ ...prev, error: 'Feedback message cannot be empty.' }));
      return;
    }

    try {
      setFeedbackModal(prev => ({ ...prev, loading: true, error: '' }));
      const isAll = !student || student === 'all' || student.id === 'all';
      const targetId = isAll ? 'all' : student.id;
      const res = await api.provideFeedback(targetId, category, message);

      setFeedbackModal(prev => ({
        ...prev,
        loading: false,
        success: isAll
          ? (res.message || `General message sent simultaneously to all ${mentees.length} assigned mentees!`)
          : 'Feedback sent to student successfully!'
      }));

      setTimeout(() => {
        setFeedbackModal({ isOpen: false, student: null, category: 'General', message: '', loading: false, error: '', success: '' });
        loadAllData();
      }, 1000);
    } catch (err) {
      setFeedbackModal(prev => ({ ...prev, loading: false, error: err.message || 'Failed to submit feedback.' }));
    }
  };

  // Mark notification read
  const handleMarkNotificationRead = async (id) => {
    try {
      await api.markMentorNotificationRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (err) {
      console.error(err);
    }
  };

  // Metrics computed live from assigned mentees
  const totalMentees = mentees.length;
  const averagePoints = totalMentees
    ? Math.round(mentees.reduce((acc, m) => acc + (m.verified_points || 0), 0) / totalMentees)
    : 0;
  const lowAttendanceCount = mentees.filter(
    m => m.verified_attendance > 0 && m.verified_attendance < 75.0
  ).length;
  const averageCgpa = totalMentees
    ? (mentees.reduce((acc, m) => acc + (m.cgpa || 0), 0) / totalMentees).toFixed(2)
    : '0.00';

  // Filter mentees
  const filteredMentees = mentees.filter(m => {
    const matchesSearch =
      m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.roll_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.department?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'low_attendance') {
      return m.verified_attendance > 0 && m.verified_attendance < 75.0;
    }
    if (filterType === 'low_points') {
      return m.verified_points > 0 && m.verified_points < 300;
    }
    if (filterType === 'high_performers') {
      return m.verified_points >= 800;
    }

    return true;
  });

  const unreadNotifCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F5FB] flex items-center justify-center text-[#1F2937]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#7652F6] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#6B7280] font-medium text-sm">Loading Faculty Mentor Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F5FB] text-[#1F2937] flex flex-col md:flex-row font-sans">
      {/* White Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-[#E5E7EB] flex flex-col shrink-0 shadow-sm">
        {/* Branding */}
        <div className="p-6 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F3F0FE] border border-[#E9E3FE] flex items-center justify-center text-[#7652F6] font-bold shadow-sm">
              <Shield size={22} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1F2937] tracking-tight">Mentor Portal</h2>
              <p className="text-[11px] text-[#6B7280]">Faculty Supervisory Control</p>
            </div>
          </div>
        </div>

        {/* Mentor Mini Badge */}
        <div className="p-4 mx-4 my-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#7652F6] to-[#9B82FB] flex items-center justify-center font-bold text-white text-sm shadow">
              M
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-[#1F2937] truncate">Faculty Mentor</p>
              <p className="text-[11px] text-[#7652F6] font-mono font-semibold">Assigned: {mentees.length} Students</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1">
          <button
            onClick={() => setActiveTab('mentees')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'mentees'
                ? 'bg-[#7652F6] text-white shadow-md shadow-[#7652F6]/25'
                : 'text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F3F5FB]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users size={16} />
              <span>Assigned Mentees</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
              activeTab === 'mentees' ? 'bg-white/20 text-white' : 'bg-[#F3F5FB] text-[#6B7280]'
            }`}>
              {mentees.length}
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
              <span>Feedback Center</span>
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

        {/* Sign Out */}
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top White Navbar */}
        <header className="h-16 bg-white border-b border-[#E5E7EB] px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-[#1F2937]">
              {activeTab === 'mentees' && 'Assigned Mentee Performance & Official Rankings'}
              {activeTab === 'feedback' && 'Mentor Directives & Feedback Communication Center'}
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

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl p-3 z-50">
                  <div className="flex justify-between items-center px-2 py-1 mb-2 border-b border-[#E5E7EB]">
                    <span className="text-xs font-bold text-[#1F2937]">Mentor Alerts ({unreadNotifCount} unread)</span>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-[11px] text-[#6B7280] hover:text-[#1F2937]"
                    >
                      Close
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-[#6B7280] text-center py-4">No alerts yet.</p>
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
          </div>
        </header>

        {/* Content Body */}
        <main className="p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* TAB 1: ASSIGNED MENTEES */}
          {activeTab === 'mentees' && (
            <div className="space-y-6">
              {/* 4 Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs">
                  <p className="text-xs font-medium text-[#6B7280]">Assigned Mentees</p>
                  <h3 className="text-3xl font-extrabold text-[#1F2937] mt-1.5 font-mono">{totalMentees}</h3>
                  <p className="text-xs text-[#7652F6] font-semibold mt-2">Active Supervision</p>
                </div>

                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs">
                  <p className="text-xs font-medium text-[#6B7280]">Cohort Average Points</p>
                  <h3 className="text-3xl font-extrabold text-[#7652F6] mt-1.5 font-mono">{averagePoints}</h3>
                  <p className="text-xs text-[#6B7280] mt-2">Reward points earned</p>
                </div>

                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs">
                  <p className="text-xs font-medium text-[#6B7280]">Attendance Shortage (&lt;75%)</p>
                  <h3 className={`text-3xl font-extrabold mt-1.5 font-mono ${
                    lowAttendanceCount > 0 ? 'text-red-600' : 'text-emerald-600'
                  }`}>
                    {lowAttendanceCount}
                  </h3>
                  <p className="text-xs text-red-600 mt-2">Requires counseling</p>
                </div>

                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs">
                  <p className="text-xs font-medium text-[#6B7280]">Cohort Average CGPA</p>
                  <h3 className="text-3xl font-extrabold text-[#1F2937] mt-1.5 font-mono">
                    {averageCgpa}
                  </h3>
                  <p className="text-xs text-[#6B7280] mt-2">Out of 10.0 scale</p>
                </div>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-3 justify-between items-center">
                <div className="relative w-full md:w-80">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by student name, roll number..."
                    className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#D1D5DB] rounded-xl text-xs text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#7652F6]"
                  />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                      filterType === 'all'
                        ? 'bg-[#7652F6] text-white shadow-sm'
                        : 'bg-[#F3F5FB] text-[#6B7280] hover:text-[#1F2937]'
                    }`}
                  >
                    All Mentees ({mentees.length})
                  </button>

                  <button
                    onClick={() => setFilterType('low_attendance')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                      filterType === 'low_attendance'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-red-50 text-red-700 hover:bg-red-100'
                    }`}
                  >
                    Low Attendance (&lt;75%)
                  </button>

                  <button
                    onClick={() => setFilterType('low_points')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                      filterType === 'low_points'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    }`}
                  >
                    Low Points (&lt;300)
                  </button>

                  <button
                    onClick={() => setFilterType('high_performers')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                      filterType === 'high_performers'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    High Performers (≥800)
                  </button>
                </div>
              </div>

              {/* Mentor Student Ranking Table */}
              <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#6B7280] uppercase tracking-wider text-[10px]">
                        <th className="py-3.5 px-4 font-bold">Rank</th>
                        <th className="py-3.5 px-4 font-bold">Student Name & Roll Number</th>
                        <th className="py-3.5 px-4 font-bold">Department</th>
                        <th className="py-3.5 px-4 font-bold">Reward Points</th>
                        <th className="py-3.5 px-4 font-bold">Attendance</th>
                        <th className="py-3.5 px-4 font-bold">CGPA</th>
                        <th className="py-3.5 px-4 font-bold">Alert Flags</th>
                        <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {filteredMentees.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-[#6B7280] text-xs">
                            No mentees match the current search or filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredMentees.map(m => {
                          const hasNotEntered = (m.verified_attendance === 0 && m.verified_points === 0);
                          const isLowAtt = m.verified_attendance > 0 && m.verified_attendance < 75.0;
                          const isLowPts = m.verified_points > 0 && m.verified_points < 300;

                          return (
                            <tr key={m.id} className="text-[#374151] hover:bg-[#F8FAFC] transition-colors">
                              <td className="py-3.5 px-4 font-mono font-bold text-[#1F2937]">
                                #{m.rank_position || '—'}
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-[#1F2937]">{m.name}</div>
                                <div className="font-mono text-[11px] text-[#6B7280]">{m.roll_number}</div>
                              </td>
                              <td className="py-3.5 px-4 text-[#4B5563]">{m.department}</td>
                              <td className="py-3.5 px-4 font-mono font-bold text-[#7652F6]">
                                {m.verified_points} pts
                              </td>
                              <td className="py-3.5 px-4 font-mono font-bold">
                                <span className={
                                  m.verified_attendance === 0 ? 'text-[#6B7280]' :
                                  isLowAtt ? 'text-red-600' : 'text-emerald-600'
                                }>
                                  {m.verified_attendance}%
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-mono font-semibold text-[#1F2937]">
                                {m.cgpa ? Number(m.cgpa).toFixed(2) : '0.00'}
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="flex flex-wrap gap-1">
                                  {hasNotEntered ? (
                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                      Pending Entry
                                    </span>
                                  ) : (
                                    <>
                                      {isLowAtt && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                                          Low Attendance
                                        </span>
                                      )}
                                      {isLowPts && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                          Low Points
                                        </span>
                                      )}
                                      {!isLowAtt && !isLowPts && (
                                        <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                                          <Check size={11} /> Normal Standing
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleViewMentee(m)}
                                    className="px-3 py-1 bg-[#F3F5FB] hover:bg-[#E5E7EB] text-[#1F2937] rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                                    title="View Detailed Profile"
                                  >
                                    <Eye size={13} />
                                    <span>Profile</span>
                                  </button>
                                  <button
                                    onClick={() => setFeedbackModal({ isOpen: true, student: m, category: 'General', message: '', loading: false, error: '', success: '' })}
                                    className="px-3 py-1 bg-[#7652F6] hover:bg-[#633BF3] text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
                                    title="Send Direct Feedback"
                                  >
                                    <MessageSquare size={13} />
                                    <span>Feedback</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FEEDBACK CENTER */}
          {activeTab === 'feedback' && (
            <div className="space-y-6">
              {/* Option 1: Broadcast General Message to All Assigned Mentees */}
              <div className="bg-white border-2 border-[#E9E3FE] rounded-2xl p-6 shadow-xs">
                <div className="flex items-start justify-between pb-4 border-b border-[#F3F0FE] mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F3F0FE] text-[#7652F6] flex items-center justify-center font-bold">
                      <Megaphone size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#1F2937] flex items-center gap-2">
                        <span>General Message (Send to All Mentees)</span>
                        <span className="text-[11px] font-semibold text-[#7652F6] bg-[#F3F0FE] px-2.5 py-0.5 rounded-full border border-[#E9E3FE]">
                          Common Broadcast
                        </span>
                      </h3>
                      <p className="text-xs text-[#6B7280] mt-0.5">
                        Post a common announcement, exam reminder, or directive delivered simultaneously to all {mentees.length} assigned students.
                      </p>
                    </div>
                  </div>
                </div>

                {broadcastBanner.text && (
                  <div className={`p-3 rounded-xl text-xs mb-4 flex items-center gap-2 ${
                    broadcastBanner.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}>
                    {broadcastBanner.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                    <span>{broadcastBanner.text}</span>
                  </div>
                )}

                <form onSubmit={handleBroadcastSubmit} className="space-y-3">
                  <textarea
                    rows={3}
                    value={broadcastMsg}
                    onChange={(e) => setBroadcastMsg(e.target.value)}
                    placeholder="Enter common message to deliver simultaneously to all your assigned students (e.g. 'Complete your SQL assessment by Friday, submit attendance updates on time')..."
                    className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#D1D5DB] rounded-xl text-xs text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#7652F6] resize-none"
                    required
                  />

                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[11px] text-[#6B7280]">
                      Recipients: <strong className="text-[#7652F6]">All {mentees.length} Assigned Students</strong>
                    </span>
                    <button
                      type="submit"
                      disabled={broadcastLoading}
                      className="px-5 py-2.5 bg-[#7652F6] hover:bg-[#633BF3] text-white rounded-xl text-xs font-bold shadow-md shadow-[#7652F6]/20 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      <Megaphone size={14} />
                      <span>{broadcastLoading ? 'Broadcasting...' : 'Broadcast to All Students'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Option 2: Select Individual Mentee to Send 1-on-1 Message */}
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                  <div>
                    <h4 className="text-xs font-bold text-[#374151] uppercase tracking-wider">
                      Send 1-on-1 Message to a Specific Mentee
                    </h4>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      Select an individual student to send private feedback or guidance.
                    </p>
                  </div>
                  <button
                    onClick={() => setFeedbackModal({ isOpen: true, student: 'all', category: 'General', message: '', loading: false, error: '', success: '' })}
                    className="text-xs text-[#7652F6] hover:text-[#633BF3] font-bold flex items-center gap-1"
                  >
                    <Megaphone size={13} />
                    <span>Open Common Broadcast Modal</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {mentees.map(m => (
                    <div
                      key={m.id}
                      className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between hover:border-[#7652F6]/50 transition-colors"
                    >
                      <div className="overflow-hidden">
                        <p className="font-bold text-[#1F2937] text-xs truncate">{m.name}</p>
                        <p className="text-[11px] text-[#6B7280] font-mono">{m.roll_number}</p>
                        <p className="text-[10px] text-[#7652F6] font-semibold mt-1">
                          {m.verified_points} pts • {m.verified_attendance}% att
                        </p>
                      </div>
                      <button
                        onClick={() => setFeedbackModal({ isOpen: true, student: m, category: 'General', message: '', loading: false, error: '', success: '' })}
                        className="px-3 py-1.5 bg-[#7652F6] hover:bg-[#633BF3] text-white rounded-lg text-xs font-bold shadow-xs transition-colors shrink-0 flex items-center gap-1"
                      >
                        <Send size={12} />
                        <span>Message</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sent Feedback History */}
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-[#374151] uppercase tracking-wider pb-3 border-b border-[#E5E7EB]">
                  Sent Feedback & Directives Ledger ({feedbackList.length})
                </h4>

                {feedbackList.length === 0 ? (
                  <div className="text-center py-16 text-[#6B7280] text-xs">
                    <div className="w-12 h-12 rounded-2xl bg-[#F3F0FE] text-[#7652F6] flex items-center justify-center mx-auto mb-3">
                      <MessageSquare size={24} />
                    </div>
                    <p className="font-semibold text-[#1F2937] text-sm">No Feedback Messages Sent Yet</p>
                    <p className="text-[#6B7280] mt-1 max-w-sm mx-auto">
                      You have not sent any feedback messages to your assigned mentees yet. Use the broadcast box above or click "Message" next to any student to send guidance.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {feedbackList.map(fb => (
                      <div
                        key={fb.id}
                        className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#1F2937]">{fb.student_name}</span>
                            <span className="font-mono text-[11px] text-[#6B7280]">({fb.roll_number})</span>
                            <span className="text-[10px] font-bold text-[#7652F6] uppercase tracking-wider px-2 py-0.5 bg-[#F3F0FE] border border-[#E9E3FE] rounded-full ml-1">
                              {fb.category}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#6B7280] font-mono">
                            {new Date(fb.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-[#374151] leading-relaxed pl-1">{fb.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* FEEDBACK MODAL (Supports Individual Student or All Mentees Broadcast) */}
      {feedbackModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-xl p-6 w-full max-w-md text-[#1F2937]">
            <div className="flex justify-between items-center pb-3 border-b border-[#E5E7EB] mb-4">
              <h3 className="text-base font-bold text-[#1F2937] flex items-center gap-2">
                <MessageSquare size={18} className="text-[#7652F6]" />
                <span>
                  {(!feedbackModal.student || feedbackModal.student === 'all' || feedbackModal.student?.id === 'all')
                    ? `General Broadcast to All ${mentees.length} Mentees`
                    : `Send Feedback to ${feedbackModal.student?.name}`}
                </span>
              </h3>
              <button
                onClick={() => setFeedbackModal({ ...feedbackModal, isOpen: false })}
                className="text-[#6B7280] hover:text-[#1F2937]"
              >
                ✕
              </button>
            </div>

            {feedbackModal.error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl mb-4 flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{feedbackModal.error}</span>
              </div>
            )}

            {feedbackModal.success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl mb-4 flex items-center gap-2">
                <Check size={16} />
                <span>{feedbackModal.success}</span>
              </div>
            )}

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">Target Recipient</label>
                <select
                  value={
                    (!feedbackModal.student || feedbackModal.student === 'all' || feedbackModal.student?.id === 'all')
                      ? 'all'
                      : feedbackModal.student.id
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'all') {
                      setFeedbackModal({ ...feedbackModal, student: 'all', category: 'General' });
                    } else {
                      const found = mentees.find(m => m.id === parseInt(val));
                      setFeedbackModal({ ...feedbackModal, student: found || null });
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-xl text-xs text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#7652F6]"
                >
                  <option value="all">📢 All Assigned Mentees ({mentees.length} Students) - General Broadcast</option>
                  <optgroup label="Individual Students">
                    {mentees.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.roll_number})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">Feedback Category</label>
                <select
                  value={feedbackModal.category}
                  onChange={(e) => setFeedbackModal({ ...feedbackModal, category: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-xl text-xs text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#7652F6]"
                >
                  <option value="General">General Message / Announcement</option>
                  <option value="Reward Points">Reward Points</option>
                  <option value="Attendance">Attendance Warning / Counseling</option>
                  <option value="Academic">Academic Guidance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">Message Directive</label>
                <textarea
                  rows={4}
                  value={feedbackModal.message}
                  onChange={(e) => setFeedbackModal({ ...feedbackModal, message: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-xl text-xs text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#7652F6] resize-none"
                  placeholder="Enter constructive advice, targets or guidance..."
                  required
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setFeedbackModal({ ...feedbackModal, isOpen: false })}
                  className="px-4 py-2 bg-[#F3F5FB] hover:bg-[#E5E7EB] text-[#374151] rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={feedbackModal.loading}
                  className="px-5 py-2 bg-[#7652F6] hover:bg-[#633BF3] text-white rounded-xl text-xs font-bold shadow-md shadow-[#7652F6]/20 transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send size={13} />
                  <span>
                    {feedbackModal.loading
                      ? 'Sending...'
                      : (!feedbackModal.student || feedbackModal.student === 'all' || feedbackModal.student?.id === 'all')
                        ? 'Broadcast to All'
                        : 'Send Message'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MENTEE DETAIL DRAWER */}
      {selectedMentee && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-end z-50">
          <div className="bg-white border-l border-[#E5E7EB] w-full max-w-xl h-full p-6 text-[#1F2937] overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-[#E5E7EB]">
              <div>
                <h3 className="text-lg font-bold text-[#1F2937]">{selectedMentee.name}</h3>
                <p className="text-xs font-mono text-[#7652F6]">{selectedMentee.roll_number} • {selectedMentee.department}</p>
              </div>
              <button
                onClick={() => setSelectedMentee(null)}
                className="p-1.5 text-[#6B7280] hover:text-[#1F2937] rounded-lg hover:bg-[#F3F5FB]"
              >
                ✕
              </button>
            </div>

            {loadingMenteeDetails ? (
              <div className="py-12 text-center text-[#6B7280] text-xs">
                <div className="w-8 h-8 border-2 border-[#7652F6] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading mentee details...
              </div>
            ) : menteeDetails ? (
              <div className="space-y-6">
                {/* Metric Summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0] text-center">
                    <p className="text-[11px] text-[#6B7280]">Reward Points</p>
                    <p className="text-xl font-bold text-[#7652F6] font-mono mt-0.5">{menteeDetails.student.verified_points}</p>
                    <p className="text-[10px] text-[#6B7280]">Rank #{menteeDetails.student.rank_position || '—'}</p>
                  </div>
                  <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0] text-center">
                    <p className="text-[11px] text-[#6B7280]">Attendance</p>
                    <p className={`text-xl font-bold font-mono mt-0.5 ${
                      menteeDetails.student.verified_attendance === 0 ? 'text-[#6B7280]' :
                      menteeDetails.student.verified_attendance < 75 ? 'text-red-600' : 'text-emerald-600'
                    }`}>
                      {menteeDetails.student.verified_attendance}%
                    </p>
                    <p className="text-[10px] text-[#6B7280]">Min 75%</p>
                  </div>
                  <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0] text-center">
                    <p className="text-[11px] text-[#6B7280]">CGPA</p>
                    <p className="text-xl font-bold text-[#1F2937] font-mono mt-0.5">
                      {menteeDetails.student.cgpa ? Number(menteeDetails.student.cgpa).toFixed(2) : '0.00'}
                    </p>
                    <p className="text-[10px] text-[#6B7280]">Score {menteeDetails.student.performance_score}</p>
                  </div>
                </div>

                {/* Point History Ledger */}
                <div>
                  <h4 className="text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Points History</h4>
                  <div className="space-y-2">
                    {menteeDetails.pointsHistory.length === 0 ? (
                      <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-center text-xs text-[#6B7280]">
                        No points entered yet by student.
                      </div>
                    ) : (
                      menteeDetails.pointsHistory.map(h => (
                        <div key={h.id} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <span className="font-semibold text-[#1F2937]">{h.reason}</span>
                            <p className="text-[10px] text-[#6B7280] font-mono mt-0.5">{new Date(h.created_at).toLocaleDateString()} • Balance: {h.new_total} pts</p>
                          </div>
                          <span className="text-[11px] font-bold font-mono text-[#7652F6]">
                            +{h.points_change} pts
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Attendance History */}
                <div>
                  <h4 className="text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Attendance History</h4>
                  <div className="space-y-2">
                    {menteeDetails.attendanceHistory.length === 0 ? (
                      <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-center text-xs text-[#6B7280]">
                        No attendance updates entered yet.
                      </div>
                    ) : (
                      menteeDetails.attendanceHistory.map(a => (
                        <div key={a.id} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <span className="font-semibold text-[#1F2937]">Updated to {a.new_attendance}%</span>
                            <p className="text-[10px] text-[#6B7280] font-mono mt-0.5">Previous: {a.previous_attendance}%</p>
                          </div>
                          <span className="text-[10px] text-[#6B7280] font-mono">
                            {new Date(a.recorded_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Feedback Ledger */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-bold text-[#374151] uppercase tracking-wider">Feedback Sent</h4>
                    <button
                      onClick={() => setFeedbackModal({ isOpen: true, student: menteeDetails.student, category: 'General', message: '', loading: false, error: '', success: '' })}
                      className="text-xs text-[#7652F6] hover:text-[#633BF3] font-bold"
                    >
                      + Send Feedback
                    </button>
                  </div>
                  <div className="space-y-2">
                    {menteeDetails.feedback.length === 0 ? (
                      <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-center text-xs text-[#6B7280]">
                        No feedback sent to this student yet.
                      </div>
                    ) : (
                      menteeDetails.feedback.map(f => (
                        <div key={f.id} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-[#7652F6]">{f.category}</span>
                            <span className="text-[10px] text-[#6B7280]">{new Date(f.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-[#374151]">{f.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorDashboard;
