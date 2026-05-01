CREATE 
VIEW `vw_event_header_info` AS
    SELECT 
        `e`.`event_id` AS `event_id`,
        `e`.`title` AS `title`,
        `e`.`featured_image` AS `featured_image`,
        `e`.`banner_image` AS `banner_image`,
        `e`.`short_description` AS `short_description`,
        DATE_FORMAT(`ee`.`departure_date`,
                '%Y-%m-%d %h:%i:%s %p') AS `departure_date`,
        `ee`.`departure_place_name` AS `departure_place_name`,
        `ee`.`departure_place_url_map` AS `departure_place_url_map`,
        DATE_FORMAT(`ee`.`enrollment_start_date`,
                '%Y-%m-%d %h:%i:%s %p') AS `enrollment_start_date`,
        DATE_FORMAT(`ee`.`enrollment_end_date`,
                '%Y-%m-%d %h:%i:%s %p') AS `enrollment_end_date`,
        `ee`.`arrival_place_name` AS `arrival_place_name`,
        `ee`.`event_edition_id` AS `event_edition_id`,
        `ee`.`description` AS `event_edition`,
        `ee`.`distances` AS `event_distances`,
        `ee`.`whatsapp_general_group` AS `whatsapp_general_group`,
        `ee`.`whatsapp_enrolled_group` AS `whatsapp_enrolled_group`,
        `et`.`event_type_id` AS `event_type_id`,
        `etl`.`description` AS `event_type`,
        `l`.`language_id` AS `language_id`,
        `l`.`code` AS `language_code`
    FROM
        ((((`events` `e`
        JOIN `event_edition` `ee` ON ((`ee`.`event_id` = `e`.`event_id`)))
        JOIN `event_types` `et` ON ((`et`.`event_type_id` = `ee`.`event_type_id`)))
        JOIN `event_types_lang` `etl` ON ((`etl`.`event_type_id` = `ee`.`event_type_id`)))
        JOIN `languages` `l` ON ((`l`.`language_id` = `etl`.`language_id`)))
    WHERE
        (`ee`.`status_id` = 1)