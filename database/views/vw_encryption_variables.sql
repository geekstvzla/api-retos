CREATE 
VIEW `vw_encryption_variables` AS
    SELECT 
        (SELECT 
                `s`.`value`
            FROM
                `setting` `s`
            WHERE
                `s`.`name` = 'encrypt-key'
            LIMIT 1) AS `key`,
        (SELECT 
                `s`.`value`
            FROM
                `setting` `s`
            WHERE
                `s`.`name` = 'encrypt-iv'
            LIMIT 1) AS `iv`