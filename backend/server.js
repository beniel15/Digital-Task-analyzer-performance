const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./db');
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const mentorRoutes = require('./routes/mentorRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes (supports both /api/ prefix and direct routes for serverless deployments)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/student', studentRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/mentor', mentorRoutes);

// Root & Health Check Endpoints
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: '🎓 Mentor–Mentee Management Dashboard API is running successfully!',
    version: '2.0.0'
  });
});

app.get('/api/health', async (req, res) => {
  try {
    const studentCount = await db.get('SELECT COUNT(*) as count FROM students');
    const mentorCount = await db.get('SELECT COUNT(*) as count FROM mentors');
    res.json({
      success: true,
      database: 'connected',
      studentsRegistered: studentCount?.count || 0,
      mentorsRegistered: mentorCount?.count || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred.'
  });
});

// Initialize DB and Start Server
async function startServer() {
  try {
    await db.init();
    console.log('✅ Relational Database initialized & verified successfully.');

    const server = app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🔗 API available at http://localhost:${PORT}`);
    });

    // Graceful Shutdown
    const shutdown = async () => {
      console.log('\n🛑 Gracefully shutting down server...');
      server.close(async () => {
        await db.end();
        console.log('✅ Database connections closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
