CREATE TABLE `product_order_items` (
  `product_order_item_id` INT NOT NULL AUTO_INCREMENT,
  `product_order_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(30,8) NOT NULL,
  `subtotal` DECIMAL(30,8) NOT NULL,
  PRIMARY KEY (`product_order_item_id`));
