CREATE TABLE `event_edition_mode_kit` (
  `event_edition_mode_kit_id` INT NOT NULL AUTO_INCREMENT,
  `event_edition_mode_id` INT NOT NULL,
  `description` VARCHAR(50) NOT NULL,
  `price` DECIMAL(30,8) NOT NULL,
  `status_id` INT(1) NOT NULL,
  PRIMARY KEY (`event_edition_mode_kit_id`));