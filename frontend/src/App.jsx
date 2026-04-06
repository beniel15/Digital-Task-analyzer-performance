import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Target, Trophy, Star } from 'lucide-react';

// Components
import MentorLogin from './components/mentor/MentorLogin';
import MentorDashboard from './components/mentor/MentorDashboardNew';
import StudentLogin from './components/student/StudentLogin';
import StudentDashboard from './components/student/StudentDashboardFixed';

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyC9rbxNfDozTe8NO6IojEgm88Sfz0GoOF0",
  authDomain: "taks-performance-analyzer.firebaseapp.com",
  projectId: "taks-performance-analyzer",
  storageBucket: "taks-performance-analyzer.firebasestorage.app",
  messagingSenderId: "587608121965",
  appId: "1:587608121965:web:5b890c3c73c48997b2d564",
  measurementId: "G-MP4JP78BEP"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

function App() {
  const [authToken, setAuthToken] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [currentPage, setCurrentPage] = useState('role-selection');
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('userRole');
        sessionStorage.removeItem('currentPage');

        setAuthToken(null);
        setUserRole(null);
        setCurrentPage('role-selection');
      } else {
        try {
          const freshToken = await user.getIdToken(true);
          const savedRole = sessionStorage.getItem('userRole');
          const savedPage = sessionStorage.getItem('currentPage');

          setAuthToken(freshToken);
          sessionStorage.setItem('authToken', freshToken);

          if (savedRole && savedPage) {
            setUserRole(savedRole);
            setCurrentPage(savedPage);
          }
        } catch (error) {
          console.error('Token refresh failed:', error);
        }
      }

      setAuthLoading(false); // Done — safe to render now
    });

    return () => unsubscribe();
  }, []);

  // Block rendering until Firebase resolves auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-indigo-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  const handleMentorLogin = (token, user) => {
    setAuthToken(token);
    setUserRole('mentor');
    setCurrentPage('mentor-dashboard');

    sessionStorage.setItem('authToken', token);
    sessionStorage.setItem('userRole', 'mentor');
    sessionStorage.setItem('currentPage', 'mentor-dashboard');
  };

  const handleStudentLogin = (token, user) => {
    setAuthToken(token);
    setUserRole('student');
    setCurrentPage('student-dashboard');

    sessionStorage.setItem('authToken', token);
    sessionStorage.setItem('userRole', 'student');
    sessionStorage.setItem('currentPage', 'student-dashboard');
  };

  const handleLogout = () => {
    auth.signOut();
    setAuthToken(null);
    setUserRole(null);
    setCurrentPage('role-selection');

    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('currentPage');
  };

  const goBack = () => {
    setCurrentPage('role-selection');
    setUserRole(null);
  };

  if (currentPage === 'role-selection') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
          <div className="text-center mb-8">
            <Target className="w-16 h-16 mx-auto mb-4 text-indigo-600" />
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Digital Task Performance Analyzer
            </h1>
            <p className="text-gray-600">Select your role to continue</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={() => { setUserRole('mentor'); setCurrentPage('mentor-login'); }}
              className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-8 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <Trophy className="w-12 h-12 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Sign in as Mentor</h2>
              <p className="text-purple-100">Monitor and track student performance</p>
            </button>

            <button
              onClick={() => { setUserRole('student'); setCurrentPage('student-login'); }}
              className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white p-8 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <Star className="w-12 h-12 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Sign in as Student</h2>
              <p className="text-blue-100">Track your progress and achievements</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === 'mentor-login') {
    return (
      <div>
        <button onClick={goBack} className="fixed top-4 left-4 px-4 py-2 bg-white text-indigo-600 rounded-lg shadow hover:bg-gray-100 z-50">
          ← Back
        </button>
        <MentorLogin onLoginSuccess={handleMentorLogin} />
      </div>
    );
  }

  if (currentPage === 'mentor-dashboard') {
    return <MentorDashboard authToken={authToken} onLogout={handleLogout} />;
  }

  if (currentPage === 'student-login') {
    return (
      <div>
        <button onClick={goBack} className="fixed top-4 left-4 px-4 py-2 bg-white text-blue-600 rounded-lg shadow hover:bg-gray-100 z-50">
          ← Back
        </button>
        <StudentLogin onLoginSuccess={handleStudentLogin} />
      </div>
    );
  }

  if (currentPage === 'student-dashboard') {
    return <StudentDashboard authToken={authToken} onLogout={handleLogout} />;
  }

  return null;
}

export default App;
