CREATE FUNCTION `fn_get_user_event_attr_value`(`p_editionId` INT, `p_userId` INT, `p_attrId` INT, `p_attrIdVal` INT, `p_langCode` VARCHAR(3)) RETURNS text CHARSET utf8mb3 COLLATE utf8mb3_unicode_ci
BEGIN

	SELECT COUNT(*), avl.description AS attribute_value INTO @v_count, @v_response
	FROM event_edition_enrolled_users eeeu
	JOIN event_edition_enrolled_users_kit_attrs eeeuka ON eeeuka.event_edition_enrolled_user_id = eeeu.event_edition_enrolled_user_id
	JOIN attributes a ON a.attribute_id = eeeuka.attribute_id
	JOIN attributes_lang al ON al.attribute_id = a.attribute_id
	JOIN languages l1 ON l1.language_id = al.language_id
	JOIN attributes_values av ON av.attribute_value_id = eeeuka.attribute_value_id
	JOIN attributes_values_lang avl ON avl.attribute_value_id = av.attribute_value_id
	JOIN languages l2 ON l2.language_id = avl.language_id
	WHERE eeeu.user_id = p_userId
	AND eeeu.event_edition_id = p_editionId
    AND eeeuka.attribute_id = p_attrId
    AND eeeuka.attribute_value_id = p_attrIdVal
	AND UCASE(l1.code) = UCASE(p_langCode)
	AND UCASE(l2.code) = UCASE(p_langCode);

	IF @v_count = 0 THEN
    
        SET @v_response = '';
    
    END IF;

RETURN @v_response;
END