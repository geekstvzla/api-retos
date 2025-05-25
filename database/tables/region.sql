CREATE TABLE `region` (
  `region_id` int(11) NOT NULL AUTO_INCREMENT,
  `parent_region_id` int(11) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `order` int(11) NOT NULL,
  `status_id` int(11) NOT NULL,
  PRIMARY KEY (`region_id`)
) ENGINE=MyISAM;