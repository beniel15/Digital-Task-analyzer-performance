const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyAuth, requireStudent } = require('../middleware/auth');

// All student routes require valid student JWT authentication
router.use(verifyAuth);
router.use(requireStudent);

// Helper to calculate composite performance score
function calcPerfScore(points, attendance) {
  const pointsScore = Math.min((points / 1000) * 60, 60);
  const attendanceScore = (attendance / 100) * 40;
  return Number((pointsScore + attendanceScore).toFixed(2));
}

// ==================== GET STUDENT PROFILE ====================
router.get('/profile', async (req, res) => {
  try {
    const student = await db.get(
      `SELECT s.id, u.full_name as name, s.roll_number, u.email, s.department, 
              s.academic_year, s.cgpa, s.verified_attendance, s.verified_points, 
              s.target_points, s.rank_position, s.performance_score,
              mu.full_name as mentor_name, mu.email as mentor_email, m.department as mentor_department,
              m.designation as mentor_designation
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN mentor_mentees mm ON s.id = mm.student_id
       LEFT JOIN mentors m ON mm.mentor_id = m.id
       LEFT JOIN users mu ON m.user_id = mu.id
       WHERE s.id = ?`,
      [req.user.studentId]
    );

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }

    // Unread notifications count
    const unreadNotifs = await db.get(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user.userId]
    );

    // Total feedback count
    const feedbackCount = await db.get(
      'SELECT COUNT(*) as count FROM mentor_feedback WHERE student_id = ?',
      [req.user.studentId]
    );

    res.json({
      ...student,
      unreadNotificationsCount: unreadNotifs?.count || 0,
      feedbackCount: feedbackCount?.count || 0,
      isLowAttendance: student.verified_attendance < 75.0,
      isLowPoints: student.verified_points < 300
    });

  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

// ==================== DIRECT UPDATE STUDENT DETAILS ====================
// Student enters their details (Reward Points, Attendance, CGPA, Skill/Notes)
// Directly updates the student's records and reflects immediately in the Mentor Dashboard.
router.post('/update-details', async (req, res) => {
  try {
    const {
      reward_points,
      points_to_add,
      allocated_points,
      attendance_percentage,
      cgpa,
      department,
      skill_completed,
      description
    } = req.body;

    const student = await db.get(
      `SELECT s.*, u.full_name, s.roll_number, mm.mentor_id, mu.id as mentor_user_id, mu.full_name as mentor_name
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN mentor_mentees mm ON s.id = mm.student_id
       LEFT JOIN mentors m ON mm.mentor_id = m.id
       LEFT JOIN users mu ON m.user_id = mu.id
       WHERE s.id = ?`,
      [req.user.studentId]
    );

    if (!student) {
      return res.status(404).json({ error: 'Student record not found.' });
    }

    let newPoints = student.verified_points;
    let pointsAdded = 0;

    // Check if points were provided (either absolute points or points_to_add / allocated_points)
    if (points_to_add !== undefined && !isNaN(points_to_add)) {
      pointsAdded = parseInt(points_to_add);
      newPoints = Math.max(0, student.verified_points + pointsAdded);
    } else if (allocated_points !== undefined && !isNaN(allocated_points)) {
      pointsAdded = parseInt(allocated_points);
      newPoints = Math.max(0, student.verified_points + pointsAdded);
    } else if (reward_points !== undefined && !isNaN(reward_points)) {
      const targetPts = parseInt(reward_points);
      pointsAdded = targetPts - student.verified_points;
      newPoints = Math.max(0, targetPts);
    }

    let newAttendance = student.verified_attendance;
    if (attendance_percentage !== undefined && !isNaN(attendance_percentage)) {
      const att = parseFloat(attendance_percentage);
      if (att < 0 || att > 100) {
        return res.status(400).json({ error: 'Attendance must be between 0% and 100%.' });
      }
      newAttendance = Number(att.toFixed(2));
    }

    let newCgpa = student.cgpa;
    if (cgpa !== undefined && !isNaN(cgpa)) {
      const val = parseFloat(cgpa);
      if (val < 0 || val > 10) {
        return res.status(400).json({ error: 'CGPA must be between 0.0 and 10.0.' });
      }
      newCgpa = Number(val.toFixed(2));
    }

    let newDept = student.department;
    if (department && typeof department === 'string') {
      newDept = department.trim();
    }

    const note = (description || skill_completed || 'Academic progress update').trim();
    const perfScore = calcPerfScore(newPoints, newAttendance);

    await db.transaction(async (tx) => {
      // 1. Update students table
      await tx.run(
        `UPDATE students 
         SET verified_points = ?, verified_attendance = ?, cgpa = ?, department = ?, 
             performance_score = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [newPoints, newAttendance, newCgpa, newDept, perfScore, req.user.studentId]
      );

      // 2. Append to point history if points changed
      if (pointsAdded !== 0 || newPoints !== student.verified_points) {
        await tx.run(
          `INSERT INTO reward_point_history (student_id, points_change, previous_total, new_total, reason)
           VALUES (?, ?, ?, ?, ?)`,
          [req.user.studentId, pointsAdded, student.verified_points, newPoints, note]
        );
      }

      // 3. Append to attendance history if attendance changed
      if (newAttendance !== student.verified_attendance) {
        await tx.run(
          `INSERT INTO attendance_history (student_id, previous_attendance, new_attendance)
           VALUES (?, ?, ?)`,
          [req.user.studentId, student.verified_attendance, newAttendance]
        );
      }

      // 4. Notify mentor of the update
      if (student.mentor_user_id) {
        await tx.run(
          `INSERT INTO notifications (user_id, title, message, type)
           VALUES (?, ?, ?, 'submission')`,
          [
            student.mentor_user_id,
            'Mentee Academic Update',
            `${student.full_name} (${student.roll_number}) updated details: Points: ${newPoints} (+${pointsAdded}), Attendance: ${newAttendance}%, CGPA: ${newCgpa}.`
          ]
        );
      }

      // 5. Audit log
      await tx.run(
        'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
        [req.user.userId, 'STUDENT_UPDATE_DETAILS', `Updated points to ${newPoints}, att to ${newAttendance}%, cgpa to ${newCgpa}`]
      );
    });

    // Recalculate rankings across all students
    await db.recalculateRankings();

    const updatedProfile = await db.get(
      'SELECT verified_points, verified_attendance, cgpa, rank_position, performance_score FROM students WHERE id = ?',
      [req.user.studentId]
    );

    res.json({
      success: true,
      message: 'Your academic details have been updated successfully and are now visible to your mentor!',
      updatedProfile
    });

  } catch (error) {
    console.error('Error updating student details:', error);
    res.status(500).json({ error: 'Failed to update student details.' });
  }
});

// Alias for backwards compatibility
router.post('/submit-update', async (req, res) => {
  return router.handle(Object.assign(req, { url: '/update-details' }), res);
});

// ==================== GET REWARD POINTS SUMMARY & HISTORY ====================
router.get('/reward-points', async (req, res) => {
  try {
    const student = await db.get(
      'SELECT verified_points, target_points, rank_position FROM students WHERE id = ?',
      [req.user.studentId]
    );

    const history = await db.all(
      `SELECT id, points_change, previous_total, new_total, reason, created_at
       FROM reward_point_history
       WHERE student_id = ?
       ORDER BY created_at DESC`,
      [req.user.studentId]
    );

    const targetProgress = Math.min(
      Math.round(((student?.verified_points || 0) / (student?.target_points || 1000)) * 100),
      100
    );

    res.json({
      verifiedPoints: student?.verified_points || 0,
      targetPoints: student?.target_points || 1000,
      targetProgressPercentage: targetProgress,
      rankPosition: student?.rank_position || null,
      history
    });
  } catch (error) {
    console.error('Error fetching reward points data:', error);
    res.status(500).json({ error: 'Failed to retrieve reward points data.' });
  }
});

// ==================== GET ATTENDANCE SUMMARY & HISTORY ====================
router.get('/attendance', async (req, res) => {
  try {
    const student = await db.get(
      'SELECT verified_attendance FROM students WHERE id = ?',
      [req.user.studentId]
    );

    const history = await db.all(
      `SELECT id, previous_attendance, new_attendance, recorded_at
       FROM attendance_history
       WHERE student_id = ?
       ORDER BY recorded_at DESC`,
      [req.user.studentId]
    );

    const attendance = student?.verified_attendance || 0;

    res.json({
      currentAttendance: attendance,
      isLowAttendance: attendance < 75.0,
      requiredMinimum: 75.0,
      history
    });
  } catch (error) {
    console.error('Error fetching attendance data:', error);
    res.status(500).json({ error: 'Failed to retrieve attendance data.' });
  }
});

// ==================== GET PERFORMANCE ANALYTICS ====================
router.get('/analytics', async (req, res) => {
  try {
    const student = await db.get(
      `SELECT verified_points, target_points, verified_attendance, cgpa, rank_position, performance_score
       FROM students WHERE id = ?`,
      [req.user.studentId]
    );

    const pointsHistory = await db.all(
      `SELECT new_total as points, created_at as date, reason
       FROM reward_point_history
       WHERE student_id = ?
       ORDER BY created_at ASC`,
      [req.user.studentId]
    );

    const attendanceHistory = await db.all(
      `SELECT new_attendance as attendance, recorded_at as date
       FROM attendance_history
       WHERE student_id = ?
       ORDER BY recorded_at ASC`,
      [req.user.studentId]
    );

    const totalStudentsResult = await db.get('SELECT COUNT(*) as total FROM students');
    const totalStudents = totalStudentsResult?.total || 1;
    const rank = student?.rank_position || totalStudents;
    const percentile = Math.max(0, Math.round(((totalStudents - rank + 1) / totalStudents) * 100));

    res.json({
      summary: {
        verifiedPoints: student?.verified_points || 0,
        attendance: student?.verified_attendance || 0,
        cgpa: student?.cgpa || 0,
        rank: student?.rank_position || null,
        totalStudents,
        percentile,
        performanceScore: student?.performance_score || 0
      },
      pointsHistory,
      attendanceHistory
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to retrieve analytics.' });
  }
});

// ==================== GET MENTOR FEEDBACK ====================
router.get('/feedback', async (req, res) => {
  try {
    const feedback = await db.all(
      `SELECT mf.id, mf.category, mf.message, mf.created_at,
              u.full_name as mentor_name, m.department as mentor_department, m.designation as mentor_designation
       FROM mentor_feedback mf
       JOIN mentors m ON mf.mentor_id = m.id
       JOIN users u ON m.user_id = u.id
       WHERE mf.student_id = ?
       ORDER BY mf.created_at DESC`,
      [req.user.studentId]
    );

    res.json(feedback);
  } catch (error) {
    console.error('Error fetching mentor feedback:', error);
    res.status(500).json({ error: 'Failed to retrieve mentor feedback.' });
  }
});

// ==================== GET NOTIFICATIONS ====================
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
    console.error('Error fetching notifications:', error);
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
