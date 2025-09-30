-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: ispsc_tagudin_dms_2
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `action_required`
--

DROP TABLE IF EXISTS `action_required`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `action_required` (
  `action_id` int(11) NOT NULL AUTO_INCREMENT,
  `action_name` varchar(255) NOT NULL,
  `action_description` text DEFAULT NULL,
  `action_category` enum('decision','communication','document_management','administrative','custom') DEFAULT 'custom',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`action_id`),
  KEY `idx_action_category` (`action_category`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_created_by` (`created_by`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `action_required`
--

LOCK TABLES `action_required` WRITE;
/*!40000 ALTER TABLE `action_required` DISABLE KEYS */;
INSERT INTO `action_required` VALUES (1,'Appropriate Action','Take appropriate action based on document content','decision',1,'2024-12-31 16:00:00','2024-12-31 16:00:00',1),(2,'Study/Information','Study the document for information purposes','decision',1,'2024-12-31 16:00:00','2024-12-31 16:00:00',1),(3,'Signature','Document requires signature','decision',1,'2024-12-31 16:00:00','2024-12-31 16:00:00',1),(4,'Clearance/Approval','Document requires clearance or approval','decision',1,'2024-12-31 16:00:00','2024-12-31 16:00:00',1),(5,'Comments/Feedback','Provide comments or feedback on the document','communication',1,'2024-12-31 16:00:00','2024-12-31 16:00:00',1),(6,'Reply','Reply to the document or sender','communication',1,'2024-12-31 16:00:00','2024-12-31 16:00:00',1),(7,'Take up with me','Discuss the document in person','communication',1,'2024-12-31 16:00:00','2024-12-31 16:00:00',1),(8,'File','File the document for record keeping','document_management',1,'2024-12-31 16:00:00','2024-12-31 16:00:00',1),(9,'Return','Return the document to sender','document_management',1,'2024-12-31 16:00:00','2024-12-31 16:00:00',1),(10,'Submit Report','Submit a report based on the document','document_management',1,'2024-12-31 16:00:00','2024-12-31 16:00:00',1),(11,'Submit CSW','Submit CSW (Complete Staff Work)','document_management',1,'2024-12-31 16:00:00','2024-12-31 16:00:00',1),(12,'Attendance','Mark attendance or participation','administrative',1,'2024-12-31 16:00:00','2024-12-31 16:00:00',1),(13,'Review','Review the document thoroughly','decision',1,'2024-12-31 16:00:00','2024-12-31 16:00:00',1),(14,'Prepare Memo/Special','Prepare a memo or special order','document_management',1,'2024-12-31 16:00:00','2024-12-31 16:00:00',1),(15,'Order/Office Order','Issue an order or office order','document_management',1,'2024-12-31 16:00:00','2024-12-31 16:00:00',1),(16,'Representation','Handle representation on behalf of','administrative',1,'2024-12-31 16:00:00','2024-12-31 16:00:00',1);
/*!40000 ALTER TABLE `action_required` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `announcement_departments`
--

DROP TABLE IF EXISTS `announcement_departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `announcement_departments` (
  `announcement_id` int(11) NOT NULL,
  `department_id` int(11) NOT NULL,
  PRIMARY KEY (`announcement_id`,`department_id`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `announcement_departments_ibfk_announcement` FOREIGN KEY (`announcement_id`) REFERENCES `announcements` (`announcement_id`) ON DELETE CASCADE,
  CONSTRAINT `announcement_departments_ibfk_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcement_departments`
--

LOCK TABLES `announcement_departments` WRITE;
/*!40000 ALTER TABLE `announcement_departments` DISABLE KEYS */;
INSERT INTO `announcement_departments` VALUES (13,1),(16,1);
/*!40000 ALTER TABLE `announcement_departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `announcement_roles`
--

DROP TABLE IF EXISTS `announcement_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `announcement_roles` (
  `announcement_id` int(11) NOT NULL,
  `role` enum('ADMIN','DEAN','FACULTY') NOT NULL,
  PRIMARY KEY (`announcement_id`,`role`),
  KEY `role` (`role`),
  CONSTRAINT `announcement_roles_ibfk_announcement` FOREIGN KEY (`announcement_id`) REFERENCES `announcements` (`announcement_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcement_roles`
--

LOCK TABLES `announcement_roles` WRITE;
/*!40000 ALTER TABLE `announcement_roles` DISABLE KEYS */;
INSERT INTO `announcement_roles` VALUES (13,'FACULTY');
/*!40000 ALTER TABLE `announcement_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `announcement_users`
--

DROP TABLE IF EXISTS `announcement_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `announcement_users` (
  `announcement_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  PRIMARY KEY (`announcement_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `announcement_users_ibfk_announcement` FOREIGN KEY (`announcement_id`) REFERENCES `announcements` (`announcement_id`) ON DELETE CASCADE,
  CONSTRAINT `announcement_users_ibfk_user` FOREIGN KEY (`user_id`) REFERENCES `dms_user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcement_users`
--

LOCK TABLES `announcement_users` WRITE;
/*!40000 ALTER TABLE `announcement_users` DISABLE KEYS */;
/*!40000 ALTER TABLE `announcement_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `announcements`
--

DROP TABLE IF EXISTS `announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `announcements` (
  `announcement_id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `visible_to_all` tinyint(1) DEFAULT 1,
  `status` enum('draft','scheduled','published','archived') DEFAULT 'draft',
  `publish_at` datetime DEFAULT NULL,
  `expire_at` datetime DEFAULT NULL,
  `created_by_name` varchar(150) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`announcement_id`),
  KEY `idx_status` (`status`),
  KEY `idx_publish_at` (`publish_at`),
  KEY `idx_expire_at` (`expire_at`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcements`
--

LOCK TABLES `announcements` WRITE;
/*!40000 ALTER TABLE `announcements` DISABLE KEYS */;
INSERT INTO `announcements` VALUES (11,'ALL MEMBERS','TEST 1',1,'published','2025-09-07 09:15:50',NULL,'ADMIN LAN','2025-09-07 09:15:50','2025-09-07 09:15:50'),(12,'ALL','ADS',1,'published','2025-09-07 10:09:55',NULL,'ADMIN LAN','2025-09-07 10:09:55','2025-09-07 10:09:55'),(13,'again','kj',0,'published','2025-09-07 10:12:18',NULL,'ADMIN LAN','2025-09-07 10:12:18','2025-09-07 10:12:18'),(14,'wqe','qew',1,'published','2025-09-07 11:56:47',NULL,'ADMIN LAN','2025-09-07 11:56:47','2025-09-07 11:56:47'),(15,'das','das',1,'published','2025-09-07 11:58:19',NULL,'ADMIN LAN','2025-09-07 11:58:19','2025-09-07 11:58:19'),(16,'das','sdadasdsa',0,'published','2025-09-07 12:01:44',NULL,'ADMIN LAN','2025-09-07 12:01:44','2025-09-07 12:01:44'),(17,'das','ds',1,'published','2025-09-07 12:02:03',NULL,'ADMIN LAN','2025-09-07 12:02:03','2025-09-07 12:02:03');
/*!40000 ALTER TABLE `announcements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `departments` (
  `department_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`department_id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'College of Arts and Sciences','CAS',1),(2,'College of Management and Business Economics','CMBE',1),(3,'College of Teacher Education','CTE',1),(4,'Laboratory High School','LHS',1),(5,'Non-Teaching Personnel','NON-TEACHING',1),(6,'Graduate School','GRADUATE SCHOOL',1),(7,'Student Council','STUDENT COUNCIL',1);
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dms_documents`
--

DROP TABLE IF EXISTS `dms_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dms_documents` (
  `doc_id` int(11) NOT NULL AUTO_INCREMENT,
  `doc_type` int(11) NOT NULL,
  `folder_id` int(11) DEFAULT NULL,
  `reference` varchar(255) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `revision` varchar(50) DEFAULT NULL,
  `rev_date` date DEFAULT NULL,
  `from_field` varchar(255) DEFAULT NULL,
  `to_field` varchar(255) DEFAULT NULL,
  `date_received` date DEFAULT NULL,
  `google_drive_link` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `available_copy` enum('hard_copy','soft_copy','both') DEFAULT 'soft_copy',
  `received_by` varchar(255) DEFAULT NULL,
  `received_by_user_id` int(11) DEFAULT NULL,
  `visible_to_all` tinyint(1) DEFAULT 1,
  `status` enum('active','inactive','pending','deleted') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by_name` varchar(150) DEFAULT NULL,
  `deleted` tinyint(1) DEFAULT 0,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by_name` varchar(150) DEFAULT NULL,
  `restored_at` datetime DEFAULT NULL,
  `restored_by_name` varchar(150) DEFAULT NULL,
  `is_reply_to_doc_id` int(11) DEFAULT NULL,
  `reply_type` varchar(50) DEFAULT NULL,
  `created_by_user_id` int(11) DEFAULT NULL,
  `visibility` enum('ALL','DEPARTMENT','SPECIFIC_USERS','SPECIFIC_ROLES','ROLE_DEPARTMENT') DEFAULT 'ALL',
  `target_users` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`target_users`)),
  `target_roles` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`target_roles`)),
  `target_role_dept` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`target_role_dept`)),
  PRIMARY KEY (`doc_id`),
  KEY `idx_doc_type` (`doc_type`),
  KEY `idx_title` (`title`),
  KEY `idx_available_copy` (`available_copy`),
  KEY `idx_received_by_user_id` (`received_by_user_id`),
  KEY `idx_visible_to_all` (`visible_to_all`),
  KEY `idx_status` (`status`),
  KEY `idx_deleted` (`deleted`),
  KEY `idx_deleted_at` (`deleted_at`),
  KEY `idx_deleted_by_name` (`deleted_by_name`),
  KEY `dms_documents_ibfk_reply` (`is_reply_to_doc_id`),
  KEY `idx_folder_id` (`folder_id`),
  KEY `dms_documents_ibfk_created_by` (`created_by_user_id`),
  CONSTRAINT `dms_documents_ibfk_created_by` FOREIGN KEY (`created_by_user_id`) REFERENCES `dms_user` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `dms_documents_ibfk_doc_type` FOREIGN KEY (`doc_type`) REFERENCES `document_types` (`type_id`),
  CONSTRAINT `dms_documents_ibfk_folder` FOREIGN KEY (`folder_id`) REFERENCES `folders` (`folder_id`) ON DELETE SET NULL,
  CONSTRAINT `dms_documents_ibfk_received_by` FOREIGN KEY (`received_by_user_id`) REFERENCES `dms_user` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `dms_documents_ibfk_reply` FOREIGN KEY (`is_reply_to_doc_id`) REFERENCES `dms_documents` (`doc_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dms_documents`
--

LOCK TABLES `dms_documents` WRITE;
/*!40000 ALTER TABLE `dms_documents` DISABLE KEYS */;
INSERT INTO `dms_documents` VALUES (20,1,1,'d','cas f',NULL,NULL,'sas','ss','2025-09-09','https://drive.google.com/file/d/1sHWFkiTEDJgGdxDkE0h08jJRwLbZzViw/view?usp=drive_link',NULL,'both',NULL,NULL,0,'active','2025-09-09 11:18:51','2025-09-09 11:18:51','Pol andrei Bulong',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ALL',NULL,NULL,NULL),(21,1,2,'ads','asd',NULL,NULL,'asd','das','2025-09-10','https://drive.google.com/file/d/1fIFyhCNKa7RlJXBKpYyyEcvDnzZv628Z/view?usp=drive_link',NULL,'soft_copy',NULL,NULL,1,'active','2025-09-10 10:02:10','2025-09-14 09:51:25','Pol andrei Bulong',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ALL',NULL,NULL,NULL),(22,1,2,'sad','teesy','2','2025-09-13','sa','dsa','2025-09-13','https://drive.google.com/file/d/13FjgznnFxV0QlhI44Yvu5F6aaU2dSvGd/view?usp=drive_link','sdasdasdasdsad','both',NULL,NULL,1,'active','2025-09-12 21:01:29','2025-09-14 09:53:47','Pol andrei Bulong',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ALL',NULL,NULL,NULL),(23,1,2,'WQEQ','TEST 1',NULL,NULL,'QE','QEW','2025-09-14','https://drive.google.com/file/d/1pMcDBaiJapuj6olKSSLhRHyOQvPwB20R/view?usp=drive_link',NULL,'both',NULL,NULL,1,'active','2025-09-14 08:47:17','2025-09-14 11:12:20','Pol andrei Bulong',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ALL',NULL,NULL,NULL);
/*!40000 ALTER TABLE `dms_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dms_user`
--

DROP TABLE IF EXISTS `dms_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dms_user` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `profile_pic` longtext DEFAULT NULL,
  `user_email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `Username` varchar(100) NOT NULL,
  `firstname` varchar(100) NOT NULL,
  `lastname` varchar(100) NOT NULL,
  `Contact_number` varchar(20) DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  `role` enum('ADMIN','DEAN','FACULTY') DEFAULT 'FACULTY',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `status` enum('active','inactive','banned','pending','deleted') DEFAULT 'pending',
  `is_verified` enum('yes','no') DEFAULT 'no',
  `verification_token` varchar(255) DEFAULT NULL,
  `verification_code` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  KEY `dms_user_ibfk_department` (`department_id`),
  CONSTRAINT `dms_user_ibfk_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dms_user`
--

LOCK TABLES `dms_user` WRITE;
/*!40000 ALTER TABLE `dms_user` DISABLE KEYS */;
INSERT INTO `dms_user` VALUES (1,'https://lh3.googleusercontent.com/a/ACg8ocIhpD_184y_Edc-9RJod2dRMKXfsKksA7Z1AKaWM-5lc7srqUFH=s96-c','polandreiladera03@gmail.com','','Pol andrei Bulong','ADMIN LAN','LAN','09184226099',1,'ADMIN','2025-09-07 03:34:43','2025-09-12 20:36:31','active','yes',NULL,NULL),(3,'https://lh3.googleusercontent.com/a/ACg8ocLCtLZz7Zmt471wn_Ox2BYg5YUHStURu5kczNi_W3goIXHxvHw=s96-c','laderasanjuan03@gmail.com','','Levv1','','','',2,'DEAN','2025-09-07 03:42:46','2025-09-14 05:20:08','active','yes',NULL,NULL),(4,'https://lh3.googleusercontent.com/a/ACg8ocLV-XDgqUWjRyS9kVC_pJNkjOG7n6LJVcVeD7mWS9FDJ30CerUs=s96-c','mainlan03@gmail.com','','Admin Lan','','','',1,'FACULTY','2025-09-07 03:43:13','2025-09-11 05:14:23','deleted','yes',NULL,NULL),(7,NULL,'polsanjuanladera03@gmail.com','$2b$12$U5lxEjzAEJFbR1XKOuc/A.iypaqAktYmbS.pCuyDCalaeb0.S.Sgi','aaa','A','aa','09184226085',1,'FACULTY','2025-09-11 04:39:19','2025-09-11 05:13:51','deleted','yes',NULL,NULL),(8,NULL,'victoriyaklauss03@gmail.com','$2b$12$JIucxsMFcG0DfaFR.FbwpOK1Xj7uwfTcSJhFaaC9aE56J3zZGeEhW','212121','21','21','09184226085',2,'FACULTY','2025-09-11 05:15:09','2025-09-11 05:15:44','active','yes',NULL,NULL);
/*!40000 ALTER TABLE `dms_user` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `set_first_user_as_admin` BEFORE INSERT ON `dms_user` FOR EACH ROW BEGIN
    DECLARE user_count INT DEFAULT 0;
    
    -- Check if this is the first user being created
    SELECT COUNT(*) INTO user_count FROM dms_user;
    
    -- If this is the first user (user_count = 0), make them ADMIN
    IF user_count = 0 THEN
        SET NEW.role = 'ADMIN';
        SET NEW.is_verified = 'yes';
        SET NEW.status = 'active';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `set_initial_user_status` BEFORE INSERT ON `dms_user` FOR EACH ROW BEGIN
    IF NEW.is_verified = 'yes' THEN
        SET NEW.status = 'active';
    ELSE
        SET NEW.status = 'pending';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `update_user_status_on_verification` BEFORE UPDATE ON `dms_user` FOR EACH ROW BEGIN
    -- Only update status if is_verified is being changed and status is not being explicitly set
    IF NEW.is_verified != OLD.is_verified THEN
        IF NEW.is_verified = 'yes' AND OLD.is_verified = 'no' THEN
            SET NEW.status = 'active';
        ELSEIF NEW.is_verified = 'no' AND OLD.is_verified = 'yes' THEN
            SET NEW.status = 'pending';
        END IF;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `document_actions`
--

DROP TABLE IF EXISTS `document_actions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `document_actions` (
  `document_action_id` int(11) NOT NULL AUTO_INCREMENT,
  `doc_id` int(11) NOT NULL,
  `action_id` int(11) NOT NULL,
  `assigned_to_user_id` int(11) DEFAULT NULL,
  `assigned_to_role` enum('ADMIN','DEAN','FACULTY') DEFAULT NULL,
  `assigned_to_department_id` int(11) DEFAULT NULL,
  `status` enum('pending','in_progress','completed','cancelled') DEFAULT 'pending',
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `due_date` date DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `completed_by_user_id` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by_user_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`document_action_id`),
  KEY `idx_doc_id` (`doc_id`),
  KEY `idx_action_id` (`action_id`),
  KEY `idx_assigned_to_user_id` (`assigned_to_user_id`),
  KEY `idx_assigned_to_role` (`assigned_to_role`),
  KEY `idx_assigned_to_department_id` (`assigned_to_department_id`),
  KEY `idx_status` (`status`),
  KEY `idx_priority` (`priority`),
  KEY `idx_due_date` (`due_date`),
  KEY `idx_completed_by_user_id` (`completed_by_user_id`),
  KEY `idx_created_by_user_id` (`created_by_user_id`),
  CONSTRAINT `document_actions_ibfk_action` FOREIGN KEY (`action_id`) REFERENCES `action_required` (`action_id`) ON DELETE CASCADE,
  CONSTRAINT `document_actions_ibfk_assigned_department` FOREIGN KEY (`assigned_to_department_id`) REFERENCES `departments` (`department_id`) ON DELETE SET NULL,
  CONSTRAINT `document_actions_ibfk_assigned_user` FOREIGN KEY (`assigned_to_user_id`) REFERENCES `dms_user` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `document_actions_ibfk_completed_by` FOREIGN KEY (`completed_by_user_id`) REFERENCES `dms_user` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `document_actions_ibfk_created_by` FOREIGN KEY (`created_by_user_id`) REFERENCES `dms_user` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `document_actions_ibfk_doc` FOREIGN KEY (`doc_id`) REFERENCES `dms_documents` (`doc_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_actions`
--

LOCK TABLES `document_actions` WRITE;
/*!40000 ALTER TABLE `document_actions` DISABLE KEYS */;
INSERT INTO `document_actions` VALUES (7,20,9,NULL,NULL,NULL,'pending','medium',NULL,NULL,NULL,NULL,'2025-09-09 11:18:51','2025-09-09 11:18:51',1);
/*!40000 ALTER TABLE `document_actions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_departments`
--

DROP TABLE IF EXISTS `document_departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `document_departments` (
  `doc_id` int(11) NOT NULL,
  `department_id` int(11) NOT NULL,
  KEY `document_departments_ibfk_doc` (`doc_id`),
  KEY `document_departments_ibfk_department` (`department_id`),
  CONSTRAINT `document_departments_ibfk_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`) ON DELETE CASCADE,
  CONSTRAINT `document_departments_ibfk_doc` FOREIGN KEY (`doc_id`) REFERENCES `dms_documents` (`doc_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_departments`
--

LOCK TABLES `document_departments` WRITE;
/*!40000 ALTER TABLE `document_departments` DISABLE KEYS */;
/*!40000 ALTER TABLE `document_departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_roles`
--

DROP TABLE IF EXISTS `document_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `document_roles` (
  `doc_id` int(11) NOT NULL,
  `role` enum('ADMIN','DEAN','FACULTY') NOT NULL,
  KEY `document_roles_ibfk_doc` (`doc_id`),
  CONSTRAINT `document_roles_ibfk_doc` FOREIGN KEY (`doc_id`) REFERENCES `dms_documents` (`doc_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_roles`
--

LOCK TABLES `document_roles` WRITE;
/*!40000 ALTER TABLE `document_roles` DISABLE KEYS */;
/*!40000 ALTER TABLE `document_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_types`
--

DROP TABLE IF EXISTS `document_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `document_types` (
  `type_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`type_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_types`
--

LOCK TABLES `document_types` WRITE;
/*!40000 ALTER TABLE `document_types` DISABLE KEYS */;
INSERT INTO `document_types` VALUES (1,'MEMO');
/*!40000 ALTER TABLE `document_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_users`
--

DROP TABLE IF EXISTS `document_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `document_users` (
  `doc_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  KEY `document_users_ibfk_doc` (`doc_id`),
  KEY `document_users_ibfk_user` (`user_id`),
  CONSTRAINT `document_users_ibfk_doc` FOREIGN KEY (`doc_id`) REFERENCES `dms_documents` (`doc_id`) ON DELETE CASCADE,
  CONSTRAINT `document_users_ibfk_user` FOREIGN KEY (`user_id`) REFERENCES `dms_user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_users`
--

LOCK TABLES `document_users` WRITE;
/*!40000 ALTER TABLE `document_users` DISABLE KEYS */;
/*!40000 ALTER TABLE `document_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `folders`
--

DROP TABLE IF EXISTS `folders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `folders` (
  `folder_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`folder_id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `folders`
--

LOCK TABLES `folders` WRITE;
/*!40000 ALTER TABLE `folders` DISABLE KEYS */;
INSERT INTO `folders` VALUES (1,'2025','2025-09-07 09:17:03','2025-09-07 09:17:03'),(2,'2026','2025-09-14 09:51:03','2025-09-14 09:51:03');
/*!40000 ALTER TABLE `folders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_departments`
--

DROP TABLE IF EXISTS `notification_departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notification_departments` (
  `notification_id` int(11) NOT NULL,
  `department_id` int(11) NOT NULL,
  PRIMARY KEY (`notification_id`,`department_id`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `notification_departments_ibfk_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`) ON DELETE CASCADE,
  CONSTRAINT `notification_departments_ibfk_notification` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`notification_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_departments`
--

LOCK TABLES `notification_departments` WRITE;
/*!40000 ALTER TABLE `notification_departments` DISABLE KEYS */;
INSERT INTO `notification_departments` VALUES (25,1),(28,1);
/*!40000 ALTER TABLE `notification_departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_reads`
--

DROP TABLE IF EXISTS `notification_reads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notification_reads` (
  `notification_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `read_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`notification_id`,`user_id`),
  UNIQUE KEY `uq_notification_reads` (`notification_id`,`user_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `nr_fk_notification` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`notification_id`) ON DELETE CASCADE,
  CONSTRAINT `nr_fk_user` FOREIGN KEY (`user_id`) REFERENCES `dms_user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_reads`
--

LOCK TABLES `notification_reads` WRITE;
/*!40000 ALTER TABLE `notification_reads` DISABLE KEYS */;
INSERT INTO `notification_reads` VALUES (22,1,'2025-09-11 06:52:37'),(24,1,'2025-09-11 06:52:37'),(26,1,'2025-09-11 06:52:37'),(27,1,'2025-09-11 06:52:37'),(29,1,'2025-09-11 06:52:37'),(36,1,'2025-09-11 06:52:37'),(37,1,'2025-09-11 23:55:38');
/*!40000 ALTER TABLE `notification_reads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_roles`
--

DROP TABLE IF EXISTS `notification_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notification_roles` (
  `notification_id` int(11) NOT NULL,
  `role` enum('ADMIN','DEAN','FACULTY') NOT NULL,
  PRIMARY KEY (`notification_id`,`role`),
  KEY `role` (`role`),
  CONSTRAINT `notification_roles_ibfk_notification` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`notification_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_roles`
--

LOCK TABLES `notification_roles` WRITE;
/*!40000 ALTER TABLE `notification_roles` DISABLE KEYS */;
INSERT INTO `notification_roles` VALUES (25,'FACULTY');
/*!40000 ALTER TABLE `notification_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_users`
--

DROP TABLE IF EXISTS `notification_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notification_users` (
  `notification_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  PRIMARY KEY (`notification_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notification_users_ibfk_notification` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`notification_id`) ON DELETE CASCADE,
  CONSTRAINT `notification_users_ibfk_user` FOREIGN KEY (`user_id`) REFERENCES `dms_user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_users`
--

LOCK TABLES `notification_users` WRITE;
/*!40000 ALTER TABLE `notification_users` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `notification_id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` enum('added','updated','deleted') NOT NULL,
  `visible_to_all` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `related_doc_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`notification_id`),
  KEY `idx_type` (`type`),
  KEY `idx_visible_to_all` (`visible_to_all`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_related_doc_id` (`related_doc_id`),
  CONSTRAINT `notifications_ibfk_doc` FOREIGN KEY (`related_doc_id`) REFERENCES `dms_documents` (`doc_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (22,'New Announcement: ALL MEMBERS','A new announcement \"ALL MEMBERS\" has been created by ADMIN LAN','added',1,'2025-09-07 09:15:50',NULL),(24,'New Announcement: ALL','A new announcement \"ALL\" has been created by ADMIN LAN','added',1,'2025-09-07 10:09:55',NULL),(25,'New Announcement: again','A new announcement \"again\" has been created by ADMIN LAN','added',0,'2025-09-07 10:12:18',NULL),(26,'New Announcement: wqe','A new announcement \"wqe\" has been created by ADMIN LAN','added',1,'2025-09-07 11:56:47',NULL),(27,'New Announcement: das','A new announcement \"das\" has been created by ADMIN LAN','added',1,'2025-09-07 11:58:20',NULL),(28,'New Announcement: das','A new announcement \"das\" has been created by ADMIN LAN','added',0,'2025-09-07 12:01:44',NULL),(29,'New Announcement: das','A new announcement \"das\" has been created by ADMIN LAN','added',1,'2025-09-07 12:02:03',NULL),(36,'New Document Added: cas f','A new document \"cas f\" has been uploaded by Pol andrei Bulong','added',1,'2025-09-09 11:18:51',20),(37,'New Document Added: asd','A new document \"asd\" has been uploaded by Pol andrei Bulong','added',1,'2025-09-10 10:02:10',21),(38,'New Document Added: teesy','A new document \"teesy\" has been uploaded by Pol andrei Bulong','added',1,'2025-09-12 21:01:29',22),(39,'New Document Added: TEST 1','A new document \"TEST 1\" has been uploaded by Pol andrei Bulong','added',1,'2025-09-14 08:47:17',23);
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_document_preferences`
--

DROP TABLE IF EXISTS `user_document_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_document_preferences` (
  `preference_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `doc_id` int(11) NOT NULL,
  `is_favorite` tinyint(1) DEFAULT 0,
  `is_pinned` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`preference_id`),
  KEY `user_id` (`user_id`),
  KEY `doc_id` (`doc_id`),
  CONSTRAINT `user_document_preferences_ibfk_doc` FOREIGN KEY (`doc_id`) REFERENCES `dms_documents` (`doc_id`) ON DELETE CASCADE,
  CONSTRAINT `user_document_preferences_ibfk_user` FOREIGN KEY (`user_id`) REFERENCES `dms_user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_document_preferences`
--

LOCK TABLES `user_document_preferences` WRITE;
/*!40000 ALTER TABLE `user_document_preferences` DISABLE KEYS */;
INSERT INTO `user_document_preferences` VALUES (2,1,23,1,0,'2025-09-14 11:13:02','2025-09-14 11:13:02'),(3,1,22,0,0,'2025-09-14 11:13:05','2025-09-14 11:13:07');
/*!40000 ALTER TABLE `user_document_preferences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'ispsc_tagudin_dms_2'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-15  4:21:29
