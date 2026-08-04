CREATE TABLE `product_images` (
  `product_image_id` INT NOT NULL AUTO_INCREMENT,
  `product_id` INT NOT NULL,
  `image_url` VARCHAR(255) NOT NULL,
  `display_order` INT NOT NULL DEFAULT 0,
  `status_id` INT NOT NULL,
  PRIMARY KEY (`product_image_id`));
