import React, { useState, useEffect } from 'react';

const StudentDashboard = ({ authToken, onLogout }) => {
  const [profile, setProfile] = useState(null);
  const [showAddDetails, setShowAddDetails] = useState(false);
  const [mentorData, setMentorData] = useState(null);


  useEffect(() => {
    fetchProfile();
    fetchMentorData();
    

  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('https://digital-task-analyzer-performance.onrender.com/api/student/profile', {
        headers: { 
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setProfile(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchMentorData = async () => {
    try {
      const response = await fetch('https://digital-task-analyzer-performance.onrender.com/api/mentor/students', {
        headers: { 
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setMentorData(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-6">
      {/* Header */}
      <div className="bg-white border-b border-[#E5E7EB] px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold text-[#1F2937]">Student Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-[#5B6CFF] to-[#7C4DFF] rounded-full"></div>
            <button 
              onClick={onLogout}
              className="text-[#6B7280] hover:text-[#1F2937]"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l2 2M9 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">


        {/* Add Details Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowAddDetails(true)}
            className="bg-[#5B6CFF] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#4B5CEF] transition-all transform hover:scale-105"
          >
            Add Details
          </button>
        </div>

        {/* Mentor Data - Average Points and Rankings */}
        {mentorData && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-[#1F2937] mb-4">Class Performance</h2>
              
              {/* Average Points */}
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">Class Average Points</p>
                    <p className="text-2xl font-bold text-[#1F2937]">
                      {mentorData.length > 0 ? 
                        Math.round(mentorData.reduce((sum, student) => sum + (student.reward_points || 0), 0) / mentorData.length) 
                        : 0}
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <svg className="text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v1m0 0l2 2M13 17" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Top Performers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mentorData.slice(0, 3).map((student, index) => (
                  <div key={student.id} className="bg-white rounded-lg p-4 border border-[#E5E7EB]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-[#1F2937]">{student.name}</p>
                          <p className="text-sm text-[#6B7280]">{student.roll_number}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-[#1F2937]">{student.reward_points || 0}</p>
                        <p className="text-sm text-[#6B7280]">points</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Details Modal */}
      {showAddDetails && (
        <AddDetailsModal
          authToken={authToken}
          onClose={() => setShowAddDetails(false)}
          onSuccess={() => {
            fetchProfile();
            fetchMentorData();
          }}
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
  const [cgpa, setCgpa] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('https://digital-task-analyzer-performance.onrender.com/api/student/update-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roll_no: rollNo,
          completed_levels: completedLevels,
          skill_completed: skillCompleted,
          allocated_points: parseInt(allocatedPoints) || 0,
          attendance_percentage: parseFloat(attendancePercentage) || 0,
          cgpa: cgpa !== '' ? parseFloat(cgpa) : null
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(data.message || 'Details added successfully!');
        
        // Check for level completion message
        if (data.levelCompleted) {
          setMessage(`🎉 Congratulations for completing ${data.skill} level ${data.completedLevel}! Now try to complete ${data.skill} level ${data.nextLevel}.`);
        }
        
        // Check for average points bonus
        if (data.averageBonus) {
          setMessage(prev => prev + '\n\n🏆 Excellent! You scored ${data.bonusPoints} bonus points for scoring above average!');
        }
        
        setTimeout(() => {
          onClose();
          onSuccess();
        }, 3000);
      } else {
        setMessage(data.error || 'Failed to add details');
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      setMessage('Error adding details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Add Your Details</h2>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Roll Number</label>
            <input
              type="text"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter roll number"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Skill Completed</label>
            <input
              type="text"
              value={skillCompleted}
              onChange={(e) => setSkillCompleted(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter skill completed (e.g., Java Level 1)"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Allocated Points</label>
            <input
              type="number"
              value={allocatedPoints}
              onChange={(e) => setAllocatedPoints(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter allocated points"
              min="0"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Attendance Percentage</label>
            <input
              type="number"
              value={attendancePercentage}
              onChange={(e) => setAttendancePercentage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter attendance percentage"
              min="0"
              max="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CGPA</label>
            <input
              type="number"
              step="0.01"
              value={cgpa}
              onChange={(e) => setCgpa(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter CGPA"
              min="0"
              max="10"
            />
          </div>
        </div>
        
        {/* Message Display */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            message.includes('🎉') || message.includes('🏆') 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={() => {
              setRollNo('');
              setCompletedLevels('');
              setSkillCompleted('');
              setAllocatedPoints('');
              setAttendancePercentage('');
              setCgpa('');
              setMessage('');
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {loading ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
