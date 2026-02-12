require('dotenv').config();
const mysql = require('mysql2/promise');

async function createTable() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        console.log('✅ DB Connected');

        const sql = `
    CREATE TABLE IF NOT EXISTS activity_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        activity_type VARCHAR(100) NOT NULL,
        activity_description TEXT,
        points_earned INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );
    `;

        await connection.execute(sql);
        console.log('✅ activity_log table created successfully');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        if (connection) await connection.end();
    }
}

createTable();
