import React, { useState, useEffect } from 'react';
import { Shield, Users, Trophy, Star, Trash2 } from 'lucide-react';

const API_URL = 'https://digital-task-analyzer-performance.onrender.com';

const AdminDashboard = ({ onLogout }) => {
  const [stats, setStats] = useState({ totalStudents: 0, totalMentors: 0, avgCgpa: '0.00' });
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, mentorsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/stats`),
        fetch(`${API_URL}/api/admin/mentors`)
      ]);
      const statsData = await statsRes.json();
      const mentorsData = await mentorsRes.json();
      setStats(statsData);
      setMentors(mentorsData);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMentor = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete mentor "${name}"?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/mentors/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMentors(mentors.filter(m => m.id !== id));
        setStats(prev => ({ ...prev, totalMentors: prev.totalMentors - 1 }));
      } else {
        alert('Failed to delete mentor');
      }
    } catch (err) {
      alert('Failed to delete mentor');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-indigo-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-800">Admin Portal</h1>
              <p className="text-sm text-gray-500">Digital Task Performance Analyzer</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Overview Stats */}
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-xl">
              <Users className="w-7 h-7 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Students</p>
              <p className="text-3xl font-bold text-gray-800">{stats.totalStudents}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className="bg-indigo-100 p-3 rounded-xl">
              <Trophy className="w-7 h-7 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Mentors</p>
              <p className="text-3xl font-bold text-gray-800">{stats.totalMentors}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className="bg-cyan-100 p-3 rounded-xl">
              <Star className="w-7 h-7 text-cyan-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Average CGPA</p>
              <p className="text-3xl font-bold text-gray-800">{stats.avgCgpa}</p>
            </div>
          </div>
        </div>

        {/* Mentors List */}
        <h2 className="text-lg font-semibold text-gray-700 mb-4">All Mentors</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {mentors.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No mentors found</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">#</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Name</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Email</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Joined</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {mentors.map((mentor, index) => (
                  <tr key={mentor.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
                          {mentor.name?.charAt(0).toUpperCase() || 'M'}
                        </div>
                        <span className="font-medium text-gray-800">{mentor.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{mentor.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {mentor.created_at ? new Date(mentor.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeleteMentor(mentor.id, mentor.name)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
