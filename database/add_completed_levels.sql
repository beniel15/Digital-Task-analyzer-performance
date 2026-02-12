-- Add completed_levels column to students table
ALTER TABLE students 
ADD COLUMN completed_levels VARCHAR(255) DEFAULT '0';
