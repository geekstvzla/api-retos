CREATE TABLE `users` (
  `user_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `geek_user_id` text unsigned DEFAULT NULL,
  `refered_by` bigint unsigned DEFAULT NULL,
  `status_id` bigint unsigned NOT NULL,
  `login_date` datetime NOT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=MyISAM;