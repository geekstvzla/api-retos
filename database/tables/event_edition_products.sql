CREATE TABLE `event_edition_products` (
  `event_edition_product_id` INT NOT NULL AUTO_INCREMENT,
  `event_edition_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `custom_price` DECIMAL(30,8) NULL DEFAULT NULL,
  `display_order` INT NOT NULL DEFAULT 0,
  `is_featured` INT(1) NOT NULL DEFAULT 0,
  `status_id` INT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`event_edition_product_id`),
  UNIQUE KEY `uk_edition_product` (`event_edition_id`, `product_id`),
  CONSTRAINT `fk_eep_event_edition` FOREIGN KEY (`event_edition_id`) REFERENCES `event_edition` (`event_edition_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_eep_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
);
