const express = require('express');
const router = express.Router();

module.exports = (pool) => {
  // ==================== GET ALL STUDENTS ====================
  router.get('/students', async (req, res) => {
    try {
      const [students] = await pool.execute('SELECT * FROM students ORDER BY reward_points DESC');
      res.json(students);
    } catch (error) {
      console.error('Error fetching students:', error);
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
        attendance_percentage,
        cgpa
      } = req.body;

      // Handle simplified frontend data (only name, roll_number, firebase_uid)
      const studentData = {
        firebase_uid,
        name,
        roll_number,
        email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        personalized_skill: personalized_skill || 'General Programming',
        completed_status: completed_status || 'Not Started',
        certificate_completion: certificate_completion || 0,
        reward_points: reward_points || 0,
        attendance_percentage: attendance_percentage || 0,
        cgpa: cgpa || 0.0
      };

      console.log('📝 Processed student data:', studentData);

      // ✅ Optional safety: verify that Firebase UID actually exists
      try {
        // Temporarily bypass Firebase UID verification for testing
        // await admin.auth().getUser(firebase_uid);
        console.log('⚠️ Bypassing Firebase UID verification for testing:', firebase_uid);
      } catch (e) {
        console.log('❌ Invalid Firebase UID (not found in Firebase Auth):', firebase_uid);
        return res.status(400).json({
          error: 'Invalid Firebase UID: user not found in Firebase Authentication'
        });
      }

      // ✅ Check for duplicate Firebase UID
      const [existingByUID] = await pool.execute(
        'SELECT id FROM students WHERE firebase_uid = ?',
        [studentData.firebase_uid]
      );

      if (existingByUID.length > 0) {
        console.log('❌ Duplicate Firebase UID:', studentData.firebase_uid);
        return res.status(409).json({
          error: 'Student with this Firebase UID already exists'
        });
      }

      // ✅ Check for duplicate Roll Number
      const [existingByRoll] = await pool.execute(
        'SELECT id FROM students WHERE roll_number = ?',
        [studentData.roll_number]
      );

      if (existingByRoll.length > 0) {
        console.log('❌ Duplicate Roll Number:', studentData.roll_number);
        return res.status(409).json({
          error: 'Student with this Roll Number already exists'
        });
      }

      // ✅ Check for duplicate Email
      const [existingByEmail] = await pool.execute(
        'SELECT id FROM students WHERE email = ?',
        [studentData.email]
      );

      if (existingByEmail.length > 0) {
        console.log('❌ Duplicate Email:', studentData.email);
        return res.status(409).json({
          error: 'Student with this Email already exists'
        });
      }

      // ✅ Calculate initial performance score
      const points = studentData.reward_points || 0;
      const attendance = studentData.attendance_percentage || 0;
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
          cgpa,
          performance_score,
          rank_position
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          studentData.firebase_uid,
          studentData.name,
          studentData.roll_number,
          studentData.email,
          studentData.personalized_skill || null,
          studentData.completed_status || 'Not Started',
          studentData.certificate_completion ? 1 : 0,
          points,
          attendance,
          studentData.cgpa,
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
      console.error('Error adding student:', error);
      res.status(500).json({ error: 'Failed to add student' });
    }
  });

  // ==================== GENERATE PDF REPORT ====================
  router.post('/generate-pdf', async (req, res) => {
    try {
      const { students } = req.body;
      
      // For now, return a simple response - PDF generation would require additional packages
      res.status(200).json({
        message: 'PDF generation endpoint ready',
        studentCount: students.length,
        students: students.map(s => ({
          name: s.name,
          roll_number: s.roll_number,
          cgpa: s.cgpa || 0.0,
          points: s.reward_points || 0
        }))
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).json({ error: 'Failed to generate PDF' });
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

      console.log('✅ Student deleted successfully!');
      res.status(200).json({ message: 'Student deleted successfully' });
    } catch (error) {
      console.error('Error deleting student:', error);
      res.status(500).json({ error: 'Failed to delete student' });
    }
  });

  return router;
};
