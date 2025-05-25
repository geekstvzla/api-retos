CREATE TABLE `status` (
  `status_id` int(11) NOT NULL AUTO_INCREMENT,
  `value` int(11) NOT NULL,
  `table` varchar(30) NOT NULL,
  `description` varchar(50) NOT NULL,
  `available` tinyint(1) NOT NULL,
  PRIMARY KEY (`status_id`)
) ENGINE=MyISAM;