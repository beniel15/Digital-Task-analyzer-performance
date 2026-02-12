require('dotenv').config();
const mysql = require('mysql2/promise');

async function debugUpdate() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        console.log('✅ DB Connected');

        // 1. List all students to see valid roll numbers
        const [allStudents] = await connection.execute('SELECT id, name, roll_number, personalized_skill FROM students LIMIT 5');
        console.log('📋 First 5 students:', allStudents);

        if (allStudents.length === 0) {
            console.log('⚠️ No students found in DB.');
            return;
        }

        const testRollNo = allStudents[0].roll_number;
        console.log(`🔍 Testing update for Roll No: '${testRollNo}'`);

        // 2. Try to find by roll number (exact match)
        const [students] = await connection.execute(
            'SELECT id, reward_points FROM students WHERE roll_number = ?',
            [testRollNo]
        );

        if (students.length === 0) {
            console.log('❌ Could not find student by roll number even though I just read it from DB!');
        } else {
            console.log('✅ Found student by roll number:', students[0]);

            // 3. Try Update
            const student_id = students[0].id;
            const newPoints = (students[0].reward_points || 0) + 10;

            await connection.execute(
                'UPDATE students SET reward_points = ?, personalized_skill = ? WHERE id = ?',
                [newPoints, 'Debug Level', student_id]
            );
            console.log('✅ Update query executed successfully');
        }

    } catch (err) {
        console.error('❌ Error during debug:', err);
    } finally {
        if (connection) await connection.end();
    }
}

debugUpdate();
