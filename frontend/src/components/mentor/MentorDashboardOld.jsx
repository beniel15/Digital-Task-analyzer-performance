import React, { useState, useEffect } from 'react';
import { Trophy, Target, TrendingUp, Award, Plus, Trash2, X } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      {showAddModal && <AddStudentModal authToken={authToken} onClose={() => setShowAddModal(false)} onSuccess={fetchStudents} />}
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2">Mentor Dashboard</h1>
              <p className="text-indigo-100 text-lg">Real-time student performance tracking</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 flex items-center gap-2 font-semibold transition-all transform hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                Add Student
              </button>
              <button onClick={onLogout} className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold transition-all">
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg transform transition-all hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Students</p>
                <p className="text-4xl font-bold mt-2">{safeStudents.length}</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <Target className="w-8 h-8" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6 shadow-lg transform transition-all hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Top Performer</p>
                <p className="text-2xl font-bold mt-2">{safeStudents[0]?.name || 'N/A'}</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <Trophy className="w-8 h-8" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl p-6 shadow-lg transform transition-all hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Avg Score</p>
                <p className="text-4xl font-bold mt-2">{avgScore}%</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <TrendingUp className="w-8 h-8" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl p-6 shadow-lg transform transition-all hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Diamond Rank</p>
                <p className="text-4xl font-bold mt-2">{safeStudents.filter(s => s.reward_points >= 1000).length}</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <Award className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Student Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6">
            <h2 className="text-2xl font-bold text-white">Student Rankings</h2>
            <p className="text-indigo-100 mt-1">Ranked by total reward points</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Roll No</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Skill</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Completed Levels</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Points</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Badge</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {safeStudents.map((student, index) => (
                  <tr key={student.id} className={`hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all ${index === 0 ? 'bg-gradient-to-r from-amber-50 to-yellow-50' : ''}`}>
                    <td className="px-6 py-4">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm shadow-md ${
                        student.rank <= 3 ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white' :
                        student.rank <= 10 ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white' :
                        'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700'
                      }`}>
                        {student.rank}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{student.name}</td>
                    <td className="px-6 py-4 text-gray-700 font-mono">{student.roll_number}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                        {student.personalized_skill || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 font-semibold">{student.completed_levels || '0'}</td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        {student.reward_points}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 rounded-full text-sm font-bold">
                        {student.badge}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-3 w-24">
                          <div
                            className={`h-3 rounded-full transition-all ${
                              student.performance_score >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' :
                              student.performance_score >= 60 ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
                              'bg-gradient-to-r from-red-400 to-red-600'
                            }`}
                            style={{ width: `${student.performance_score}%` }}
                          ></div>
                        </div>
                        <span className="font-bold text-gray-900 min-w-[3rem]">{student.performance_score}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        student.completed_status === 'Completed' ? 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800' :
                        student.completed_status === 'In Progress' ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800' :
                        'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800'
                      }`}>
                        {student.completed_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => deleteStudent(student.id)} 
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all transform hover:scale-110"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// ADD STUDENT MODAL - NO TYPING LAG!
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
        console.error('Add student failed with response:', response.status, error);
        alert('Error: ' + (error.details || error.error || `HTTP ${response.status}`));
      }
    } catch (error) {
      console.error('Network or parsing error while adding student:', error);
      alert('Error adding student: ' + (error.message || 'Network error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Add New Student</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Full Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Roll Number *</label>
              <input
                type="text"
                value={form.roll_number}
                onChange={(e) => setForm({...form, roll_number: e.target.value})}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                placeholder="CS2024001"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({...form, email: e.target.value})}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                placeholder="student@example.com"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Firebase UID *</label>
              <input
                type="text"
                value={form.firebase_uid}
                onChange={(e) => setForm({...form, firebase_uid: e.target.value})}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                placeholder="Get from Firebase Console"
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-medium">📝 Firebase UID: Student signs up → Firebase Console → Authentication → Users → Copy UID</p>
          </div>

          <div>
            <label className="block text-gray-700 mb-2 font-medium">Personalized Skill</label>
            <input
              type="text"
              value={form.personalized_skill}
              onChange={(e) => setForm({...form, personalized_skill: e.target.value})}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
              placeholder="React, Python, etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Reward Points</label>
              <input
                type="number"
                value={form.reward_points}
                onChange={(e) => setForm({...form, reward_points: parseInt(e.target.value) || 0})}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Attendance %</label>
              <input
                type="number"
                value={form.attendance_percentage}
                onChange={(e) => setForm({...form, attendance_percentage: parseFloat(e.target.value) || 0})}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                max="100"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Student'}
            </button>
            <button onClick={onClose} className="flex-1 border-2 border-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorDashboard;