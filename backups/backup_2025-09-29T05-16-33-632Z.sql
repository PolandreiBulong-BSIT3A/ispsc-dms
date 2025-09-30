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
INSERT INTO `announcement_departments` VALUES (22,2);
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
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcements`
--

LOCK TABLES `announcements` WRITE;
/*!40000 ALTER TABLE `announcements` DISABLE KEYS */;
INSERT INTO `announcements` VALUES (11,'ALL MEMBERS','Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.\n\nLorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.\n\nLorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.\n\nLorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.\n\nLorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.',1,'published','2025-09-07 09:15:50',NULL,'ADMIN LAN','2025-09-07 09:15:50','2025-09-26 22:05:37'),(12,'ALL','ADS fsfasd',1,'published','2025-09-07 10:09:55',NULL,'ADMIN LAN','2025-09-07 10:09:55','2025-09-26 22:02:49'),(22,'DEAN CASS','Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.\n\nLorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.\n\nLorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.\n\nLorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.\n\nLorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.',0,'published','2025-09-27 09:34:02',NULL,'Levv1','2025-09-27 01:34:02','2025-09-27 01:34:02'),(23,'TEST 1 FOR ALL AGAIN, agian','Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.\n\nLorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.\n\nLorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.\n\nLorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.\n\nLorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.',1,'published','2025-09-27 09:56:08',NULL,'Pol andrei Bulong','2025-09-27 01:56:08','2025-09-27 01:56:08'),(24,'nigga memo','remember, no niggers',1,'published','2025-09-29 13:14:04',NULL,'Pol andrei Bulong','2025-09-29 05:14:04','2025-09-29 05:14:04');
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
  `allowed_user_ids` text DEFAULT NULL,
  `allowed_roles` text DEFAULT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=96 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dms_documents`
--

LOCK TABLES `dms_documents` WRITE;
/*!40000 ALTER TABLE `dms_documents` DISABLE KEYS */;
INSERT INTO `dms_documents` VALUES (21,1,2,'ads','asd',NULL,NULL,'asd','das','2025-09-10','https://drive.google.com/file/d/1fIFyhCNKa7RlJXBKpYyyEcvDnzZv628Z/view?usp=drive_link',NULL,'soft_copy',NULL,NULL,1,NULL,'faculty','active','2025-09-10 10:02:10','2025-09-23 02:53:34','Pol andrei Bulong',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ALL',NULL,NULL,NULL),(22,1,2,'sad','teesy','2','2025-09-13','sa','dsa','2025-09-13','https://drive.google.com/file/d/13FjgznnFxV0QlhI44Yvu5F6aaU2dSvGd/view?usp=drive_link','sdasdasdasdsad','both',NULL,NULL,1,NULL,NULL,'active','2025-09-12 21:01:29','2025-09-14 09:53:47','Pol andrei Bulong',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ALL',NULL,NULL,NULL),(23,1,2,'WQEQ','TEST 1',NULL,NULL,'QE','QEW','2025-09-14','https://drive.google.com/file/d/1pMcDBaiJapuj6olKSSLhRHyOQvPwB20R/view?usp=drive_link',NULL,'both',NULL,NULL,1,NULL,NULL,'active','2025-09-14 08:47:17','2025-09-14 11:12:20','Pol andrei Bulong',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ALL',NULL,NULL,NULL),(24,2,3,'FIN-REQ-2025-024','Request: Additional Budget for Supplies','v1','2025-01-10','Finance Office','VP Admin','2025-01-11',NULL,'Budget request for office supplies.','soft_copy','Admin Lan',45,1,NULL,NULL,'active','2025-09-23 01:58:29','2025-09-28 00:45:53','Finance Office',1,'2025-09-28 00:45:53','Admin Lan',NULL,NULL,NULL,NULL,45,'ALL',NULL,NULL,NULL),(25,3,4,'HR-REP-2025-025','Report: Faculty Attendance Summary','v1','2025-01-15','HR Office','President','2025-01-16',NULL,'Summary of faculty attendance report.','soft_copy','Victoriya Visha',46,1,NULL,NULL,'active','2025-09-23 01:58:29','2025-09-23 01:58:29','HR Office',0,NULL,NULL,NULL,NULL,NULL,NULL,46,'ALL',NULL,NULL,NULL),(26,4,5,'STU-CLEAR-2025-026','Clearance: Student Organization Renewal','v1','2025-01-20','Student Affairs','Registrar','2025-01-21',NULL,'Clearance for student org renewal.','both','Levv1',47,1,NULL,NULL,'active','2025-09-23 01:58:29','2025-09-23 01:58:29','Student Affairs',0,NULL,NULL,NULL,NULL,NULL,NULL,47,'ALL',NULL,NULL,NULL),(27,5,6,'FAC-TRAIN-2025-027','Letter: Faculty Development Training Invite','v1','2025-01-25','Dean CAS','All CAS Faculty','2025-01-26',NULL,'Invitation to faculty development seminar.','soft_copy','Admin Lan',48,1,NULL,NULL,'active','2025-09-23 01:58:29','2025-09-23 01:58:29','Dean CAS',0,NULL,NULL,NULL,NULL,NULL,NULL,48,'ALL',NULL,NULL,NULL),(28,6,7,'RES-NOT-2025-028','Notice: Research Proposal Deadline','v1','2025-01-30','Research Office','All Departments','2025-01-31',NULL,'Reminder for research proposal submission.','soft_copy','Victoriya Visha',49,1,NULL,NULL,'active','2025-09-23 01:58:29','2025-09-23 01:58:29','Research Office',0,NULL,NULL,NULL,NULL,NULL,NULL,49,'ALL',NULL,NULL,NULL),(29,7,8,'ADM-POL-2025-029','Resolution: Admin Policy Update','v1','2025-02-02','Admin Council','VP Admin','2025-02-03',NULL,'Resolution on administrative updates.','hard_copy','Levv1',50,1,NULL,NULL,'active','2025-09-23 01:58:29','2025-09-27 20:01:23','Admin Council',0,NULL,NULL,'2025-09-27 20:01:23','Pol andrei Bulong',NULL,NULL,50,'ALL',NULL,NULL,NULL),(30,8,9,'IT-PROP-2025-030','Proposal: Digital Filing System','v1','2025-02-07','IT Office','VPAA','2025-02-08',NULL,'Proposal to adopt a digital filing system.','both','Admin Lan',51,1,NULL,NULL,'active','2025-09-23 01:58:29','2025-09-23 01:58:29','IT Office',0,NULL,NULL,NULL,NULL,NULL,NULL,51,'ALL',NULL,NULL,NULL),(31,9,10,'PROC-GUIDE-2025-031','Guidelines: Procurement Process','v1','2025-02-12','Procurement Office','All Units','2025-02-13',NULL,'Standardized procurement process guidelines.','soft_copy','Victoriya Visha',52,1,NULL,NULL,'active','2025-09-23 01:58:29','2025-09-23 01:58:29','Procurement Office',0,NULL,NULL,NULL,NULL,NULL,NULL,52,'ALL',NULL,NULL,NULL),(32,10,11,'LEGAL-POL-2025-032','Policy: Contract Management','v1','2025-02-15','Legal Office','All Departments','2025-02-16',NULL,'Policy on contracts and agreements.','soft_copy','Levv1',53,1,NULL,NULL,'active','2025-09-23 01:58:29','2025-09-23 01:58:29','Legal Office',0,NULL,NULL,NULL,NULL,NULL,NULL,53,'ALL',NULL,NULL,NULL),(33,11,12,'ARC-CERT-2025-033','Certificate: Archive Completion','v1','2025-02-20','Records Office','VP Admin','2025-02-21',NULL,'Certificate of document archive completion.','hard_copy','Admin Lan',54,1,NULL,NULL,'active','2025-09-23 01:58:29','2025-09-23 01:58:29','Records Office',0,NULL,NULL,NULL,NULL,NULL,NULL,54,'ALL',NULL,NULL,NULL),(34,2,3,'CAS-MEMO-2025-034','Memo: Faculty Meeting Notice','v1','2025-03-01','Dean CAS','CAS Faculty','2025-03-02',NULL,'Notice of upcoming CAS faculty meeting.','soft_copy','Admin Lan',45,0,NULL,NULL,'active','2025-09-23 02:34:30','2025-09-23 02:34:30','Dean CAS',0,NULL,NULL,NULL,NULL,NULL,NULL,45,'DEPARTMENT',NULL,NULL,NULL),(35,3,4,'CAS-REP-2025-035','Report: Research Activities CAS','v1','2025-03-03','CAS Research Coordinator','VPAA','2025-03-04',NULL,'Report on ongoing research within CAS.','soft_copy','Victoriya Visha',46,0,NULL,NULL,'active','2025-09-23 02:34:30','2025-09-23 02:34:30','CAS Research Coordinator',0,NULL,NULL,NULL,NULL,NULL,NULL,46,'DEPARTMENT',NULL,NULL,NULL),(36,4,5,'CAS-CLEAR-2025-036','Clearance: CAS Laboratory Equipment','v1','2025-03-05','CAS Lab Head','VP Admin','2025-03-06',NULL,'Clearance request for laboratory equipment use.','hard_copy','Levv1',47,0,NULL,NULL,'active','2025-09-23 02:34:30','2025-09-23 02:34:30','CAS Lab Head',0,NULL,NULL,NULL,NULL,NULL,NULL,47,'DEPARTMENT',NULL,NULL,NULL),(37,5,6,'CAS-LET-2025-037','Letter: Invitation to CAS Academic Forum','v1','2025-03-07','Dean CAS','All CAS Faculty','2025-03-08',NULL,'Invitation to participate in the CAS academic forum.','soft_copy','Admin Lan',48,0,NULL,NULL,'active','2025-09-23 02:34:30','2025-09-23 02:34:30','Dean CAS',0,NULL,NULL,NULL,NULL,NULL,NULL,48,'DEPARTMENT',NULL,NULL,NULL),(38,6,7,'CAS-NOT-2025-038','Notice: CAS Exam Schedule Release','v1','2025-03-08','CAS Registrar','CAS Faculty & Students','2025-03-09','https://drive.google.com/file/d/1TAVFyRUbKhjHtrqaCL_ASPVMovigMbur/view?usp=drive_link','Release of exam schedule for CAS students.','soft_copy','Victoriya Visha',49,0,NULL,NULL,'active','2025-09-23 02:34:30','2025-09-28 03:18:58','CAS Registrar',0,NULL,NULL,NULL,NULL,NULL,NULL,49,'DEPARTMENT',NULL,NULL,NULL),(39,7,8,'CAS-RES-2025-039','Resolution: CAS Curriculum Update','v1','2025-03-11','CAS Faculty Council','VPAA','2025-03-12',NULL,'Resolution to update the CAS curriculum.','hard_copy','Levv1',50,0,NULL,NULL,'active','2025-09-23 02:34:30','2025-09-23 02:34:30','CAS Faculty Council',0,NULL,NULL,NULL,NULL,NULL,NULL,50,'DEPARTMENT',NULL,NULL,NULL),(40,8,9,'CAS-PROP-2025-040','Proposal: CAS Library Expansion','v1','2025-03-13','CAS Librarian','VP Admin','2025-03-14',NULL,'Proposal for expansion of CAS library facilities.','both','Admin Lan',51,0,NULL,NULL,'active','2025-09-23 02:34:30','2025-09-23 02:34:30','CAS Librarian',0,NULL,NULL,NULL,NULL,NULL,NULL,51,'DEPARTMENT',NULL,NULL,NULL),(41,9,10,'CAS-GUIDE-2025-041','Guidelines: CAS Research Ethics','v1','2025-03-15','CAS Research Committee','CAS Faculty','2025-03-16',NULL,'Ethical guidelines for research within CAS.','soft_copy','Victoriya Visha',52,0,NULL,NULL,'active','2025-09-23 02:34:30','2025-09-23 02:34:30','CAS Research Committee',0,NULL,NULL,NULL,NULL,NULL,NULL,52,'DEPARTMENT',NULL,NULL,NULL),(42,10,11,'CAS-POL-2025-042','Policy: CAS Faculty Evaluation','v1','2025-03-17','CAS Evaluation Board','VPAA','2025-03-18',NULL,'Policy on periodic faculty evaluations.','soft_copy','Levv1',53,0,NULL,NULL,'active','2025-09-23 02:34:30','2025-09-23 02:34:30','CAS Evaluation Board',0,NULL,NULL,NULL,NULL,NULL,NULL,53,'DEPARTMENT',NULL,NULL,NULL),(43,11,12,'CAS-CERT-2025-043','Certificate: CAS Faculty Recognition','v1','2025-03-19','CAS Dean','VP Admin','2025-03-20',NULL,'Certificate of recognition for outstanding CAS faculty.','hard_copy','Admin Lan',54,0,NULL,NULL,'active','2025-09-23 02:34:30','2025-09-23 02:34:30','CAS Dean',0,NULL,NULL,NULL,NULL,NULL,NULL,54,'DEPARTMENT',NULL,NULL,NULL),(44,2,3,'FAC-MEMO-2025-044','Memo: Faculty Evaluation Guidelines','v1','2025-03-21','VPAA','All Faculty','2025-03-22',NULL,'Guidelines for upcoming faculty evaluations.','soft_copy','Admin Lan',45,0,NULL,NULL,'active','2025-09-23 02:42:49','2025-09-23 02:42:49','VPAA',0,NULL,NULL,NULL,NULL,NULL,NULL,45,'SPECIFIC_ROLES',NULL,NULL,NULL),(45,3,4,'FAC-REP-2025-045','Report: Faculty Workload Summary','v1','2025-03-23','HR Office','VPAA','2025-03-24',NULL,'Summary report of faculty workload.','soft_copy','Victoriya Visha',46,0,NULL,NULL,'active','2025-09-23 02:42:49','2025-09-23 02:42:49','HR Office',0,NULL,NULL,NULL,NULL,NULL,NULL,46,'SPECIFIC_ROLES',NULL,NULL,NULL),(46,4,5,'FAC-CLEAR-2025-046','Clearance: Faculty Research Grants','v1','2025-03-25','Research Office','Faculty Members','2025-03-26',NULL,'Clearance requirement for faculty research grants.','both','Levv1',47,0,NULL,NULL,'active','2025-09-23 02:42:49','2025-09-23 02:42:49','Research Office',0,NULL,NULL,NULL,NULL,NULL,NULL,47,'SPECIFIC_ROLES',NULL,NULL,NULL),(47,5,6,'FAC-LET-2025-047','Letter: Faculty Training Invitation','v1','2025-03-27','VPAA','All Faculty','2025-03-28',NULL,'Invitation to faculty training.','soft_copy','Admin Lan',48,0,NULL,NULL,'active','2025-09-23 02:42:49','2025-09-23 02:42:49','VPAA',0,NULL,NULL,NULL,NULL,NULL,NULL,48,'SPECIFIC_ROLES',NULL,NULL,NULL),(48,6,7,'FAC-NOT-2025-048','Notice: Faculty Research Deadline','v1','2025-03-29','Research Coordinator','Faculty','2025-03-30',NULL,'Reminder of faculty research submission.','soft_copy','Victoriya Visha',49,0,NULL,NULL,'active','2025-09-23 02:42:49','2025-09-23 02:42:49','Research Coordinator',0,NULL,NULL,NULL,NULL,NULL,NULL,49,'SPECIFIC_ROLES',NULL,NULL,NULL),(49,7,8,'FAC-RES-2025-049','Resolution: Faculty Workload Adjustment','v1','2025-04-01','Faculty Council','VPAA','2025-04-02',NULL,'Resolution on faculty workload adjustments.','hard_copy','Levv1',50,0,NULL,NULL,'active','2025-09-23 02:42:49','2025-09-23 02:42:49','Faculty Council',0,NULL,NULL,NULL,NULL,NULL,NULL,50,'SPECIFIC_ROLES',NULL,NULL,NULL),(50,8,9,'FAC-PROP-2025-050','Proposal: Faculty Development Program','v1','2025-04-03','VPAA','All Faculty','2025-04-04',NULL,'Proposal for faculty development program.','both','Admin Lan',51,0,NULL,NULL,'active','2025-09-23 02:42:49','2025-09-23 02:42:49','VPAA',0,NULL,NULL,NULL,NULL,NULL,NULL,51,'SPECIFIC_ROLES',NULL,NULL,NULL),(51,9,10,'FAC-GUIDE-2025-051','Guidelines: Faculty Academic Advising','v1','2025-04-05','CAS Dean','Faculty Advisors','2025-04-06',NULL,'Guidelines for faculty academic advising.','soft_copy','Victoriya Visha',52,0,NULL,NULL,'active','2025-09-23 02:42:49','2025-09-23 02:42:49','CAS Dean',0,NULL,NULL,NULL,NULL,NULL,NULL,52,'SPECIFIC_ROLES',NULL,NULL,NULL),(52,10,11,'FAC-POL-2025-052','Policy: Faculty Research Incentives','v1','2025-04-07','VPAA','Faculty Members','2025-04-08',NULL,'Policy on incentives for research-active faculty.','soft_copy','Levv1',53,0,NULL,NULL,'active','2025-09-23 02:42:49','2025-09-23 02:42:49','VPAA',0,NULL,NULL,NULL,NULL,NULL,NULL,53,'SPECIFIC_ROLES',NULL,NULL,NULL),(53,11,12,'FAC-CERT-2025-053','Certificate: Faculty Service Recognition','v1','2025-04-09','VPAA','CAS Faculty','2025-04-10',NULL,'Certificates for long-serving faculty.','hard_copy','Admin Lan',54,0,NULL,NULL,'active','2025-09-23 02:42:49','2025-09-23 02:42:49','VPAA',0,NULL,NULL,NULL,NULL,NULL,NULL,54,'SPECIFIC_ROLES',NULL,NULL,NULL),(54,2,3,'ADM-MEMO-2025-054','Memo: Administrative Staff Meeting','v1','2025-04-11','VP Admin','All Admin Staff','2025-04-12',NULL,'Notice for admin staff meeting.','soft_copy','Admin Lan',45,0,NULL,NULL,'active','2025-09-23 02:43:20','2025-09-23 02:43:20','VP Admin',0,NULL,NULL,NULL,NULL,NULL,NULL,45,'SPECIFIC_ROLES',NULL,NULL,NULL),(55,3,4,'ADM-REP-2025-055','Report: Admin Services Summary','v1','2025-04-13','Admin Services','VP Admin','2025-04-14',NULL,'Summary of admin services performance.','soft_copy','Victoriya Visha',46,0,NULL,NULL,'active','2025-09-23 02:43:20','2025-09-23 02:43:20','Admin Services',0,NULL,NULL,NULL,NULL,NULL,NULL,46,'SPECIFIC_ROLES',NULL,NULL,NULL),(56,4,5,'ADM-CLEAR-2025-056','Clearance: Office Supplies Distribution','v1','2025-04-15','Admin Office','VP Admin','2025-04-16',NULL,'Clearance for distribution of office supplies.','both','Levv1',47,0,NULL,NULL,'active','2025-09-23 02:43:20','2025-09-23 02:43:20','Admin Office',0,NULL,NULL,NULL,NULL,NULL,NULL,47,'SPECIFIC_ROLES',NULL,NULL,NULL),(57,5,6,'ADM-LET-2025-057','Letter: Invitation to Admin Training','v1','2025-04-17','VP Admin','Admin Personnel','2025-04-18',NULL,'Invitation for admin training seminar.','soft_copy','Admin Lan',48,0,NULL,NULL,'active','2025-09-23 02:43:20','2025-09-23 02:43:20','VP Admin',0,NULL,NULL,NULL,NULL,NULL,NULL,48,'SPECIFIC_ROLES',NULL,NULL,NULL),(58,6,7,'ADM-NOT-2025-058','Notice: Admin Policy Implementation','v1','2025-04-19','VP Admin','Admin Staff','2025-04-20',NULL,'Notice on implementation of new policies.','soft_copy','Victoriya Visha',49,0,NULL,NULL,'active','2025-09-23 02:43:20','2025-09-23 02:43:20','VP Admin',0,NULL,NULL,NULL,NULL,NULL,NULL,49,'SPECIFIC_ROLES',NULL,NULL,NULL),(59,7,8,'ADM-RES-2025-059','Resolution: Office Procedures Update','v1','2025-04-21','Admin Council','VP Admin','2025-04-22',NULL,'Resolution updating office procedures.','hard_copy','Levv1',50,0,NULL,NULL,'active','2025-09-23 02:43:20','2025-09-23 02:43:20','Admin Council',0,NULL,NULL,NULL,NULL,NULL,NULL,50,'SPECIFIC_ROLES',NULL,NULL,NULL),(60,8,9,'ADM-PROP-2025-060','Proposal: Admin Records Digitization','v1','2025-04-23','Admin Office','VP Admin','2025-04-24',NULL,'Proposal to digitize admin records.','both','Admin Lan',51,0,NULL,NULL,'active','2025-09-23 02:43:20','2025-09-23 02:43:20','Admin Office',0,NULL,NULL,NULL,NULL,NULL,NULL,51,'SPECIFIC_ROLES',NULL,NULL,NULL),(61,9,10,'ADM-GUIDE-2025-061','Guidelines: Office Correspondence','v1','2025-04-25','Admin Office','All Admin Units','2025-04-26',NULL,'Guidelines for proper office correspondence.','soft_copy','Victoriya Visha',52,0,NULL,NULL,'active','2025-09-23 02:43:20','2025-09-23 02:43:20','Admin Office',0,NULL,NULL,NULL,NULL,NULL,NULL,52,'SPECIFIC_ROLES',NULL,NULL,NULL),(62,10,11,'ADM-POL-2025-062','Policy: Admin Performance Review','v1','2025-04-27','VP Admin','Admin Staff','2025-04-28',NULL,'Policy on admin performance review.','soft_copy','Levv1',53,0,NULL,NULL,'active','2025-09-23 02:43:20','2025-09-23 02:43:20','VP Admin',0,NULL,NULL,NULL,NULL,NULL,NULL,53,'SPECIFIC_ROLES',NULL,NULL,NULL),(63,11,12,'ADM-CERT-2025-063','Certificate: Admin Service Recognition','v1','2025-04-29','VP Admin','Admin Council','2025-04-30',NULL,'Certificates for outstanding admin service.','hard_copy','Admin Lan',54,0,NULL,NULL,'active','2025-09-23 02:43:20','2025-09-23 02:43:20','VP Admin',0,NULL,NULL,NULL,NULL,NULL,NULL,54,'SPECIFIC_ROLES',NULL,NULL,NULL),(64,5,8,'ADS','FOR USER YOU ONLY',NULL,NULL,NULL,NULL,NULL,'https://drive.google.com/file/d/1pMcDBaiJapuj6olKSSLhRHyOQvPwB20R/view?usp=drive_link',NULL,'soft_copy',NULL,NULL,0,NULL,NULL,'active','2025-09-23 03:15:02','2025-09-28 03:15:55','Pol andrei Bulong',1,'2025-09-28 03:15:55','Pol andrei Bulong',NULL,NULL,NULL,NULL,NULL,'ALL',NULL,NULL,NULL),(65,7,7,'A','TRE',NULL,NULL,NULL,NULL,NULL,'https://drive.google.com/file/d/1pMcDBaiJapuj6olKSSLhRHyOQvPwB20R/view?usp=drive_link',NULL,'soft_copy',NULL,NULL,0,NULL,NULL,'active','2025-09-23 03:17:06','2025-09-28 03:15:55','Pol andrei Bulong',1,'2025-09-28 03:15:55','Pol andrei Bulong',NULL,NULL,NULL,NULL,NULL,'ALL',NULL,NULL,NULL),(66,7,8,'sad','sadas adpol',NULL,NULL,NULL,NULL,NULL,'https://drive.google.com/file/d/1pMcDBaiJapuj6olKSSLhRHyOQvPwB20R/view?usp=drive_link',NULL,'soft_copy',NULL,NULL,0,NULL,NULL,'active','2025-09-23 03:20:31','2025-09-28 03:15:55','Pol andrei Bulong',1,'2025-09-28 03:15:55','Pol andrei Bulong',NULL,NULL,NULL,NULL,NULL,'ALL',NULL,NULL,NULL),(67,3,NULL,'dsf','sdf',NULL,NULL,NULL,NULL,NULL,'https://drive.google.com/file/d/1pMcDBaiJapuj6olKSSLhRHyOQvPwB20R/view?usp=drive_link',NULL,'soft_copy',NULL,NULL,0,NULL,NULL,'active','2025-09-23 03:23:35','2025-09-28 03:15:55','Pol andrei Bulong',1,'2025-09-28 03:15:55','Pol andrei Bulong',NULL,NULL,NULL,NULL,NULL,'ALL',NULL,NULL,NULL),(68,7,NULL,'as','pol',NULL,NULL,'sad','asd','2025-09-23','https://drive.google.com/file/d/1TAVFyRUbKhjHtrqaCL_ASPVMovigMbur/view?usp=drive_link',NULL,'soft_copy',NULL,NULL,0,'1',NULL,'active','2025-09-23 07:21:30','2025-09-23 07:21:30','Pol andrei Bulong',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ALL',NULL,NULL,NULL),(69,9,7,'asd','asda',NULL,NULL,'as','sad','2025-09-23','https://drive.google.com/file/d/1TAVFyRUbKhjHtrqaCL_ASPVMovigMbur/view?usp=drive_link',NULL,'soft_copy',NULL,NULL,0,'11',NULL,'active','2025-09-23 07:30:59','2025-09-23 07:30:59','Pol andrei Bulong',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ALL',NULL,NULL,NULL),(70,9,2,'asddsa','asd',NULL,NULL,'asdasd','dasads','2025-09-23','https://drive.google.com/file/d/1TAVFyRUbKhjHtrqaCL_ASPVMovigMbur/view?usp=drive_link',NULL,'both',NULL,NULL,0,'11,3',NULL,'active','2025-09-23 07:39:29','2025-09-23 07:39:29','Pol andrei Bulong',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ALL',NULL,NULL,NULL),(71,7,7,'DS','FOR LEVV1',NULL,NULL,'AS','DS','2025-09-23','https://drive.google.com/file/d/1TAVFyRUbKhjHtrqaCL_ASPVMovigMbur/view?usp=drive_link',NULL,'soft_copy',NULL,NULL,0,'3',NULL,'active','2025-09-23 07:41:42','2025-09-23 07:41:42','Pol andrei Bulong',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ALL',NULL,NULL,NULL),(72,7,NULL,'Remove the “Role + Department” option from the UI entirely to avoid confusion?','please notify for levvi only',NULL,NULL,'Remove the “Role + Department” option from the UI entirely to avoid confusion?','Remove the “Role + Department” option from the UI entirely to avoid confusion?','2025-09-23','https://drive.google.com/file/d/1pMcDBaiJapuj6olKSSLhRHyOQvPwB20R/view?usp=drive_link',NULL,'soft_copy',NULL,NULL,0,'11',NULL,'active','2025-09-23 09:08:03','2025-09-23 09:08:03','Pol andrei Bulong',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ALL',NULL,NULL,NULL),(73,7,7,'123','FOR ALL y',NULL,NULL,'231','123','2025-09-21','https://drive.google.com/file/d/1xxFOBzRK-KuipDKp4T2j_E_OrwX6eoS_/view?usp=drive_link','','soft_copy',NULL,NULL,1,NULL,NULL,'active','2025-09-23 09:32:43','2025-09-28 03:18:19','Pol andrei Bulong',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ALL',NULL,NULL,NULL),(74,3,9,'ASD','for ONLY ONE',NULL,NULL,'AS','DAS','2025-09-21','https://drive.google.com/file/d/1xxFOBzRK-KuipDKp4T2j_E_OrwX6eoS_/view?usp=drive_link','','both',NULL,NULL,0,'11',NULL,'active','2025-09-23 09:33:59','2025-09-28 03:08:17','Pol andrei Bulong',1,'2025-09-28 03:08:17','Pol andrei Bulong',NULL,NULL,NULL,NULL,NULL,'ALL',NULL,NULL,NULL),(75,2,5,'QWE','FOR LEEVII - Link 1',NULL,NULL,'22','2222','2025-09-23','https://drive.google.com/file/d/1xxFOBzRK-KuipDKp4T2j_E_OrwX6eoS_/view?usp=drive_link',NULL,'soft_copy',NULL,NULL,0,'3,11',NULL,'active','2025-09-23 09:39:26','2025-09-28 03:08:17','Pol andrei Bulong',1,'2025-09-28 03:08:17','Pol andrei Bulong',NULL,NULL,NULL,NULL,NULL,'ALL',NULL,NULL,NULL),(76,2,5,'QWE','FOR LEEVII - Link 2',NULL,NULL,'22','2222','2025-09-23','https://drive.google.com/file/d/1xxFOBzRK-KuipDKp4T2j_E_OrwX6eoS_/view?usp=drive_link',NULL,'soft_copy',NULL,NULL,0,'3,11',NULL,'active','2025-09-23 09:39:26','2025-09-28 03:08:17','Pol andrei Bulong',1,'2025-09-28 03:08:17','Pol andrei Bulong',NULL,NULL,NULL,NULL,NULL,'ALL',NULL,NULL,NULL),(77,2,5,'QWE','FOR LEEVII - Link 3',NULL,NULL,'22','2222','2025-09-23','https://drive.google.com/file/d/1xxFOBzRK-KuipDKp4T2j_E_OrwX6eoS_/view?usp=drive_link',NULL,'soft_copy',NULL,NULL,0,'3,11',NULL,'active','2025-09-23 09:39:26','2025-09-28 03:08:17','Pol andrei Bulong',1,'2025-09-28 03:08:17','Pol andrei Bulong',NULL,NULL,NULL,NULL,NULL,'ALL',NULL,NULL,NULL),(78,7,NULL,'213','TESINT - Link 1',NULL,NULL,'EEQW','EWQEWQ','2025-09-22','https://drive.google.com/file/d/1xxFOBzRK-KuipDKp4T2j_E_OrwX6eoS_/view?usp=drive_link','','soft_copy',NULL,NULL,0,'11,3',NULL,'active','2025-09-23 09:52:09','2025-09-28 03:08:17','Pol andrei Bulong',1,'2025-09-28 03:08:17','Pol andrei Bulong','2025-09-27 10:10:58','Pol andrei Bulong',NULL,NULL,NULL,'ALL',NULL,NULL,NULL),(79,7,NULL,'213','TESINT - Link 2',NULL,NULL,'EEQW','EWQEWQ','2025-09-23','https://drive.google.com/file/d/1xxFOBzRK-KuipDKp4T2j_E_OrwX6eoS_/view?usp=drive_link',NULL,'soft_copy',NULL,NULL,0,'11,3',NULL,'active','2025-09-23 09:52:09','2025-09-28 03:08:17','Pol andrei Bulong',1,'2025-09-28 03:08:17','Pol andrei Bulong',NULL,NULL,NULL,NULL,NULL,'ALL',NULL,NULL,NULL),(80,7,NULL,'213','TESINT - Link 3',NULL,NULL,'EEQW','EWQEWQ','2025-09-23','https://drive.google.com/file/d/1xxFOBzRK-KuipDKp4T2j_E_OrwX6eoS_/view?usp=drive_link',NULL,'soft_copy',NULL,NULL,0,'11,3',NULL,'active','2025-09-23 09:52:09','2025-09-28 03:08:17','Pol andrei Bulong',1,'2025-09-28 03:08:17','Pol andrei Bulong',NULL,NULL,NULL,NULL,NULL,'ALL',NULL,NULL,NULL),(81,7,NULL,'213','TESINT - Link 4',NULL,NULL,'EEQW','EWQEWQ','2025-09-23','https://drive.google.com/file/d/1xxFOBzRK-KuipDKp4T2j_E_OrwX6eoS_/view?usp=drive_link',NULL,'soft_copy',NULL,NULL,0,'11,3',NULL,'active','2025-09-23 09:52:09','2025-09-28 03:08:17','Pol andrei Bulong',1,'2025-09-28 03:08:17','Pol andrei Bulong',NULL,NULL,NULL,NULL,NULL,'ALL',NULL,NULL,NULL),(82,7,NULL,'213','TESINT - Link 5',NULL,NULL,'EEQW','EWQEWQ','2025-09-23','https://drive.google.com/file/d/1xxFOBzRK-KuipDKp4T2j_E_OrwX6eoS_/view?usp=drive_link',NULL,'soft_copy',NULL,NULL,0,'11,3',NULL,'active','2025-09-23 09:52:09','2025-09-28 03:08:17','Pol andrei Bulong',1,'2025-09-28 03:08:17','Pol andrei Bulong',NULL,NULL,NULL,NULL,NULL,'ALL',NULL,NULL,NULL),(83,7,5,'sdaasddsa','213',NULL,NULL,'dead','adimin','2025-09-27','https://drive.google.com/file/d/1pMcDBaiJapuj6olKSSLhRHyOQvPwB20R/view?usp=drive_link',NULL,'soft_copy',NULL,NULL,0,NULL,'admin','active','2025-09-27 02:33:38','2025-09-27 19:38:10','Victoriya Visha Von Klauss',1,'2025-09-27 19:38:10','Pol andrei Bulong',NULL,NULL,NULL,NULL,NULL,'ALL',NULL,NULL,NULL),(84,4,3,'111zz22','CBMEzz22','2','2025-09-27','Faaaaa','DSAFaa','2025-09-24','https://drive.google.com/file/d/1sLmzWc-viPP9l5sRvH6tG5NS7iSFJ1YS/view?usp=drive_link','','soft_copy',NULL,NULL,0,NULL,'admin','active','2025-09-27 03:01:59','2025-09-28 02:47:10','Victoriya Visha Von Klauss',1,'2025-09-28 02:47:10','Victoriya Visha Von Klauss','2025-09-28 01:07:08','Victoriya Visha Von Klauss',NULL,NULL,NULL,'ALL',NULL,NULL,NULL),(85,7,7,'ASDASD','ASDAS',NULL,NULL,'EEQW','2222','2025-09-27','https://drive.google.com/file/d/1TAVFyRUbKhjHtrqaCL_ASPVMovigMbur/view?usp=drive_link',NULL,'soft_copy',NULL,NULL,1,NULL,NULL,'active','2025-09-27 03:46:21','2025-09-27 19:51:03','Pol andrei Bulong',1,'2025-09-27 19:51:03','Pol andrei Bulong','2025-09-27 10:10:37','Pol andrei Bulong',NULL,NULL,NULL,'ALL',NULL,NULL,NULL),(86,14,1,'ASDASDAS','Asdasdaaaaa',NULL,NULL,'22','Asdasdasdas','2025-09-27','https://drive.google.com/file/d/1pMcDBaiJapuj6olKSSLhRHyOQvPwB20R/view?usp=drive_link',NULL,'soft_copy',NULL,NULL,1,NULL,NULL,'active','2025-09-27 03:53:04','2025-09-27 20:01:34','Pol andrei Bulong',1,'2025-09-27 20:01:34','Pol andrei Bulong','2025-09-27 10:11:15','Pol andrei Bulong',NULL,NULL,NULL,'ALL',NULL,NULL,NULL),(87,7,4,'wer','3 Depeaty',NULL,NULL,'22','2222','2025-09-28','https://drive.google.com/file/d/1TAVFyRUbKhjHtrqaCL_ASPVMovigMbur/view?usp=drive_link',NULL,'soft_copy',NULL,NULL,0,NULL,NULL,'active','2025-09-28 03:22:46','2025-09-28 07:53:31','Pol andrei Bulong',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ALL',NULL,NULL,NULL),(88,2,5,'122221','Request 4 Vic',NULL,NULL,'Admin','Victoria','2025-09-29','https://drive.google.com/file/d/1Xql5dZ823OwMQbOKPpcDo4FquEUXvIb6/view?usp=drive_link',NULL,'soft_copy',NULL,NULL,0,'101',NULL,'active','2025-09-28 21:01:49','2025-09-28 21:01:49','Pol andrei Bulong',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ALL',NULL,NULL,NULL),(89,1,NULL,'REPLY-1759096355972','assa',NULL,NULL,'sdf sdf','System','2025-09-29','https://docs.google.com/presentation/d/1Or7JWI1FjNt9nTObp6QBFp8Gta4V68wv/edit?usp=drive_link&ouid=113067982392129814733&rtpof=true&sd=true','sasa','soft_copy',NULL,NULL,1,NULL,NULL,'active','2025-09-28 21:52:35','2025-09-28 21:52:35','sdf sdf',0,NULL,NULL,NULL,NULL,88,'action_response',101,'ALL',NULL,NULL,NULL),(90,4,8,'122221','Request 4 Vic',NULL,NULL,'Admin Lan Lan','Pol Andrei Bulong','2025-09-29','https://drive.google.com/file/d/1Xql5dZ823OwMQbOKPpcDo4FquEUXvIb6/view?usp=drive_link',NULL,'soft_copy',NULL,NULL,1,NULL,NULL,'active','2025-09-28 21:58:09','2025-09-28 21:58:09','Pol andrei Bulong',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ALL',NULL,NULL,NULL),(91,2,10,'111','Request 4 Lan',NULL,NULL,'Admin','Pol Andrei Bulong','2025-09-29','https://drive.google.com/file/d/1Oy2KQDDQOuB8Y_02en_sZhDbYE8E80hf/view?usp=drive_link',NULL,'both',NULL,NULL,0,'11',NULL,'active','2025-09-28 23:12:59','2025-09-28 23:12:59','Pol andrei Bulong',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ALL',NULL,NULL,NULL),(92,1,NULL,'REPLY-1759101298709','ASDASD',NULL,NULL,'ad pol','System','2025-09-29','https://drive.google.com/file/d/1j4jFKRJ3gmKVOBu2yqZW0dB9R-_TdO8T/view?usp=drive_link','DASDASD','soft_copy',NULL,NULL,1,NULL,NULL,'active','2025-09-28 23:14:58','2025-09-28 23:14:58','ad pol',0,NULL,NULL,NULL,NULL,91,'action_response',11,'ALL',NULL,NULL,NULL),(93,2,NULL,'REF-1759102155579','New Document - Request 4 Vic',NULL,NULL,'Admin Lan Lan','Pol Andrei Bulong','2025-09-29','https://drive.google.com/file/d/1Xql5dZ823OwMQbOKPpcDo4FquEUXvIb6/view?usp=drive_link','Related to: Request 4 Vic','soft_copy',NULL,NULL,1,NULL,NULL,'active','2025-09-28 23:29:20','2025-09-28 23:29:20','Pol andrei Bulong',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ALL',NULL,NULL,NULL),(94,2,7,'11','Another Req',NULL,NULL,'Admin Lan Lan','Victoria','2025-09-29','https://drive.google.com/file/d/19QyFMqR8WsNYnaU26G8X09Gj_hYiZnhP/view?usp=drive_link',NULL,'hard_copy',NULL,NULL,0,'101',NULL,'active','2025-09-28 23:55:27','2025-09-28 23:55:27','Pol andrei Bulong',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ALL',NULL,NULL,NULL),(95,1,NULL,'REPLY-1759103772358','sasasasas',NULL,NULL,'sdf sdf','System','2025-09-29','https://drive.google.com/file/d/19QyFMqR8WsNYnaU26G8X09Gj_hYiZnhP/view?usp=drive_link','as','soft_copy',NULL,NULL,1,NULL,NULL,'active','2025-09-28 23:56:12','2025-09-28 23:56:12','sdf sdf',0,NULL,NULL,NULL,NULL,94,'action_response',101,'ALL',NULL,NULL,NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=103 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dms_user`
--

LOCK TABLES `dms_user` WRITE;
/*!40000 ALTER TABLE `dms_user` DISABLE KEYS */;
INSERT INTO `dms_user` VALUES (1,'https://lh3.googleusercontent.com/a/ACg8ocIhpD_184y_Edc-9RJod2dRMKXfsKksA7Z1AKaWM-5lc7srqUFH=s96-c','polandreiladera03@gmail.com','','Pol andrei Bulong','ADMIN LAN','LAN','09184226099',1,'ADMIN','2025-09-07 03:34:43','2025-09-12 20:36:31','active','yes',NULL,NULL),(3,'https://lh3.googleusercontent.com/a/ACg8ocLCtLZz7Zmt471wn_Ox2BYg5YUHStURu5kczNi_W3goIXHxvHw=s96-c','laderasanjuan03@gmail.com','','Levv1','asd','asd','1112121212',2,'DEAN','2025-09-07 03:42:46','2025-09-23 01:15:02','active','yes',NULL,NULL),(9,'https://lh3.googleusercontent.com/a/ACg8ocKY7FHsiOFJd8h-754VQgb1muTsSXKonCDewIZtAZ5GR1itVQ=s96-c','capstoneuser101@gmail.com','','capstone 101','casp','1','09184226085',1,'FACULTY','2025-09-14 22:22:57','2025-09-14 22:27:26','active','yes',NULL,NULL),(11,'https://lh3.googleusercontent.com/a/ACg8ocJgAiBETzRmatXaHQCEnhQAHqiISli8O_R1o7WzyaOC6LJFmXtg=s96-c','polsanjuanladera03@gmail.com','','Pol Andrei L. Bulong','ad','pol','09184226085',7,'FACULTY','2025-09-22 03:30:36','2025-09-22 03:30:56','active','yes',NULL,NULL),(25,'https://example.com/hsr/avatar01.png','hsr_trailblazer01@hsr.test','','hsr_trailblazer01','Himeko','Astral','09280000001',1,'FACULTY','2025-09-22 02:00:01','2025-09-22 02:00:01','active','yes',NULL,NULL),(26,'https://example.com/hsr/avatar02.png','hsr_trailblazer02@hsr.test','','hsr_trailblazer02','Welt','Yang','09280000002',2,'FACULTY','2025-09-22 02:01:02','2025-09-22 02:01:02','active','yes',NULL,NULL),(27,'https://example.com/hsr/avatar03.png','hsr_trailblazer03@hsr.test','','hsr_trailblazer03','March','Seven','09280000003',3,'FACULTY','2025-09-22 02:02:03','2025-09-22 02:02:03','active','yes',NULL,NULL),(28,'https://example.com/hsr/avatar04.png','hsr_trailblazer04@hsr.test','','hsr_trailblazer04','Dan','Heng','09280000004',4,'FACULTY','2025-09-22 02:03:04','2025-09-22 02:03:04','active','yes',NULL,NULL),(29,'https://example.com/hsr/avatar05.png','hsr_trailblazer05@hsr.test','','hsr_trailblazer05','Bronya','Rand','09280000005',5,'FACULTY','2025-09-22 02:04:05','2025-09-22 02:04:05','active','yes',NULL,NULL),(30,'https://example.com/hsr/avatar06.png','hsr_trailblazer06@hsr.test','','hsr_trailblazer06','Seele','Vollerei','09280000006',1,'FACULTY','2025-09-22 02:05:06','2025-09-22 02:05:06','active','yes',NULL,NULL),(31,'https://example.com/hsr/avatar07.png','hsr_trailblazer07@hsr.test','','hsr_trailblazer07','Kafka','Stellar','09280000007',2,'FACULTY','2025-09-22 02:06:07','2025-09-22 02:06:07','active','yes',NULL,NULL),(32,'https://example.com/hsr/avatar08.png','hsr_trailblazer08@hsr.test','','hsr_trailblazer08','Silver','Wolf','09280000008',3,'FACULTY','2025-09-22 02:07:08','2025-09-22 02:07:08','active','yes',NULL,NULL),(33,'https://example.com/hsr/avatar09.png','hsr_trailblazer09@hsr.test','','hsr_trailblazer09','Blade','Ebon','09280000009',4,'FACULTY','2025-09-22 02:08:09','2025-09-22 02:08:09','active','yes',NULL,NULL),(34,'https://example.com/hsr/avatar10.png','hsr_trailblazer10@hsr.test','','hsr_trailblazer10','Luocha','Seraph','09280000010',5,'FACULTY','2025-09-22 02:09:10','2025-09-22 02:09:10','active','yes',NULL,NULL),(35,'https://example.com/hsr/avatar11.png','hsr_trailblazer11@hsr.test','','hsr_trailblazer11','Clara','Guardian','09280000011',1,'FACULTY','2025-09-22 02:10:11','2025-09-22 02:10:11','active','yes',NULL,NULL),(36,'https://example.com/hsr/avatar12.png','hsr_trailblazer12@hsr.test','','hsr_trailblazer12','Sampo','Koski','09280000012',2,'FACULTY','2025-09-22 02:11:12','2025-09-22 02:11:12','active','yes',NULL,NULL),(37,'https://example.com/hsr/avatar13.png','hsr_trailblazer13@hsr.test','','hsr_trailblazer13','Tingyun','Aurora','09280000013',3,'FACULTY','2025-09-22 02:12:13','2025-09-22 02:12:13','active','yes',NULL,NULL),(38,'https://example.com/hsr/avatar14.png','hsr_trailblazer14@hsr.test','','hsr_trailblazer14','Jing','Yuan','09280000014',4,'FACULTY','2025-09-22 02:13:14','2025-09-22 02:13:14','active','yes',NULL,NULL),(39,'https://example.com/hsr/avatar15.png','hsr_trailblazer15@hsr.test','','hsr_trailblazer15','Yanqing','General','09280000015',5,'FACULTY','2025-09-22 02:14:15','2025-09-22 02:14:15','active','yes',NULL,NULL),(40,'https://example.com/hsr/avatar16.png','hsr_trailblazer16@hsr.test','','hsr_trailblazer16','Bailu','Draconic','09280000016',1,'FACULTY','2025-09-22 02:15:16','2025-09-27 01:25:04','deleted','yes',NULL,NULL),(41,'https://example.com/hsr/avatar17.png','hsr_trailblazer17@hsr.test','','hsr_trailblazer17','Qingque','Mahjong','09280000017',2,'FACULTY','2025-09-22 02:16:17','2025-09-22 02:16:17','active','yes',NULL,NULL),(42,'https://example.com/hsr/avatar18.png','hsr_trailblazer18@hsr.test','','hsr_trailblazer18','Herta','Genius','09280000018',3,'FACULTY','2025-09-22 02:17:18','2025-09-22 02:17:18','active','yes',NULL,NULL),(43,'https://example.com/hsr/avatar19.png','hsr_trailblazer19@hsr.test','','hsr_trailblazer19','Pela','Warrior','09280000019',4,'FACULTY','2025-09-22 02:18:19','2025-09-22 02:18:19','active','yes',NULL,NULL),(44,'https://example.com/hsr/avatar20.png','hsr_trailblazer20@hsr.test','','hsr_trailblazer20','Lynx','Support','09280000020',5,'FACULTY','2025-09-22 02:19:20','2025-09-22 02:19:20','active','yes',NULL,NULL),(45,'https://example.com/hsr/avatar21.png','hsr_trailblazer21@hsr.test','','hsr_trailblazer21','Topaz','Interastral','09280000021',1,'FACULTY','2025-09-22 03:00:21','2025-09-22 03:00:21','active','yes',NULL,NULL),(46,'https://example.com/hsr/avatar22.png','hsr_trailblazer22@hsr.test','','hsr_trailblazer22','Numby','Trotter','09280000022',2,'FACULTY','2025-09-22 03:01:22','2025-09-22 03:01:22','active','yes',NULL,NULL),(47,'https://example.com/hsr/avatar23.png','hsr_trailblazer23@hsr.test','','hsr_trailblazer23','Guinaifen','Performer','09280000023',3,'FACULTY','2025-09-22 03:02:23','2025-09-22 03:02:23','active','yes',NULL,NULL),(48,'https://example.com/hsr/avatar24.png','hsr_trailblazer24@hsr.test','','hsr_trailblazer24','Fu','Xuan','09280000024',4,'FACULTY','2025-09-22 03:03:24','2025-09-22 03:03:24','active','yes',NULL,NULL),(49,'https://example.com/hsr/avatar25.png','hsr_trailblazer25@hsr.test','','hsr_trailblazer25','Jingliu','Swordmaster','09280000025',5,'FACULTY','2025-09-22 03:04:25','2025-09-22 03:04:25','active','yes',NULL,NULL),(50,'https://example.com/hsr/avatar26.png','hsr_trailblazer26@hsr.test','','hsr_trailblazer26','Xueyi','Judge','09280000026',1,'FACULTY','2025-09-22 03:05:26','2025-09-22 03:05:26','active','yes',NULL,NULL),(51,'https://example.com/hsr/avatar27.png','hsr_trailblazer27@hsr.test','','hsr_trailblazer27','Dr.','Ratio','09280000027',2,'FACULTY','2025-09-22 03:06:27','2025-09-22 03:06:27','active','yes',NULL,NULL),(52,'https://example.com/hsr/avatar28.png','hsr_trailblazer28@hsr.test','','hsr_trailblazer28','Black','Swan','09280000028',3,'FACULTY','2025-09-22 03:07:28','2025-09-22 03:07:28','active','yes',NULL,NULL),(53,'https://example.com/hsr/avatar29.png','hsr_trailblazer29@hsr.test','','hsr_trailblazer29','Sparkle','Mask','09280000029',4,'FACULTY','2025-09-22 03:08:29','2025-09-22 03:08:29','active','yes',NULL,NULL),(54,'https://example.com/hsr/avatar30.png','hsr_trailblazer30@hsr.test','','hsr_trailblazer30','Aventurine','Casino','09280000030',5,'FACULTY','2025-09-22 03:09:30','2025-09-23 21:12:31','deleted','yes',NULL,NULL),(55,'https://example.com/hsr/avatar31.png','hsr_trailblazer31@hsr.test','','hsr_trailblazer31','Robin','Songstress','09280000031',1,'FACULTY','2025-09-22 03:10:31','2025-09-22 03:10:31','active','yes',NULL,NULL),(56,'https://example.com/hsr/avatar32.png','hsr_trailblazer32@hsr.test','','hsr_trailblazer32','Firefly','Stellar','09280000032',2,'FACULTY','2025-09-22 03:11:32','2025-09-22 03:11:32','active','yes',NULL,NULL),(57,'https://example.com/hsr/avatar33.png','hsr_trailblazer33@hsr.test','','hsr_trailblazer33','Ruan','Mei','09280000033',3,'FACULTY','2025-09-22 03:12:33','2025-09-22 03:12:33','active','yes',NULL,NULL),(58,'https://example.com/hsr/avatar34.png','hsr_trailblazer34@hsr.test','','hsr_trailblazer34','Gallagher','Medic','09280000034',4,'FACULTY','2025-09-22 03:13:34','2025-09-22 03:13:34','active','yes',NULL,NULL),(59,'https://example.com/hsr/avatar35.png','hsr_trailblazer35@hsr.test','','hsr_trailblazer35','Boothill','Cowboy','09280000035',5,'FACULTY','2025-09-22 03:14:35','2025-09-22 03:14:35','active','yes',NULL,NULL),(60,'https://example.com/hsr/avatar36.png','hsr_trailblazer36@hsr.test','','hsr_trailblazer36','Jade','Ten','09280000036',1,'FACULTY','2025-09-22 03:15:36','2025-09-22 03:15:36','active','yes',NULL,NULL),(61,'https://example.com/hsr/avatar37.png','hsr_trailblazer37@hsr.test','','hsr_trailblazer37','Misha','Belobog','09280000037',2,'FACULTY','2025-09-22 03:16:37','2025-09-22 03:16:37','active','yes',NULL,NULL),(62,'https://example.com/hsr/avatar38.png','hsr_trailblazer38@hsr.test','','hsr_trailblazer38','Sunday','Harmony','09280000038',3,'FACULTY','2025-09-22 03:17:38','2025-09-22 03:17:38','active','yes',NULL,NULL),(64,'https://example.com/hsr/avatar40.png','hsr_trailblazer40@hsr.test','','hsr_trailblazer40','Sam','Mecha','09280000040',5,'FACULTY','2025-09-22 03:19:40','2025-09-22 03:19:40','active','yes',NULL,NULL),(65,'https://example.com/hsr/avatar41.png','hsr_trailblazer41@hsr.test','','hsr_trailblazer41','Jing','Yuan','09280000041',1,'FACULTY','2025-09-22 03:20:41','2025-09-22 03:20:41','active','yes',NULL,NULL),(66,'https://example.com/hsr/avatar42.png','hsr_trailblazer42@hsr.test','','hsr_trailblazer42','Yanqing','Prodigy','09280000042',2,'FACULTY','2025-09-22 03:21:42','2025-09-22 03:21:42','active','yes',NULL,NULL),(67,'https://example.com/hsr/avatar43.png','hsr_trailblazer43@hsr.test','','hsr_trailblazer43','Dan','Heng','09280000043',3,'FACULTY','2025-09-22 03:22:43','2025-09-22 03:22:43','active','yes',NULL,NULL),(68,'https://example.com/hsr/avatar44.png','hsr_trailblazer44@hsr.test','','hsr_trailblazer44','March','Seven','09280000044',4,'FACULTY','2025-09-22 03:23:44','2025-09-22 03:23:44','active','yes',NULL,NULL),(69,'https://example.com/hsr/avatar45.png','hsr_trailblazer45@hsr.test','','hsr_trailblazer45','Kafka','Hunter','09280000045',5,'FACULTY','2025-09-22 03:24:45','2025-09-22 03:24:45','active','yes',NULL,NULL),(70,'https://example.com/hsr/avatar46.png','hsr_trailblazer46@hsr.test','','hsr_trailblazer46','Silver','Wolf','09280000046',1,'FACULTY','2025-09-22 03:25:46','2025-09-22 03:25:46','active','yes',NULL,NULL),(71,'https://example.com/hsr/avatar47.png','hsr_trailblazer47@hsr.test','','hsr_trailblazer47','Clara','Stellaron','09280000047',2,'FACULTY','2025-09-22 03:26:47','2025-09-22 03:26:47','active','yes',NULL,NULL),(72,'https://example.com/hsr/avatar48.png','hsr_trailblazer48@hsr.test','','hsr_trailblazer48','Svarog','Guardian','09280000048',3,'FACULTY','2025-09-22 03:27:48','2025-09-22 03:27:48','active','yes',NULL,NULL),(73,'https://example.com/hsr/avatar49.png','hsr_trailblazer49@hsr.test','','hsr_trailblazer49','Himeko','Navigator','09280000049',4,'FACULTY','2025-09-22 03:28:49','2025-09-22 03:28:49','active','yes',NULL,NULL),(74,'https://example.com/hsr/avatar50.png','hsr_trailblazer50@hsr.test','','hsr_trailblazer50','Welt','Yang','09280000050',5,'FACULTY','2025-09-22 03:29:50','2025-09-22 03:29:50','active','yes',NULL,NULL),(75,'https://example.com/hsr/avatar51.png','hsr_trailblazer51@hsr.test','','hsr_trailblazer51','Bronya','Rand','09280000051',1,'FACULTY','2025-09-22 03:30:51','2025-09-22 03:30:51','active','yes',NULL,NULL),(76,'https://example.com/hsr/avatar52.png','hsr_trailblazer52@hsr.test','','hsr_trailblazer52','Seele','Butterfly','09280000052',2,'FACULTY','2025-09-22 03:31:52','2025-09-22 03:31:52','active','yes',NULL,NULL),(77,'https://example.com/hsr/avatar53.png','hsr_trailblazer53@hsr.test','','hsr_trailblazer53','Serval','Rockstar','09280000053',3,'FACULTY','2025-09-22 03:32:53','2025-09-22 03:32:53','active','yes',NULL,NULL),(78,'https://example.com/hsr/avatar54.png','hsr_trailblazer54@hsr.test','','hsr_trailblazer54','Natasha','Medic','09280000054',4,'FACULTY','2025-09-22 03:33:54','2025-09-22 03:33:54','active','yes',NULL,NULL),(79,'https://example.com/hsr/avatar55.png','hsr_trailblazer55@hsr.test','','hsr_trailblazer55','Pela','Analyst','09280000055',5,'FACULTY','2025-09-22 03:34:55','2025-09-22 03:34:55','active','yes',NULL,NULL),(80,'https://example.com/hsr/avatar56.png','hsr_trailblazer56@hsr.test','','hsr_trailblazer56','Hook','Mole','09280000056',1,'FACULTY','2025-09-22 03:35:56','2025-09-22 03:35:56','active','yes',NULL,NULL),(81,'https://example.com/hsr/avatar57.png','hsr_trailblazer57@hsr.test','','hsr_trailblazer57','Sampo','Merchant','09280000057',2,'FACULTY','2025-09-22 03:36:57','2025-09-22 03:36:57','active','yes',NULL,NULL),(82,'https://example.com/hsr/avatar58.png','hsr_trailblazer58@hsr.test','','hsr_trailblazer58','Gepard','Knight','09280000058',3,'FACULTY','2025-09-22 03:37:58','2025-09-22 03:37:58','active','yes',NULL,NULL),(83,'https://example.com/hsr/avatar59.png','hsr_trailblazer59@hsr.test','','hsr_trailblazer59','Lynx','Explorer','09280000059',4,'FACULTY','2025-09-22 03:38:59','2025-09-22 03:38:59','active','yes',NULL,NULL),(84,'https://example.com/hsr/avatar60.png','hsr_trailblazer60@hsr.test','','hsr_trailblazer60','Luka','Boxer','09280000060',5,'FACULTY','0000-00-00 00:00:00','0000-00-00 00:00:00','active','yes',NULL,NULL),(85,'https://example.com/hsr/avatar61.png','hsr_trailblazer61@hsr.test','','hsr_trailblazer61','Yukong','Helm','09280000061',1,'FACULTY','0000-00-00 00:00:00','0000-00-00 00:00:00','active','yes',NULL,NULL),(86,'https://example.com/hsr/avatar62.png','hsr_trailblazer62@hsr.test','','hsr_trailblazer62','Qingque','Gambler','09280000062',2,'FACULTY','0000-00-00 00:00:00','0000-00-00 00:00:00','active','yes',NULL,NULL),(87,'https://example.com/hsr/avatar63.png','hsr_trailblazer63@hsr.test','','hsr_trailblazer63','Tingyun','Broker','09280000063',3,'FACULTY','0000-00-00 00:00:00','0000-00-00 00:00:00','active','yes',NULL,NULL),(88,'https://example.com/hsr/avatar64.png','hsr_trailblazer64@hsr.test','','hsr_trailblazer64','Bailu','Healer','09280000064',4,'FACULTY','0000-00-00 00:00:00','2025-09-23 21:20:36','deleted','yes',NULL,NULL),(89,'https://example.com/hsr/avatar65.png','hsr_trailblazer65@hsr.test','','hsr_trailblazer65','Yan','Shou','09280000065',5,'FACULTY','0000-00-00 00:00:00','0000-00-00 00:00:00','active','yes',NULL,NULL),(90,'https://example.com/hsr/avatar66.png','hsr_trailblazer66@hsr.test','','hsr_trailblazer66','Huohuo','Exorcist','09280000066',1,'FACULTY','0000-00-00 00:00:00','0000-00-00 00:00:00','active','yes',NULL,NULL),(93,'https://example.com/hsr/avatar69.png','hsr_trailblazer69@hsr.test','','hsr_trailblazer69','Sushang','Knight','09280000069',4,'FACULTY','0000-00-00 00:00:00','0000-00-00 00:00:00','active','yes',NULL,NULL),(94,'https://example.com/hsr/avatar70.png','hsr_trailblazer70@hsr.test','','hsr_trailblazer70','Herta','Genius','09280000070',5,'FACULTY','0000-00-00 00:00:00','0000-00-00 00:00:00','active','yes',NULL,NULL),(95,'https://example.com/hsr/avatar71.png','hsr_trailblazer71@hsr.test','','hsr_trailblazer71','Luocha','Merchant','09280000071',1,'FACULTY','0000-00-00 00:00:00','0000-00-00 00:00:00','active','yes',NULL,NULL),(96,'https://example.com/hsr/avatar72.png','hsr_trailblazer72@hsr.test','','hsr_trailblazer72','Imbibitor','Lunae','09280000072',2,'FACULTY','0000-00-00 00:00:00','0000-00-00 00:00:00','active','yes',NULL,NULL),(97,'https://example.com/hsr/avatar73.png','hsr_trailblazer73@hsr.test','','hsr_trailblazer73','Dan','Shu','09280000073',3,'FACULTY','0000-00-00 00:00:00','0000-00-00 00:00:00','active','yes',NULL,NULL),(98,'https://example.com/hsr/avatar74.png','hsr_trailblazer74@hsr.test','','hsr_trailblazer74','Phantom','Edge','09280000074',4,'FACULTY','0000-00-00 00:00:00','0000-00-00 00:00:00','active','yes',NULL,NULL),(101,'https://lh3.googleusercontent.com/a/ACg8ocLEtatCeMtXksrYW6U6JJqP0yRA92tumSUftqgGPHQuMyX53FA=s96-c','victoriyaklauss03@gmail.com','','Victoriya Visha Von Klauss','sdf','sdf','0918111',2,'DEAN','2025-09-23 02:26:00','2025-09-27 02:20:08','active','yes',NULL,NULL),(102,'https://lh3.googleusercontent.com/a/ACg8ocLV-XDgqUWjRyS9kVC_pJNkjOG7n6LJVcVeD7mWS9FDJ30CerUs=s96-c','mainlan03@gmail.com','','Admin Lan','','',NULL,4,'DEAN','2025-09-23 03:18:22','2025-09-23 23:25:25','active','yes',NULL,NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_actions`
--

LOCK TABLES `document_actions` WRITE;
/*!40000 ALTER TABLE `document_actions` DISABLE KEYS */;
INSERT INTO `document_actions` VALUES (8,88,12,101,NULL,NULL,'completed','medium',NULL,'2025-09-29 05:52:35',101,NULL,'2025-09-28 21:01:49','2025-09-28 21:52:35',1),(9,91,10,11,NULL,NULL,'completed','medium',NULL,'2025-09-29 07:14:58',11,NULL,'2025-09-28 23:12:59','2025-09-28 23:14:58',1),(10,94,16,101,NULL,NULL,'completed','medium',NULL,'2025-09-29 07:56:12',101,NULL,'2025-09-28 23:55:27','2025-09-28 23:56:12',1);
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
INSERT INTO `document_departments` VALUES (34,1),(35,1),(36,1),(37,1),(38,1),(39,1),(40,1),(41,1),(42,1),(43,1),(83,2),(84,2),(87,1),(87,2),(87,3);
/*!40000 ALTER TABLE `document_departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_folders`
--

DROP TABLE IF EXISTS `document_folders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `document_folders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `doc_id` int(11) NOT NULL,
  `folder_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_doc` (`doc_id`),
  KEY `idx_folder` (`folder_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_folders`
--

LOCK TABLES `document_folders` WRITE;
/*!40000 ALTER TABLE `document_folders` DISABLE KEYS */;
INSERT INTO `document_folders` VALUES (8,87,8,'2025-09-28 07:53:15'),(9,87,6,'2025-09-28 07:53:15'),(10,87,4,'2025-09-28 07:53:31'),(11,88,5,'2025-09-28 21:01:49'),(12,90,8,'2025-09-28 21:58:09'),(13,91,10,'2025-09-28 23:12:59'),(14,94,7,'2025-09-28 23:55:27');
/*!40000 ALTER TABLE `document_folders` ENABLE KEYS */;
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
INSERT INTO `document_roles` VALUES (44,'FACULTY'),(45,'FACULTY'),(46,'FACULTY'),(47,'FACULTY'),(48,'FACULTY'),(49,'FACULTY'),(50,'FACULTY'),(51,'FACULTY'),(52,'FACULTY'),(53,'FACULTY'),(54,'ADMIN'),(55,'ADMIN'),(56,'ADMIN'),(57,'ADMIN'),(58,'ADMIN'),(59,'ADMIN'),(60,'ADMIN'),(61,'ADMIN'),(62,'ADMIN'),(63,'ADMIN');
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
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`type_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_types`
--

LOCK TABLES `document_types` WRITE;
/*!40000 ALTER TABLE `document_types` DISABLE KEYS */;
INSERT INTO `document_types` VALUES (1,'MEMO',NULL,'2025-09-29 00:02:46','2025-09-29 00:02:46'),(2,'Request',NULL,'2025-09-29 00:02:46','2025-09-29 00:02:46'),(3,'Report',NULL,'2025-09-29 00:02:46','2025-09-29 00:02:46'),(4,'Clearance',NULL,'2025-09-29 00:02:46','2025-09-29 00:02:46'),(5,'Letter',NULL,'2025-09-29 00:02:46','2025-09-29 00:02:46'),(6,'Notice',NULL,'2025-09-29 00:02:46','2025-09-29 00:02:46'),(7,'Resolution',NULL,'2025-09-29 00:02:46','2025-09-29 00:02:46'),(8,'Proposal',NULL,'2025-09-29 00:02:46','2025-09-29 00:02:46'),(9,'Guidelines',NULL,'2025-09-29 00:02:46','2025-09-29 00:02:46'),(10,'Policy',NULL,'2025-09-29 00:02:46','2025-09-29 00:02:46'),(11,'Certificate',NULL,'2025-09-29 00:02:46','2025-09-29 00:02:46'),(12,'LOG',NULL,'2025-09-29 00:02:46','2025-09-29 00:02:46'),(13,'POEM',NULL,'2025-09-29 00:02:46','2025-09-29 00:02:46'),(14,'PROGRESSS',NULL,'2025-09-29 00:02:46','2025-09-29 00:02:46'),(15,'Ssad','','2025-09-29 02:29:39','2025-09-29 02:29:39');
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
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `folders`
--

LOCK TABLES `folders` WRITE;
/*!40000 ALTER TABLE `folders` DISABLE KEYS */;
INSERT INTO `folders` VALUES (1,'2025','2025-09-07 09:17:03','2025-09-07 09:17:03'),(2,'2026','2025-09-14 09:51:03','2025-09-14 09:51:03'),(3,'Finance Records','2025-09-23 01:48:31','2025-09-23 01:48:31'),(4,'Human Resources','2025-09-23 01:48:31','2025-09-23 01:48:31'),(5,'Student Affairs','2025-09-23 01:48:31','2025-09-23 01:48:31'),(6,'Faculty Development','2025-09-23 01:48:31','2025-09-23 01:48:31'),(7,'Research and Extension','2025-09-23 01:48:31','2025-09-23 01:48:31'),(8,'Administrative Orders','2025-09-23 01:48:31','2025-09-23 01:48:31'),(9,'Memorandums','2025-09-23 01:48:31','2025-09-23 01:48:31'),(10,'Procurement','2025-09-23 01:48:31','2025-09-23 01:48:31'),(11,'Legal Documents','2025-09-23 01:48:31','2025-09-23 01:48:31'),(12,'Archived Records','2025-09-23 01:48:31','2025-09-23 01:48:31');
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
  KEY `idx_nd_notif` (`notification_id`),
  KEY `idx_nd_dept` (`department_id`),
  CONSTRAINT `notification_departments_ibfk_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`) ON DELETE CASCADE,
  CONSTRAINT `notification_departments_ibfk_notification` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`notification_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_departments`
--

LOCK TABLES `notification_departments` WRITE;
/*!40000 ALTER TABLE `notification_departments` DISABLE KEYS */;
INSERT INTO `notification_departments` VALUES (25,1),(28,1),(61,2),(63,2),(64,2),(85,2),(108,1),(109,1),(109,2),(109,3);
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
INSERT INTO `notification_reads` VALUES (22,1,'2025-09-28 06:31:20'),(22,3,'2025-09-23 09:56:22'),(22,9,'2025-09-27 03:02:11'),(22,11,'2025-09-23 09:41:09'),(22,101,'2025-09-29 05:12:40'),(24,1,'2025-09-28 06:31:20'),(24,3,'2025-09-23 09:56:22'),(24,9,'2025-09-27 03:02:11'),(24,11,'2025-09-23 09:41:09'),(24,101,'2025-09-29 05:12:40'),(25,1,'2025-09-28 06:31:20'),(25,9,'2025-09-27 03:02:11'),(25,11,'2025-09-23 09:41:09'),(26,1,'2025-09-28 06:31:20'),(26,3,'2025-09-23 09:56:22'),(26,9,'2025-09-27 03:02:11'),(26,11,'2025-09-23 09:41:09'),(26,101,'2025-09-29 05:12:40'),(27,1,'2025-09-28 06:31:20'),(27,3,'2025-09-23 09:56:22'),(27,9,'2025-09-27 03:02:11'),(27,11,'2025-09-23 09:41:09'),(27,101,'2025-09-29 05:12:40'),(28,1,'2025-09-28 06:31:20'),(28,9,'2025-09-27 03:02:11'),(29,1,'2025-09-28 06:31:20'),(29,3,'2025-09-23 09:56:22'),(29,9,'2025-09-27 03:02:11'),(29,11,'2025-09-23 09:41:09'),(29,101,'2025-09-29 05:12:40'),(37,1,'2025-09-28 06:31:20'),(37,3,'2025-09-23 09:56:22'),(37,9,'2025-09-27 03:02:11'),(37,11,'2025-09-23 09:41:09'),(37,101,'2025-09-29 05:12:40'),(38,1,'2025-09-28 06:31:20'),(38,3,'2025-09-23 09:56:22'),(38,9,'2025-09-27 03:02:11'),(38,11,'2025-09-23 09:41:09'),(38,101,'2025-09-29 05:12:40'),(39,1,'2025-09-28 06:31:20'),(39,3,'2025-09-23 09:56:22'),(39,9,'2025-09-27 03:02:11'),(39,11,'2025-09-23 09:41:09'),(39,101,'2025-09-29 05:12:40'),(41,1,'2025-09-28 06:31:20'),(41,3,'2025-09-23 09:56:22'),(41,9,'2025-09-27 03:02:11'),(41,11,'2025-09-23 09:41:09'),(41,101,'2025-09-29 05:12:40'),(42,1,'2025-09-28 06:31:20'),(42,3,'2025-09-23 09:56:22'),(42,9,'2025-09-27 03:02:11'),(42,11,'2025-09-23 09:41:09'),(42,101,'2025-09-29 05:12:40'),(43,1,'2025-09-28 06:31:20'),(43,3,'2025-09-23 09:56:22'),(43,9,'2025-09-27 03:02:11'),(43,11,'2025-09-23 09:41:09'),(43,101,'2025-09-29 05:12:40'),(44,1,'2025-09-28 06:31:20'),(44,3,'2025-09-23 09:56:22'),(44,9,'2025-09-27 03:02:11'),(44,11,'2025-09-23 09:41:09'),(44,101,'2025-09-29 05:12:40'),(45,1,'2025-09-28 06:31:20'),(45,3,'2025-09-23 09:56:22'),(45,9,'2025-09-27 03:02:11'),(45,11,'2025-09-23 09:41:09'),(45,101,'2025-09-29 05:12:40'),(46,1,'2025-09-28 06:31:20'),(46,3,'2025-09-23 09:56:22'),(46,9,'2025-09-27 03:02:11'),(46,11,'2025-09-23 09:41:09'),(46,101,'2025-09-29 05:12:40'),(47,1,'2025-09-28 06:31:20'),(47,3,'2025-09-23 09:56:22'),(47,9,'2025-09-27 03:02:11'),(47,11,'2025-09-23 09:41:09'),(47,101,'2025-09-29 05:12:40'),(48,1,'2025-09-28 06:31:20'),(48,3,'2025-09-23 09:56:22'),(48,9,'2025-09-27 03:02:11'),(48,11,'2025-09-23 09:41:09'),(48,101,'2025-09-29 05:12:40'),(49,1,'2025-09-28 06:31:20'),(49,3,'2025-09-23 09:56:22'),(49,9,'2025-09-27 03:02:11'),(49,11,'2025-09-23 09:41:09'),(49,101,'2025-09-29 05:12:40'),(50,1,'2025-09-28 06:31:20'),(50,3,'2025-09-23 09:56:22'),(50,9,'2025-09-27 03:02:11'),(50,11,'2025-09-23 09:41:09'),(50,101,'2025-09-29 05:12:40'),(51,11,'2025-09-23 09:41:09'),(52,3,'2025-09-23 09:56:22'),(52,11,'2025-09-23 09:50:15'),(53,3,'2025-09-23 09:56:22'),(53,11,'2025-09-23 09:41:09'),(54,3,'2025-09-23 09:56:22'),(54,11,'2025-09-23 09:41:09'),(55,3,'2025-09-23 09:56:22'),(55,11,'2025-09-23 09:53:04'),(56,3,'2025-09-23 09:56:22'),(56,11,'2025-09-23 09:53:05'),(57,3,'2025-09-23 09:56:22'),(57,11,'2025-09-23 09:53:06'),(58,3,'2025-09-23 09:56:22'),(58,11,'2025-09-23 09:53:07'),(59,3,'2025-09-23 09:56:22'),(59,11,'2025-09-27 01:34:56'),(60,1,'2025-09-28 06:31:20'),(60,9,'2025-09-27 03:02:11'),(60,101,'2025-09-29 05:12:40'),(61,101,'2025-09-29 05:12:40'),(62,1,'2025-09-28 06:31:20'),(62,9,'2025-09-27 03:02:11'),(62,101,'2025-09-29 05:12:40'),(63,1,'2025-09-28 06:31:20'),(63,101,'2025-09-29 05:12:40'),(64,1,'2025-09-28 06:31:20'),(64,101,'2025-09-29 05:12:40'),(65,1,'2025-09-28 06:31:20'),(65,101,'2025-09-29 05:12:40'),(66,1,'2025-09-28 06:31:20'),(66,101,'2025-09-29 05:12:40'),(67,1,'2025-09-28 06:31:20'),(67,101,'2025-09-29 05:12:40'),(68,1,'2025-09-28 06:31:20'),(68,101,'2025-09-29 05:12:40'),(69,1,'2025-09-28 06:31:20'),(69,101,'2025-09-29 05:12:40'),(72,1,'2025-09-28 06:31:20'),(72,101,'2025-09-29 05:12:40'),(73,1,'2025-09-28 06:31:20'),(73,101,'2025-09-29 05:12:40'),(74,1,'2025-09-28 06:31:20'),(74,101,'2025-09-29 05:12:40'),(75,1,'2025-09-28 06:31:20'),(75,101,'2025-09-29 05:12:40'),(76,1,'2025-09-28 06:31:20'),(76,101,'2025-09-29 05:12:40'),(77,1,'2025-09-28 06:31:20'),(77,101,'2025-09-29 05:12:40'),(78,1,'2025-09-28 06:31:20'),(78,101,'2025-09-29 05:12:40'),(79,1,'2025-09-28 06:31:20'),(79,101,'2025-09-29 05:12:40'),(81,1,'2025-09-28 06:31:20'),(81,101,'2025-09-29 05:12:40'),(82,1,'2025-09-28 06:31:20'),(82,101,'2025-09-29 05:12:40'),(83,1,'2025-09-28 06:31:20'),(83,101,'2025-09-29 05:12:40'),(84,1,'2025-09-28 06:31:20'),(84,101,'2025-09-29 05:12:40'),(85,1,'2025-09-28 06:31:20'),(85,101,'2025-09-29 05:12:40'),(86,1,'2025-09-28 06:31:20'),(86,101,'2025-09-29 05:12:40'),(87,1,'2025-09-28 06:31:20'),(87,101,'2025-09-29 05:12:40'),(88,1,'2025-09-28 06:31:20'),(88,101,'2025-09-29 05:12:40'),(89,1,'2025-09-28 06:31:20'),(89,101,'2025-09-29 05:12:40'),(90,1,'2025-09-28 06:31:20'),(90,101,'2025-09-29 05:12:40'),(94,1,'2025-09-28 06:31:20'),(94,101,'2025-09-29 05:12:40'),(95,1,'2025-09-28 06:31:20'),(95,101,'2025-09-29 05:12:40'),(96,1,'2025-09-28 06:31:20'),(96,101,'2025-09-29 05:12:40'),(97,1,'2025-09-28 06:31:20'),(97,101,'2025-09-29 05:12:40'),(98,1,'2025-09-28 06:31:20'),(98,101,'2025-09-29 05:12:40'),(99,1,'2025-09-28 06:31:20'),(99,101,'2025-09-29 05:12:40'),(100,1,'2025-09-28 06:31:20'),(100,101,'2025-09-29 05:12:40'),(101,1,'2025-09-28 06:31:20'),(101,101,'2025-09-29 05:12:40'),(102,1,'2025-09-28 06:31:20'),(102,101,'2025-09-29 05:12:40'),(103,1,'2025-09-28 06:31:20'),(103,101,'2025-09-29 05:12:40'),(104,1,'2025-09-28 06:31:20'),(104,101,'2025-09-29 05:12:40'),(105,1,'2025-09-28 06:31:20'),(105,101,'2025-09-29 05:12:40'),(106,1,'2025-09-28 06:31:20'),(106,101,'2025-09-29 05:12:40'),(107,1,'2025-09-28 06:31:20'),(107,101,'2025-09-29 05:12:40'),(108,1,'2025-09-28 06:31:20'),(109,1,'2025-09-28 06:31:20'),(109,101,'2025-09-29 05:12:40'),(110,101,'2025-09-29 05:12:40'),(111,101,'2025-09-29 05:12:40'),(112,101,'2025-09-29 05:12:40'),(113,1,'2025-09-28 23:15:31'),(113,101,'2025-09-29 05:12:40'),(117,1,'2025-09-28 23:56:35'),(117,101,'2025-09-29 05:12:40'),(118,101,'2025-09-29 05:12:40'),(119,101,'2025-09-29 05:12:40');
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
  KEY `idx_nr_notif` (`notification_id`),
  KEY `idx_nr_role` (`role`),
  CONSTRAINT `notification_roles_ibfk_notification` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`notification_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_roles`
--

LOCK TABLES `notification_roles` WRITE;
/*!40000 ALTER TABLE `notification_roles` DISABLE KEYS */;
INSERT INTO `notification_roles` VALUES (25,'FACULTY'),(63,'ADMIN'),(64,'ADMIN'),(85,'ADMIN');
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
  KEY `idx_nu_notif` (`notification_id`),
  KEY `idx_nu_user` (`user_id`),
  CONSTRAINT `notification_users_ibfk_notification` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`notification_id`) ON DELETE CASCADE,
  CONSTRAINT `notification_users_ibfk_user` FOREIGN KEY (`user_id`) REFERENCES `dms_user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_users`
--

LOCK TABLES `notification_users` WRITE;
/*!40000 ALTER TABLE `notification_users` DISABLE KEYS */;
INSERT INTO `notification_users` VALUES (51,11),(52,3),(52,11),(53,3),(53,11),(54,3),(54,11),(55,3),(55,11),(56,3),(56,11),(57,3),(57,11),(58,3),(58,11),(59,3),(59,11),(91,11),(92,3),(92,11),(93,11),(110,101),(111,101),(112,101),(114,11),(115,11),(116,11),(118,101),(119,101);
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
  `type` enum('added','updated','deleted','requested','replied') NOT NULL,
  `visible_to_all` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `related_doc_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`notification_id`),
  KEY `idx_type` (`type`),
  KEY `idx_visible_to_all` (`visible_to_all`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_related_doc_id` (`related_doc_id`),
  CONSTRAINT `notifications_ibfk_doc` FOREIGN KEY (`related_doc_id`) REFERENCES `dms_documents` (`doc_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=121 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (22,'New Announcement: ALL MEMBERS','A new announcement \"ALL MEMBERS\" has been created by ADMIN LAN','added',1,'2025-09-07 09:15:50',NULL),(24,'New Announcement: ALL','A new announcement \"ALL\" has been created by ADMIN LAN','added',1,'2025-09-07 10:09:55',NULL),(25,'New Announcement: again','A new announcement \"again\" has been created by ADMIN LAN','added',0,'2025-09-07 10:12:18',NULL),(26,'New Announcement: wqe','A new announcement \"wqe\" has been created by ADMIN LAN','added',1,'2025-09-07 11:56:47',NULL),(27,'New Announcement: das','A new announcement \"das\" has been created by ADMIN LAN','added',1,'2025-09-07 11:58:20',NULL),(28,'New Announcement: das','A new announcement \"das\" has been created by ADMIN LAN','added',0,'2025-09-07 12:01:44',NULL),(29,'New Announcement: das','A new announcement \"das\" has been created by ADMIN LAN','added',1,'2025-09-07 12:02:03',NULL),(37,'New Document Added: asd','A new document \"asd\" has been uploaded by Pol andrei Bulong','added',1,'2025-09-10 10:02:10',21),(38,'New Document Added: teesy','A new document \"teesy\" has been uploaded by Pol andrei Bulong','added',1,'2025-09-12 21:01:29',22),(39,'New Document Added: TEST 1','A new document \"TEST 1\" has been uploaded by Pol andrei Bulong','added',1,'2025-09-14 08:47:17',23),(41,'New Document Added: FOR USER YOU ONLY','A new document \"FOR USER YOU ONLY\" has been uploaded by Pol andrei Bulong','added',1,'2025-09-23 03:15:02',64),(42,'New Document Added: TRE','A new document \"TRE\" has been uploaded by Pol andrei Bulong','added',1,'2025-09-23 03:17:06',65),(43,'New Document Added: sadas adpol','A new document \"sadas adpol\" has been uploaded by Pol andrei Bulong','added',1,'2025-09-23 03:20:31',66),(44,'New Document Added: sdf','A new document \"sdf\" has been uploaded by Pol andrei Bulong','added',1,'2025-09-23 03:23:35',67),(45,'New Document Added: pol','A new document \"pol\" has been uploaded by Pol andrei Bulong','added',1,'2025-09-23 07:21:30',68),(46,'New Document Added: asda','A new document \"asda\" has been uploaded by Pol andrei Bulong','added',1,'2025-09-23 07:30:59',69),(47,'New Document Added: asd','A new document \"asd\" has been uploaded by Pol andrei Bulong','added',1,'2025-09-23 07:39:29',70),(48,'New Document Added: FOR LEVV1','A new document \"FOR LEVV1\" has been uploaded by Pol andrei Bulong','added',1,'2025-09-23 07:41:42',71),(49,'New Document Added: please notify for levvi only','A new document \"please notify for levvi only\" has been uploaded by Pol andrei Bulong','added',1,'2025-09-23 09:08:03',72),(50,'New Document Added: FOR ALL','A new document \"FOR ALL\" has been uploaded by Pol andrei Bulong','added',1,'2025-09-23 09:32:43',73),(51,'New Document Added: for ONLY ONE','A new document \"for ONLY ONE\" has been uploaded by Pol andrei Bulong','added',0,'2025-09-23 09:33:59',74),(52,'New Document Added: FOR LEEVII - Link 1','A new document \"FOR LEEVII - Link 1\" has been uploaded by Pol andrei Bulong','added',0,'2025-09-23 09:39:26',75),(53,'New Document Added: FOR LEEVII - Link 2','A new document \"FOR LEEVII - Link 2\" has been uploaded by Pol andrei Bulong','added',0,'2025-09-23 09:39:26',76),(54,'New Document Added: FOR LEEVII - Link 3','A new document \"FOR LEEVII - Link 3\" has been uploaded by Pol andrei Bulong','added',0,'2025-09-23 09:39:26',77),(55,'New Document Added: TESINT - Link 1','A new document \"TESINT - Link 1\" has been uploaded by Pol andrei Bulong','added',0,'2025-09-23 09:52:09',78),(56,'New Document Added: TESINT - Link 2','A new document \"TESINT - Link 2\" has been uploaded by Pol andrei Bulong','added',0,'2025-09-23 09:52:09',79),(57,'New Document Added: TESINT - Link 3','A new document \"TESINT - Link 3\" has been uploaded by Pol andrei Bulong','added',0,'2025-09-23 09:52:09',80),(58,'New Document Added: TESINT - Link 4','A new document \"TESINT - Link 4\" has been uploaded by Pol andrei Bulong','added',0,'2025-09-23 09:52:09',81),(59,'New Document Added: TESINT - Link 5','A new document \"TESINT - Link 5\" has been uploaded by Pol andrei Bulong','added',0,'2025-09-23 09:52:09',82),(60,'New Announcement: asd','Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.','',1,'2025-09-26 20:59:03',21),(61,'New Announcement: DEAN CASS','Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.\n\nLorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.\n\nLorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.\n\nLorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.\n\nLorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.','',0,'2025-09-27 01:34:02',22),(62,'New Announcement: TEST 1 FOR ALL AGAIN, agian','Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.\n\nLorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.\n\nLorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.\n\nLorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.\n\nLorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.','',1,'2025-09-27 01:56:08',23),(63,'New Document Added: 213','A new document \"213\" has been uploaded by Victoriya Visha Von Klauss','added',0,'2025-09-27 02:33:38',83),(64,'New Document Added: CBME','A new document \"CBME\" has been uploaded by Victoriya Visha Von Klauss','added',0,'2025-09-27 03:01:59',84),(65,'New Document Added: ASDAS','A new document \"ASDAS\" has been uploaded by Pol andrei Bulong','added',1,'2025-09-27 03:46:21',85),(66,'New Document Added: ASDASDAAAAA','A new document \"ASDASDAAAAA\" has been uploaded by Pol andrei Bulong','added',1,'2025-09-27 03:53:04',86),(67,'Document Moved to Trashcan','Document \"TESINT - Link 1\" has been moved to trashcan by Pol andrei Bulong','deleted',1,'2025-09-27 10:01:18',78),(68,'Document Moved to Trashcan','Document \"Asdasdaaaaa\" has been moved to trashcan by Pol andrei Bulong','deleted',1,'2025-09-27 10:01:48',86),(69,'Document Moved to Trashcan','Document \"ASDAS\" has been moved to trashcan by Pol andrei Bulong','deleted',1,'2025-09-27 10:10:11',85),(72,'Document Restored','Document \"ASDAS\" has been restored by Pol andrei Bulong','updated',1,'2025-09-27 10:10:37',85),(73,'Document Restored','Document \"Asdasdaaaaa\" has been restored by Pol andrei Bulong','updated',1,'2025-09-27 10:10:57',86),(74,'Document Restored','Document \"TESINT - Link 1\" has been restored by Pol andrei Bulong','updated',1,'2025-09-27 10:10:58',78),(75,'Document Moved to Trashcan','Document \"Asdasdaaaaa\" has been moved to trashcan by Pol andrei Bulong','deleted',1,'2025-09-27 10:11:11',86),(76,'Document Restored','Document \"Asdasdaaaaa\" has been restored by Pol andrei Bulong','updated',1,'2025-09-27 10:11:15',86),(77,'Document Moved to Trashcan','Document \"CBME\" has been moved to trashcan by Pol andrei Bulong','deleted',1,'2025-09-27 19:37:54',84),(78,'Document Moved to Trashcan','Document \"213\" has been moved to trashcan by Pol andrei Bulong','deleted',1,'2025-09-27 19:38:10',83),(79,'Document Restored','Document \"CBME\" has been restored by Pol andrei Bulong','updated',1,'2025-09-27 19:38:31',84),(81,'Document Moved to Trashcan','Document \"Resolution: Admin Policy Update\" has been moved to trashcan by Pol andrei Bulong','deleted',1,'2025-09-27 19:39:46',29),(82,'Document Moved to Trashcan','Document \"ASDAS\" has been moved to trashcan by Pol andrei Bulong','deleted',1,'2025-09-27 19:51:03',85),(83,'Document Restored','Document \"Resolution: Admin Policy Update\" has been restored by Pol andrei Bulong','updated',1,'2025-09-27 20:01:23',29),(84,'Document Moved to Trashcan','Document \"Asdasdaaaaa\" has been moved to trashcan by Pol andrei Bulong','deleted',1,'2025-09-27 20:01:34',86),(85,'Document Updated: CBMEzz22','The document \"CBMEzz22\" was updated by Pol andrei Bulong','updated',0,'2025-09-28 00:40:31',84),(86,'Document Moved to Trashcan','Document \"CBMEzz22\" has been moved to trashcan by Pol andrei Bulong','deleted',1,'2025-09-28 00:41:32',84),(87,'Document Moved to Trashcan','Document \"Request: Additional Budget for Supplies\" has been moved to trashcan by Admin Lan','deleted',1,'2025-09-28 00:45:53',24),(88,'Document Restored','Document \"CBMEzz22\" has been restored by Victoriya Visha Von Klauss','updated',1,'2025-09-28 01:07:08',84),(89,'Document Updated: FOR ALL y','The document \"FOR ALL y\" was updated by Victoriya Visha Von Klauss','updated',1,'2025-09-28 02:46:36',73),(90,'Document Moved to Trashcan','Document \"CBMEzz22\" has been moved to trashcan by Victoriya Visha Von Klauss','deleted',1,'2025-09-28 02:47:10',84),(91,'Document Updated: for ONLY ONE','The document \"for ONLY ONE\" was updated by Pol andrei Bulong','updated',0,'2025-09-28 03:04:50',74),(92,'Document Updated: TESINT - Link 1','The document \"TESINT - Link 1\" was updated by Pol andrei Bulong','updated',0,'2025-09-28 03:05:18',78),(93,'Document Updated: for ONLY ONE','The document \"for ONLY ONE\" was updated by Pol andrei Bulong','updated',0,'2025-09-28 03:07:56',74),(94,'Document Moved to Trashcan','Document \"FOR LEEVII - Link 3\" has been moved to trashcan by Pol andrei Bulong','deleted',1,'2025-09-28 03:08:17',77),(95,'Document Moved to Trashcan','Document \"for ONLY ONE\" has been moved to trashcan by Pol andrei Bulong','deleted',1,'2025-09-28 03:08:17',74),(96,'Document Moved to Trashcan','Document \"FOR LEEVII - Link 2\" has been moved to trashcan by Pol andrei Bulong','deleted',1,'2025-09-28 03:08:17',76),(97,'Document Moved to Trashcan','Document \"FOR LEEVII - Link 1\" has been moved to trashcan by Pol andrei Bulong','deleted',1,'2025-09-28 03:08:17',75),(98,'Document Moved to Trashcan','Document \"TESINT - Link 1\" has been moved to trashcan by Pol andrei Bulong','deleted',1,'2025-09-28 03:08:17',78),(99,'Document Moved to Trashcan','Document \"TESINT - Link 2\" has been moved to trashcan by Pol andrei Bulong','deleted',1,'2025-09-28 03:08:17',79),(100,'Document Moved to Trashcan','Document \"TESINT - Link 3\" has been moved to trashcan by Pol andrei Bulong','deleted',1,'2025-09-28 03:08:17',80),(101,'Document Moved to Trashcan','Document \"TESINT - Link 4\" has been moved to trashcan by Pol andrei Bulong','deleted',1,'2025-09-28 03:08:17',81),(102,'Document Moved to Trashcan','Document \"TESINT - Link 5\" has been moved to trashcan by Pol andrei Bulong','deleted',1,'2025-09-28 03:08:17',82),(103,'Document Moved to Trashcan','Document \"sdf\" has been moved to trashcan by Pol andrei Bulong','deleted',1,'2025-09-28 03:15:55',67),(104,'Document Moved to Trashcan','Document \"sadas adpol\" has been moved to trashcan by Pol andrei Bulong','deleted',1,'2025-09-28 03:15:55',66),(105,'Document Moved to Trashcan','Document \"TRE\" has been moved to trashcan by Pol andrei Bulong','deleted',1,'2025-09-28 03:15:55',65),(106,'Document Moved to Trashcan','Document \"FOR USER YOU ONLY\" has been moved to trashcan by Pol andrei Bulong','deleted',1,'2025-09-28 03:15:55',64),(107,'Document Updated: FOR ALL y','The document \"FOR ALL y\" was updated by Pol andrei Bulong','updated',1,'2025-09-28 03:18:19',73),(108,'Document Updated: Notice: CAS Exam Schedule Release','The document \"Notice: CAS Exam Schedule Release\" was updated by Pol andrei Bulong','updated',0,'2025-09-28 03:18:58',38),(109,'New Document Added: 3 depeaty','A new document \"3 depeaty\" has been uploaded by Pol andrei Bulong','added',0,'2025-09-28 03:22:46',87),(110,'New Document Added: REQUEST 4 VIC','A new document \"REQUEST 4 VIC\" has been uploaded by Pol andrei Bulong','added',0,'2025-09-28 21:01:49',88),(111,'Document Request: REQUEST 4 VIC','You have a new request on \"REQUEST 4 VIC\" from Pol andrei Bulong','requested',0,'2025-09-28 21:01:49',88),(112,'Document Replied: assa','sdf sdf replied to your request on document #88.','replied',0,'2025-09-28 21:52:35',88),(113,'New Document Added: Request 4 Vic','A new document \"Request 4 Vic\" has been uploaded by Pol andrei Bulong','added',1,'2025-09-28 21:58:09',90),(114,'New Document Added: REQUEST 4 LAN','A new document \"REQUEST 4 LAN\" has been uploaded by Pol andrei Bulong','added',0,'2025-09-28 23:12:59',91),(115,'Document Request: REQUEST 4 LAN','You have a new request on \"REQUEST 4 LAN\" from Pol andrei Bulong','requested',0,'2025-09-28 23:12:59',91),(116,'Document Replied: ASDASD','ad pol replied to your request on document #91.','replied',0,'2025-09-28 23:14:58',91),(117,'New Document Added: New Document - Request 4 Vic','A new document \"New Document - Request 4 Vic\" has been uploaded by Pol andrei Bulong','added',1,'2025-09-28 23:29:20',93),(118,'Request Added: another req','You have a new request \"another req\" from Pol andrei Bulong','requested',0,'2025-09-28 23:55:27',94),(119,'Reply Added: sasasasas','sdf sdf replied to your request \"sasasasas\".','replied',0,'2025-09-28 23:56:12',94),(120,'New Announcement: nigga memo','remember, no niggers','',1,'2025-09-29 05:14:04',24);
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL,
  `maintenance_mode` tinyint(1) NOT NULL DEFAULT 0,
  `maintenance_message` text DEFAULT NULL,
  `maintenance_start_time` datetime DEFAULT NULL,
  `maintenance_end_time` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_settings`
--

LOCK TABLES `system_settings` WRITE;
/*!40000 ALTER TABLE `system_settings` DISABLE KEYS */;
INSERT INTO `system_settings` VALUES (1,0,'Test','2025-09-18 16:44:00','2025-09-18 16:45:00','2025-09-14 20:29:10','2025-09-29 05:16:26');
/*!40000 ALTER TABLE `system_settings` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_document_preferences`
--

LOCK TABLES `user_document_preferences` WRITE;
/*!40000 ALTER TABLE `user_document_preferences` DISABLE KEYS */;
INSERT INTO `user_document_preferences` VALUES (2,1,23,0,0,'2025-09-14 11:13:02','2025-09-22 17:50:40'),(3,1,22,0,0,'2025-09-14 11:13:05','2025-09-14 11:13:07'),(4,3,24,0,0,'2025-09-23 02:25:17','2025-09-23 02:25:24'),(5,3,25,0,0,'2025-09-23 02:25:19','2025-09-23 02:25:30'),(6,1,78,0,0,'2025-09-25 11:48:44','2025-09-27 09:53:52'),(7,1,87,1,0,'2025-09-28 07:53:11','2025-09-29 02:27:39'),(8,101,87,1,0,'2025-09-28 08:59:22','2025-09-28 08:59:22'),(9,1,73,0,0,'2025-09-28 20:06:24','2025-09-28 20:55:26'),(10,1,72,0,0,'2025-09-28 20:06:26','2025-09-28 20:55:06'),(11,1,68,1,1,'2025-09-28 20:55:28','2025-09-29 02:27:44'),(12,1,93,1,0,'2025-09-29 02:27:37','2025-09-29 02:27:37'),(13,1,90,1,0,'2025-09-29 02:27:39','2025-09-29 02:27:39');
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

-- Dump completed on 2025-09-29 13:16:34
