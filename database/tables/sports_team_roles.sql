CREATE TABLE `sports_team_roles` (
  `role_id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `description` varchar(100) NOT NULL,
  `status_id` int(11) NOT NULL DEFAULT 1,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `uk_sports_team_roles_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
