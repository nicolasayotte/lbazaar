/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `badges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `badges` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `classifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `commision_rate` double NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `countries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `countries` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `course_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_applications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `professor_id` bigint unsigned DEFAULT NULL,
  `course_type_id` bigint unsigned DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` double DEFAULT NULL COMMENT 'Price in Japanese Yen (JPY)',
  `points_earned` double DEFAULT NULL,
  `max_participant` int NOT NULL,
  `nft_id` bigint unsigned DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `denied_at` datetime DEFAULT NULL,
  `is_live` tinyint(1) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `lecture_frequency` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `length` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data` longtext COLLATE utf8mb4_unicode_ci,
  `certificate_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `token_reward_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `token_reward_amount` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `course_applications_professor_id_index` (`professor_id`),
  KEY `course_applications_course_type_id_index` (`course_type_id`),
  CONSTRAINT `course_applications_course_type_id_foreign` FOREIGN KEY (`course_type_id`) REFERENCES `course_types` (`id`) ON DELETE CASCADE,
  CONSTRAINT `course_applications_professor_id_foreign` FOREIGN KEY (`professor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `course_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `course_category_course`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_category_course` (
  `course_id` bigint unsigned NOT NULL,
  `course_category_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`course_id`,`course_category_id`),
  KEY `course_category_course_course_category_id_foreign` (`course_category_id`),
  CONSTRAINT `course_category_course_course_category_id_foreign` FOREIGN KEY (`course_category_id`) REFERENCES `course_categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `course_category_course_course_id_foreign` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `course_category_course_application`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_category_course_application` (
  `course_application_id` bigint unsigned NOT NULL,
  `course_category_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`course_application_id`,`course_category_id`),
  KEY `course_category_course_application_course_category_id_foreign` (`course_category_id`),
  CONSTRAINT `course_category_course_application_course_application_id_foreign` FOREIGN KEY (`course_application_id`) REFERENCES `course_applications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `course_category_course_application_course_category_id_foreign` FOREIGN KEY (`course_category_id`) REFERENCES `course_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `course_feedbacks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_feedbacks` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `course_id` bigint unsigned NOT NULL,
  `rating` int NOT NULL,
  `comments` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `schedule_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `course_feedbacks_user_id_index` (`user_id`),
  KEY `course_feedbacks_course_id_index` (`course_id`),
  KEY `course_feedbacks_schedule_id_foreign` (`schedule_id`),
  CONSTRAINT `course_feedbacks_course_id_foreign` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`),
  CONSTRAINT `course_feedbacks_schedule_id_foreign` FOREIGN KEY (`schedule_id`) REFERENCES `course_schedules` (`id`) ON DELETE SET NULL,
  CONSTRAINT `course_feedbacks_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `course_histories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_histories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `course_id` bigint unsigned NOT NULL,
  `course_schedule_id` bigint unsigned NOT NULL,
  `is_cancelled` tinyint(1) NOT NULL DEFAULT '0',
  `payment_status` enum('pending','confirmed','failed','refunded') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_tx_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_ada_amount` decimal(20,6) DEFAULT NULL,
  `payment_submitted_at` timestamp NULL DEFAULT NULL,
  `payment_confirmed_at` timestamp NULL DEFAULT NULL,
  `rewards_invalidated_at` timestamp NULL DEFAULT NULL,
  `rewards_notification_sent_at` timestamp NULL DEFAULT NULL,
  `enrolled_certificate_enabled` tinyint(1) DEFAULT NULL,
  `enrolled_certificate_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `enrolled_certificate_description` text COLLATE utf8mb4_unicode_ci,
  `enrolled_certificate_image_url` varchar(2048) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `enrolled_token_reward_enabled` tinyint(1) DEFAULT NULL,
  `enrolled_token_reward_amount` int unsigned DEFAULT NULL,
  `is_watched` tinyint(1) NOT NULL DEFAULT '0',
  `certificate_status` enum('not_eligible','eligible','pending','minting','minted','failed','revoked') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `certificate_tx_hash` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `certificate_minted_at` timestamp NULL DEFAULT NULL,
  `token_reward_status` enum('eligible','minting','minted','failed','clawback_flagged') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `token_reward_tx_hash` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `token_reward_minted_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `course_histories_user_id_index` (`user_id`),
  KEY `course_histories_course_id_index` (`course_id`),
  KEY `course_histories_course_schedule_id_index` (`course_schedule_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `course_package_courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_package_courses` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `course_package_id` bigint unsigned NOT NULL,
  `course_id` bigint unsigned NOT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `course_package_courses_course_package_id_index` (`course_package_id`),
  KEY `course_package_courses_course_id_index` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `course_packages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_packages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `course_packages_user_id_index` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `course_schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_schedules` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `course_id` bigint unsigned DEFAULT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `start_datetime` datetime DEFAULT NULL,
  `end_datetime` datetime DEFAULT NULL,
  `max_participant` int NOT NULL,
  `is_completed` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `course_schedules_course_id_index` (`course_id`),
  KEY `course_schedules_user_id_index` (`user_id`),
  CONSTRAINT `course_schedules_course_id_foreign` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `course_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_types` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `professor_id` bigint unsigned DEFAULT NULL,
  `course_type_id` bigint unsigned DEFAULT NULL,
  `status_id` bigint unsigned DEFAULT NULL,
  `course_application_id` bigint unsigned DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` double DEFAULT NULL COMMENT 'Price in Japanese Yen (JPY)',
  `image_thumbnail` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `language` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `points_earned` double DEFAULT NULL,
  `video_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `video_link` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `zoom_link` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_live` tinyint(1) NOT NULL,
  `is_cancellable` tinyint(1) NOT NULL DEFAULT '0',
  `days_before_cancellation` int DEFAULT NULL,
  `certificate_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `certificate_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `certificate_description` text COLLATE utf8mb4_unicode_ci,
  `certificate_image_url` varchar(2048) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `token_reward_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `token_reward_amount` int unsigned DEFAULT NULL,
  `max_participant` int NOT NULL,
  `nft_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `courses_professor_id_index` (`professor_id`),
  KEY `courses_course_type_id_index` (`course_type_id`),
  KEY `courses_status_id_index` (`status_id`),
  KEY `courses_course_application_id_index` (`course_application_id`),
  CONSTRAINT `courses_course_application_id_foreign` FOREIGN KEY (`course_application_id`) REFERENCES `course_applications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `courses_course_type_id_foreign` FOREIGN KEY (`course_type_id`) REFERENCES `course_types` (`id`) ON DELETE CASCADE,
  CONSTRAINT `courses_professor_id_foreign` FOREIGN KEY (`professor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `courses_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `statuses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `exam_item_choices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exam_item_choices` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `exam_item_id` bigint unsigned DEFAULT NULL,
  `value` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort` int NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `exam_item_choices_exam_item_id_index` (`exam_item_id`),
  CONSTRAINT `exam_item_choices_exam_item_id_foreign` FOREIGN KEY (`exam_item_id`) REFERENCES `exam_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `exam_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exam_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `exam_id` bigint unsigned DEFAULT NULL,
  `question` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort` int NOT NULL,
  `correct_choice_id` bigint unsigned DEFAULT NULL,
  `points` double DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `exam_items_exam_id_index` (`exam_id`),
  KEY `exam_items_correct_choice_id_index` (`correct_choice_id`),
  CONSTRAINT `exam_items_correct_choice_id_foreign` FOREIGN KEY (`correct_choice_id`) REFERENCES `exam_item_choices` (`id`),
  CONSTRAINT `exam_items_exam_id_foreign` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `exams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exams` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `course_id` bigint unsigned DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `published_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `exams_course_id_index` (`course_id`),
  CONSTRAINT `exams_course_id_foreign` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `inquiries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inquiries` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `content` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `logs_user_id_index` (`user_id`),
  CONSTRAINT `logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `nft_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nft_transactions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `nft_id` bigint unsigned NOT NULL,
  `nft_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `serial_num` bigint unsigned NOT NULL,
  `course_id` bigint unsigned DEFAULT NULL,
  `schedule_id` bigint unsigned DEFAULT NULL,
  `used` tinyint(1) NOT NULL,
  `tx_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mph` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metadata` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nft_transactions_user_course_schedule_unique` (`user_id`,`course_id`,`schedule_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `nfts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nfts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `mph` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `image_url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `points` int NOT NULL,
  `for_sale` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `from_user_id` bigint unsigned DEFAULT NULL,
  `to_user_id` bigint unsigned DEFAULT NULL,
  `message` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notifications_from_user_id_index` (`from_user_id`),
  KEY `notifications_to_user_id_index` (`to_user_id`),
  CONSTRAINT `notifications_from_user_id_foreign` FOREIGN KEY (`from_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `notifications_to_user_id_foreign` FOREIGN KEY (`to_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_resets` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  KEY `password_resets_email_index` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `permission_role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permission_role` (
  `permission_id` bigint unsigned NOT NULL,
  `role_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`permission_id`,`role_id`),
  KEY `permission_role_role_id_foreign` (`role_id`),
  CONSTRAINT `permission_role_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `permission_role_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `permission_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permission_user` (
  `permission_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `user_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`user_id`,`permission_id`,`user_type`),
  KEY `permission_user_permission_id_foreign` (`permission_id`),
  CONSTRAINT `permission_user_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `role_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_user` (
  `role_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `user_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`,`user_type`),
  KEY `role_user_role_id_foreign` (`role_id`),
  CONSTRAINT `role_user_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` enum('general','email') COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_deletable` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `statuses` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `stripe_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stripe_payments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `course_id` bigint unsigned NOT NULL,
  `course_history_id` bigint unsigned DEFAULT NULL,
  `stripe_payment_intent_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stripe_customer_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` int NOT NULL,
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'jpy',
  `status` enum('pending','succeeded','failed','refunded','canceled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `receipt_url` text COLLATE utf8mb4_unicode_ci,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stripe_payments_stripe_payment_intent_id_unique` (`stripe_payment_intent_id`),
  KEY `stripe_payments_user_id_index` (`user_id`),
  KEY `stripe_payments_course_id_index` (`course_id`),
  KEY `stripe_payments_course_history_id_index` (`course_history_id`),
  KEY `stripe_payments_stripe_customer_id_index` (`stripe_customer_id`),
  KEY `stripe_payments_status_index` (`status`),
  CONSTRAINT `stripe_payments_course_history_id_foreign` FOREIGN KEY (`course_history_id`) REFERENCES `course_histories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `stripe_payments_course_id_foreign` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `stripe_payments_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `teacher_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teacher_applications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `first_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `data` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `translations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `translations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `en` text COLLATE utf8mb4_unicode_ci,
  `ja` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `translations_key_unique` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user_badges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_badges` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `badge_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `course_history_id` bigint unsigned DEFAULT NULL,
  `course_package_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_badges_course_history_id_index` (`course_history_id`),
  KEY `user_badges_course_package_id_index` (`course_package_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user_certifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_certifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `awarded_at` date NOT NULL,
  `awarded_by` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_certifications_user_id_foreign` (`user_id`),
  CONSTRAINT `user_certifications_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user_education`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_education` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `school` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `degree` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `sort` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_education_user_id_foreign` (`user_id`),
  CONSTRAINT `user_education_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user_exam_answers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_exam_answers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_exam_id` bigint unsigned DEFAULT NULL,
  `exam_item_id` bigint unsigned DEFAULT NULL,
  `exam_item_choice_id` bigint unsigned DEFAULT NULL,
  `is_correct` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_exam_answers_user_exam_id_index` (`user_exam_id`),
  KEY `user_exam_answers_exam_item_id_index` (`exam_item_id`),
  KEY `user_exam_answers_exam_item_choice_id_index` (`exam_item_choice_id`),
  CONSTRAINT `user_exam_answers_exam_item_choice_id_foreign` FOREIGN KEY (`exam_item_choice_id`) REFERENCES `exam_item_choices` (`id`),
  CONSTRAINT `user_exam_answers_exam_item_id_foreign` FOREIGN KEY (`exam_item_id`) REFERENCES `exam_items` (`id`),
  CONSTRAINT `user_exam_answers_user_exam_id_foreign` FOREIGN KEY (`user_exam_id`) REFERENCES `user_exams` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user_exams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_exams` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `course_schedule_id` bigint unsigned DEFAULT NULL,
  `exam_id` bigint unsigned DEFAULT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `total_score` double NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_passed` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `user_exams_course_schedule_id_index` (`course_schedule_id`),
  KEY `user_exams_exam_id_index` (`exam_id`),
  KEY `user_exams_user_id_index` (`user_id`),
  CONSTRAINT `user_exams_exam_id_foreign` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`),
  CONSTRAINT `user_exams_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user_wallets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_wallets` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `points` double NOT NULL DEFAULT '0',
  `badges` double NOT NULL DEFAULT '0',
  `credit` double NOT NULL DEFAULT '0',
  `stake_key_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_wallets_user_id_index` (`user_id`),
  CONSTRAINT `user_wallets_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user_work_histories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_work_histories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `company` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `position` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `description` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_work_histories_user_id_foreign` (`user_id`),
  CONSTRAINT `user_work_histories_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `about` longtext COLLATE utf8mb4_unicode_ci,
  `specialty` longtext COLLATE utf8mb4_unicode_ci,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `country_id` bigint unsigned NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_temp_password` tinyint(1) DEFAULT NULL,
  `is_enabled` tinyint(1) DEFAULT NULL,
  `classification_id` bigint unsigned DEFAULT NULL,
  `commission_rate` bigint DEFAULT NULL,
  `commission_earn_rate` bigint DEFAULT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `custodial_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `deleted_by` bigint unsigned DEFAULT NULL,
  `discord_id` longtext COLLATE utf8mb4_unicode_ci,
  `university` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  KEY `users_country_id_index` (`country_id`),
  KEY `users_classification_id_index` (`classification_id`),
  KEY `users_deleted_by_index` (`deleted_by`),
  CONSTRAINT `users_classification_id_foreign` FOREIGN KEY (`classification_id`) REFERENCES `classifications` (`id`),
  CONSTRAINT `users_country_id_foreign` FOREIGN KEY (`country_id`) REFERENCES `countries` (`id`),
  CONSTRAINT `users_deleted_by_foreign` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `votes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `votes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `description` longtext COLLATE utf8mb4_unicode_ci,
  `end_date` longtext COLLATE utf8mb4_unicode_ci,
  `counted_option` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '?',
  `approved_at` timestamp NULL DEFAULT NULL,
  `denied_at` timestamp NULL DEFAULT NULL,
  `data` longtext COLLATE utf8mb4_unicode_ci,
  `result_data` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `voteable_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `voteable_id` bigint unsigned DEFAULT NULL,
  `options` json NOT NULL,
  PRIMARY KEY (`id`),
  KEY `votes_voteable_type_voteable_id_index` (`voteable_type`,`voteable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `wallet_transaction_histories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wallet_transaction_histories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_wallet_id` bigint NOT NULL,
  `course_history_id` bigint DEFAULT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `points_before` int NOT NULL,
  `points_after` int NOT NULL,
  `tx_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `course_schedule_id` bigint DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

INSERT INTO `migrations` VALUES (1,'2014_10_10_000000_create_countries_table',1);
INSERT INTO `migrations` VALUES (2,'2014_10_11_000000_create_classifications_table',1);
INSERT INTO `migrations` VALUES (3,'2014_10_12_000000_create_users_table',1);
INSERT INTO `migrations` VALUES (4,'2014_10_12_100000_create_password_resets_table',1);
INSERT INTO `migrations` VALUES (5,'2019_08_19_000000_create_failed_jobs_table',1);
INSERT INTO `migrations` VALUES (6,'2019_12_14_000001_create_personal_access_tokens_table',1);
INSERT INTO `migrations` VALUES (7,'2022_12_02_023826_create_user_wallets_table',1);
INSERT INTO `migrations` VALUES (8,'2022_12_02_024301_create_logs_table',1);
INSERT INTO `migrations` VALUES (9,'2022_12_02_024432_create_notifications_table',1);
INSERT INTO `migrations` VALUES (10,'2022_12_02_024700_create_settings_table',1);
INSERT INTO `migrations` VALUES (11,'2022_12_02_024809_create_inquiries_table',1);
INSERT INTO `migrations` VALUES (12,'2022_12_02_025540_create_course_types_table',1);
INSERT INTO `migrations` VALUES (13,'2022_12_02_025754_create_course_categories_table',1);
INSERT INTO `migrations` VALUES (14,'2022_12_02_030024_create_statuses_table',1);
INSERT INTO `migrations` VALUES (15,'2022_12_02_030037_create_course_applications_table',1);
INSERT INTO `migrations` VALUES (16,'2022_12_02_030137_create_courses_table',1);
INSERT INTO `migrations` VALUES (17,'2022_12_06_063001_create_exams_table',1);
INSERT INTO `migrations` VALUES (18,'2022_12_06_064907_create_exam_items_table',1);
INSERT INTO `migrations` VALUES (19,'2022_12_06_065102_create_exam_item_choices_table',1);
INSERT INTO `migrations` VALUES (20,'2022_12_06_065838_update_exam_items_table',1);
INSERT INTO `migrations` VALUES (21,'2022_12_06_070135_create_user_exams_table',1);
INSERT INTO `migrations` VALUES (22,'2022_12_06_070409_create_user_exam_answers_table',1);
INSERT INTO `migrations` VALUES (23,'2022_12_09_042731_laratrust_setup_tables',1);
INSERT INTO `migrations` VALUES (24,'2022_12_12_033244_create_course_feedback_table',1);
INSERT INTO `migrations` VALUES (25,'2022_12_12_034202_create_course_histories_table',1);
INSERT INTO `migrations` VALUES (26,'2023_01_19_052039_create_user_education_table',1);
INSERT INTO `migrations` VALUES (27,'2023_01_19_083254_create_user_certifications_table',1);
INSERT INTO `migrations` VALUES (28,'2023_01_19_085605_create_user_work_histories_table',1);
INSERT INTO `migrations` VALUES (29,'2023_01_26_010216_create_translations_table',1);
INSERT INTO `migrations` VALUES (30,'2023_02_07_062625_create_course_schedules',1);
INSERT INTO `migrations` VALUES (31,'2023_02_16_064024_create_badges',1);
INSERT INTO `migrations` VALUES (32,'2023_02_16_064126_create_user_badges',1);
INSERT INTO `migrations` VALUES (33,'2023_02_22_000601_create_wallet_trasaction_histories',1);
INSERT INTO `migrations` VALUES (34,'2023_03_01_053245_create_course_packages_table',1);
INSERT INTO `migrations` VALUES (35,'2023_03_01_053435_create_course_package_courses_table',1);
INSERT INTO `migrations` VALUES (36,'2023_03_08_071700_create_votes_table',1);
INSERT INTO `migrations` VALUES (37,'2023_03_08_073054_create_teacher_applications_table',1);
INSERT INTO `migrations` VALUES (38,'2023_03_10_022337_update_user_wallets_table',1);
INSERT INTO `migrations` VALUES (39,'2023_03_10_045659_update_course_schedule_table',1);
INSERT INTO `migrations` VALUES (40,'2023_03_10_072451_update_user_badge_table',1);
INSERT INTO `migrations` VALUES (41,'2023_03_13_085345_update_user_table',1);
INSERT INTO `migrations` VALUES (42,'2023_03_13_103503_update_course_applications_table',1);
INSERT INTO `migrations` VALUES (43,'2023_03_13_104723_update_votes_table',1);
INSERT INTO `migrations` VALUES (44,'2023_03_14_010812_update_teacher_applications_table',1);
INSERT INTO `migrations` VALUES (45,'2023_03_14_064748_update_votes_table_to_include_options',1);
INSERT INTO `migrations` VALUES (46,'2023_03_16_054421_set_default_points_value_in_exam_items',1);
INSERT INTO `migrations` VALUES (47,'2023_03_16_065550_add_rows_to_settings_table',1);
INSERT INTO `migrations` VALUES (48,'2023_03_27_082826_update_wallet_transaction_history_table',1);
INSERT INTO `migrations` VALUES (49,'2023_03_28_065550_add_rows_to_settings_table',1);
INSERT INTO `migrations` VALUES (50,'2023_03_29_082826_update_user_exams_table',1);
INSERT INTO `migrations` VALUES (51,'2023_03_31_082826_update_wallet_transaction_table',1);
INSERT INTO `migrations` VALUES (52,'2023_06_19_190020_update_user_wallets',1);
INSERT INTO `migrations` VALUES (53,'2023_06_20_205326_add_rows_to_settings',1);
INSERT INTO `migrations` VALUES (54,'2023_06_21_112412_update_wallet_transaction_histories',1);
INSERT INTO `migrations` VALUES (55,'2023_06_22_114355_update_wallet_transaction_histories',1);
INSERT INTO `migrations` VALUES (56,'2023_06_30_190118_create_nfts',1);
INSERT INTO `migrations` VALUES (57,'2023_07_01_224935_add_nft_id_to_course_applications',1);
INSERT INTO `migrations` VALUES (58,'2023_07_02_193019_add_nft_id_to_courses',1);
INSERT INTO `migrations` VALUES (59,'2023_07_05_181919_create_nft_transactions',1);
INSERT INTO `migrations` VALUES (60,'2024_01_22_000000_add_metadata_to_nft_transactions_table',1);
INSERT INTO `migrations` VALUES (61,'2025_07_14_193348_create_course_category_course_table',1);
INSERT INTO `migrations` VALUES (62,'2025_07_14_193509_create_course_application_course_category_table',1);
INSERT INTO `migrations` VALUES (63,'2025_07_14_193923_drop_course_category_id_from_course',1);
INSERT INTO `migrations` VALUES (64,'2025_07_14_194004_drop_course_category_id_from_course_applications',1);
INSERT INTO `migrations` VALUES (65,'2025_07_18_000000_add_schedule_id_to_course_feedbacks_table',1);
INSERT INTO `migrations` VALUES (66,'2025_07_23_013331_add_description_to_nfts_table',1);
INSERT INTO `migrations` VALUES (67,'2025_07_31_000000_add_address_to_user_wallets',1);
INSERT INTO `migrations` VALUES (68,'2025_08_01_000000_add_custodial_address_to_users_table',1);
INSERT INTO `migrations` VALUES (69,'2026_02_16_000001_add_certificate_enabled_fields',1);
INSERT INTO `migrations` VALUES (70,'2026_02_16_000002_add_payment_fields_to_course_histories',1);
INSERT INTO `migrations` VALUES (71,'2026_02_17_000000_create_stripe_payments_table',1);
INSERT INTO `migrations` VALUES (72,'2026_02_17_000001_add_price_jpy_comment_to_courses_and_applications',1);
INSERT INTO `migrations` VALUES (73,'2026_02_18_033218_add_composite_unique_to_nft_transactions_table',1);
INSERT INTO `migrations` VALUES (74,'2026_02_18_035439_add_canceled_status_to_stripe_payments_table',1);
INSERT INTO `migrations` VALUES (75,'2026_02_17_210708_update_certificate_status_enum_values',2);
INSERT INTO `migrations` VALUES (76,'2026_02_28_000001_add_token_reward_fields',3);
INSERT INTO `migrations` VALUES (77,'2026_02_27_000001_add_certificate_metadata_to_courses',4);
INSERT INTO `migrations` VALUES (78,'2026_02_27_000002_add_refunded_status_and_rewards_flag_to_course_histories',5);
INSERT INTO `migrations` VALUES (79,'2026_02_28_000002_add_enrollment_reward_snapshot_to_course_histories',6);
INSERT INTO `migrations` VALUES (80,'2026_02_28_000003_add_revoked_and_clawback_to_course_histories',7);
INSERT INTO `migrations` VALUES (81,'2026_02_28_000004_add_certificate_image_url_to_courses',8);
INSERT INTO `migrations` VALUES (82,'2026_02_28_000005_add_enrolled_certificate_image_url_to_course_histories',8);
INSERT INTO `migrations` VALUES (83,'2026_02_28_000006_add_rewards_notification_sent_at_to_course_histories',9);
