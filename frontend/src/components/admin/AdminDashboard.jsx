import React, { useState } from 'react';
import { Shield, Users, Trophy, Star, Trash2, Ban, CheckCircle, Search } from 'lucide-react';

const sampleStudents = [
  { id: 1, name: 'Sudharsan', roll_number: '7376232IT261', cgpa: 9.0, skill: 'C, JAVA', points: 3300, attendance: '90.00', status: 'active' },
  { id: 2, name: 'Beniel raja', roll_number: '7376231CS122', cgpa: 8.5, skill: 'C', points: 900, attendance: '90.00', status: 'active' },
  { id: 3, name: 'Harish r', roll_number: '7376231CS172', cgpa: 8.5, skill: 'Database', points: 300, attendance: '90.00', status: 'active' },
  { id: 4, name: 'Bharath', roll_number: '7376231CS121', cgpa: 7.7, skill: 'C', points: 300, attendance: '94.00', status: 'active' },
  { id: 5, name: 'Thejeswar', roll_number: '7376231334', cgpa: 8.5, skill: 'C', points: 300, attendance: '80.00', status: 'active' },
  { id: 6, name: 'Irfhan', roll_number: '7376231CS181', cgpa: 0.0, skill: 'None', points: 0, attendance: '0.00', status: 'active' },
  { id: 7, name: 'Bhupesh', roll_number: '7376231CS124', cgpa: 0.0, skill: 'None', points: 0, attendance: '0.00', status: 'active' },
  { id: 8, name: 'Abhishek', roll_number: '7376231CS106', cgpa: 0.0, skill: 'None', points: 0, attendance: '0.00', status: 'active' },
  { id: 9, name: 'Balasutharsan', roll_number: '7376231CS120', cgpa: 8.5, skill: 'C, Java, Aptitude', points: 3900, attendance: '90.00', status: 'active' },
  { id: 10, name: 'Anbu selvam', roll_number: '7376231CS112', cgpa: 0.0, skill: 'None', points: 0, attendance: '0.00', status: 'active' },
];

const sampleMentors = [
  { id: 1, name: 'Dr. Rajesh Kumar', email: 'rajesh@college.edu', students: 10, status: 'active' },
  { id: 2, name: 'Prof. Meena Devi', email: 'meena@college.edu', students: 8, status: 'active' },
];

const AdminDashboard = ({ onLogout }) => {
  const [students, setStudents] = useState(sampleStudents);
  const [mentors, setMentors] = useState(sampleMentors);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [blockInput, setBlockInput] = useState('');
  const [blockMessage, setBlockMessage] = useState('');

  const totalStudents = students.length;
  const totalMentors = mentors.length;
  const avgCgpa = (students.reduce((sum, s) => sum + s.cgpa, 0) / totalStudents).toFixed(2);
  const blockedCount = students.filter(s => s.status === 'blocked').length;

  const handleToggleBlock = (id) => {
    setStudents(students.map(s =>
      s.id === id ? { ...s, status: s.status === 'active' ? 'blocked' : 'active' } : s
    ));
  };

  const handleBlockByName = () => {
    if (!blockInput.trim()) return;
    const found = students.find(s =>
      s.name.toLowerCase().includes(blockInput.toLowerCase()) ||
      s.roll_number.toLowerCase().includes(blockInput.toLowerCase())
    );
    if (found) {
      const newStatus = found.status === 'active' ? 'blocked' : 'active';
      handleToggleBlock(found.id);
      setBlockMessage(`✅ ${found.name} has been ${newStatus} successfully!`);
      setBlockInput('');
      setTimeout(() => setBlockMessage(''), 3000);
    } else {
      setBlockMessage('❌ Student not found!');
      setTimeout(() => setBlockMessage(''), 3000);
    }
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.roll_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-800">Admin Portal</h1>
              <p className="text-sm text-gray-500">Digital Task Performance Analyzer</p>
            </div>
          </div>
          <button onClick={onLogout} className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 flex gap-6">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'students', label: 'Students' },
            { key: 'mentors', label: 'Mentors' },
            { key: 'block', label: 'Block / Unblock' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-4 px-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-4">System Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[
                { label: 'Total Students', value: totalStudents, color: 'purple', Icon: Users },
                { label: 'Total Mentors', value: totalMentors, color: 'indigo', Icon: Trophy },
                { label: 'Average CGPA', value: avgCgpa, color: 'cyan', Icon: Star },
                { label: 'Blocked Accounts', value: blockedCount, color: 'red', Icon: Ban },
              ].map(({ label, value, color, Icon }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-100 p-6 flex items-center gap-4">
                  <div className={`bg-${color}-100 p-3 rounded-xl`}>
                    <Icon className={`w-7 h-7 text-${color}-600`} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{label}</p>
                    <p className="text-3xl font-bold text-gray-800">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="text-lg font-semibold text-gray-700 mb-4">Recent Students</h2>
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Name', 'Roll No', 'CGPA', 'Points', 'Status'].map(h => (
                      <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.slice(0, 5).map(s => (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-800">{s.name}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{s.roll_number}</td>
                      <td className="px-6 py-3 text-sm font-semibold text-green-600">{s.cgpa}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{s.points}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STUDENTS TAB */}
        {activeTab === 'students' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-700">All Students ({filteredStudents.length})</h2>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or roll no..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 w-64"
                />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['#', 'Name', 'Roll No', 'CGPA', 'Points', 'Attendance', 'Status', 'Action'].map(h => (
                      <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s, i) => (
                    <tr key={s.id} className={`border-b border-gray-50 hover:bg-gray-50 ${s.status === 'blocked' ? 'opacity-60' : ''}`}>
                      <td className="px-6 py-3 text-sm text-gray-500">{i + 1}</td>
                      <td className="px-6 py-3 font-medium text-gray-800">{s.name}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{s.roll_number}</td>
                      <td className="px-6 py-3 text-sm font-semibold text-green-600">{s.cgpa}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{s.points}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{s.attendance}%</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => handleToggleBlock(s.id)}
                          className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                            s.status === 'active' ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-green-600 border-green-200 hover:bg-green-50'
                          }`}
                        >
                          {s.status === 'active' ? <><Ban className="w-3 h-3" /> Block</> : <><CheckCircle className="w-3 h-3" /> Unblock</>}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MENTORS TAB */}
        {activeTab === 'mentors' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-4">All Mentors</h2>
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['#', 'Name', 'Email', 'Students', 'Status', 'Action'].map(h => (
                      <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mentors.map((m, i) => (
                    <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-500">{i + 1}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
                            {m.name.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-800">{m.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">{m.email}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{m.students} students</td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
                      </td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => setMentors(mentors.filter(x => x.id !== m.id))}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BLOCK TAB */}
        {activeTab === 'block' && (
          <div className="max-w-lg">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Block / Unblock Student</h2>
            <p className="text-sm text-gray-500 mb-6">Enter student name or roll number to block or unblock their account.</p>
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Student Name or Roll Number</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="e.g. Bharath or 7376231CS121"
                  value={blockInput}
                  onChange={e => setBlockInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleBlockByName()}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
                />
                <button
                  onClick={handleBlockByName}
                  className="px-5 py-2.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Block / Unblock
                </button>
              </div>
              {blockMessage && (
                <div className={`mt-4 px-4 py-3 rounded-lg text-sm font-medium ${blockMessage.startsWith('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {blockMessage}
                </div>
              )}
              <div className="mt-6 border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">Currently Blocked Students</p>
                {students.filter(s => s.status === 'blocked').length === 0 ? (
                  <p className="text-sm text-gray-400">No blocked students</p>
                ) : (
                  students.filter(s => s.status === 'blocked').map(s => (
                    <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{s.name}</p>
                        <p className="text-xs text-gray-500">{s.roll_number}</p>
                      </div>
                      <button onClick={() => handleToggleBlock(s.id)} className="text-xs text-green-600 border border-green-200 px-3 py-1 rounded-lg hover:bg-green-50">
                        Unblock
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
