CREATE FUNCTION `fn_get_dorsal_number`(`p_editionId` INT, `p_eventEditionModeId` INT) RETURNS text CHARSET utf8mb3 COLLATE utf8mb3_unicode_ci
BEGIN
	
    SELECT IF(COUNT(1) = 0, 1, (CAST(enroll_number AS UNSIGNED) + 1))
    INTO @v_new_dorsal_number
    FROM(
        SELECT enroll_number
		FROM event_edition_enrolled_users 
		WHERE event_edition_id = p_editionId
		AND event_edition_mode_id = p_eventEditionModeId
		AND status_id IN(1) 
		ORDER BY event_edition_enrolled_user_id DESC 
		LIMIT 1
	)t;
    
    IF @v_last_dorsal_number < 9999 THEN
		SET @v_new_dorsal_number = LPAD(@v_last_dorsal_number, 4, '0');
    END IF;

	SET @v_response = CONCAT('{
		"dorsal" : "',@v_new_dorsal_number,'"
    }');

	RETURN @v_response;
    
END