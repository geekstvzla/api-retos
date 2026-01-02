CREATE TABLE `event_edition_reported_payment` (
  `event_edition_reported_payment_id` INT NOT NULL AUTO_INCREMENT,
  `event_edition_id` INT NOT NULL,
  `payment_date` DATE NOT NULL,
  `operation_number` VARCHAR(30) NOT NULL,
  `voucher_file` TEXT NOT NULL,
  `status_id` INT NOT NULL,
  PRIMARY KEY (`event_edition_reported_payment_id`));
