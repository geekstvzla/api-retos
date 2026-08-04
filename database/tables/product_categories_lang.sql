CREATE TABLE `product_categories_lang` (
  `product_categories_lang_id` INT NOT NULL AUTO_INCREMENT,
  `product_category_id` INT NOT NULL,
  `language_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) NULL,
  `status_id` INT NOT NULL DEFAULT 1,
  PRIMARY KEY (`product_categories_lang_id`));
