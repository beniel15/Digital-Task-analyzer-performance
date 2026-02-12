const mysql = require('mysql2/promise');

async function testDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'task_performance_db'
    });

    const [students] = await connection.execute('SELECT id, name, roll_number, completed_levels, personalized_skill, reward_points FROM students LIMIT 3');
    console.log('Students in database:');
    console.table(students);
    
    await connection.end();
  } catch (error) {
    console.error('Database error:', error);
  }
}

testDatabase();
