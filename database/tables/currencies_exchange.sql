CREATE TABLE `currencies_exchange` (
  `currencies_exchange_id` INT NOT NULL AUTO_INCREMENT,
  `from_currency_id` INT NOT NULL,
  `to_currency_id` INT NOT NULL,
  `rate` DECIMAL(20,8) NOT NULL,
  `status_id` INT NOT NULL,
  PRIMARY KEY (`currencies_exchange_id`));