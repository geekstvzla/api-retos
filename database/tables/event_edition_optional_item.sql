CREATE TABLE `event_edition_optional_item` (
  `event_edition_optional_item_id` INT NOT NULL AUTO_INCREMENT,
  `description` VARCHAR(100) NOT NULL,
  `price` DECIMAL(30,8) NOT NULL,
  `status_id` INT(1) NOT NULL,
  PRIMARY KEY (`event_edition_optional_item_id`));
