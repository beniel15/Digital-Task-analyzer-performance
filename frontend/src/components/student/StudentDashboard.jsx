import React, { useState, useEffect } from 'react';
import { Trophy, Star, Target, TrendingUp, Zap, Award } from 'lucide-react';

const StudentDashboard = ({ authToken, onLogout }) => {
  const [profile, setProfile] = useState(null);
  const [showAddDetails, setShowAddDetails] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/student/profile', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await response.json();
      setProfile(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (!profile) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;


  return (
    <div className="min-h-screen bg-gray-50 p-6">

      {/* Add Details Modal */}
      {showAddDetails && (
        <AddDetailsModal
          authToken={authToken}
          onClose={() => setShowAddDetails(false)}
          onSuccess={fetchProfile}
        />
      )}

      <div className="max-w-6xl mx-auto">
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setShowAddDetails(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700"
          >
            Add Details
          </button>
        </div>
      </div>
    </div>
  );
};

// ADD DETAILS MODAL
const AddDetailsModal = ({ authToken, onClose, onSuccess }) => {
  const [rollNo, setRollNo] = useState('');
  const [completedLevels, setCompletedLevels] = useState('');
  const [skillCompleted, setSkillCompleted] = useState('');
  const [allocatedPoints, setAllocatedPoints] = useState('');
  const [attendancePercentage, setAttendancePercentage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!rollNo.trim() || !completedLevels.trim() || !skillCompleted.trim() || 
        !allocatedPoints.trim() || !attendancePercentage.trim()) {
      alert('Please fill all fields!');
      return;
    }

    console.log('🚀 Submitting form data:', {
      roll_no: rollNo,
      completed_levels: completedLevels,
      skill_completed: skillCompleted,
      allocated_points: allocatedPoints,
      attendance_percentage: attendancePercentage
    });

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/student/update-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          roll_no: rollNo,
          completed_levels: completedLevels,
          skill_completed: skillCompleted,
          allocated_points: allocatedPoints,
          attendance_percentage: attendancePercentage
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.badgeUpgraded) {
          alert(`✅ Details updated successfully! 🎉 Badge upgraded to ${result.newBadge}!`);
        } else {
          alert('✅ Details updated successfully!');
        }
        onSuccess();
        onClose();
      } else {
        const error = await response.json().catch(() => ({}));
        console.error('❌ Error response:', error);
        alert('Error: ' + (error.error || 'Failed to update details'));
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      alert('Error adding details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Add Your Details</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2 font-medium">Enter Roll No</label>
            <input
              type="text"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
              placeholder="Enter your roll number"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2 font-medium">Completed Levels</label>
            <input
              type="text"
              value={completedLevels}
              onChange={(e) => setCompletedLevels(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
              placeholder="Enter completed levels"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2 font-medium">Skill Completed</label>
            <input
              type="text"
              value={skillCompleted}
              onChange={(e) => setSkillCompleted(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
              placeholder="Enter completed skills"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2 font-medium">Allocated Points</label>
            <input
              type="number"
              value={allocatedPoints}
              onChange={(e) => setAllocatedPoints(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
              placeholder="Enter allocated points"
              min="0"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2 font-medium">Attendance Percentage</label>
            <input
              type="number"
              value={attendancePercentage}
              onChange={(e) => setAttendancePercentage(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
              placeholder="Enter attendance percentage"
              min="0"
              max="100"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 border-2 border-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
