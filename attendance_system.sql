-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Jan 12, 2026 at 07:57 PM
-- Server version: 8.2.0
-- PHP Version: 8.2.13

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `attendance_system`
--

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS `attendance`;
CREATE TABLE IF NOT EXISTS `attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `session_id` int NOT NULL,
  `student_id` int NOT NULL,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('Present','Late','Absent') DEFAULT 'Present',
  `device_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_attendance` (`session_id`,`student_id`),
  KEY `student_id` (`student_id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `attendance`
--

INSERT INTO `attendance` (`id`, `session_id`, `student_id`, `timestamp`, `status`, `device_id`) VALUES
(1, 1, 2, '2026-01-01 08:19:22', 'Present', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `unit_code` varchar(20) NOT NULL,
  `lecturer_id` int NOT NULL,
  `qr_token` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `unit_code` (`unit_code`),
  KEY `lecturer_id` (`lecturer_id`)
) ENGINE=MyISAM AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`id`, `unit_code`, `lecturer_id`, `qr_token`, `is_active`, `created_at`, `latitude`, `longitude`) VALUES
(1, 'CCS 401', 1, 'test_qr_token_123', 1, '2026-01-01 08:19:22', NULL, NULL),
(2, 'CC1', 5, '32f0199fb365eeb06f898e8fe639e5da', 1, '2026-01-01 09:23:44', -1.10185253, 37.01322894),
(3, 'CC1', 5, 'a0a6b0aed3ccb6a64c03e1646928ebda', 1, '2026-01-04 12:01:43', -1.10185098, 37.01333454),
(4, 'CC1', 5, '61ba388284b354d8532fceaf379cf54d', 1, '2026-01-04 12:14:53', -1.10223330, 37.01359760),
(5, 'Try123', 5, 'd706d268ac6e05c766fa440eca277cf8', 1, '2026-01-04 12:33:05', -1.10172780, 37.01364667),
(6, 'Try123', 5, 'ce41d498f7299a82ce055be35bb6a5ae', 1, '2026-01-04 13:11:52', -1.10180593, 37.01330978);

-- --------------------------------------------------------

--
-- Table structure for table `units`
--

DROP TABLE IF EXISTS `units`;
CREATE TABLE IF NOT EXISTS `units` (
  `id` int NOT NULL AUTO_INCREMENT,
  `unit_code` varchar(50) NOT NULL,
  `unit_name` varchar(100) NOT NULL,
  `lecturer_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `lecturer_id` (`lecturer_id`)
) ENGINE=MyISAM AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `units`
--

INSERT INTO `units` (`id`, `unit_code`, `unit_name`, `lecturer_id`) VALUES
(1, 'CCS 401', 'Network Security', 1),
(2, 'CCS 302', 'Database Systems', 1),
(3, 'CC1', 'Computing12', 5),
(4, 'Try123', 'Example', 5);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(50) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `university_id` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('student','lecturer') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `user_id`, `name`, `university_id`, `email`, `password`, `role`, `created_at`) VALUES
(1, '', 'Mr Yue', 'JKU12', '', '$2b$10$rWH4JLZpRNxACMMDSkxEBOq.1yBr7LUK0ikEMRTBDL.s6AZ63xcre', 'student', '2026-01-04 12:51:46');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
