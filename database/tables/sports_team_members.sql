CREATE TABLE `sports_team_members` (
  `sports_team_member_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `sports_team_id` int(11) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `role_id` int(11) NOT NULL DEFAULT 3,
  `status_id` int(11) NOT NULL DEFAULT 1,
  `joined_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`sports_team_member_id`),
  UNIQUE KEY `uk_sports_team_user` (`sports_team_id`, `user_id`),
  KEY `idx_sports_team_members_team` (`sports_team_id`),
  KEY `idx_sports_team_members_user` (`user_id`),
  KEY `idx_sports_team_members_role` (`role_id`),
  KEY `idx_sports_team_members_status` (`status_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
