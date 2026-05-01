CREATE 
VIEW `vw_event_cards` AS
    SELECT 
        `e`.`event_id` AS `event_id`,
        `e`.`title` AS `title`,
        `e`.`banner_image` AS `banner_image`,
        `e`.`featured_image` AS `featured_image`,
        DATE_FORMAT(`ee`.`departure_date`,
                '%Y-%m-%d %h:%i:%s %p') AS `departure_date`,
        `ee`.`departure_place_name` AS `departure_place_name`,
        `ee`.`departure_place_url_map` AS `departure_place_url_map`,
        `ee`.`event_edition_id` AS `event_edition_id`,
        `ee`.`description` AS `event_edition`,
        `e`.`slug` AS `event_slug`,
        `et`.`event_type_id` AS `event_type_id`,
        `etl`.`description` AS `event_type`,
        `l`.`language_id` AS `language_id`,
        `l`.`code` AS `language_code`,
        (SELECT 
                GROUP_CONCAT(`teml`.`description`
                        SEPARATOR ', ') AS `event_modes`
            FROM
                (((`event_edition_mode` `eem`
                JOIN `type_event_modes` `tem` ON ((`tem`.`type_event_mode_id` = `eem`.`type_event_mode_id`)))
                JOIN `type_event_modes_lang` `teml` ON ((`teml`.`type_event_mode_id` = `eem`.`type_event_mode_id`)))
                JOIN `languages` `l2` ON ((`l2`.`language_id` = `teml`.`language_id`)))
            WHERE
                ((`eem`.`status_id` = 1)
                    AND (`l2`.`language_id` = `l`.`language_id`)
                    AND (`eem`.`event_edition_id` = `ee`.`event_edition_id`))) AS `event_modes`
    FROM
        ((((`events` `e`
        JOIN `event_edition` `ee` ON ((`ee`.`event_id` = `e`.`event_id`)))
        JOIN `event_types` `et` ON ((`et`.`event_type_id` = `ee`.`event_type_id`)))
        JOIN `event_types_lang` `etl` ON ((`etl`.`event_type_id` = `ee`.`event_type_id`)))
        JOIN `languages` `l` ON ((`l`.`language_id` = `etl`.`language_id`)))
    WHERE
        (`ee`.`status_id` = 1)