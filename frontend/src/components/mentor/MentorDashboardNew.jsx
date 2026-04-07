import React, { useState, useEffect } from 'react';
import { Trophy, Target, TrendingUp, Award, Plus, Trash2, Search, FileText, Download, Settings, Users, BarChart3, Medal, Star, ChevronDown, ChevronUp, Check } from 'lucide-react';

// Helper function to parse completed levels
const parseCompletedLevels = (completedLevels) => {
  if (!completedLevels || completedLevels === '0' || completedLevels === 0) return {};

  const skills = {};
  const skillEntries = String(completedLevels).split(',').map(entry => entry.trim()).filter(e => e && e !== '0' && e !== 'Not Started');

  skillEntries.forEach(entry => {
    // Match "Java Level 1" or "Java 1" format (skill name with space before number)
    const spaceMatch = entry.match(/^(.+?)\s+[Ll]evel\s+(\d+)$/i);
    // Match "C-1", "Python-2" format (skill name with dash before number)  
    const dashMatch = entry.match(/^([A-Za-z][A-Za-z\s]*)-(\d+)$/);

    if (spaceMatch) {
      const skillName = spaceMatch[1].trim();
      const level = parseInt(spaceMatch[2]);
      if (!skills[skillName]) skills[skillName] = [];
      if (!skills[skillName].includes(level)) skills[skillName].push(level);
    } else if (dashMatch) {
      const skillName = dashMatch[1].trim();
      const level = parseInt(dashMatch[2]);
      if (!skills[skillName]) skills[skillName] = [];
      if (!skills[skillName].includes(level)) skills[skillName].push(level);
    } else if (entry) {
      if (!skills[entry]) skills[entry] = [];
    }
  });

  return skills;
};

// Helper function to count total completed levels
const countCompletedLevels = (completedLevels) => {
  if (!completedLevels || completedLevels === '0' || completedLevels === 0) return 0;

  const skills = parseCompletedLevels(completedLevels);
  let totalCount = 0;

  Object.values(skills).forEach(levels => {
    if (levels.length > 0) {
      totalCount += levels.length;
    } else {
      totalCount += 1; // Count standalone string as 1 skill/level completed
    }
  });

  return totalCount;
};

const MentorDashboard = ({ authToken, onLogout }) => {
  const [students, setStudents] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    roll_number: '',
    firebase_uid: ''
  });
  const [loading, setLoading] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [studentRollNumber, setStudentRollNumber] = useState(''); // For student dashboard integration
  const [expandedSkills, setExpandedSkills] = useState({}); // Track expanded skills per student

  // Toggle skill expansion
  const toggleSkillExpansion = (studentId, skillName) => {
    const key = `${studentId}-${skillName}`;
    setExpandedSkills(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Fetch students on load
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch('https://digital-task-analyzer-performance.onrender.com/api/mentor/students', {
  headers: { 'Authorization': `Bearer ${authToken}` }
});
const data = await response.json();
      if (!response.ok) {
        console.error('Failed to fetch students:', data);
        setStudents([]);
        return;
      }

      const allStudents = Array.isArray(data) ? data : [];

      // If student roll number is set, filter to show only that student
      if (studentRollNumber) {
        const filteredStudent = allStudents.find(s => s.roll_number === studentRollNumber);
        setStudents(filteredStudent ? [filteredStudent] : allStudents);
      } else {
        setStudents(allStudents);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    }
  };

  const deleteStudent = async (id) => {
    if (!confirm('Delete this student?')) return;
    try {
      await fetch(`https://digital-task-analyzer-performance.onrender.com/api/mentor/students/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      fetchStudents();
    } catch (error) {
      alert('Error deleting student');
    }
  };

  const addStudent = async () => {
    if (!newStudent.name || !newStudent.roll_number || !newStudent.firebase_uid) {
      alert('Please fill in name, roll number, and Firebase UID');
      return;
    }

    try {
      const response = await fetch('https://digital-task-analyzer-performance.onrender.com/api/mentor/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newStudent)
      });

      if (response.ok) {
        setNewStudent({ name: '', roll_number: '', firebase_uid: '' });
        setShowAddForm(false);
        fetchStudents();
      } else {
        const errorData = await response.json();
        alert(`Error adding student: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Error adding student: ${error.message}`);
    }
  };

  // Calculate stats
  const totalStudents = students.length;
  const topPerformer = students.length > 0 ? students.reduce((prev, current) =>
    (prev.reward_points || 0) > (current.reward_points || 0) ? prev : current
  ) : null;
  const averageCGPA = students.length > 0 ?
    (students.reduce((sum, student) => sum + parseFloat(student.cgpa || 0), 0) / students.length).toFixed(1) : '0.0';
  const averagePoints = students.length > 0 ?
    Math.round(students.reduce((sum, student) => sum + (student.reward_points || 0), 0) / students.length) : 0;

  // Filter students based on search
  const filteredStudents = students.filter(student =>
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.roll_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter students below 500 points for report generation
  const belowAverageStudents = students.filter(s => (s.reward_points || 0) < 500);

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return <DashboardView
          students={students}
          onAddStudent={() => setShowAddForm(true)}
          expandedSkills={expandedSkills}
          toggleSkillExpansion={toggleSkillExpansion}
          setExpandedSkills={setExpandedSkills}
          onDelete={deleteStudent}
          studentRollNumber={studentRollNumber}
        />;
      case 'rankings':
        return <RankingsView students={filteredStudents} onDelete={deleteStudent} searchTerm={searchTerm} setSearchTerm={setSearchTerm} newStudent={newStudent} setNewStudent={setNewStudent} addStudent={addStudent} />;
      case 'reports':
        return <ReportsView students={belowAverageStudents} />;
      case 'cgpa':
        return <CGPAView students={students} />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView
          students={students}
          onAddStudent={() => setShowAddForm(true)}
          expandedSkills={expandedSkills}
          toggleSkillExpansion={toggleSkillExpansion}
          setExpandedSkills={setExpandedSkills}
          onDelete={deleteStudent}
          studentRollNumber={studentRollNumber}
        />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 text-white flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold">Mentor Portal</h1>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => setActiveMenu('dashboard')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 transition-colors ${activeMenu === 'dashboard' ? 'bg-blue-600 text-white' : 'hover:bg-slate-700'
                  }`}
              >
                <BarChart3 size={20} />
                <span>Dashboard</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveMenu('reports')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 transition-colors ${activeMenu === 'reports' ? 'bg-blue-600 text-white' : 'hover:bg-slate-700'
                  }`}
              >
                <FileText size={20} />
                <span>Report Generation</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveMenu('cgpa')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 transition-colors ${activeMenu === 'cgpa' ? 'bg-blue-600 text-white' : 'hover:bg-slate-700'
                  }`}
              >
                <Award size={20} />
                <span>CGPA Board</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveMenu('settings')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 transition-colors ${activeMenu === 'settings' ? 'bg-blue-600 text-white' : 'hover:bg-slate-700'
                  }`}
              >
                <Settings size={20} />
                <span>Settings</span>
              </button>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={onLogout}
            className="w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 hover:bg-slate-700 transition-colors"
          >
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>

      {/* Add Student Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Add New Student</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter student name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Roll Number</label>
                <input
                  type="text"
                  value={newStudent.roll_number}
                  onChange={(e) => setNewStudent({ ...newStudent, roll_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter roll number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Firebase UID</label>
                <input
                  type="text"
                  value={newStudent.firebase_uid}
                  onChange={(e) => setNewStudent({ ...newStudent, firebase_uid: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter Firebase UID"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setNewStudent({ name: '', roll_number: '', firebase_uid: '' })}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={addStudent}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Dashboard View Component
const DashboardView = ({ students, onAddStudent, expandedSkills, toggleSkillExpansion, setExpandedSkills, onDelete, studentRollNumber }) => {
  const totalStudents = students.length;
  const topPerformer = students.length > 0 ? students.reduce((prev, current) =>
    (prev.reward_points || 0) > (current.reward_points || 0) ? prev : current
  ) : null;
  const averagePoints = students.length > 0 ?
    Math.round(students.reduce((sum, student) => sum + (student.reward_points || 0), 0) / students.length) : 0;
  const averageCGPA = students.length > 0 ?
    (students.reduce((sum, student) => sum + parseFloat(student.cgpa || 0), 0) / students.length).toFixed(1) : '0.0';

  // Check if this is a single student view (from student dashboard integration)
  const isSingleStudentView = studentRollNumber && students.length === 1 && students[0]?.roll_number;

  return (
    <div className="p-8">
      {isSingleStudentView ? (
        // Single Student View - Show detailed info for one student
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Student Details</h2>
            <button
              onClick={onAddStudent}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Add New Student</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Name</span>
                    <span className="font-medium text-gray-900">{students[0]?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Roll Number</span>
                    <span className="font-medium text-gray-900">{students[0]?.roll_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Skill</span>
                    <span className="font-medium text-gray-900">{students[0]?.personalized_skill || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Completed Levels</span>
                    <span className="font-medium text-gray-900">{students[0]?.completed_levels || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Reward Points</span>
                    <span className="font-medium text-gray-900">{students[0]?.reward_points || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Performance Score</span>
                    <span className="font-medium text-gray-900">{Math.round(students[0]?.performance_score || 0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Attendance</span>
                    <span className="font-medium text-gray-900">{students[0]?.attendance_percentage || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Rank Position</span>
                    <span className="font-medium text-gray-900">#{students[0]?.rank_position || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Multiple Students View - Show stats cards and table
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Users className="text-blue-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-6 border border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Average CGPA</p>
                  <p className="text-xl font-bold text-gray-900">{averageCGPA}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <Trophy className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Average Points</p>
                  <p className="text-2xl font-bold text-gray-900">{averagePoints}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <TrendingUp className="text-purple-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-orange-50 rounded-xl p-6 border border-orange-100">
              <button
                onClick={onAddStudent}
                className="w-full h-full flex flex-col items-center justify-center space-y-2 hover:bg-orange-100 transition-colors rounded-xl"
              >
                <Plus className="text-orange-600" size={24} />
                <span className="text-orange-600 font-medium">Add Student</span>
              </button>
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CGPA</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skill</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed Levels</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance %</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student, index) => {
                    const skills = parseCompletedLevels(student.completed_levels);
                    return (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-800' :
                            index === 1 ? 'bg-gray-100 text-gray-800' :
                              index === 2 ? 'bg-orange-100 text-orange-800' :
                                'bg-blue-100 text-blue-800'
                            }`}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.roll_number}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600">
                          {student.cgpa || 0.0}
                        </td>
                        <td className="px-4 py-3 min-w-[250px] whitespace-normal break-words text-sm text-gray-500">
                          <div className="flex flex-wrap gap-2 mb-2">
                            {Object.entries(skills).map(([skillName, levels]) => {
                              const isExpanded = expandedSkills[`${student.id}-${skillName}`];
                              const key = `${student.id}-${skillName}`;

                              if (levels.length === 0) {
                                return (
                                  <span key={key} className="inline-flex items-center px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg text-sm font-medium text-blue-900">
                                    {skillName}
                                  </span>
                                );
                              }

                              return (
                                <div key={key} className="flex flex-col">
                                  <button
                                    onClick={() => toggleSkillExpansion(student.id, skillName)}
                                    className="inline-flex items-center px-3 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-sm font-medium text-blue-900 transition-colors"
                                  >
                                    <span className="font-semibold">{skillName}</span>
                                    {isExpanded ? (
                                      <ChevronUp className="ml-1 w-4 h-4" />
                                    ) : (
                                      <ChevronDown className="ml-1 w-4 h-4" />
                                    )}
                                  </button>

                                  {isExpanded && levels.length > 0 && (
                                    <div className="mt-2 ml-2 space-y-1">
                                      {levels.map((level, levelIndex) => (
                                        <div key={levelIndex} className="flex items-center text-sm text-gray-700">
                                          <Check className="w-4 h-4 text-blue-500 mr-2" />
                                          <span>Level {level}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {Object.keys(skills).length === 0 && (
                            <span className="text-sm text-gray-400">No skills completed</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{countCompletedLevels(student.completed_levels)}</span>
                            <button
                              onClick={() => {
                                const allExpanded = Object.keys(expandedSkills).filter(key =>
                                  expandedSkills[key] && key.includes(`${student.id}-`)
                                ).length === 0;

                                // Toggle all skills for this student
                                const skills = parseCompletedLevels(student.completed_levels);
                                Object.keys(skills).forEach(skillName => {
                                  const key = `${student.id}-${skillName}`;
                                  setExpandedSkills(prev => ({
                                    ...prev,
                                    [key]: !allExpanded
                                  }));
                                });
                              }}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                              {Object.keys(expandedSkills).filter(key =>
                                expandedSkills[key] && key.includes(`${student.id}-`)
                              ).length === 0 ? (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronUp className="w-4 h-4 text-gray-500" />
                              )}
                            </button>
                          </div>

                          {/* Expanded details box */}
                          {Object.keys(expandedSkills).filter(key =>
                            expandedSkills[key] && key.includes(`${student.id}-`)
                          ).length > 0 && (
                              <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                                <div className="font-medium text-gray-700 mb-2">Completed Levels Details:</div>
                                {Object.entries(parseCompletedLevels(student.completed_levels)).map(([skillName, levels]) => (
                                  <div key={skillName} className="mb-1">
                                    <span className="font-semibold">{skillName}{levels.length > 0 ? ':' : ''}</span>
                                    <span className="ml-2 text-gray-600">
                                      {levels.length > 0 ? (
                                        levels.map((level, index) => (
                                          <span key={index} className="inline-flex items-center mr-2">
                                            <Check className="w-3 h-3 text-blue-500 mr-1" />
                                            Level {level}
                                          </span>
                                        ))
                                      ) : (
                                        <span className="text-gray-400 italic">Completed</span>
                                      )}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {student.reward_points || 0}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.attendance_percentage || 0}%
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            onClick={() => onDelete(student.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
// Rankings View Component
const RankingsView = ({ students, onDelete, searchTerm, setSearchTerm, newStudent, setNewStudent, addStudent }) => {
  const totalStudents = students.length;
  const topPerformer = students.length > 0 ? students.reduce((prev, current) =>
    (prev.reward_points || 0) > (current.reward_points || 0) ? prev : current
  ) : null;
  const averagePoints = students.length > 0 ?
    Math.round(students.reduce((sum, student) => sum + (student.reward_points || 0), 0) / students.length) : 0;

  return (
    <div className="p-8">
      {/* Add Student Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Student</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={newStudent.name}
              onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter student name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Roll Number</label>
            <input
              type="text"
              value={newStudent.roll_number}
              onChange={(e) => setNewStudent({ ...newStudent, roll_number: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter roll number"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-3 mt-4">
          <button
            onClick={() => setNewStudent({ name: '', roll_number: '', firebase_uid: '' })}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={addStudent}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Student
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search student by name or roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skill</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed Levels</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student, index) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                      }`}>
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {student.name}
                  </td>
                  <td className="px-6 py-4 min-w-[250px] whitespace-normal break-words text-sm text-gray-500">
                    {student.personalized_skill || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.completed_levels || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {student.reward_points || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 w-24">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${Math.min((parseFloat(student.performance_score) || Math.min(((student.reward_points || 0) / 1000) * 60, 60)), 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {parseFloat(student.performance_score || Math.min(((student.reward_points || 0) / 1000) * 60, 60)).toFixed(2)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => onDelete(student.id)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Reports View Component
const ReportsView = ({ students }) => {
  const generatePDF = async () => {
    try {
      const response = await fetch('https://digital-task-analyzer-performance.onrender.com/api/mentor/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ students })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `student-report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF');
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Generation</h2>
        <p className="text-gray-600">Students below 500 points</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance %</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {student.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.roll_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {student.reward_points || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.attendance_percentage || 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={generatePDF}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Download PDF Report</span>
        </button>
      </div>
    </div>
  );
};

// CGPA Board View Component
const CGPAView = ({ students }) => {
  const sortedStudents = [...students].sort((a, b) => (b.cgpa || 0) - (a.cgpa || 0));

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">CGPA Board</h2>
        <p className="text-gray-600">Academic Performance Leaderboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedStudents.slice(0, 9).map((student, index) => (
          <div key={student.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-800' :
                index === 1 ? 'bg-gray-100 text-gray-800' :
                  index === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                }`}>
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{student.name}</div>
                <div className="text-sm text-gray-600">{student.roll_number}</div>
                <div className="text-2xl font-bold text-green-600">{student.cgpa || 0.0}</div>
                <div className="text-sm text-gray-500">CGPA</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Settings View Component
const SettingsView = () => {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Settings</h2>
        <p className="text-gray-600">Manage your account preferences</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Notifications</label>
                <div className="flex items-center space-x-3">
                  <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                  <span className="text-sm text-gray-600">Receive email notifications for student updates</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Light</option>
                  <option>Dark</option>
                  <option>System</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Security</h3>
            <div className="space-y-4">
              <button className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
                Change Password
              </button>
              <button className="text-red-600 hover:text-red-800 font-medium transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorDashboard;
