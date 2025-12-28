CREATE TABLE `events` (
  `event_id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(100) NOT NULL,
  `featured_image` VARCHAR(45) NOT NULL,
  `banner_image` VARCHAR(45) NULL,
  `short_description` VARCHAR(100) NOT NULL,
  `slug` TEXT NOT NULL,
  `status_id` INT(1) NOT NULL,
  PRIMARY KEY (`event_id`));