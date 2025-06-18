CREATE TABLE `event_edition_distances` (
  `event_edition_distances_id` INT NOT NULL AUTO_INCREMENT,
  `edition_event_id` INT NOT NULL,
  `distance` VARCHAR(10) NOT NULL,
  `status_id` INT(1) NOT NULL,
  PRIMARY KEY (`event_edition_distances_id`));