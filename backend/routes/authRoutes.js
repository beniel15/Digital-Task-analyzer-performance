const express = require('express');
const router = express.Router();
const db = require('../db');
const { generateToken, verifyAuth } = require('../middleware/auth');
const { hashPassword } = require('../database/initDb');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { identifier, password, role } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email or Roll Number and password are required.' });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const inputHash = hashPassword(password);

    let user = null;

    // Search by email first
    user = await db.get(
      'SELECT id, email, password_hash, role, full_name FROM users WHERE LOWER(email) = ?',
      [cleanIdentifier]
    );

    // If not found and role is student, search by roll number
    if (!user) {
      const studentRecord = await db.get(
        'SELECT user_id FROM students WHERE LOWER(roll_number) = ?',
        [cleanIdentifier]
      );
      if (studentRecord) {
        user = await db.get(
          'SELECT id, email, password_hash, role, full_name FROM users WHERE id = ?',
          [studentRecord.user_id]
        );
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. User account not found.' });
    }

    // Role check if specified
    if (role && user.role !== role) {
      return res.status(403).json({
        error: `Access denied. This account is registered as a ${user.role}, not as a ${role}.`
      });
    }

    // Verify password hash
    if (user.password_hash !== inputHash) {
      return res.status(401).json({ error: 'Invalid password. Please check your credentials.' });
    }

    // Generate JWT Token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Fetch role details
    let profileData = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role
    };

    if (user.role === 'student') {
      const student = await db.get(
        `SELECT s.id, s.roll_number, s.department, s.academic_year, s.cgpa, 
                s.verified_attendance, s.verified_points, s.target_points, s.rank_position,
                u.full_name as mentor_name, u.email as mentor_email
         FROM students s
         LEFT JOIN mentor_mentees mm ON s.id = mm.student_id
         LEFT JOIN mentors m ON mm.mentor_id = m.id
         LEFT JOIN users u ON m.user_id = u.id
         WHERE s.user_id = ?`,
        [user.id]
      );

      profileData.studentId = student?.id;
      profileData.rollNumber = student?.roll_number;
      profileData.department = student?.department;
      profileData.academicYear = student?.academic_year;
      profileData.cgpa = student?.cgpa;
      profileData.verifiedAttendance = student?.verified_attendance;
      profileData.verifiedPoints = student?.verified_points;
      profileData.targetPoints = student?.target_points;
      profileData.rankPosition = student?.rank_position;
      profileData.mentor = student?.mentor_name ? {
        name: student.mentor_name,
        email: student.mentor_email
      } : null;

    } else if (user.role === 'mentor') {
      const mentor = await db.get(
        'SELECT id, employee_id, department, designation FROM mentors WHERE user_id = ?',
        [user.id]
      );

      profileData.mentorId = mentor?.id;
      profileData.employeeId = mentor?.employee_id;
      profileData.department = mentor?.department;
      profileData.designation = mentor?.designation;
    }

    // Audit log
    const clientIp = req.socket?.remoteAddress || '127.0.0.1';
    await db.run(
      'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [user.id, 'USER_LOGIN', `Successful login as ${user.role}`, clientIp]
    );

    res.json({
      success: true,
      token,
      user: profileData
    });

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
});

// GET /api/auth/me - Verify session
router.get('/me', verifyAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve current user.' });
  }
});

// POST /api/auth/logout
router.post('/logout', verifyAuth, async (req, res) => {
  try {
    const clientIp = req.socket?.remoteAddress || '127.0.0.1';
    await db.run(
      'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [req.user.userId, 'USER_LOGOUT', 'Logged out', clientIp]
    );
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record logout.' });
  }
});

module.exports = router;
