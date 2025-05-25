CREATE PROCEDURE `sp_sign_up`(IN `p_email` TEXT, IN `p_password` TEXT, IN `p_username` VARCHAR(25), IN `p_lang_id` INT(3), OUT `p_response` TEXT)
BEGIN

    SELECT IF(COUNT(1) > 0,TRUE, FALSE)
    INTO @v_user_exists
    FROM users u
    WHERE u.email = p_email;
    
    SELECT IF(COUNT(1) > 0,TRUE, FALSE)
    INTO @v_username_exists
	FROM users u
	WHERE u.username = p_username;

    IF @v_user_exists = 0 THEN
		
		IF @v_username_exists = 0 THEN
        
			SELECT AES_ENCRYPT(p_password, (SELECT value FROM setting WHERE name = "encrypt-key")) INTO @v_password;
			INSERT INTO users (email, password, username, status_id) VALUE (LOWER(p_email), TRIM(@v_password), LOWER(p_username), 3);
			SET @v_user_id = LAST_INSERT_ID();
            
            SELECT fn_messages("SP_SING_UP", 1, 1, p_lang_id) INTO @v_message_data;
			SELECT JSON_UNQUOTE(JSON_EXTRACT(@v_message_data, '$.message')) INTO @v_message;
			
			SELECT CONCAT('{
				"response" : {
					"userId"     : ',@v_user_id,',
					"message"    : "',@v_message,'",
					"status"     : "success",
					"statusCode" : 1
				}
			 }') INTO p_response;
             
		ELSE
			
			SELECT fn_messages("SP_SING_UP", 3, 1, p_lang_id) INTO @v_message_data;
			SELECT JSON_UNQUOTE(JSON_EXTRACT(@v_message_data, '$.message')) INTO @v_message;
			
			SELECT CONCAT('{
				"response" : {
					"message"    : "',@v_message,'",
					"status"     : "warning",
					"statusCode" : 3
				}
			}') INTO p_response;
        
        END IF;

    ELSE
        
        SELECT fn_messages("SP_SING_UP", 2, 1, p_lang_id) INTO @v_message_data;
		SELECT JSON_UNQUOTE(JSON_EXTRACT(@v_message_data, '$.message')) INTO @v_message;
        
        SELECT CONCAT('{
            "response" : {
				"message"    : "',@v_message,'",
				"status"     : "warning",
				"statusCode" : 2
			}
        }') INTO p_response;

    END IF;

END;