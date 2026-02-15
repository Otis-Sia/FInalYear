-- =======================================================
-- MERGED DATABASE: attendance_system
-- Sources: databse.sql (Schema/Structure) + attendance_system.sql (Data/Columns)
-- =======================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
SET FOREIGN_KEY_CHECKS = 0; -- Disable FK checks to allow bulk import of potentially incomplete data

-- =======================================================
-- 1. DATABASE SETUP
-- =======================================================
CREATE DATABASE IF NOT EXISTS attendance_system;
USE attendance_system;

-- =======================================================
-- 2. USERS TABLE
-- =======================================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` VARCHAR(50) UNIQUE NOT NULL, -- Admission No or Staff ID
    `full_name` VARCHAR(100) DEFAULT NULL, -- Merged 'name' and 'full_name'
    `university_id` VARCHAR(50) DEFAULT NULL, -- From attendance_system.sql
    `email` VARCHAR(100) UNIQUE DEFAULT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('student', 'lecturer') NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =======================================================
-- 3. UNITS TABLE
-- =======================================================
DROP TABLE IF EXISTS `units`;
CREATE TABLE `units` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `unit_code` VARCHAR(50) NOT NULL,
    `unit_name` VARCHAR(100) NOT NULL,
    `lecturer_id` INT,
    KEY `lecturer_id` (`lecturer_id`),
    CONSTRAINT `fk_units_lecturer` FOREIGN KEY (`lecturer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =======================================================
-- 4. SESSIONS TABLE
-- =======================================================
DROP TABLE IF EXISTS `sessions`;
CREATE TABLE `sessions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `unit_code` VARCHAR(50) NOT NULL, -- Increased length to match Units table
    `lecturer_id` INT NOT NULL,
    `qr_token` VARCHAR(255),
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `latitude` DECIMAL(10,8) DEFAULT NULL,  -- From attendance_system.sql
    `longitude` DECIMAL(11,8) DEFAULT NULL, -- From attendance_system.sql
    KEY `unit_code` (`unit_code`),
    KEY `lecturer_id` (`lecturer_id`),
    CONSTRAINT `fk_sessions_lecturer` FOREIGN KEY (`lecturer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
    -- Note: Removed FK on unit_code to allow sessions for units that might not explicitly exist in 'units' table yet (cleanup flexibility)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =======================================================
-- 5. ATTENDANCE TABLE
-- =======================================================
DROP TABLE IF EXISTS `attendance`;
CREATE TABLE `attendance` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `session_id` INT NOT NULL,
    `student_id` INT NOT NULL,
    `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `status` ENUM('Present', 'Late', 'Absent') DEFAULT 'Present',
    `device_id` VARCHAR(255) DEFAULT NULL, -- From attendance_system.sql
    UNIQUE KEY `unique_attendance` (`session_id`, `student_id`),
    KEY `student_id` (`student_id`),
    KEY `session_id` (`session_id`),
    CONSTRAINT `fk_attendance_session` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_attendance_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =======================================================
-- 6. DATA MIGRATION
-- =======================================================

-- --------------------------------------------------------
-- Users Data
-- --------------------------------------------------------
-- From databse.sql (Seed Data)
INSERT INTO `users` (`id`, `user_id`, `full_name`, `email`, `password`, `role`) VALUES
(NULL, 'L-001', 'Dr. Smith', 'smith@university.ac.ke', '$2b$10$hashedpasswordplaceholder', 'lecturer'),
(NULL, 'SCT-001', 'Ian Mukaramoja', 'ian@student.ac.ke', '$2b$10$hashedpasswordplaceholder', 'student'),
(NULL, 'SCT-002', 'Jane Doe', 'jane@student.ac.ke', '$2b$10$hashedpasswordplaceholder', 'student');

-- From attendance_system.sql (Dump Data)
-- Adjusted columns to match new schema: name -> full_name
INSERT IGNORE INTO `users` (`id`, `user_id`, `full_name`, `university_id`, `email`, `password`, `role`, `created_at`) VALUES
(1, 'S-001', 'Mr Yue', 'JKU12', 'yue@example.com', '$2b$10$rWH4JLZpRNxACMMDSkxEBOq.1yBr7LUK0ikEMRTBDL.s6AZ63xcre', 'student', '2026-01-04 12:51:46');
-- Note: Added dummy 'S-001' user_id and email for Mr Yue as they were empty in the dump but are required UNIQUE fields in the new schema.

-- Placeholder Users to satisfy Foreign Key constraints from the dump data (Lecturer ID 5, Student ID 2)
INSERT IGNORE INTO `users` (`id`, `user_id`, `full_name`, `email`, `password`, `role`) VALUES
(2, 'S-002', 'Unknown Student (ID 2)', 'student2@placeholder.com', 'placeholder', 'student'),
(5, 'L-005', 'Unknown Lecturer (ID 5)', 'lecturer5@placeholder.com', 'placeholder', 'lecturer');


-- --------------------------------------------------------
-- Units Data
-- --------------------------------------------------------
-- From databse.sql
INSERT INTO `units` (`unit_code`, `unit_name`, `lecturer_id`) VALUES
('CCS 401', 'Network Security', (SELECT id FROM users WHERE user_id = 'L-001')),
('CCS 302', 'Database Systems', (SELECT id FROM users WHERE user_id = 'L-001'));

-- From attendance_system.sql
INSERT IGNORE INTO `units` (`id`, `unit_code`, `unit_name`, `lecturer_id`) VALUES
(3, 'CC1', 'Computing12', 5),
(4, 'Try123', 'Example', 5);


-- --------------------------------------------------------
-- Sessions Data
-- --------------------------------------------------------
INSERT IGNORE INTO `sessions` (`id`, `unit_code`, `lecturer_id`, `qr_token`, `is_active`, `created_at`, `latitude`, `longitude`) VALUES
(1, 'CCS 401', 1, 'test_qr_token_123', 1, '2026-01-01 08:19:22', NULL, NULL),
(2, 'CC1', 5, '32f0199fb365eeb06f898e8fe639e5da', 1, '2026-01-01 09:23:44', -1.10185253, 37.01322894),
(3, 'CC1', 5, 'a0a6b0aed3ccb6a64c03e1646928ebda', 1, '2026-01-04 12:01:43', -1.10185098, 37.01333454),
(4, 'CC1', 5, '61ba388284b354d8532fceaf379cf54d', 1, '2026-01-04 12:14:53', -1.10223330, 37.01359760),
(5, 'Try123', 5, 'd706d268ac6e05c766fa440eca277cf8', 1, '2026-01-04 12:33:05', -1.10172780, 37.01364667),
(6, 'Try123', 5, 'ce41d498f7299a82ce055be35bb6a5ae', 1, '2026-01-04 13:11:52', -1.10180593, 37.01330978);


-- --------------------------------------------------------
-- Attendance Data
-- --------------------------------------------------------
INSERT IGNORE INTO `attendance` (`id`, `session_id`, `student_id`, `timestamp`, `status`, `device_id`) VALUES
(1, 1, 2, '2026-01-01 08:19:22', 'Present', NULL);


SET FOREIGN_KEY_CHECKS = 1;
COMMIT;
