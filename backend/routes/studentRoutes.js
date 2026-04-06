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


// Helper function to parse skill level
const parseSkillLevel = (skillString) => {
  if (!skillString) return null;

  const match = skillString.match(/(\w+)\s*(\d+)/);
  if (match) {
    return {
      skill: match[1].trim(),
      level: parseInt(match[2])
    };
  }
  return null;
};

module.exports = (pool) => {

  // ==================== GET STUDENT PROFILE ====================
  router.get('/profile', async (req, res) => {
    try {
      // Temporarily skip firebase_uid check for testing
      const firebase_uid = req.user?.uid || 'test_uid';

      // For testing, return the first student with CGPA data
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

  // ==================== UPDATE STUDENT DETAILS ====================
  router.post('/update-details', async (req, res) => {
    try {
      // Temporarily skip firebase_uid check for testing
      const firebase_uid = req.user?.uid || 'test_uid';

      const { roll_no, skill_completed, allocated_points, attendance_percentage, cgpa } = req.body;

      console.log('🔍 Update Details Request:', {
        firebase_uid,
        roll_no,
        skill_completed,
        allocated_points,
        attendance_percentage,
        cgpa
      });

      // Find student by roll number (try exact match first, then fall back to case/space-insensitive match)
      let [students] = await pool.execute(
        'SELECT id, reward_points, completed_levels FROM students WHERE roll_number = ?',
        [roll_no]
      );

      if (!students || students.length === 0) {
        // Try case-insensitive and space-insensitive match (helps when users enter roll with/without spaces or different case)
        const normalized = roll_no ? roll_no.toString().replace(/\s+/g, '').toLowerCase() : '';
        const fallbackQuery = `SELECT id, reward_points, completed_levels, roll_number FROM students WHERE LOWER(REPLACE(roll_number, ' ', '')) = ?`;
        console.log('🔎 Fallback roll match query:', fallbackQuery, 'params:', [normalized]);
        const [fallbackRows] = await pool.execute(fallbackQuery, [normalized]);
        students = fallbackRows;
      }

      console.log('👤 Found students:', students.length, students[0] ? { id: students[0].id, roll_number: students[0].roll_number } : null);

      if (students.length === 0) {
        return res.status(404).json({ error: 'Student not found', detail: `No student matching roll '${roll_no}'` });
      }

      const student = students[0];
      const studentId = student.id;

      // Get existing completed levels and append new skill_completed
      let existingCompletedLevels = student.completed_levels || '';
      let newCompletedLevels = existingCompletedLevels;

      // If student entered new skill_completed, append to existing levels
      if (skill_completed && skill_completed.trim()) {
        // Strip out the default '0' value before appending
        const cleanExisting = existingCompletedLevels
          ? existingCompletedLevels.split(',').map(s => s.trim()).filter(s => s !== '0' && s !== '')
          : [];

        const newSkill = skill_completed.trim();

        // Only append if not already exists (no duplicates)
        if (!cleanExisting.includes(newSkill)) {
          cleanExisting.push(newSkill);
        }

        newCompletedLevels = cleanExisting.join(', ');
      }

      console.log('📚 Completed Levels Update:', {
        existing: existingCompletedLevels,
        new: skill_completed,
        combined: newCompletedLevels
      });

      // Calculate new reward points by ADDING to existing (not replacing)
      const existingRewardPoints = student.reward_points || 0;
      const newRewardPoints = (allocated_points || 0) + existingRewardPoints;

      console.log('💰 Points Update:', {
        existing: existingRewardPoints,
        new: allocated_points,
        total: newRewardPoints
      });

      // Calculate new performance score based on updated points and attendance
      const currentAttendance = attendance_percentage !== undefined ? attendance_percentage : (student.attendance_percentage || 0);
      const pointsScore = Math.min((newRewardPoints / 1000) * 60, 60);
      const attendanceScore = (currentAttendance / 100) * 40;
      const newPerformanceScore = (pointsScore + attendanceScore).toFixed(2);

      console.log('📊 Score Update:', {
        pointsScore,
        attendanceScore,
        performance_score: newPerformanceScore
      });

      // Update student with new data
      const updateFields = [];
      const updateValues = [];

      if (skill_completed && skill_completed.trim()) {
        updateFields.push('completed_levels = ?');
        updateValues.push(newCompletedLevels);
      }

      if (allocated_points !== undefined && allocated_points > 0) {
        updateFields.push('reward_points = ?');
        updateValues.push(newRewardPoints);
      }

      if (attendance_percentage !== undefined) {
        updateFields.push('attendance_percentage = ?');
        updateValues.push(attendance_percentage);
      }

      if (cgpa !== undefined && cgpa > 0) {
        updateFields.push('cgpa = ?');
        updateValues.push(cgpa);
      }

      // Always update performance score if points or attendance changed
      if (allocated_points !== undefined || attendance_percentage !== undefined) {
        updateFields.push('performance_score = ?');
        updateValues.push(newPerformanceScore);
      }

      if (updateFields.length > 0) {
        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(studentId);

        const updateQuery = `UPDATE students SET ${updateFields.join(', ')} WHERE id = ?`;
        console.log('🔄 Update Query:', updateQuery);
        console.log('🔄 Update Values:', updateValues);

        await pool.execute(updateQuery, updateValues);
      }

      console.log('✅ Student details updated successfully!');

      // Get the updated student data
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
