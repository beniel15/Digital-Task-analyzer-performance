    const mysql = require("mysql2");
const fs = require("fs");

// Connect to Railway MySQL using the environment variable
const connection = mysql.createConnection(process.env.DATABASE_URL);

// Read your .sql file
const sql = fs.readFileSync("db/backup.sql", "utf8");

// Execute SQL commands
connection.query(sql, (err, result) => {
  if (err) {
    console.error("Error importing SQL:", err);
  } else {
    console.log("SQL imported successfully!");
  }
  connection.end();
});