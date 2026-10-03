const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

class SQLitePoolWrapper {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = new sqlite3.Database(dbPath);
    this.initDatabase();
  }

  initDatabase() {
    this.db.serialize(() => {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS students (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          firebase_uid TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          roll_number TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          personalized_skill TEXT,
          completed_status TEXT DEFAULT 'Not Started',
          certificate_completion INTEGER DEFAULT 0,
          reward_points INTEGER DEFAULT 0,
          attendance_percentage REAL DEFAULT 0.0,
          cgpa REAL DEFAULT 0.0,
          performance_score REAL DEFAULT 0.0,
          rank_position INTEGER,
          completed_levels TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      this.db.run(`
        CREATE TABLE IF NOT EXISTS mentors (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          firebase_uid TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      this.db.run(`
        CREATE TABLE IF NOT EXISTS activity_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id INTEGER NOT NULL,
          activity_type TEXT NOT NULL,
          activity_description TEXT,
          points_earned INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
        )
      `);

      this.db.get("SELECT COUNT(*) as count FROM students", (err, row) => {
        if (!err && row && row.count === 0) {
          console.log('🌱 Seeding initial sample students into database...');
          const seedStudents = [
            ['uid_sample_1', 'Alex Johnson', 'CS2024001', 'alex.j@university.edu', 'Full Stack Development', 'In Progress', 1, 850, 92.5, 3.8, 88.0, 1, 'Level 1, Level 2'],
            ['uid_sample_2', 'Sarah Smith', 'CS2024002', 'sarah.s@university.edu', 'Data Science & AI', 'In Progress', 1, 720, 88.0, 3.6, 78.4, 2, 'Level 1'],
            ['uid_sample_3', 'Michael Brown', 'CS2024003', 'michael.b@university.edu', 'Cloud Computing', 'Completed', 1, 950, 95.0, 3.9, 95.0, 3, 'Level 1, Level 2, Level 3'],
            ['uid_sample_4', 'Emily Davis', 'CS2024004', 'emily.d@university.edu', 'Cybersecurity', 'Not Started', 0, 450, 78.0, 3.2, 58.2, 4, 'Level 1']
          ];

          const stmt = this.db.prepare(`
            INSERT INTO students (
              firebase_uid, name, roll_number, email, personalized_skill, 
              completed_status, certificate_completion, reward_points, 
              attendance_percentage, cgpa, performance_score, rank_position, completed_levels
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          seedStudents.forEach(s => stmt.run(s));
          stmt.finalize();
        }
      });
    });
  }

  execute(sql, params = []) {
    return new Promise((resolve, reject) => {
      let normalizedSql = sql.trim();
      
      const isSelect = /^select/i.test(normalizedSql);
      const isInsert = /^insert/i.test(normalizedSql);
      const isUpdate = /^update/i.test(normalizedSql);
      const isDelete = /^delete/i.test(normalizedSql);

      if (isSelect) {
        this.db.all(normalizedSql, params, (err, rows) => {
          if (err) return reject(err);
          resolve([rows, []]);
        });
      } else if (isInsert) {
        this.db.run(normalizedSql, params, function (err) {
          if (err) return reject(err);
          resolve([{ insertId: this.lastID, affectedRows: this.changes }, []]);
        });
      } else if (isUpdate || isDelete) {
        this.db.run(normalizedSql, params, function (err) {
          if (err) return reject(err);
          resolve([{ affectedRows: this.changes }, []]);
        });
      } else {
        this.db.run(normalizedSql, params, (err) => {
          if (err) return reject(err);
          resolve([{ affectedRows: 0 }, []]);
        });
      }
    });
  }

  async end() {
    return new Promise((resolve) => {
      this.db.close(() => resolve());
    });
  }
}

let activePool = null;
let isUsingMySQL = false;
let initPromise = null;

function createMySQLPool() {
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;
  const port = parseInt(process.env.DB_PORT) || 3306;

  if (!host || !user) return null;

  return mysql.createPool({
    host,
    user,
    password,
    database,
    port,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  });
}

function getSQLitePool() {
  const sqliteDbPath = path.join(__dirname, 'database.sqlite');
  console.log(`📁 Using SQLite database at: ${sqliteDbPath}`);
  return new SQLitePoolWrapper(sqliteDbPath);
}

const dbWrapper = {
  async init() {
    if (initPromise) return initPromise;

    initPromise = (async () => {
      const mysqlPool = createMySQLPool();
      if (mysqlPool) {
        try {
          console.log(`🔄 Connection test to MySQL host (${process.env.DB_HOST}:${process.env.DB_PORT || 3306})...`);
          await mysqlPool.execute('SELECT 1');
          console.log('✅ MySQL connection successful!');
          activePool = mysqlPool;
          isUsingMySQL = true;

          await activePool.execute(`
            CREATE TABLE IF NOT EXISTS students (
              id INT AUTO_INCREMENT PRIMARY KEY,
              firebase_uid VARCHAR(255) UNIQUE NOT NULL,
              name VARCHAR(255) NOT NULL,
              roll_number VARCHAR(50) UNIQUE NOT NULL,
              email VARCHAR(255) UNIQUE NOT NULL,
              personalized_skill VARCHAR(255),
              completed_status ENUM('Not Started', 'In Progress', 'Completed') DEFAULT 'Not Started',
              certificate_completion BOOLEAN DEFAULT FALSE,
              reward_points INT DEFAULT 0,
              attendance_percentage DECIMAL(5,2) DEFAULT 0.00,
              cgpa DECIMAL(3,1) DEFAULT 0.0,
              performance_score DECIMAL(5,2) DEFAULT 0.00,
              rank_position INT DEFAULT NULL,
              completed_levels TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
          `).catch(err => console.log('MySQL students table setup:', err.message));

          await activePool.execute(`
            CREATE TABLE IF NOT EXISTS mentors (
              id INT AUTO_INCREMENT PRIMARY KEY,
              firebase_uid VARCHAR(255) UNIQUE NOT NULL,
              name VARCHAR(255) NOT NULL,
              email VARCHAR(255) UNIQUE NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `).catch(err => console.log('MySQL mentors table setup:', err.message));

          await activePool.execute(`
            CREATE TABLE IF NOT EXISTS activity_log (
              id INT AUTO_INCREMENT PRIMARY KEY,
              student_id INT NOT NULL,
              activity_type VARCHAR(100) NOT NULL,
              activity_description TEXT,
              points_earned INT DEFAULT 0,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
            )
          `).catch(err => console.log('MySQL activity_log table setup:', err.message));

          return;
        } catch (err) {
          console.error('⚠️ Remote MySQL connection failed:', err.message);
          console.log('💡 Falling back to embedded SQLite database.');
        }
      }

      activePool = getSQLitePool();
      isUsingMySQL = false;
    })();

    return initPromise;
  },

  async execute(sql, params = []) {
    if (!activePool) {
      await this.init();
    }

    try {
      return await activePool.execute(sql, params);
    } catch (error) {
      if (isUsingMySQL && (error.code === 'PROTOCOL_CONNECTION_LOST' || error.code === 'ECONNRESET' || error.message?.includes('closed'))) {
        console.error('⚠️ MySQL connection lost during query execution. Switching to SQLite database.');
        activePool = getSQLitePool();
        isUsingMySQL = false;
        return await activePool.execute(sql, params);
      }
      throw error;
    }
  },

  async end() {
    if (activePool && activePool.end) {
      await activePool.end();
    }
  },

  isMySQL() {
    return isUsingMySQL;
  }
};

dbWrapper.init().catch(console.error);

module.exports = dbWrapper;
