CREATE TABLE `users` (
  `user_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `geek_user_id` text,
  `user_role_id` int DEFAULT NULL,
  `refered_by` bigint unsigned DEFAULT NULL,
  `login_date` datetime NOT NULL,
  `status_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB;