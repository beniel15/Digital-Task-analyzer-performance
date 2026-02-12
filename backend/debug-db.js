require('dotenv').config();
const mysql = require('mysql2/promise');

async function debugDB() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: process.env.DB_PASSWORD,
            database: 'task_performance_db'
        });

        console.log('Connected to DB');

        // Get latest activity logs
        const [rows] = await connection.execute(
            `SELECT * FROM activity_log ORDER BY id DESC LIMIT 10`
        );

        console.log('--- Latest 10 Activity Logs ---');
        rows.forEach(r => {
            console.log(`ID: ${r.id}, Student: ${r.student_id}, Type: ${r.activity_type}, Desc: "${r.activity_description}"`);
        });

        // Check specific logic from mentorRoutes
        console.log('\n--- Simulating Mentor Route Logic ---');
        rows.forEach(log => {
            const desc = log.activity_description;
            if (desc.startsWith('Level completed: ')) {
                const prefixLen = "Level completed: ".length;
                const mainPart = desc.substring(prefixLen);
                const parenIndex = mainPart.indexOf(' (');
                const levelName = parenIndex > -1 ? mainPart.substring(0, parenIndex).trim() : mainPart.trim();
                console.log(`Original: "${desc}" -> Extracted: "${levelName}"`);
            } else {
                console.log(`Skipped: "${desc}" (No match)`);
            }
        });

        await connection.end();
    } catch (e) {
        console.error(e);
    }
}

debugDB();
