const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const isVercel = !!process.env.VERCEL;
const DB_PATH = isVercel
  ? path.join('/tmp', 'task_performance.db')
  : (process.env.DB_PATH || path.join(__dirname, '..', 'task_performance.db'));

function ensureDbFile() {
  if (isVercel && !fs.existsSync(DB_PATH)) {
    const seedDb = path.join(__dirname, '..', 'task_performance.db');
    if (fs.existsSync(seedDb)) {
      try {
        fs.copyFileSync(seedDb, DB_PATH);
      } catch (e) {
        console.error('Failed to copy db to /tmp:', e);
      }
    }
  }
}

function hashPassword(password) {
  const salt = 'mentor_mentee_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

function getDatabase() {
  ensureDbFile();
  const db = new sqlite3.Database(DB_PATH);
  db.serialize(() => {
    db.run('PRAGMA foreign_keys = ON;');
    db.run('PRAGMA journal_mode = WAL;');
    db.run('PRAGMA busy_timeout = 5000;');
  });
  return db;
}

function runAsync(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function allAsync(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function getAsync(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

async function initializeDatabase(forceReset = false) {
  const db = getDatabase();

  console.log('🚀 Initializing Clean Database at:', DB_PATH);

  try {
    await runAsync(db, 'BEGIN TRANSACTION;');

    if (forceReset) {
      console.log('🧹 Dropping existing tables for clean setup...');
      await runAsync(db, 'DROP TABLE IF EXISTS audit_logs;');
      await runAsync(db, 'DROP TABLE IF EXISTS notifications;');
      await runAsync(db, 'DROP TABLE IF EXISTS mentor_feedback;');
      await runAsync(db, 'DROP TABLE IF EXISTS attendance_history;');
      await runAsync(db, 'DROP TABLE IF EXISTS reward_point_history;');
      await runAsync(db, 'DROP TABLE IF EXISTS update_requests;');
      await runAsync(db, 'DROP TABLE IF EXISTS student_activity_progress;');
      await runAsync(db, 'DROP TABLE IF EXISTS college_activities;');
      await runAsync(db, 'DROP TABLE IF EXISTS mentor_mentees;');
      await runAsync(db, 'DROP TABLE IF EXISTS students;');
      await runAsync(db, 'DROP TABLE IF EXISTS mentors;');
      await runAsync(db, 'DROP TABLE IF EXISTS users;');
    }

    // 1. Users table
    await runAsync(db, `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('student', 'mentor')),
        full_name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Mentors table
    await runAsync(db, `
      CREATE TABLE IF NOT EXISTS mentors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        employee_id TEXT UNIQUE NOT NULL,
        department TEXT NOT NULL,
        designation TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Students table (Starts completely clean: 0 points, 0 attendance, 0 CGPA)
    await runAsync(db, `
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        roll_number TEXT UNIQUE NOT NULL,
        department TEXT NOT NULL,
        academic_year INTEGER NOT NULL DEFAULT 3,
        cgpa REAL NOT NULL DEFAULT 0.0,
        verified_attendance REAL NOT NULL DEFAULT 0.0,
        verified_points INTEGER NOT NULL DEFAULT 0,
        target_points INTEGER NOT NULL DEFAULT 1000,
        rank_position INTEGER DEFAULT NULL,
        performance_score REAL DEFAULT 0.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Mentor-Mentee Assignments
    await runAsync(db, `
      CREATE TABLE IF NOT EXISTS mentor_mentees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mentor_id INTEGER NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(mentor_id, student_id)
      );
    `);

    // 5. Reward Point History (Starts empty)
    await runAsync(db, `
      CREATE TABLE IF NOT EXISTS reward_point_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        points_change INTEGER NOT NULL,
        previous_total INTEGER NOT NULL,
        new_total INTEGER NOT NULL,
        reason TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Attendance History (Starts empty)
    await runAsync(db, `
      CREATE TABLE IF NOT EXISTS attendance_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        previous_attendance REAL NOT NULL,
        new_attendance REAL NOT NULL,
        recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. Mentor Feedback (Starts empty)
    await runAsync(db, `
      CREATE TABLE IF NOT EXISTS mentor_feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mentor_id INTEGER NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        category TEXT NOT NULL DEFAULT 'General' CHECK(category IN ('Reward Points', 'Attendance', 'Academic', 'General')),
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 8. Notifications (Starts empty)
    await runAsync(db, `
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('submission', 'feedback', 'alert')),
        is_read INTEGER NOT NULL DEFAULT 0,
        link TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 9. Audit Logs (Starts empty)
    await runAsync(db, `
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        details TEXT,
        ip_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Indexes
    await runAsync(db, 'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);');
    await runAsync(db, 'CREATE INDEX IF NOT EXISTS idx_students_roll ON students(roll_number);');
    await runAsync(db, 'CREATE INDEX IF NOT EXISTS idx_mentor_mentees_mentor ON mentor_mentees(mentor_id);');
    await runAsync(db, 'CREATE INDEX IF NOT EXISTS idx_mentor_mentees_student ON mentor_mentees(student_id);');

    await runAsync(db, 'COMMIT;');
    console.log('✅ Tables and Indexes created successfully.');

    // Seed User & Mentee Accounts ONLY (Zero dummy data in points, feedback, or history)
    const userCount = await getAsync(db, 'SELECT COUNT(*) as count FROM users');
    if (userCount.count === 0) {
      console.log('🌱 Seeding user and mentor-mentee accounts (Zero dummy entries)...');
      await seedCleanAccounts(db);
      console.log('✅ Accounts initialized.');
    } else {
      console.log(`ℹ️ Database contains ${userCount.count} accounts.`);
    }

  } catch (error) {
    await runAsync(db, 'ROLLBACK;');
    console.error('❌ Database initialization error:', error);
    throw error;
  } finally {
    db.close();
  }
}

async function updateOfficialRankings(db) {
  const students = await allAsync(db, `
    SELECT id, verified_points, cgpa, verified_attendance 
    FROM students 
    ORDER BY verified_points DESC, cgpa DESC, verified_attendance DESC
  `);

  let currentRank = 1;
  for (let i = 0; i < students.length; i++) {
    if (i > 0) {
      const prev = students[i - 1];
      const curr = students[i];
      if (curr.verified_points !== prev.verified_points) {
        currentRank = i + 1;
      }
    }
    // Only assign rank if student has entered points (> 0)
    const rankVal = students[i].verified_points > 0 ? currentRank : null;
    await runAsync(db, 'UPDATE students SET rank_position = ? WHERE id = ?', [rankVal, students[i].id]);
  }
}

async function seedCleanAccounts(db) {
  await runAsync(db, 'BEGIN TRANSACTION;');

  const defaultPasswordHash = hashPassword('password123');
  const mentorPasswordHash = hashPassword('mentor123');

  // --- SEED MENTORS ---
  // Mentor 1 (CSE)
  const m1User = await runAsync(db, `
    INSERT INTO users (email, password_hash, role, full_name)
    VALUES (?, ?, 'mentor', ?)
  `, ['mentor@bitsathy.ac.in', mentorPasswordHash, 'Dr. Rajesh Kumar']);

  const m1 = await runAsync(db, `
    INSERT INTO mentors (user_id, employee_id, department, designation)
    VALUES (?, ?, ?, ?)
  `, [m1User.lastID, 'FAC_CSE_101', 'Computer Science and Engineering', 'Associate Professor & Mentor']);

  // Mentor 2 (IT)
  const m2User = await runAsync(db, `
    INSERT INTO users (email, password_hash, role, full_name)
    VALUES (?, ?, 'mentor', ?)
  `, ['meena.mentor@bitsathy.ac.in', mentorPasswordHash, 'Dr. Meena Devi']);

  const m2 = await runAsync(db, `
    INSERT INTO mentors (user_id, employee_id, department, designation)
    VALUES (?, ?, ?, ?)
  `, [m2User.lastID, 'FAC_IT_102', 'Information Technology', 'Assistant Professor & Mentor']);

  // --- SEED STUDENT ACCOUNTS (ALL START AT 0 POINTS, 0 ATTENDANCE, 0 CGPA, 0 FEEDBACK) ---
  const studentList = [
    // Assigned to Mentor 1 (Dr. Rajesh Kumar) - 12 Students
    { roll: '7376231CS101', name: 'Aarav Sharma', email: 'aarav.cs23@bitsathy.ac.in', dept: 'CSE', mentorId: m1.lastID },
    { roll: '7376231CS102', name: 'Beniel Raja', email: 'benielraja.cs23@bitsathy.ac.in', dept: 'CSE', mentorId: m1.lastID },
    { roll: '7376231CS103', name: 'Chaitanya Verma', email: 'chaitanya.cs23@bitsathy.ac.in', dept: 'CSE', mentorId: m1.lastID },
    { roll: '7376231CS104', name: 'Deepika Raman', email: 'deepika.cs23@bitsathy.ac.in', dept: 'CSE', mentorId: m1.lastID },
    { roll: '7376231CS105', name: 'Eswar Sundar', email: 'eswar.cs23@bitsathy.ac.in', dept: 'CSE', mentorId: m1.lastID },
    { roll: '7376231CS106', name: 'Farhan Ali', email: 'farhan.cs23@bitsathy.ac.in', dept: 'CSE', mentorId: m1.lastID },
    { roll: '7376231CS107', name: 'Gowtham Krishnan', email: 'gowtham.cs23@bitsathy.ac.in', dept: 'CSE', mentorId: m1.lastID },
    { roll: '7376231CS108', name: 'Harish R', email: 'harish.cs23@bitsathy.ac.in', dept: 'CSE', mentorId: m1.lastID },
    { roll: '7376231CS109', name: 'Irfan Mohammed', email: 'irfan.cs23@bitsathy.ac.in', dept: 'CSE', mentorId: m1.lastID },
    { roll: '7376231CS110', name: 'Jayashree Nair', email: 'jayashree.cs23@bitsathy.ac.in', dept: 'CSE', mentorId: m1.lastID },
    { roll: '7376231CS111', name: 'Karthik Raja', email: 'karthik.cs23@bitsathy.ac.in', dept: 'CSE', mentorId: m1.lastID },
    { roll: '7376231CS112', name: 'Lavanya M', email: 'lavanya.cs23@bitsathy.ac.in', dept: 'CSE', mentorId: m1.lastID },

    // Assigned to Mentor 2 (Dr. Meena Devi) - 12 Students
    { roll: '7376232IT201', name: 'Manoj Kumar', email: 'manoj.it23@bitsathy.ac.in', dept: 'IT', mentorId: m2.lastID },
    { roll: '7376232IT202', name: 'Naveen Prakash', email: 'naveen.it23@bitsathy.ac.in', dept: 'IT', mentorId: m2.lastID },
    { roll: '7376232IT203', name: 'Oviya Selvan', email: 'oviya.it23@bitsathy.ac.in', dept: 'IT', mentorId: m2.lastID },
    { roll: '7376232IT204', name: 'Pranav Anand', email: 'pranav.it23@bitsathy.ac.in', dept: 'IT', mentorId: m2.lastID },
    { roll: '7376232IT205', name: 'Qadir Basha', email: 'qadir.it23@bitsathy.ac.in', dept: 'IT', mentorId: m2.lastID },
    { roll: '7376232IT206', name: 'Rithanya Shree', email: 'rithanya.it23@bitsathy.ac.in', dept: 'IT', mentorId: m2.lastID },
    { roll: '7376232IT207', name: 'Sudharsan S', email: 'sudharsan.it23@bitsathy.ac.in', dept: 'IT', mentorId: m2.lastID },
    { roll: '7376232IT208', name: 'Tharun Tej', email: 'tharun.it23@bitsathy.ac.in', dept: 'IT', mentorId: m2.lastID },
    { roll: '7376232IT209', name: 'Uma Maheshwari', email: 'uma.it23@bitsathy.ac.in', dept: 'IT', mentorId: m2.lastID },
    { roll: '7376232IT210', name: 'Vigneshwaran K', email: 'vignesh.it23@bitsathy.ac.in', dept: 'IT', mentorId: m2.lastID },
    { roll: '7376232IT211', name: 'Yamini Priya', email: 'yamini.it23@bitsathy.ac.in', dept: 'IT', mentorId: m2.lastID },
    { roll: '7376232IT212', name: 'Zameer Ahmed', email: 'zameer.it23@bitsathy.ac.in', dept: 'IT', mentorId: m2.lastID }
  ];

  for (const s of studentList) {
    const u = await runAsync(db, `
      INSERT INTO users (email, password_hash, role, full_name)
      VALUES (?, ?, 'student', ?)
    `, [s.email, defaultPasswordHash, s.name]);

    // All academic fields initialized to 0, completely clean
    const st = await runAsync(db, `
      INSERT INTO students (user_id, roll_number, department, academic_year, cgpa, verified_attendance, verified_points, performance_score)
      VALUES (?, ?, ?, 3, 0.0, 0.0, 0, 0.0)
    `, [u.lastID, s.roll, s.dept]);

    // Assign to Mentor
    await runAsync(db, `
      INSERT INTO mentor_mentees (mentor_id, student_id)
      VALUES (?, ?)
    `, [s.mentorId, st.lastID]);
  }

  // NOTE: Zero dummy rows inserted in:
  // - mentor_feedback (0 rows)
  // - reward_point_history (0 rows)
  // - attendance_history (0 rows)
  // - notifications (0 rows)

  await runAsync(db, 'COMMIT;');
}

module.exports = {
  initializeDatabase,
  getDatabase,
  runAsync,
  allAsync,
  getAsync,
  hashPassword,
  updateOfficialRankings,
  DB_PATH
};

if (require.main === module) {
  // Pass true to force reset to a completely clean state
  initializeDatabase(true)
    .then(() => {
      console.log('✅ Clean database reset completed: ZERO dummy data.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Database setup failed:', err);
      process.exit(1);
    });
}
