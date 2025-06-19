CREATE TABLE `event_edition` (
  `event_edition_id` INT NOT NULL AUTO_INCREMENT,
  `event_id` INT NOT NULL,
  `description` VARCHAR(45) NOT NULL,
  `includes` TEXT NULL,
  `distances` VARCHAR(100) NOT NULL,
  `status_id` INT(1) NOT NULL,
  PRIMARY KEY (`event_edition_id`));