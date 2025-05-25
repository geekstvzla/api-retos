CREATE TABLE `orders` (
  `order_id` int(11) NOT NULL AUTO_INCREMENT,
  `order_type_id` int(11) DEFAULT NULL,
  `product_id` int(11) NOT NULL,
  `weighing_unit_id` int(11) NOT NULL,
  `amount` decimal(20,2) NOT NULL,
  `price` decimal(20,2) NOT NULL,
  `currency_id` int(11) NOT NULL,
  `latitude` text NOT NULL,
  `longitude` text NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_date` datetime NOT NULL,
  `status_id` int(11) NOT NULL,
  PRIMARY KEY (`order_id`)
) ENGINE=InnoDB;