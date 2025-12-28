CREATE VIEW vw_event_edition_optional_item AS
SELECT `eeoi`.`event_edition_id` AS `event_edition_id`,
       `eeoi`.`event_edition_optional_item_id` AS `item_id`,
       `eeoi`.`description` AS `item`,
       `eeoi`.`quantity` AS `item_quantity`,
       `eeoi`.`currency_id` AS `currency_id`,
       `cl`.`description` AS `currency_desc`,
       `c`.`abbreviation` AS `currency_abb`,
       `c`.`symbol` AS `currency_symbol`,
       `l`.`language_id` AS `language_id`,
       `l`.`code` AS `code`,
       `eeoi`.`status_id` AS `status_id`
FROM `event_edition_optional_item` `eeoi`
INNER JOIN `currencies` `c` ON `c`.`currency_id` = `eeoi`.`currency_id`
INNER JOIN `currencies_lang` `cl` ON `cl`.`currency_id` = `c`.`currency_id`
INNER JOIN `languages` `l` ON `l`.`language_id` = `cl`.`language_id`
WHERE `eeoi`.`status_id` = 1;