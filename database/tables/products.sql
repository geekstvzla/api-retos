CREATE TABLE `products` (
  `product_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `status_id` int(1) NOT NULL,
  PRIMARY KEY (`product_id`)
) ENGINE=MyISAM;