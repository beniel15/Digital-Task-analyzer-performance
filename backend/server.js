const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const admin = require('firebase-admin');
require('dotenv').config(); 

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
// Firebase Admin SDK
// Prefer env vars if they are set; otherwise fall back to the local service account JSON file.
let firebaseCredential;

if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  // Using individual env variables (what your current .env shows)
  firebaseCredential = admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  });
} else {
  // Fallback: read from backend/serviceAccountKey.json.json
  // This file already contains project_id, client_email, private_key, etc.
  const serviceAccount = require('./serviceAccountKey.json')
  firebaseCredential = admin.credential.cert(serviceAccount);
}

admin.initializeApp({
  credential: firebaseCredential,
});

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
// Verify Firebase Token Middleware
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Import route files
const mentorRoutes = require('./routes/mentorRoutes')(pool);
const studentRoutes = require('./routes/studentRoutes')(pool);

// Use routes
app.use('/api/mentor', mentorRoutes); 
app.use('/api/student', studentRoutes); // Temporarily disabled auth for testing

// Register mentor (no auth required)
app.post('/api/auth/register-mentor', async (req, res) => {
  try {
    const { firebase_uid, name, email } = req.body;
    await pool.execute(
      'INSERT INTO mentors (firebase_uid, name, email) VALUES (?, ?, ?)',
      [firebase_uid, name, email]
    );
    res.status(201).json({ message: 'Mentor registered successfully' });
  } catch (error) {
    console.error('Error registering mentor:', error);
    res.status(500).json({ error: 'Failed to register mentor' });
  }
});

// Start server
app.get('/', (req, res) => {
  res.send('🚀 Backend is running successfully!');
});
app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT 1');
    res.json({ success: true, message: 'DB connected!' });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔗 API available at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});