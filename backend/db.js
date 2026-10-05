const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DATA_FILE = path.join(__dirname, 'data_store.json');

const INITIAL_STUDENTS = [];

class PureJSDatabase {
  constructor() {
    this.data = {
      students: [],
      mentors: [],
      activity_log: []
    };
    this.nextId = { students: 1, mentors: 1, activity_log: 1 };
    this.loadData();
  }

  loadData() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed.students) {
          parsed.students = (parsed.students || []).filter(s =>
            !['CS2024001', 'CS2024002', 'CS2024003', 'CS2024004', 'C_ROLL_101'].includes(s.roll_number) &&
            !['Alex Johnson', 'Sarah Smith', 'Michael Brown', 'Emily Davis', 'Test Student C'].includes(s.name)
          );
          this.data = parsed;
          this.updateNextIds();
          this.saveData();
          return;
        }
      }
    } catch (e) {
      console.error('Error loading JSON store:', e.message);
    }
    
    this.data.students = [];
    this.updateNextIds();
    this.saveData();
  }

  updateNextIds() {
    for (const key of ['students', 'mentors', 'activity_log']) {
      const items = this.data[key] || [];
      const maxId = items.reduce((max, item) => Math.max(max, item.id || 0), 0);
      this.nextId[key] = maxId + 1;
    }
  }

  saveData() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2));
    } catch (e) {
      // Ephemeral disk safety
    }
  }

  execute(sql, params = []) {
    return new Promise((resolve) => {
      const query = sql.trim();
      const lowerQuery = query.toLowerCase();

      // 1. SELECT 1 (test-db)
      if (lowerQuery === 'select 1') {
        return resolve([[{ 1: 1 }], []]);
      }

      // 2. CREATE TABLE
      if (lowerQuery.startsWith('create table')) {
        return resolve([{ affectedRows: 0 }, []]);
      }

      // 3. SELECT AVG(reward_points) as avg_points FROM students
      if (lowerQuery.includes('avg(reward_points)')) {
        const students = this.data.students || [];
        const sum = students.reduce((acc, s) => acc + (Number(s.reward_points) || 0), 0);
        const avg = students.length > 0 ? sum / students.length : 0;
        return resolve([[{ avg_points: avg }], []]);
      }

      // 4. SELECT queries
      if (lowerQuery.startsWith('select')) {
        let tableName = 'students';
        if (lowerQuery.includes('from mentors')) tableName = 'mentors';
        else if (lowerQuery.includes('from activity_log')) tableName = 'activity_log';

        let rows = [...(this.data[tableName] || [])];

        if (lowerQuery.includes('where firebase_uid = ?')) {
          const uid = params[0];
          rows = rows.filter(r => r.firebase_uid === uid);
        } else if (lowerQuery.includes('where roll_number = ?')) {
          const roll = params[0];
          rows = rows.filter(r => r.roll_number === roll);
        } else if (lowerQuery.includes('replace(roll_number')) {
          const target = (params[0] || '').toString().toLowerCase().replace(/\s+/g, '');
          rows = rows.filter(r => (r.roll_number || '').toString().toLowerCase().replace(/\s+/g, '') === target);
        } else if (lowerQuery.includes('where email = ?')) {
          const email = params[0];
          rows = rows.filter(r => r.email === email);
        } else if (lowerQuery.includes('where id = ?')) {
          const id = Number(params[0]);
          rows = rows.filter(r => r.id === id);
        } else if (lowerQuery.includes('where student_id = ?')) {
          const sid = Number(params[0]);
          rows = rows.filter(r => r.student_id === sid);
        }

        if (lowerQuery.includes('order by reward_points desc')) {
          rows.sort((a, b) => (b.reward_points || 0) - (a.reward_points || 0));
        } else if (lowerQuery.includes('order by id desc')) {
          rows.sort((a, b) => (b.id || 0) - (a.id || 0));
        }

        if (lowerQuery.includes('limit 1')) {
          rows = rows.slice(0, 1);
        } else if (lowerQuery.includes('limit 5')) {
          rows = rows.slice(0, 5);
        } else if (lowerQuery.includes('limit 10')) {
          rows = rows.slice(0, 10);
        } else if (lowerQuery.includes('limit 20')) {
          rows = rows.slice(0, 20);
        }

        if (tableName === 'students' && !lowerQuery.includes('where')) {
          rows = rows.map((s, idx) => ({
            ...s,
            rank_position: idx + 1
          }));
        }

        return resolve([rows, []]);
      }

      // 5. INSERT queries
      if (lowerQuery.startsWith('insert into')) {
        let tableName = 'students';
        if (lowerQuery.includes('into mentors')) tableName = 'mentors';
        else if (lowerQuery.includes('into activity_log')) tableName = 'activity_log';

        const newId = this.nextId[tableName]++;
        let newItem = { id: newId, created_at: new Date().toISOString() };

        if (tableName === 'students') {
          if (params.length === 3) {
            newItem = {
              id: newId,
              firebase_uid: params[0],
              name: params[1],
              email: params[2],
              roll_number: 'ROLL_' + newId,
              reward_points: 0,
              attendance_percentage: 0,
              cgpa: 0,
              performance_score: 0,
              created_at: new Date().toISOString()
            };
          } else {
            newItem = {
              id: newId,
              firebase_uid: params[0],
              name: params[1],
              roll_number: params[2],
              email: params[3],
              personalized_skill: params[4] || 'General Programming',
              completed_status: params[5] || 'Not Started',
              certificate_completion: params[6] ? 1 : 0,
              reward_points: Number(params[7]) || 0,
              attendance_percentage: Number(params[8]) || 0,
              cgpa: Number(params[9]) || 0.0,
              performance_score: Number(params[10]) || 0.0,
              rank_position: params[11] || null,
              created_at: new Date().toISOString()
            };
          }
        } else if (tableName === 'mentors') {
          newItem = {
            id: newId,
            firebase_uid: params[0],
            name: params[1],
            email: params[2],
            created_at: new Date().toISOString()
          };
        } else if (tableName === 'activity_log') {
          newItem = {
            id: newId,
            student_id: Number(params[0]),
            activity_type: params[1],
            activity_description: params[2],
            points_earned: Number(params[3]) || 0,
            created_at: new Date().toISOString()
          };
        }

        this.data[tableName].push(newItem);
        this.saveData();

        return resolve([{ insertId: newId, affectedRows: 1 }, []]);
      }

      // 6. UPDATE queries
      if (lowerQuery.startsWith('update students')) {
        const id = Number(params[params.length - 1]);
        const student = this.data.students.find(s => s.id === id);

        if (student) {
          const setMatch = query.match(/SET\s+(.+?)\s+WHERE/i);
          if (setMatch) {
            const setAssignments = setMatch[1].split(',').map(s => s.trim());
            let paramIdx = 0;

            for (const assign of setAssignments) {
              const colMatch = assign.match(/^([a-z0-9_]+)\s*=/i);
              if (colMatch) {
                const colName = colMatch[1].toLowerCase();
                if (assign.toLowerCase().includes('reward_points + 50')) {
                  student.reward_points = (student.reward_points || 0) + 50;
                  student.certificate_completion = 1;
                } else if (assign.toLowerCase().includes('current_timestamp')) {
                  student.updated_at = new Date().toISOString();
                } else if (paramIdx < params.length - 1) {
                  const val = params[paramIdx++];
                  if (colName === 'reward_points' || colName === 'performance_score') {
                    student[colName] = Number(val) || 0;
                  } else if (colName === 'attendance_percentage' || colName === 'cgpa') {
                    student[colName] = Number(val) || 0;
                  } else {
                    student[colName] = val;
                  }
                }
              }
            }
          }

          student.updated_at = new Date().toISOString();
          this.saveData();
          return resolve([{ affectedRows: 1 }, []]);
        }

        return resolve([{ affectedRows: 0 }, []]);
      }

      // 7. DELETE queries
      if (lowerQuery.startsWith('delete from students')) {
        const id = Number(params[0]);
        const initCount = this.data.students.length;
        this.data.students = this.data.students.filter(s => s.id !== id);
        this.saveData();
        const affected = initCount - this.data.students.length;
        return resolve([{ affectedRows: affected }, []]);
      }

      return resolve([{ affectedRows: 0 }, []]);
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
          `).catch(err => console.log('MySQL students setup note:', err.message));

          await activePool.execute(`
            CREATE TABLE IF NOT EXISTS mentors (
              id INT AUTO_INCREMENT PRIMARY KEY,
              firebase_uid VARCHAR(255) UNIQUE NOT NULL,
              name VARCHAR(255) NOT NULL,
              email VARCHAR(255) UNIQUE NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `).catch(err => console.log('MySQL mentors setup note:', err.message));

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
          `).catch(err => console.log('MySQL activity_log setup note:', err.message));

          return;
        } catch (err) {
          console.error('⚠️ Remote MySQL connection failed:', err.message);
          console.log('💡 Falling back to pure JavaScript database engine.');
        }
      }

      console.log('📁 Using Pure JS Database Engine.');
      activePool = new PureJSDatabase();
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
        console.error('⚠️ MySQL connection lost during query execution. Switching to Pure JS engine.');
        activePool = new PureJSDatabase();
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
