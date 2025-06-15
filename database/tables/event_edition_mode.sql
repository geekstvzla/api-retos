CREATE TABLE `event_edition_mode` (
  `event_edtion_mode_id` INT NOT NULL AUTO_INCREMENT,
  `event_edition_id` INT NOT NULL,
  `type_event_mode_id` INT NOT NULL,
  `status_id` INT(1) NOT NULL,
  PRIMARY KEY (`event_edtion_mode_id`));