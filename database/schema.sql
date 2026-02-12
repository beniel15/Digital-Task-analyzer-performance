-- Digital Task Performance Analyzer - Database Schema

-- Create database
CREATE DATABASE IF NOT EXISTS task_performance_db;
USE task_performance_db;

-- Students table
CREATE TABLE students (
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
    performance_score DECIMAL(5,2) DEFAULT 0.00,
    rank_position INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Mentors table
CREATE TABLE mentors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firebase_uid VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('not-started', 'in-progress', 'completed') DEFAULT 'not-started',
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Achievements table (for motivation system)
CREATE TABLE achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    achievement_type VARCHAR(100) NOT NULL,
    achievement_title VARCHAR(255) NOT NULL,
    achievement_description TEXT,
    badge_icon VARCHAR(100),
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Activity log table (track student progress over time)
CREATE TABLE activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    activity_type VARCHAR(100) NOT NULL,
    activity_description TEXT,
    points_earned INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);



-- Indexes for better performance
CREATE INDEX idx_student_firebase_uid ON students(firebase_uid);
CREATE INDEX idx_student_roll_number ON students(roll_number);
CREATE INDEX idx_mentor_firebase_uid ON mentors(firebase_uid);
CREATE INDEX idx_tasks_student_id ON tasks(student_id);
CREATE INDEX idx_achievements_student_id ON achievements(student_id);
CREATE INDEX idx_activity_student_id ON activity_log(student_id);