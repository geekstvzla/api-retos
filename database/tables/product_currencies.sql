CREATE TABLE `product_currencies` (
  `product_currencies_id` INT NOT NULL AUTO_INCREMENT,
  `product_id` INT NOT NULL,
  `currency_id` INT NOT NULL,
  `default` INT(1) NOT NULL DEFAULT 0,
  `status_id` INT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`product_currencies_id`));
