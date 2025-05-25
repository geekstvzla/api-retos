CREATE TABLE `product_weighing_units` (
  `product_weighing_unit_id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `weighing_unit_id` int(11) NOT NULL,
  `status_id` int(1) NOT NULL,
  PRIMARY KEY (`product_weighing_unit_id`)
) ENGINE=InnoDB;