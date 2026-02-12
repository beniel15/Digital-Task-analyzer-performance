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
    <div className="min-h-screen bg-gray-50 p-6">
      {showAddModal && <AddStudentModal authToken={authToken} onClose={() => setShowAddModal(false)} onSuccess={fetchStudents} />}
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Mentor Dashboard</h1>
              <p className="text-gray-600 mt-1">Real-time student rankings</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Student
              </button>
              <button onClick={onLogout} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Students</p>
                <p className="text-3xl font-bold mt-1">{safeStudents.length}</p>
              </div>
              <Target className="w-12 h-12 opacity-80" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Top Performer</p>
                <p className="text-xl font-bold mt-1">{safeStudents[0]?.name || 'N/A'}</p>
              </div>
              <Trophy className="w-12 h-12 opacity-80" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Avg Score</p>
                <p className="text-3xl font-bold mt-1">{avgScore}%</p>
              </div>
              <TrendingUp className="w-12 h-12 opacity-80" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Diamond Rank</p>
                <p className="text-3xl font-bold mt-1">{safeStudents.filter(s => s.reward_points >= 1000).length}</p>
              </div>
              <Award className="w-12 h-12 opacity-80" />
            </div>
          </div>
        </div>

        {/* Student Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">Student Rankings</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Skill</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed Levels</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Badge</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {safeStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                        student.rank <= 3 ? 'bg-yellow-400 text-yellow-900' :
                        student.rank <= 10 ? 'bg-blue-100 text-blue-900' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {student.rank}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{student.name}</td>
                    <td className="px-6 py-4 text-gray-700">{student.roll_number}</td>
                    <td className="px-6 py-4 text-gray-700">{student.personalized_skill || '-'}</td>
                    <td className="px-6 py-4 text-gray-700">{student.completed_levels || '0'}</td>
                    <td className="px-6 py-4 text-gray-700 font-bold">{student.reward_points}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm font-semibold">
                        {student.badge}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 w-20">
                          <div
                            className={`h-2 rounded-full ${
                              student.performance_score >= 80 ? 'bg-green-500' :
                              student.performance_score >= 60 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${student.performance_score}%` }}
                          ></div>
                        </div>
                        <span className="font-semibold text-gray-900">{student.performance_score}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        student.completed_status === 'Completed' ? 'bg-green-100 text-green-800' :
                        student.completed_status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {student.completed_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => deleteStudent(student.id)} className="text-red-600 hover:text-red-800">
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