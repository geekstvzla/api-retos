CREATE TABLE `message_type` (
  `message_type_id` int(11) NOT NULL AUTO_INCREMENT,
  `description` varchar(50) NOT NULL,
  `status_id` int(1) NOT NULL,
  PRIMARY KEY (`message_type_id`)
) ENGINE=MyISAM;

