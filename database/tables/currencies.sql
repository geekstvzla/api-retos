CREATE TABLE `currencies` (
  `currency_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `description` varchar(45) NOT NULL,
  `symbol` varchar(5) DEFAULT NULL,
  `status_id` int(11) NOT NULL,
  PRIMARY KEY (`currency_id`)
) ENGINE=MyISAM;