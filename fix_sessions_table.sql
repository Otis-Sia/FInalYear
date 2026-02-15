-- Fix: Add missing ended_at column to sessions table
USE attendance_system;

ALTER TABLE sessions ADD COLUMN ended_at TIMESTAMP NULL DEFAULT NULL;

-- Verify the change
DESCRIBE sessions;
