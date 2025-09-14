CREATE TABLE `event_edition_mode_kit_item` (
  `event_edition_mode_kit_item_id` INT NOT NULL AUTO_INCREMENT,
  `event_edition_mode_kit_id` INT NOT NULL,
  `description` VARCHAR(100) NOT NULL,
  `status_id` INT(1) NOT NULL,
  PRIMARY KEY (`event_edition_mode_kit_item_id`));