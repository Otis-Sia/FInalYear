-- MySQL dump 10.13  Distrib 8.0.45, for Linux (x86_64)
--
-- Host: localhost    Database: attendance_system
-- ------------------------------------------------------
-- Server version	8.0.45-0ubuntu0.24.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `attendance_system`
--

/*!40000 DROP DATABASE IF EXISTS `attendance_system`*/;

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `attendance_system` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `attendance_system`;

--
-- Table structure for table `activity_logs`
--

DROP TABLE IF EXISTS `activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `action` varchar(50) NOT NULL,
  `details` text,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_logs`
--

LOCK TABLES `activity_logs` WRITE;
/*!40000 ALTER TABLE `activity_logs` DISABLE KEYS */;
INSERT INTO `activity_logs` VALUES (1,7,'LOGIN','User logged in','2026-02-15 19:42:39'),(2,9,'LOGIN','User logged in','2026-02-15 19:42:59');
/*!40000 ALTER TABLE `activity_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS `attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `session_id` int NOT NULL,
  `student_id` int NOT NULL,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('Present','Late','Absent') DEFAULT 'Present',
  `device_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_attendance` (`session_id`,`student_id`),
  KEY `student_id` (`student_id`),
  KEY `session_id` (`session_id`),
  CONSTRAINT `fk_attendance_session` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_attendance_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance`
--

LOCK TABLES `attendance` WRITE;
/*!40000 ALTER TABLE `attendance` DISABLE KEYS */;
INSERT INTO `attendance` VALUES (1,1,2,'2026-01-01 08:19:22','Present',NULL),(2,9,7,'2026-02-15 18:07:08','Present','DEV-88ZLJJUE-MLO1C7W8');
/*!40000 ALTER TABLE `attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `unit_code` varchar(50) NOT NULL,
  `lecturer_id` int NOT NULL,
  `qr_token` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ended_at` timestamp NULL DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `require_gps` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `unit_code` (`unit_code`),
  KEY `lecturer_id` (`lecturer_id`),
  CONSTRAINT `fk_sessions_lecturer` FOREIGN KEY (`lecturer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES (1,'CCS 401',1,'test_qr_token_123',1,'2026-01-01 08:19:22',NULL,NULL,1),(2,'CC1',5,'32f0199fb365eeb06f898e8fe639e5da',1,'2026-01-01 09:23:44',-1.10185253,37.01322894,1),(3,'CC1',5,'a0a6b0aed3ccb6a64c03e1646928ebda',1,'2026-01-04 12:01:43',-1.10185098,37.01333454,1),(4,'CC1',5,'61ba388284b354d8532fceaf379cf54d',1,'2026-01-04 12:14:53',-1.10223330,37.01359760,1),(5,'Try123',5,'d706d268ac6e05c766fa440eca277cf8',1,'2026-01-04 12:33:05',-1.10172780,37.01364667,1),(6,'Try123',5,'ce41d498f7299a82ce055be35bb6a5ae',1,'2026-01-04 13:11:52',-1.10180593,37.01330978,1),(7,'cre123',6,'39ec67977c2b1e2af73467d50109cfe4',1,'2026-02-15 17:30:18',-1.09445120,37.02128640,1),(8,'cre123',6,'e621e1d4347260a0f2a11a450f745f58',1,'2026-02-15 18:00:43',-1.09445120,37.02128640,1),(9,'cre123',6,'6bc2021d4dc7ac09edd7d1ef9b839f38',1,'2026-02-15 18:06:43',-1.10221790,37.01361740,1);
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `units`
--

DROP TABLE IF EXISTS `units`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `units` (
  `id` int NOT NULL AUTO_INCREMENT,
  `unit_code` varchar(50) NOT NULL,
  `unit_name` varchar(100) NOT NULL,
  `lecturer_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `lecturer_id` (`lecturer_id`),
  CONSTRAINT `fk_units_lecturer` FOREIGN KEY (`lecturer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `units`
--

LOCK TABLES `units` WRITE;
/*!40000 ALTER TABLE `units` DISABLE KEYS */;
INSERT INTO `units` VALUES (1,'CCS 401','Network Security',1),(2,'CCS 302','Database Systems',1),(3,'CC1','Computing12',5),(4,'Try123','Example',5),(5,'cre123','Sia',6);
/*!40000 ALTER TABLE `units` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(50) NOT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `university_id` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('student','lecturer','admin') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'L-001','Dr. Smith',NULL,'smith@university.ac.ke','$2b$10$hashedpasswordplaceholder','lecturer','2026-02-15 16:16:47'),(2,'SCT-001','Ian Mukaramoja',NULL,'ian@student.ac.ke','$2b$10$hashedpasswordplaceholder','student','2026-02-15 16:16:47'),(3,'SCT-002','Jane Doe',NULL,'jane@student.ac.ke','$2b$10$hashedpasswordplaceholder','student','2026-02-15 16:16:47'),(5,'L-005','Unknown Lecturer (ID 5)',NULL,'lecturer5@placeholder.com','placeholder','lecturer','2026-02-15 16:16:47'),(6,'sct 121','Sia Elvis',NULL,NULL,'$2b$10$.XL5/BAXec.tsxj00nyk5O0x9wNK5RioPZqhoAsufq37c8jqiynJ2','lecturer','2026-02-15 17:01:23'),(7,'Jku123','Issa',NULL,NULL,'$2b$10$VVh.feKVYZTK0CZvrASrUu1rZGLnZ1Fbq6YkTJUZcyAgMglXYYlL6','student','2026-02-15 17:42:52'),(8,'ADMIN-001','System Admin',NULL,'admin@university.ac.ke','$2b$10$.PBnAWHFwmgf5Q//aHHGU.NI/XdE2JGFxkYvjmq8T9FCbI.cKX.ku','admin','2026-02-15 18:12:39'),(9,'ADM1','MR Admin',NULL,NULL,'$2b$10$wRIOMbYj.QEaRh.SKpGtyOJt1yIb.G6z4AMZ35uFkqoyyy9.5Wg5W','admin','2026-02-15 18:20:49');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-15 23:11:42
