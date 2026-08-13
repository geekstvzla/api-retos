CREATE TABLE `products` (
  `product_id` INT NOT NULL AUTO_INCREMENT,
  `product_category_id` INT NULL,
  `supplier_id` INT NULL,
  `title` VARCHAR(150) NOT NULL,
  `short_description` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `slug` VARCHAR(150) NOT NULL,
  `sku` VARCHAR(50) NULL,
  `price` DECIMAL(30,8) NOT NULL,
  `stock` INT NOT NULL DEFAULT 0,
  `featured_image` VARCHAR(255) NOT NULL,
  `status_id` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`product_id`),
  CONSTRAINT `fk_p_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`supplier_id`) ON DELETE SET NULL
);

