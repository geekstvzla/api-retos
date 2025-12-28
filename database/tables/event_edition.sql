CREATE TABLE `event_edition` (
  `event_edition_id` INT NOT NULL AUTO_INCREMENT,
  `event_id` INT NOT NULL,
  `description` VARCHAR(45) NOT NULL,
  `distances` VARCHAR(100) NOT NULL,
  `departure_date` DATETIME NOT NULL,
  `departure_place_name` VARCHAR(100) NOT NULL,
  `departure_place_url_map` TEXT NULL,
  `arrival_place_name` VARCHAR(100) NOT NULL,
  `enrollment_start_date` DATETIME NOT NULL,
  `enrollment_end_date` DATETIME NOT NULL
  `status_id` INT(1) NOT NULL,
  PRIMARY KEY (`event_edition_id`));