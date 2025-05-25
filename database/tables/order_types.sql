CREATE TABLE `order_types` (
  `order_type_id` int(11) NOT NULL AUTO_INCREMENT,
  `description` varchar(4) NOT NULL,
  `status_id` int(1) NOT NULL,
  PRIMARY KEY (`order_type_id`)
) ENGINE=MyISAM;