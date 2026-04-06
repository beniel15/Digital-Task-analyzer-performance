import React, { useState, useEffect } from 'react';

const StudentDashboard = ({ authToken, onLogout }) => {
  const [profile, setProfile] = useState(null);
  const [showAddDetails, setShowAddDetails] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('https://digital-task-analyzer-performance.onrender.com/api/student/profile', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await response.json();
      setProfile(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (!profile) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-semibold text-gray-900">PCDP Portal</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>{profile.roll_number}</span>
              <span>{profile.name}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            <button 
              onClick={onLogout}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4 4m4-4H3m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1m6-4v4a6 6 0 01-6 6H6a6 6 0 01-6-6V7a6 6 0 016-6h4z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Welcome and Points */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Welcome Message */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Welcome back, {profile.name}
              </h2>
              <p className="text-gray-600">Track your progress and manage your skills</p>
            </div>

            {/* Points Wallet */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Points Wallets</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">MODE</span>
                  <button className="px-3 py-1 bg-gray-900 text-white text-sm rounded">Active</button>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Activity Points</p>
                <p className="text-4xl font-bold text-gray-900">{profile.reward_points}</p>
              </div>
            </div>

            {/* Points Breakdown */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Points Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">Academics (T, L)</p>
                    <p className="text-sm text-gray-600">Classes and assignments</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">POINTS EARNED</p>
                    <p className="text-sm text-gray-600">ELIGIBLE BONUS</p>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2">
                  <div>
                    <p className="font-medium text-gray-900">Mentor - CSE</p>
                    <p className="text-sm text-gray-600">MENTORCSE - S6 - MENTOR MEETING</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">POINTS EARNED</p>
                    <p className="text-sm text-gray-600">ELIGIBLE BONUS</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Skill Progress */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personalized Skill's Progress</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">UI UX</p>
                  <p className="text-xl font-semibold text-gray-900">2</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Programming Python</p>
                  <p className="text-xl font-semibold text-gray-900">3</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Web Development</p>
                  <p className="text-xl font-semibold text-gray-900">1</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Profile Card */}
          <div className="space-y-6">
            
            {/* Profile Card */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Background Image */}
              <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              
              {/* Profile Info */}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{profile.name}</h3>
                <p className="text-gray-600 mb-4">Computer Science and Engineering</p>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Roll Number</span>
                    <span className="font-medium text-gray-900">{profile.roll_number}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Skill</span>
                    <span className="font-medium text-gray-900">{profile.personalized_skill || 'Not assigned'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Points</span>
                    <span className="font-medium text-gray-900">{profile.reward_points}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Attendance</span>
                    <span className="font-medium text-gray-900">{profile.attendance_percentage}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Add Details Button */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <button
                onClick={() => setShowAddDetails(true)}
                className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Add Details
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Details Modal */}
      {showAddDetails && (
        <AddDetailsModal
          authToken={authToken}
          onClose={() => setShowAddDetails(false)}
          onSuccess={fetchProfile}
        />
      )}
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
      const response = await fetch('https://digital-task-analyzer-performance.onrender.com/api/student/update-details', {
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
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Add Your Details</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Enter Roll No</label>
            <input
              type="text"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              placeholder="Enter your roll number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Completed Levels</label>
            <input
              type="text"
              value={completedLevels}
              onChange={(e) => setCompletedLevels(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              placeholder="Enter completed levels"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Skill Completed</label>
            <input
              type="text"
              value={skillCompleted}
              onChange={(e) => setSkillCompleted(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              placeholder="Enter completed skills"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Allocated Points</label>
            <input
              type="number"
              value={allocatedPoints}
              onChange={(e) => setAllocatedPoints(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              placeholder="Enter allocated points"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Attendance Percentage</label>
            <input
              type="number"
              value={attendancePercentage}
              onChange={(e) => setAttendancePercentage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              placeholder="Enter attendance percentage"
              min="0"
              max="100"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-gray-900 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Adding...' : 'Add'}
            </button>
            <button 
              onClick={onClose}
              className="flex-1 border border-gray-300 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
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
