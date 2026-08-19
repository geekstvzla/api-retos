CREATE TABLE `sports_teams` (
  `sports_team_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `slug` varchar(180) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `region_id` int(11) NOT NULL,
  `created_by_user_id` bigint(20) NOT NULL,
  `status_id` int(11) NOT NULL DEFAULT 1,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`sports_team_id`),
  UNIQUE KEY `uk_sports_teams_slug` (`slug`),
  KEY `idx_sports_teams_created_by` (`created_by_user_id`),
  KEY `idx_sports_teams_status` (`status_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;