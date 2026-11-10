const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyAuth, requireMentor, requireAssignedMentee } = require('../middleware/auth');

// All mentor routes require mentor JWT authentication
router.use(verifyAuth);
router.use(requireMentor);

// ==================== GET ASSIGNED MENTEES ====================
// Strictly retrieves ONLY students assigned to this mentor
router.get('/mentees', async (req, res) => {
  try {
    const mentees = await db.all(
      `SELECT s.id, u.full_name as name, s.roll_number, u.email, s.department, 
              s.academic_year, s.cgpa, s.verified_attendance, s.verified_points, 
              s.target_points, s.rank_position, s.performance_score, s.updated_at,
              (SELECT COUNT(*) FROM mentor_feedback mf WHERE mf.student_id = s.id AND mf.mentor_id = ?) as feedback_count
       FROM students s
       JOIN users u ON s.user_id = u.id
       JOIN mentor_mentees mm ON s.id = mm.student_id
       WHERE mm.mentor_id = ?
       ORDER BY s.verified_points DESC, s.cgpa DESC, s.verified_attendance DESC`,
      [req.user.mentorId, req.user.mentorId]
    );

    // Add mentor flags
    const enriched = mentees.map(m => ({
      ...m,
      isLowAttendance: m.verified_attendance < 75.0,
      isLowPoints: m.verified_points < 300,
      isTopPerformer: m.verified_points >= 800
    }));

    res.json(enriched);
  } catch (error) {
    console.error('Error fetching assigned mentees:', error);
    res.status(500).json({ error: 'Failed to retrieve assigned mentees.' });
  }
});

// ==================== GET DETAILED MENTEE PROFILE ====================
router.get('/mentees/:studentId', requireAssignedMentee, async (req, res) => {
  try {
    const student = await db.get(
      `SELECT s.id, u.full_name as name, s.roll_number, u.email, s.department, 
              s.academic_year, s.cgpa, s.verified_attendance, s.verified_points, 
              s.target_points, s.rank_position, s.performance_score, s.created_at, s.updated_at
       FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`,
      [req.assignedStudentId]
    );

    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    // Reward points history
    const pointsHistory = await db.all(
      `SELECT * FROM reward_point_history 
       WHERE student_id = ? 
       ORDER BY created_at DESC LIMIT 20`,
      [req.assignedStudentId]
    );

    // Attendance history
    const attendanceHistory = await db.all(
      `SELECT * FROM attendance_history 
       WHERE student_id = ? 
       ORDER BY recorded_at DESC LIMIT 20`,
      [req.assignedStudentId]
    );

    // Feedback history
    const feedback = await db.all(
      `SELECT * FROM mentor_feedback 
       WHERE student_id = ? 
       ORDER BY created_at DESC LIMIT 20`,
      [req.assignedStudentId]
    );

    res.json({
      student: {
        ...student,
        isLowAttendance: student.verified_attendance < 75.0,
        isLowPoints: student.verified_points < 300
      },
      pointsHistory,
      attendanceHistory,
      feedback
    });

  } catch (error) {
    console.error('Error fetching mentee details:', error);
    res.status(500).json({ error: 'Failed to retrieve mentee details.' });
  }
});

// ==================== PROVIDE MENTOR FEEDBACK / GENERAL BROADCAST ====================
router.post('/feedback', async (req, res) => {
  try {
    const { student_id, category, message, send_to_all } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Feedback message cannot be empty.' });
    }

    const cleanCategory = ['Reward Points', 'Attendance', 'Academic', 'General'].includes(category)
      ? category
      : 'General';

    // Broadcast to all assigned mentees simultaneously
    if (send_to_all || student_id === 'all' || student_id === 0) {
      const mentees = await db.all(
        `SELECT s.id as student_id, s.user_id, u.full_name as student_name
         FROM mentor_mentees mm
         JOIN students s ON mm.student_id = s.id
         JOIN users u ON s.user_id = u.id
         WHERE mm.mentor_id = ?`,
        [req.user.mentorId]
      );

      if (mentees.length === 0) {
        return res.status(400).json({ error: 'No assigned mentees found to receive broadcast.' });
      }

      await db.transaction(async (tx) => {
        for (const mentee of mentees) {
          await tx.run(
            `INSERT INTO mentor_feedback (mentor_id, student_id, category, message)
             VALUES (?, ?, ?, ?)`,
            [req.user.mentorId, mentee.student_id, cleanCategory, message.trim()]
          );

          await tx.run(
            `INSERT INTO notifications (user_id, title, message, type)
             VALUES (?, ?, ?, 'feedback')`,
            [
              mentee.user_id,
              'General Announcement from Mentor',
              `${req.user.fullName}: "${message.trim()}"`
            ]
          );
        }

        await tx.run(
          'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
          [req.user.userId, 'BROADCAST_FEEDBACK', `General broadcast sent to ${mentees.length} assigned mentees`]
        );
      });

      return res.json({
        success: true,
        is_broadcast: true,
        count: mentees.length,
        message: `General message sent simultaneously to all ${mentees.length} assigned mentees!`
      });
    }

    // Individual mentee feedback
    const studentId = parseInt(student_id);
    if (!studentId || isNaN(studentId)) {
      return res.status(400).json({ error: 'Valid student ID is required.' });
    }

    // Verify mentee assignment
    const assignment = await db.get(
      `SELECT s.id, s.user_id, u.full_name as student_name
       FROM mentor_mentees mm
       JOIN students s ON mm.student_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE mm.mentor_id = ? AND mm.student_id = ?`,
      [req.user.mentorId, studentId]
    );

    if (!assignment) {
      return res.status(403).json({ error: 'You can only provide feedback to your assigned mentees.' });
    }

    await db.transaction(async (tx) => {
      await tx.run(
        `INSERT INTO mentor_feedback (mentor_id, student_id, category, message)
         VALUES (?, ?, ?, ?)`,
        [req.user.mentorId, studentId, cleanCategory, message.trim()]
      );

      // Notify the student
      await tx.run(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES (?, ?, ?, 'feedback')`,
        [
          assignment.user_id,
          'New Mentor Feedback',
          `${req.user.fullName} sent guidance on ${cleanCategory}: "${message.trim()}"`
        ]
      );

      await tx.run(
        'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
        [req.user.userId, 'PROVIDE_FEEDBACK', `Feedback provided to student ${studentId}`]
      );
    });

    res.json({ success: true, message: 'Feedback sent to student successfully!' });
  } catch (error) {
    console.error('Error posting mentor feedback:', error);
    res.status(500).json({ error: 'Failed to submit mentor feedback.' });
  }
});

// Dedicated alias for broadcast
router.post('/feedback/broadcast', async (req, res) => {
  req.body.send_to_all = true;
  req.body.category = req.body.category || 'General';
  // Delegate to main feedback route logic by calling internal dispatch or passing forward
  return router.handle(req, res);
});

// ==================== GET ALL FEEDBACK SENT BY THIS MENTOR ====================
router.get('/feedback', async (req, res) => {
  try {
    const feedback = await db.all(
      `SELECT mf.*, u.full_name as student_name, s.roll_number, s.department
       FROM mentor_feedback mf
       JOIN students s ON mf.student_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE mf.mentor_id = ?
       ORDER BY mf.created_at DESC`,
      [req.user.mentorId]
    );

    res.json(feedback);
  } catch (error) {
    console.error('Error fetching mentor feedback list:', error);
    res.status(500).json({ error: 'Failed to retrieve mentor feedback list.' });
  }
});

// ==================== GET FEEDBACK HISTORY FOR MENTEE ====================
router.get('/feedback/:studentId', requireAssignedMentee, async (req, res) => {
  try {
    const feedback = await db.all(
      `SELECT mf.*, u.full_name as mentor_name 
       FROM mentor_feedback mf
       JOIN mentors m ON mf.mentor_id = m.id
       JOIN users u ON m.user_id = u.id
       WHERE mf.student_id = ?
       ORDER BY mf.created_at DESC`,
      [req.assignedStudentId]
    );

    res.json(feedback);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve feedback history.' });
  }
});

// ==================== GET MENTEE GROUP PERFORMANCE ANALYTICS ====================
router.get('/analytics', async (req, res) => {
  try {
    const mentees = await db.all(
      `SELECT s.id, u.full_name, s.roll_number, s.cgpa, s.verified_attendance, s.verified_points, s.rank_position
       FROM students s
       JOIN users u ON s.user_id = u.id
       JOIN mentor_mentees mm ON s.id = mm.student_id
       WHERE mm.mentor_id = ?`,
      [req.user.mentorId]
    );

    const totalCount = mentees.length;
    if (totalCount === 0) {
      return res.json({
        totalMentees: 0,
        averagePoints: 0,
        averageAttendance: 0,
        averageCgpa: 0,
        lowAttendanceCount: 0,
        lowPointsCount: 0,
        topPerformer: null
      });
    }

    const totalPoints = mentees.reduce((sum, m) => sum + (m.verified_points || 0), 0);
    const totalAtt = mentees.reduce((sum, m) => sum + (m.verified_attendance || 0), 0);
    const totalCgpa = mentees.reduce((sum, m) => sum + (m.cgpa || 0), 0);

    const avgPoints = Math.round(totalPoints / totalCount);
    const avgAttendance = Number((totalAtt / totalCount).toFixed(1));
    const avgCgpa = Number((totalCgpa / totalCount).toFixed(2));

    const lowAttendanceMentees = mentees.filter(m => m.verified_attendance < 75.0);
    const lowPointsMentees = mentees.filter(m => m.verified_points < 300);

    const sortedByPoints = [...mentees].sort((a, b) => (b.verified_points || 0) - (a.verified_points || 0));
    const topPerformer = sortedByPoints[0] || null;

    // Distribution ranges
    const attendanceDistribution = {
      above90: mentees.filter(m => m.verified_attendance >= 90).length,
      between75and90: mentees.filter(m => m.verified_attendance >= 75 && m.verified_attendance < 90).length,
      below75: lowAttendanceMentees.length
    };

    const pointsDistribution = {
      above800: mentees.filter(m => m.verified_points >= 800).length,
      between500and800: mentees.filter(m => m.verified_points >= 500 && m.verified_points < 800).length,
      below500: mentees.filter(m => m.verified_points < 500).length
    };

    res.json({
      totalMentees: totalCount,
      averagePoints: avgPoints,
      averageAttendance: avgAttendance,
      averageCgpa: avgCgpa,
      lowAttendanceCount: lowAttendanceMentees.length,
      lowPointsCount: lowPointsMentees.length,
      lowAttendanceMentees,
      lowPointsMentees,
      topPerformer,
      attendanceDistribution,
      pointsDistribution
    });

  } catch (error) {
    console.error('Error fetching mentor analytics:', error);
    res.status(500).json({ error: 'Failed to retrieve mentor analytics.' });
  }
});

// ==================== GET MENTOR NOTIFICATIONS ====================
router.get('/notifications', async (req, res) => {
  try {
    const notifications = await db.all(
      `SELECT id, title, message, type, is_read, link, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC LIMIT 50`,
      [req.user.userId]
    );

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
});

// ==================== MARK NOTIFICATION AS READ ====================
router.put('/notifications/:id/read', async (req, res) => {
  try {
    await db.run(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notification.' });
  }
});

module.exports = router;
