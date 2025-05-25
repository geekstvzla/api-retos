CREATE TABLE `languages` (
  `language_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  `code` varchar(3) NOT NULL,
  `status_id` int(11) NOT NULL,
  PRIMARY KEY (`language_id`)
) ENGINE=MyISAM;