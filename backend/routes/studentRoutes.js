const express = require('express');
const router = express.Router();

// Calculate performance score automatically
async function calculatePerformanceScore(pool, student_id) {
  try {
    const [student] = await pool.execute(
      'SELECT reward_points, attendance_percentage FROM students WHERE id = ?',
      [student_id]
    );

    if (student.length === 0) return;

    const points = student[0].reward_points || 0;
    const attendance = student[0].attendance_percentage || 0;

    // Performance Score Formula:
    // 60% from reward points (max 1000 points = 60 score)
    // 40% from attendance
    const pointsScore = Math.min((points / 1000) * 60, 60);
    const attendanceScore = (attendance / 100) * 40;
    const totalScore = pointsScore + attendanceScore;

    await pool.execute(
      'UPDATE students SET performance_score = ? WHERE id = ?',
      [totalScore.toFixed(2), student_id]
    );

    return totalScore;
  } catch (error) {
    console.error('Error calculating performance score:', error);
  }
}

module.exports = (pool) => {

  // ==================== GET STUDENT PROFILE ====================
  router.get('/profile', async (req, res) => {
    try {
      const firebase_uid = req.user.uid;

      const [students] = await pool.execute(
        `SELECT 
          id, name, roll_number, email, personalized_skill, completed_status,
          certificate_completion, reward_points, attendance_percentage, 
          performance_score, rank_position
         FROM students 
         WHERE firebase_uid = ?`,
        [firebase_uid]
      );

      if (students.length === 0) {
        return res.status(404).json({ error: 'Student not found' });
      }

      // Get next level goal
      const currentPoints = students[0].reward_points;
      const nextGoal = getNextGoal(currentPoints);
      const badge = getBadge(currentPoints);

      res.json({
        ...students[0],
        nextGoal,
        badge,
        pointsToNextLevel: nextGoal - currentPoints
      });
    } catch (error) {
      console.error('Error fetching student profile:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  // ==================== UPDATE REWARD POINTS ====================
  router.post('/update-points', async (req, res) => {
    try {
      const firebase_uid = req.user.uid;
      const { points_to_add, activity_description } = req.body;

      // Get student ID
      const [students] = await pool.execute(
        'SELECT id, reward_points FROM students WHERE firebase_uid = ?',
        [firebase_uid]
      );

      if (students.length === 0) {
        return res.status(404).json({ error: 'Student not found' });
      }

      const student_id = students[0].id;
      const oldPoints = students[0].reward_points;
      const newPoints = oldPoints + points_to_add;

      // Update reward points
      await pool.execute(
        'UPDATE students SET reward_points = ? WHERE id = ?',
        [newPoints, student_id]
      );

      // Log activity
      await pool.execute(
        'INSERT INTO activity_log (student_id, activity_type, activity_description, points_earned) VALUES (?, ?, ?, ?)',
        [student_id, 'points_added', activity_description, points_to_add]
      );

      // Recalculate performance score
      await calculatePerformanceScore(pool, student_id);

      // Check if badge changed
      const oldBadge = getBadge(oldPoints);
      const newBadge = getBadge(newPoints);
      const badgeUpgraded = oldBadge !== newBadge;

      res.json({
        message: 'Points updated successfully',
        newPoints,
        pointsAdded: points_to_add,
        newBadge,
        badgeUpgraded
      });
    } catch (error) {
      console.error('Error updating points:', error);
      res.status(500).json({ error: 'Failed to update points' });
    }
  });

  // ==================== UPDATE LEVEL/STATUS ====================
  router.post('/update-level', async (req, res) => {
    try {
      const firebase_uid = req.user.uid;
      const { completed_status } = req.body;

      const [students] = await pool.execute(
        'SELECT id FROM students WHERE firebase_uid = ?',
        [firebase_uid]
      );

      if (students.length === 0) {
        return res.status(404).json({ error: 'Student not found' });
      }

      const student_id = students[0].id;

      // Update completion status
      await pool.execute(
        'UPDATE students SET completed_status = ? WHERE id = ?',
        [completed_status, student_id]
      );

      // Award bonus points for level completion
      if (completed_status === 'Completed') {
        await pool.execute(
          'UPDATE students SET reward_points = reward_points + 50, certificate_completion = TRUE WHERE id = ?',
          [student_id]
        );

        await pool.execute(
          'INSERT INTO activity_log (student_id, activity_type, activity_description, points_earned) VALUES (?, ?, ?, ?)',
          [student_id, 'level_completed', 'Completed all levels!', 50]
        );

        await calculatePerformanceScore(pool, student_id);
      }

      res.json({ message: 'Level updated successfully' });
    } catch (error) {
      console.error('Error updating level:', error);
      res.status(500).json({ error: 'Failed to update level' });
    }
  });

  // ==================== UPDATE STUDENT DETAILS BY ROLL NUMBER ====================
  router.post('/update-details', async (req, res) => {
    try {
      const firebase_uid = req.user.uid;
      const { roll_no, completed_levels, skill_completed, allocated_points, attendance_percentage } = req.body;

      console.log('🔍 Update Details Request:', {
        firebase_uid,
        roll_no,
        completed_levels,
        skill_completed,
        allocated_points,
        attendance_percentage
      });

      // Find student by roll number
      const [students] = await pool.execute(
        'SELECT id, reward_points FROM students WHERE roll_number = ?',
        [roll_no]
      );

      console.log('👤 Found students:', students.length);

      if (students.length === 0) {
        console.log('❌ Student not found with roll number:', roll_no);
        return res.status(404).json({ error: 'Student with this roll number not found' });
      }

      const student_id = students[0].id;
      const oldPoints = students[0].reward_points;
      const newTotalPoints = oldPoints + parseInt(allocated_points);

      console.log('📝 Updating student:', { student_id, oldPoints, allocated_points, newTotalPoints });

      // Update student details - accumulate points
      await pool.execute(
        `UPDATE students SET 
         completed_levels = ?, 
         personalized_skill = ?, 
         reward_points = ?, 
         attendance_percentage = ?
         WHERE id = ?`,
        [completed_levels, skill_completed, newTotalPoints, attendance_percentage, student_id]
      );

      console.log('✅ Student updated successfully');

      // Log activity
      await pool.execute(
        'INSERT INTO activity_log (student_id, activity_type, activity_description, points_earned) VALUES (?, ?, ?, ?)',
        [student_id, 'details_updated', 'Student details updated via roll number', parseInt(allocated_points)]
      );

      // Recalculate performance score
      await calculatePerformanceScore(pool, student_id);

      // Check if badge changed
      const newBadge = getBadge(newTotalPoints);
      const badgeUpgraded = getBadge(oldPoints) !== newBadge;

      res.json({
        message: 'Student details updated successfully',
        updatedFields: {
          roll_no,
          completed_levels,
          skill_completed,
          allocated_points: parseInt(allocated_points),
          total_points: newTotalPoints,
          attendance_percentage
        },
        newBadge,
        badgeUpgraded
      });
    } catch (error) {
      console.error('Error updating student details:', error);
      res.status(500).json({ error: 'Failed to update student details' });
    }
  });

  // ==================== GET ACTIVITY HISTORY ====================
  router.get('/profile', async (req, res) => {
    try {
      const firebase_uid = req.user.uid;

      const [students] = await pool.execute(
        'SELECT * FROM students WHERE firebase_uid = ?',
        [firebase_uid]
      );

      if (students.length === 0) {
        return res.status(404).json({ error: 'Student not found' });
      }

      res.json(students[0]);

    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });


  // Helper functions
  function getBadge(points) {
    if (points >= 1000) return '🏆 Diamond';
    if (points >= 750) return '💎 Platinum';
    if (points >= 500) return '🥇 Gold';
    if (points >= 250) return '🥈 Silver';
    if (points >= 100) return '🥉 Bronze';
    return '⭐ Beginner';
  }

  function getNextGoal(currentPoints) {
    if (currentPoints < 100) return 100;
    if (currentPoints < 250) return 250;
    if (currentPoints < 500) return 500;
    if (currentPoints < 750) return 750;
    if (currentPoints < 1000) return 1000;
    return 1500; // After 1000, next goal is 1500
  }

  return router;
};