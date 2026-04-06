import React, { useState, useEffect } from 'react';

const StudentDashboard = ({ authToken, onLogout }) => {
  const [profile, setProfile] = useState(null);
  const [showAddDetails, setShowAddDetails] = useState(false);
  const [mentorData, setMentorData] = useState(null);
  const [studentRollNumber, setStudentRollNumber] = useState(''); // For mentor dashboard integration

  useEffect(() => {
    fetchProfile();
    fetchMentorData();
    
    // Save student roll number to localStorage for mentor dashboard integration
    const savedRollNumber = localStorage.getItem('studentRollNumber');
    if (savedRollNumber) {
      setStudentRollNumber(savedRollNumber);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('https://digital-task-analyzer-performance.onrender.com/api/student/profile', {
        headers: { 
          'Content-Type': 'application/json'
          // Temporarily removed Authorization header for testing
        }
      });
      const data = await response.json();
      console.log('🔍 Profile data received:', data);
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
          // Temporarily removed Authorization header for testing
        }
      });
      const data = await response.json();
      setMentorData(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Always show the progress section, even if profile is loading
  const showProgressSection = true; // Force show the section

  // Debug: Show profile state
  console.log('🔍 Current profile state:', profile);

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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l2 2M13 17" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Roll Number Input */}
        <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
          <h2 className="text-xl font-bold text-[#1F2937] mb-4">Enter Your Roll Number</h2>
          <div className="flex space-x-4">
            <input
              type="text"
              value={studentRollNumber}
              onChange={(e) => setStudentRollNumber(e.target.value)}
              placeholder="Enter your roll number"
              className="flex-1 px-4 py-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B6CFF] focus:border-[#5B6CFF]"
            />
            <button
              onClick={() => {
                if (studentRollNumber.trim()) {
                  localStorage.setItem('studentRollNumber', studentRollNumber);
                  window.location.reload(); // Refresh to update mentor dashboard
                }
              }}
              className="bg-[#5B6CFF] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#4B5CEF] transition-all transform hover:scale-105"
            >
              Submit
            </button>
          </div>
        </div>

        {/* Add Details Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowAddDetails(true)}
            className="bg-[#5B6CFF] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#4B5CEF] transition-all transform hover:scale-105"
          >
            Add Details
          </button>
        </div>

        {/* Your Current Status - Always Show */}
        {showProgressSection && (
          <div className="bg-white rounded-xl p-6 shadow-lg" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <h2 className="text-xl font-bold text-[#1F2937] mb-4">Your Progress</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-[#FFFBEB] rounded-lg">
                <p className="text-sm text-[#6B7280]">Current Level</p>
                <p className="text-xl font-bold text-[#1F2937]">
                  {profile?.personalized_skill || 'Not assigned'}
                </p>
              </div>
              <div className="p-4 bg-[#FEF2F2] rounded-lg">
                <p className="text-sm text-[#6B7280]">Completed Levels</p>
                <p className="text-xl font-bold text-[#1F2937]">{profile?.completed_levels || 0}</p>
              </div>
              <div className="p-4 bg-[#F0FDF4] rounded-lg border-2 border-green-500">
                <p className="text-sm text-[#6B7280]">Your CGPA</p>
                <p className="text-xl font-bold text-green-600">{profile?.cgpa || 0.0}</p>
                <p className="text-xs text-gray-500">CGPA Bar Here!</p>
              </div>
            </div>
          </div>
        )}
        
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
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-600">{student.roll_number}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{student.reward_points}</p>
                      <p className="text-xs text-gray-600">points</p>
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
          'Content-Type': 'application/json'
          // Temporarily removed Authorization header for testing
        },
        body: JSON.stringify({
          roll_no: rollNo,
          skill_completed: skillCompleted,
          allocated_points: parseInt(allocatedPoints) || 0,
          attendance_percentage: parseFloat(attendancePercentage) || 0,
          cgpa: parseFloat(cgpa) || 0.0
        })
      });

      const data = await response.json();
      
      console.log('🔍 Response:', data); // Debug log
      
      if (response.ok) {
        setMessage(data.message || 'Student details updated successfully!');
        console.log('✅ Student details updated successfully!');
        
        // Immediately update profile with returned data
        if (data.updatedProfile) {
          setProfile(data.updatedProfile);
          console.log('🔄 Profile updated immediately:', data.updatedProfile);
        }
        
        setTimeout(() => {
          // Reset form fields
          setRollNo('');
          setSkillCompleted('');
          setAllocatedPoints('');
          setAttendancePercentage('');
          setCgpa('');
          
          // Also refresh profile as backup
          fetchProfile();
          
          onClose();
          onSuccess();
        }, 3000);
      } else {
        console.error('❌ Backend error:', data);
        setMessage(data.error || 'Failed to add details');
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      setMessage('Network error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#1F2937]">Add Your Details</h2>
          <button 
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#1F2937]"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
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
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1F2937] mb-2">Enter Roll No</label>
            <input
              type="text"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B6CFF] focus:border-[#5B6CFF]"
              placeholder="Enter your roll number"
              required
            />
          </div>



          <div>
            <label className="block text-sm font-medium text-[#1F2937] mb-2">Skill Completed (e.g., Java Level 1)</label>
            <input
              type="text"
              value={skillCompleted}
              onChange={(e) => setSkillCompleted(e.target.value)}
              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B6CFF] focus:border-[#5B6CFF]"
              placeholder="Java Level 1, Python Level 2, etc."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1F2937] mb-2">Allocated Points</label>
            <input
              type="number"
              value={allocatedPoints}
              onChange={(e) => setAllocatedPoints(e.target.value)}
              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B6CFF] focus:border-[#5B6CFF]"
              placeholder="Enter allocated points"
              min="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1F2937] mb-2">CGPA (0.0 - 10.0)</label>
            <input
              type="number"
              value={cgpa}
              onChange={(e) => setCgpa(e.target.value)}
              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B6CFF] focus:border-[#5B6CFF]"
              placeholder="Enter CGPA"
              min="0.0"
              max="10.0"
              step="0.1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1F2937] mb-2">Attendance Percentage</label>
            <input
              type="number"
              value={attendancePercentage}
              onChange={(e) => setAttendancePercentage(e.target.value)}
              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B6CFF] focus:border-[#5B6CFF]"
              placeholder="Enter attendance percentage"
              min="0"
              max="100"
              required
            />
          </div>

          {/* CGPA Display Bar */}
          <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-green-800">Your Current CGPA</p>
                <p className="text-2xl font-bold text-green-600">{profile?.cgpa || 0.0}</p>
              </div>
              <div className="text-green-600">
                <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold">📊</span>
                </div>
              </div>
            </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#5B6CFF] text-white py-3 px-4 rounded-lg font-bold hover:bg-[#4B5CEF] disabled:opacity-50 transition-all"
            >
              {loading ? 'Adding...' : 'Add'}
            </button>
            <button 
              type="button"
              onClick={() => {
                setRollNo('');
                setSkillCompleted('');
                setAllocatedPoints('');
                setAttendancePercentage('');
                setCgpa('');
                setMessage('');
              }}
              className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-600 transition-colors"
            >
              Clear
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 border border-[#E5E7EB] py-3 px-4 rounded-lg font-bold hover:bg-[#F5F7FA] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default StudentDashboard;
