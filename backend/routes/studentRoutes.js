const express = require('express');
const router = express.Router();

// Helper function to calculate average points of all students
const calculateAveragePoints = async (pool) => {
  try {
    const [results] = await pool.execute('SELECT AVG(reward_points) as avg_points FROM students');
    const avgPoints = results[0]?.avg_points || 0;
    return Math.round(avgPoints);
  } catch (error) {
    console.error('Error calculating average points:', error);
    return 0;
  }
};

module.exports = (pool) => {

  // ==================== GET STUDENT PROFILE ====================
  router.get('/profile', async (req, res) => {
    try {
      const firebase_uid = req.user?.uid || 'test_uid';

      const [students] = await pool.execute(
        'SELECT * FROM students ORDER BY id DESC LIMIT 1'
      );

      if (students.length === 0) {
        return res.json({
          id: 1,
          name: 'Test Student',
          roll_number: 'TEST001',
          cgpa: 0.0,
          reward_points: 0,
          completed_levels: '',
          personalized_skill: 'Not assigned'
        });
      }

      res.json(students[0]);

    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  // ==================== UPDATE / AUTO-CREATE STUDENT DETAILS ====================
  router.post('/update-details', async (req, res) => {
    try {
      const { name, student_name, roll_no, skill_completed, allocated_points, attendance_percentage, cgpa } = req.body;

      if (!roll_no || !roll_no.trim()) {
        return res.status(400).json({ error: 'Roll number is required' });
      }

      const cleanRollNo = roll_no.trim();
      const displayName = (name || student_name || '').trim() || `Student (${cleanRollNo})`;

      console.log('🔍 Update Details Request:', {
        name: displayName,
        roll_no: cleanRollNo,
        skill_completed,
        allocated_points,
        attendance_percentage,
        cgpa
      });

      // Find student by roll number
      let [students] = await pool.execute(
        'SELECT id, reward_points, completed_levels, name FROM students WHERE roll_number = ?',
        [cleanRollNo]
      );

      if (!students || students.length === 0) {
        const normalized = cleanRollNo.toLowerCase().replace(/\s+/g, '');
        const fallbackQuery = `SELECT id, reward_points, completed_levels, roll_number, name FROM students WHERE LOWER(REPLACE(roll_number, ' ', '')) = ?`;
        const [fallbackRows] = await pool.execute(fallbackQuery, [normalized]);
        students = fallbackRows;
      }

      // If student does not exist, AUTO-CREATE student in database
      if (!students || students.length === 0) {
        console.log('✨ Student not found. Auto-creating new student for roll number:', cleanRollNo);
        const points = Number(allocated_points) || 0;
        const attendance = Number(attendance_percentage) || 0;
        const studentCgpa = Number(cgpa) || 0.0;
        const pointsScore = Math.min((points / 1000) * 60, 60);
        const attendanceScore = (attendance / 100) * 40;
        const performance_score = Number((pointsScore + attendanceScore).toFixed(2));
        const newUid = 'uid_' + Date.now();
        const studentEmail = `${cleanRollNo.toLowerCase().replace(/\s+/g, '')}@student.com`;

        const [insertResult] = await pool.execute(
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
            completed_levels
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newUid,
            displayName,
            cleanRollNo,
            studentEmail,
            skill_completed || 'General Programming',
            'In Progress',
            1,
            points,
            attendance,
            studentCgpa,
            performance_score,
            skill_completed || null
          ]
        );

        console.log('✅ Auto-created student ID:', insertResult.insertId);

        return res.status(200).json({
          message: 'Student added to system and details saved successfully!',
          completed_levels: skill_completed,
          cgpa: studentCgpa,
          studentId: insertResult.insertId
        });
      }

      // Student exists -> Update existing student record
      const student = students[0];
      const studentId = student.id;

      let existingCompletedLevels = student.completed_levels || '';
      let newCompletedLevels = existingCompletedLevels;

      if (skill_completed && skill_completed.trim()) {
        const cleanExisting = existingCompletedLevels
          ? existingCompletedLevels.split(',').map(s => s.trim()).filter(s => s !== '0' && s !== '')
          : [];

        const newSkill = skill_completed.trim();

        if (!cleanExisting.includes(newSkill)) {
          cleanExisting.push(newSkill);
        }

        newCompletedLevels = cleanExisting.join(', ');
      }

      const existingRewardPoints = student.reward_points || 0;
      const newRewardPoints = (Number(allocated_points) || 0) + existingRewardPoints;

      const currentAttendance = attendance_percentage !== undefined ? Number(attendance_percentage) : (student.attendance_percentage || 0);
      const pointsScore = Math.min((newRewardPoints / 1000) * 60, 60);
      const attendanceScore = (currentAttendance / 100) * 40;
      const newPerformanceScore = Number((pointsScore + attendanceScore).toFixed(2));

      const updateFields = [];
      const updateValues = [];

      // Update name if provided
      if (name || student_name) {
        updateFields.push('name = ?');
        updateValues.push(displayName);
      }

      if (skill_completed && skill_completed.trim()) {
        updateFields.push('completed_levels = ?');
        updateValues.push(newCompletedLevels);
      }

      if (allocated_points !== undefined && Number(allocated_points) > 0) {
        updateFields.push('reward_points = ?');
        updateValues.push(newRewardPoints);
      }

      if (attendance_percentage !== undefined) {
        updateFields.push('attendance_percentage = ?');
        updateValues.push(Number(attendance_percentage));
      }

      if (cgpa !== undefined && Number(cgpa) > 0) {
        updateFields.push('cgpa = ?');
        updateValues.push(Number(cgpa));
      }

      updateFields.push('performance_score = ?');
      updateValues.push(newPerformanceScore);

      if (updateFields.length > 0) {
        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(studentId);

        const updateQuery = `UPDATE students SET ${updateFields.join(', ')} WHERE id = ?`;
        await pool.execute(updateQuery, updateValues);
      }

      console.log('✅ Student details updated successfully!');

      const [updatedStudent] = await pool.execute(
        'SELECT * FROM students WHERE id = ?',
        [studentId]
      );

      res.status(200).json({
        message: 'Student details updated successfully',
        completed_levels: newCompletedLevels,
        cgpa: cgpa,
        updatedProfile: updatedStudent[0] || null
      });
    } catch (error) {
      console.error('Error updating student details:', error);
      res.status(500).json({ error: 'Failed to update student details' });
    }
  });

  return router;
};
