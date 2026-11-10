const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { DB_PATH, initializeDatabase, updateOfficialRankings } = require('./database/initDb');

let dbInstance = null;

function getDb() {
  if (!dbInstance) {
    dbInstance = new sqlite3.Database(DB_PATH);
    dbInstance.serialize(() => {
      dbInstance.run('PRAGMA foreign_keys = ON;');
      dbInstance.run('PRAGMA journal_mode = WAL;');
      dbInstance.run('PRAGMA busy_timeout = 10000;');
      dbInstance.run('PRAGMA synchronous = NORMAL;');
    });
  }
  return dbInstance;
}

// Convert MySQL-like ? placeholders or SQL dialect quirks if any
function normalizeSql(sql) {
  return sql
    .replace(/CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP/gi, 'CURRENT_TIMESTAMP')
    .replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT');
}

const db = {
  getRawDb() {
    return getDb();
  },

  async init() {
    return initializeDatabase();
  },

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.run(normalizeSql(sql), params, function (err) {
        if (err) return reject(err);
        resolve({
          insertId: this.lastID,
          affectedRows: this.changes,
          lastID: this.lastID,
          changes: this.changes
        });
      });
    });
  },

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.get(normalizeSql(sql), params, (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      });
    });
  },

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.all(normalizeSql(sql), params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
  },

  // Standard execute compatible with [rows] destructuring: const [rows] = await db.execute(...)
  async execute(sql, params = []) {
    const trimmed = sql.trim().toLowerCase();
    if (trimmed.startsWith('select') || trimmed.startsWith('pragma') || trimmed.startsWith('explain')) {
      const rows = await this.all(sql, params);
      return [rows, []];
    } else {
      const result = await this.run(sql, params);
      return [result, []];
    }
  },

  // Standard query compatible with [rows]
  async query(sql, params = []) {
    return this.execute(sql, params);
  },

  // Transaction support for concurrent updates
  async transaction(fn) {
    const rawDb = getDb();
    
    // Acquire exclusive write transaction
    await new Promise((resolve, reject) => {
      rawDb.run('BEGIN IMMEDIATE TRANSACTION;', err => (err ? reject(err) : resolve()));
    });

    const txWrapper = {
      run: (sql, params = []) => {
        return new Promise((resolve, reject) => {
          rawDb.run(normalizeSql(sql), params, function (err) {
            if (err) return reject(err);
            resolve({ insertId: this.lastID, affectedRows: this.changes, lastID: this.lastID, changes: this.changes });
          });
        });
      },
      get: (sql, params = []) => {
        return new Promise((resolve, reject) => {
          rawDb.get(normalizeSql(sql), params, (err, row) => {
            if (err) return reject(err);
            resolve(row || null);
          });
        });
      },
      all: (sql, params = []) => {
        return new Promise((resolve, reject) => {
          rawDb.all(normalizeSql(sql), params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows || []);
          });
        });
      },
      execute: async (sql, params = []) => {
        const trimmed = sql.trim().toLowerCase();
        if (trimmed.startsWith('select') || trimmed.startsWith('pragma')) {
          const rows = await txWrapper.all(sql, params);
          return [rows, []];
        } else {
          const res = await txWrapper.run(sql, params);
          return [res, []];
        }
      }
    };

    try {
      const result = await fn(txWrapper);
      await new Promise((resolve, reject) => {
        rawDb.run('COMMIT;', err => (err ? reject(err) : resolve()));
      });
      return result;
    } catch (err) {
      await new Promise((resolve) => {
        rawDb.run('ROLLBACK;', () => resolve());
      });
      throw err;
    }
  },

  async recalculateRankings() {
    const rawDb = getDb();
    return updateOfficialRankings(rawDb);
  },

  async end() {
    if (dbInstance) {
      return new Promise((resolve) => {
        dbInstance.close(() => {
          dbInstance = null;
          resolve();
        });
      });
    }
  }
};

module.exports = db;
