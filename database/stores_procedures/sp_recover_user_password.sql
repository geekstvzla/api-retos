CREATE PROCEDURE sp_recover_user_password(IN p_email TEXT, IN p_lang_id INT(3), OUT p_response TEXT)
BEGIN

    SELECT IF(COUNT(1) > 0,TRUE, FALSE)
    INTO @v_user_exists
    FROM users u
    WHERE u.email = p_email;

    IF @v_user_exists > 0 THEN

        SELECT `key`
	    INTO @v_encrypt_key
        FROM vw_encryption_variables;

        SELECT CAST(AES_DECRYPT(u.password, @v_encrypt_key) AS CHAR) AS password
		INTO @v_password
		FROM users u
		WHERE u.email = p_email;
		
		SELECT fn_messages('SP_RECOVER_USER_PASSWORD', 1, 1, p_lang_id) INTO @v_message_data;
		SELECT JSON_UNQUOTE(JSON_EXTRACT(@v_message_data, '$.message')) INTO @v_message;
        
        SELECT CONCAT('{
            "response" : {
                "message"    : "',@v_message,'",
                "password"   : ',@v_password,',
                "sendEmail"  : true,
                "status"     : "success",
				"statusCode" : 1
			}
        }') INTO p_response;

    ELSE
		
		SELECT fn_messages('SP_RECOVER_USER_PASSWORD', 0, 1, p_lang_id) INTO @v_message_data;
		SELECT JSON_UNQUOTE(JSON_EXTRACT(@v_message_data, '$.message')) INTO @v_message;
        
        SELECT CONCAT('{
            "response" : {
				"message"    : "',@v_message,'",
				"status"     : "error",
				"statusCode" : 0
			}
        }') INTO p_response;

    END IF;

END;