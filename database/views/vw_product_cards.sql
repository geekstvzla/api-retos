CREATE 
VIEW `vw_product_cards` AS
    SELECT 
        `p`.`product_id` AS `product_id`,
        `p`.`product_category_id` AS `product_category_id`,
        `pcl`.`name` AS `category_name`,
        `pcl`.`slug` AS `category_slug`,
        `pcl`.`description` AS `category_description`,
        `l`.`language_id` AS `language_id`,
        `l`.`code` AS `language_code`,
        `p`.`title` AS `title`,
        `p`.`short_description` AS `short_description`,
        `p`.`description` AS `description`,
        `p`.`slug` AS `slug`,
        `p`.`sku` AS `sku`,
        `p`.`price` AS `price`,
        `p`.`stock` AS `stock`,
        `p`.`featured_image` AS `featured_image`,
        `p`.`status_id` AS `status_id`,
        `p`.`created_at` AS `created_at`
    FROM
        `products` `p`
        LEFT JOIN `product_categories` `pc` ON (`pc`.`product_category_id` = `p`.`product_category_id`)
        LEFT JOIN `product_categories_lang` `pcl` ON (`pcl`.`product_category_id` = `pc`.`product_category_id`)
        LEFT JOIN `languages` `l` ON (`l`.`language_id` = `pcl`.`language_id`)
    WHERE
        (`p`.`status_id` = 1);
