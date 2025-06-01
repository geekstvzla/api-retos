CREATE TABLE `event_mode` (
  `event_mode_id` INT NOT NULL AUTO_INCREMENT,
  `event_id` INT NOT NULL,
  `type_event_mode_id` INT NOT NULL,
  `status_id` INT(1) NOT NULL,
  PRIMARY KEY (`event_mode_id`));