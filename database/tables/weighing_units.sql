CREATE TABLE `weighing_units` (
  `weighing_unit_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `singular` varchar(50) NOT NULL,
  `plural` varchar(50) NOT NULL,
  `abbreviation` varchar(5) DEFAULT NULL,
  `status_id` int(1) NOT NULL,
  PRIMARY KEY (`weighing_unit_id`)
) ENGINE=MyISAM;