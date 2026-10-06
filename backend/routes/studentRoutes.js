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
      const email = (req.query.email || req.user?.email || '').trim().toLowerCase();

      if (email) {
        const [students] = await pool.execute(
          'SELECT * FROM students WHERE LOWER(email) = ? LIMIT 1',
          [email]
        );
        if (students.length > 0) {
          return res.json(students[0]);
        }
      }

      // Fallback if no email provided or not found
      return res.json(null);

    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  // ==================== UPDATE / AUTO-CREATE STUDENT DETAILS ====================
  router.post('/update-details', async (req, res) => {
    try {
      const { name, student_name, roll_no, email, user_email, skill_completed, allocated_points, attendance_percentage, cgpa } = req.body;

      if (!roll_no || !roll_no.trim()) {
        return res.status(400).json({ error: 'Roll number is required' });
      }

      const cleanRollNo = roll_no.trim();
      const studentEmail = (email || user_email || req.user?.email || '').trim().toLowerCase();

      if (!studentEmail) {
        return res.status(400).json({ error: 'Student email is required to save details' });
      }

      const displayName = (name || student_name || '').trim() || `Student (${cleanRollNo})`;

      console.log('🔍 Update Details Request:', {
        name: displayName,
        roll_no: cleanRollNo,
        email: studentEmail,
        skill_completed,
        allocated_points,
        attendance_percentage,
        cgpa
      });

      // Find student record strictly for THIS logged-in email
      let [students] = await pool.execute(
        'SELECT id, reward_points, completed_levels, name, roll_number, email FROM students WHERE LOWER(email) = ?',
        [studentEmail]
      );

      // If student does not exist for this email, check roll number duplicate
      if (!students || students.length === 0) {
        const [existingRoll] = await pool.execute(
          'SELECT id, email FROM students WHERE roll_number = ?',
          [cleanRollNo]
        );

        if (existingRoll.length > 0 && existingRoll[0].email.toLowerCase() !== studentEmail) {
          return res.status(400).json({ error: `This Roll Number (${cleanRollNo}) is already registered to another student account.` });
        }

        console.log('✨ Auto-creating new student profile for email:', studentEmail);
        const points = Number(allocated_points) || 0;
        const attendance = Number(attendance_percentage) || 0;
        const studentCgpa = Number(cgpa) || 0.0;
        const pointsScore = Math.min((points / 1000) * 60, 60);
        const attendanceScore = (attendance / 100) * 40;
        const performance_score = Number((pointsScore + attendanceScore).toFixed(2));
        const newUid = 'uid_' + Date.now();

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
          message: 'Student details saved successfully!',
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
        updateFields.push('personalized_skill = ?');
        updateValues.push(skill_completed.trim());
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
