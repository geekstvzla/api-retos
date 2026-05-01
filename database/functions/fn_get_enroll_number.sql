CREATE FUNCTION `fn_get_enroll_number`(`p_editionId` INT) RETURNS text CHARSET utf8mb3 COLLATE utf8mb3_unicode_ci
BEGIN
	
    SELECT IF(COUNT(1) = 0, 1, (CAST(enroll_number AS UNSIGNED) + 1))
    INTO @v_new_enroll_number
    FROM(
        SELECT enroll_number
        FROM event_edition_enrolled_users 
        WHERE event_edition_id = p_editionId
        AND status_id IN(1) 
        ORDER BY event_edition_enrolled_user_id DESC 
        LIMIT 1
    ) t;
    
    IF @v_new_enroll_number < 9999 THEN
		SET @v_new_enroll_number = LPAD(@v_new_enroll_number, 4, '0');
    END IF;

	SET @v_response = CONCAT('{
		"enrollNumber" : "',@v_new_enroll_number,'"
    }');

	RETURN @v_response;
    
END