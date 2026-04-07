const express = require('express');
const router = express.Router();

module.exports = (pool) => {

  // GET overview stats
  router.get('/stats', async (req, res) => {
    try {
      const [[{ totalStudents }]] = await pool.execute('SELECT COUNT(*) as totalStudents FROM students');
      const [[{ totalMentors }]] = await pool.execute('SELECT COUNT(*) as totalMentors FROM mentors');
      const [[{ avgCgpa }]] = await pool.execute('SELECT AVG(cgpa) as avgCgpa FROM students');
      res.json({
        totalStudents,
        totalMentors,
        avgCgpa: parseFloat(avgCgpa || 0).toFixed(2)
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // GET all mentors
  router.get('/mentors', async (req, res) => {
    try {
      const [mentors] = await pool.execute('SELECT * FROM mentors ORDER BY created_at DESC');
      res.json(mentors);
    } catch (error) {
      console.error('Error fetching mentors:', error);
      res.status(500).json({ error: 'Failed to fetch mentors' });
    }
  });

  // DELETE mentor
  router.delete('/mentors/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const [result] = await pool.execute('DELETE FROM mentors WHERE id = ?', [id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Mentor not found' });
      }
      res.json({ message: 'Mentor deleted successfully' });
    } catch (error) {
      console.error('Error deleting mentor:', error);
      res.status(500).json({ error: 'Failed to delete mentor' });
    }
  });

  return router;
};