CREATE TABLE `product_orders` (
  `product_order_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `total_amount` DECIMAL(30,8) NOT NULL,
  `currency_id` INT UNSIGNED NOT NULL,
  `payment_date` DATETIME NULL,
  `operation_number` VARCHAR(50) NULL,
  `voucher_file` TEXT NULL,
  `status_id` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`product_order_id`));
