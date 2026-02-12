const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();

module.exports = (pool) => {

  // ==================== GET TOP 20 STUDENTS ====================
  router.get('/students', async (req, res) => {
    try {
      const [students] = await pool.execute(
        `SELECT 
          id,
          firebase_uid,
          name,
          roll_number,
          email,
          personalized_skill,
          completed_levels,
          completed_status,
          certificate_completion,
          reward_points,
          attendance_percentage,
          performance_score,
          rank_position
        FROM students
        ORDER BY reward_points DESC, performance_score DESC
        LIMIT 20`
      );

      // Assign rank + badge
      const studentsWithRank = students.map((student, index) => ({
        ...student,
        rank: index + 1,
        badge: getBadge(student.reward_points)
      }));

      // Update rank_position in DB
      for (const student of studentsWithRank) {
        await pool.execute(
          'UPDATE students SET rank_position = ? WHERE id = ?',
          [student.rank, student.id]
        );
      }

      res.json(studentsWithRank);
    } catch (error) {
      console.error('❌ Error fetching students:', error);
      res.status(500).json({ error: 'Failed to fetch students' });
    }
  });

  // ==================== ADD NEW STUDENT ====================
  router.post('/students', async (req, res) => {
    try {
      console.log('📥 Received request to add student:', req.body);

      const {
        firebase_uid,
        name,
        roll_number,
        email,
        personalized_skill,
        completed_status,
        certificate_completion,
        reward_points,
        attendance_percentage
      } = req.body;

      // ✅ Optional safety: verify that the Firebase UID actually exists
      try {
        await admin.auth().getUser(firebase_uid);
      } catch (e) {
        console.log('❌ Invalid Firebase UID (not found in Firebase Auth):', firebase_uid);
        return res.status(400).json({
          error: 'Invalid Firebase UID: user not found in Firebase Authentication'
        });
      }

      // ✅ Check for duplicate Firebase UID
      const [existingByUID] = await pool.execute(
        'SELECT id FROM students WHERE firebase_uid = ?',
        [firebase_uid]
      );

      if (existingByUID.length > 0) {
        console.log('❌ Duplicate Firebase UID:', firebase_uid);
        return res.status(409).json({
          error: 'Student with this Firebase UID already exists'
        });
      }

      // ✅ Check for duplicate Roll Number
      const [existingByRoll] = await pool.execute(
        'SELECT id FROM students WHERE roll_number = ?',
        [roll_number]
      );

      if (existingByRoll.length > 0) {
        console.log('❌ Duplicate Roll Number:', roll_number);
        return res.status(409).json({
          error: 'Student with this Roll Number already exists'
        });
      }

      // ✅ Check for duplicate Email
      const [existingByEmail] = await pool.execute(
        'SELECT id FROM students WHERE email = ?',
        [email]
      );

      if (existingByEmail.length > 0) {
        console.log('❌ Duplicate Email:', email);
        return res.status(409).json({
          error: 'Student with this Email already exists'
        });
      }

      // ✅ Calculate initial performance score
      const points = reward_points || 0;
      const attendance = attendance_percentage || 0;
      const pointsScore = Math.min((points / 1000) * 60, 60);
      const attendanceScore = (attendance / 100) * 40;
      const performance_score = (pointsScore + attendanceScore).toFixed(2);

      // ✅ Insert student
      const [result] = await pool.execute(
        `INSERT INTO students (
          firebase_uid,
          name,
          roll_number,
          email,
          personalized_skill,
          completed_status,
          certificate_completion,
          reward_points,
          attendance_percentage,
          performance_score,
          rank_position
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          firebase_uid,
          name,
          roll_number,
          email,
          personalized_skill || null,
          completed_status || 'Not Started',
          certificate_completion ? 1 : 0,
          points,
          attendance,
          performance_score,
          null
        ]
      );

      console.log('✅ Student added successfully! ID:', result.insertId);

      res.status(201).json({
        success: true,
        message: 'Student added successfully',
        studentId: result.insertId
      });

    } catch (error) {
      console.error('❌ Error adding student:', error);
      console.error('❌ Error details:', error.message);
      res.status(500).json({
        error: 'Failed to add student',
        details: error.message
      });
    }
  });

  // ==================== DELETE STUDENT ====================
  router.delete('/students/:id', async (req, res) => {
    try {
      const { id } = req.params;

      const [result] = await pool.execute(
        'DELETE FROM students WHERE id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Student not found' });
      }

      console.log('✅ Student deleted:', id);
      res.json({ message: 'Student deleted successfully' });
    } catch (error) {
      console.error('❌ Error deleting student:', error);
      res.status(500).json({ error: 'Failed to delete student' });
    }
  });

  // ==================== BADGE LOGIC ====================
  function getBadge(points) {
    if (points >= 1000) return '🏆 Diamond';
    if (points >= 750) return '💎 Platinum';
    if (points >= 500) return '🥇 Gold';
    if (points >= 250) return '🥈 Silver';
    if (points >= 100) return '🥉 Bronze';
    return '⭐ Beginner';
  }

  return router;
};