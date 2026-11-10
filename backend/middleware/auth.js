const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'mentor_mentee_secure_college_key_2026_jwt_token';

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

async function verifyAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. No Bearer token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch user from DB to verify user exists
    const user = await db.get(
      'SELECT id, email, role, full_name FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid authentication session. User not found.' });
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name
    };

    // Attach role-specific metadata
    if (user.role === 'student') {
      const student = await db.get(
        'SELECT id, roll_number, department, academic_year, verified_points, verified_attendance, cgpa, rank_position, target_points FROM students WHERE user_id = ?',
        [user.id]
      );
      if (student) {
        req.user.studentId = student.id;
        req.user.rollNumber = student.roll_number;
        req.user.department = student.department;
        req.user.academicYear = student.academic_year;
        req.user.verifiedPoints = student.verified_points;
        req.user.verifiedAttendance = student.verified_attendance;
        req.user.cgpa = student.cgpa;
        req.user.rankPosition = student.rank_position;
        req.user.targetPoints = student.target_points;
      }
    } else if (user.role === 'mentor') {
      const mentor = await db.get(
        'SELECT id, employee_id, department, designation FROM mentors WHERE user_id = ?',
        [user.id]
      );
      if (mentor) {
        req.user.mentorId = mentor.id;
        req.user.employeeId = mentor.employee_id;
        req.user.department = mentor.department;
        req.user.designation = mentor.designation;
      }
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid or forged authentication token.' });
  }
}

function requireStudent(req, res, next) {
  if (!req.user || req.user.role !== 'student' || !req.user.studentId) {
    return res.status(403).json({ error: 'Access forbidden: Student privileges required.' });
  }
  next();
}

function requireMentor(req, res, next) {
  if (!req.user || req.user.role !== 'mentor' || !req.user.mentorId) {
    return res.status(403).json({ error: 'Access forbidden: Mentor privileges required.' });
  }
  next();
}

// Strict Mentor-Mentee assignment verification middleware
async function requireAssignedMentee(req, res, next) {
  const studentId = parseInt(req.params.studentId || req.params.id || req.body.student_id);
  if (!studentId || isNaN(studentId)) {
    return res.status(400).json({ error: 'Valid student ID is required.' });
  }

  try {
    const assignment = await db.get(
      'SELECT id FROM mentor_mentees WHERE mentor_id = ? AND student_id = ?',
      [req.user.mentorId, studentId]
    );

    if (!assignment) {
      return res.status(403).json({
        error: 'Access denied: You can only access and supervise your assigned mentees.'
      });
    }

    req.assignedStudentId = studentId;
    next();
  } catch (err) {
    console.error('Error verifying mentor-mentee assignment:', err);
    res.status(500).json({ error: 'Internal error checking mentee authorization.' });
  }
}

module.exports = {
  generateToken,
  verifyAuth,
  requireStudent,
  requireMentor,
  requireAssignedMentee,
  JWT_SECRET
};

