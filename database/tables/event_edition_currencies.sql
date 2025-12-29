CREATE TABLE `event_edition_currencies` (
  `event_edition_currencies_id` INT NOT NULL AUTO_INCREMENT,
  `event_edition_id` INT NOT NULL,
  `currency_id` INT NOT NULL,
  `default` INT(1) NOT NULL,
  `status_id` INT(1) NOT NULL,
  PRIMARY KEY (`event_edition_currencies_id`));