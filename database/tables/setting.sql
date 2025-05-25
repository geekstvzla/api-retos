CREATE TABLE `setting` (
  `setting_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `value` text NOT NULL,
  `description` text NOT NULL,
  PRIMARY KEY (`setting_id`)
) ENGINE=MyISAM;