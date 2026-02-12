import React, { useState, useEffect } from 'react';
import { Trophy, Target, TrendingUp, Award, Plus, Trash2 } from 'lucide-react';

const MentorDashboard = ({ authToken, onLogout }) => {
  const [students, setStudents] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch students on load and set up auto-refresh
  useEffect(() => {
    fetchStudents();
    
    // Set up auto-refresh every 5 seconds
    const interval = setInterval(fetchStudents, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/mentor/students', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await response.json();

      // Always keep students as an array so .map/.filter don't crash
      if (!response.ok) {
        console.error('Failed to fetch students:', data);
        setStudents([]);
        return;
      }

      setStudents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    }
  };

  const deleteStudent = async (id) => {
    if (!confirm('Delete this student?')) return;
    try {
      await fetch(`http://localhost:5000/api/mentor/students/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      fetchStudents();
    } catch (error) {
      alert('Error deleting student');
    }
  };

  const safeStudents = Array.isArray(students) ? students : [];

  const avgScore = safeStudents.length > 0
    ? (safeStudents.reduce((sum, s) => sum + parseFloat(s.performance_score || 0), 0) / safeStudents.length).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Header */}
      <div className="bg-white border-b border-[#E5E7EB] px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-semibold text-[#1F2937]">DTPA Portal</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gradient-to-br from-[#5B6CFF] to-[#7C4DFF] rounded-full"></div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-[#5B6CFF] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#4B5CEF] mr-3"
            >
              Add Student
            </button>
            <button onClick={onLogout} className="text-[#6B7280] hover:text-[#1F2937]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4 4m4-4H3m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1m6-4v4a6 6 0 01-6 6H6a6 6 0 01-6-6V7a6 6 0 016-6h4z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#F8F9FF] rounded-xl p-6 text-[#1F2937] shadow-lg hover:shadow-xl transition-all hover:-translate-y-1" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6B7280]">Total Students</p>
                <p className="text-3xl font-bold text-[#1F2937]">{safeStudents.length}</p>
              </div>
              <div className="bg-[#5B6CFF]/10 p-3 rounded-lg">
                <Target className="w-6 h-6 text-[#5B6CFF]" />
              </div>
            </div>
          </div>
          
          <div className="bg-[#F0FDF4] rounded-xl p-6 text-[#1F2937] shadow-lg hover:shadow-xl transition-all hover:-translate-y-1" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6B7280]">Top Performer</p>
                <p className="text-xl font-bold text-[#1F2937]">{safeStudents[0]?.name || 'N/A'}</p>
              </div>
              <div className="bg-[#22C55E]/10 p-3 rounded-lg">
                <Trophy className="w-6 h-6 text-[#22C55E]" />
              </div>
            </div>
          </div>
          
          <div className="bg-[#FFFBEB] rounded-xl p-6 text-[#1F2937] shadow-lg hover:shadow-xl transition-all hover:-translate-y-1" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6B7280]">Avg Score</p>
                <p className="text-3xl font-bold text-[#1F2937]">{avgScore}%</p>
              </div>
              <div className="bg-[#F59E0B]/10 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-[#F59E0B]" />
              </div>
            </div>
          </div>
          
          <div className="bg-[#FEF2F2] rounded-xl p-6 text-[#1F2937] shadow-lg hover:shadow-xl transition-all hover:-translate-y-1" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6B7280]">Diamond Rank</p>
                <p className="text-3xl font-bold text-[#1F2937]">{safeStudents.filter(s => s.reward_points >= 1000).length}</p>
              </div>
              <div className="bg-[#EF4444]/10 p-3 rounded-lg">
                <Award className="w-6 h-6 text-[#EF4444]" />
              </div>
            </div>
          </div>
        </div>

        {/* Student Table */}
        <div className="bg-white rounded-xl overflow-hidden shadow-lg" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div className="px-6 py-4 border-b border-[#E5E7EB]">
            <h2 className="text-lg font-semibold text-[#1F2937]">Student Rankings</h2>
            <p className="text-sm text-[#6B7280]">Ranked by total reward points</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F5F7FA] border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#1F2937] uppercase">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#1F2937] uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#1F2937] uppercase">Roll No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#1F2937] uppercase">Skill</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#1F2937] uppercase">Completed Levels</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#1F2937] uppercase">Points</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#1F2937] uppercase">Badge</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#1F2937] uppercase">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#1F2937] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#E5E7EB]">
                {safeStudents.map((student, index) => (
                  <tr key={student.id} className="hover:bg-[#F5F7FA]">
                    <td className="px-6 py-4">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                        student.rank <= 3 ? 'bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-white' :
                        'bg-[#FFF9E6] text-[#1F2937]'
                      }`}>
                        {student.rank}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-[#1F2937]">{student.name}</td>
                    <td className="px-6 py-4 text-[#6B7280]">{student.roll_number}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-[#F5F7FA] text-[#1F2937] rounded text-sm">
                        {student.personalized_skill || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#6B7280]">{student.completed_levels || '0'}</td>
                    <td className="px-6 py-4 font-bold text-[#1F2937]">{student.reward_points}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        student.badge === 'Diamond' ? 'bg-gradient-to-r from-[#5B6CFF] to-[#7C4DFF] text-white' :
                        student.badge === 'Platinum' ? 'bg-gradient-to-r from-[#9CA3AF] to-[#6B7280] text-white' :
                        student.badge === 'Gold' ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white' :
                        'bg-[#F5F7FA] text-[#1F2937]'
                      }`}>
                        {student.badge}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-[#E5E7EB] rounded-full h-1.5 w-20">
                          <div
                            className={`h-1.5 rounded-full ${
                              student.performance_score >= 80 ? 'bg-[#22C55E]' :
                              student.performance_score >= 60 ? 'bg-[#F59E0B]' :
                              'bg-[#EF4444]'
                            }`}
                            style={{ width: `${student.performance_score}%` }}
                          ></div>
                        </div>
                        <span className="font-medium text-[#1F2937]">{student.performance_score}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => deleteStudent(student.id)} 
                        className="text-[#EF4444] hover:text-[#DC2626] hover:bg-[#FEE2E2] p-2 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAddModal && <AddStudentModal authToken={authToken} onClose={() => setShowAddModal(false)} onSuccess={fetchStudents} />}
    </div>
  );
};

// ADD STUDENT MODAL
const AddStudentModal = ({ authToken, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    name: '',
    roll_number: '',
    email: '',
    firebase_uid: '',
    personalized_skill: '',
    reward_points: 0,
    attendance_percentage: 0,
    completed_status: 'Not Started',
    certificate_completion: false
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/mentor/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(form)
      });

      if (response.ok) {
        alert('Student added successfully!');
        onSuccess();
        onClose();
      } else {
        const error = await response.json().catch(() => ({}));
        alert('Error: ' + (error.details || error.error || `HTTP ${response.status}`));
      }
    } catch (error) {
      alert('Error adding student: ' + (error.message || 'Network error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#1F2937]">Add New Student</h2>
          <button 
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#1F2937]"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1F2937] mb-2">Full Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B6CFF] focus:border-[#5B6CFF]"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1F2937] mb-2">Roll Number *</label>
              <input
                type="text"
                value={form.roll_number}
                onChange={(e) => setForm({...form, roll_number: e.target.value})}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B6CFF] focus:border-[#5B6CFF]"
                placeholder="CS2024001"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1F2937] mb-2">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({...form, email: e.target.value})}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B6CFF] focus:border-[#5B6CFF]"
                placeholder="student@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1F2937] mb-2">Firebase UID *</label>
              <input
                type="text"
                value={form.firebase_uid}
                onChange={(e) => setForm({...form, firebase_uid: e.target.value})}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B6CFF] focus:border-[#5B6CFF]"
                placeholder="Get from Firebase Console"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1F2937] mb-2">Personalized Skill</label>
            <input
              type="text"
              value={form.personalized_skill}
              onChange={(e) => setForm({...form, personalized_skill: e.target.value})}
              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B6CFF] focus:border-[#5B6CFF]"
              placeholder="React, Python, etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1F2937] mb-2">Reward Points</label>
              <input
                type="number"
                value={form.reward_points}
                onChange={(e) => setForm({...form, reward_points: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B6CFF] focus:border-[#5B6CFF]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1F2937] mb-2">Attendance %</label>
              <input
                type="number"
                value={form.attendance_percentage}
                onChange={(e) => setForm({...form, attendance_percentage: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B6CFF] focus:border-[#5B6CFF]"
                max="100"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-[#5B6CFF] text-white py-3 px-4 rounded-lg font-bold hover:bg-[#4B5CEF] disabled:opacity-50 transition-all"
            >
              {loading ? 'Adding...' : 'Add Student'}
            </button>
            <button 
              onClick={onClose}
              className="flex-1 border border-[#E5E7EB] py-3 px-4 rounded-lg font-bold hover:bg-[#F5F7FA] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorDashboard;
