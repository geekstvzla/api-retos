CREATE PROCEDURE `sp_sign_in`(IN `p_user_id` INT, IN `p_lang_id` INT, OUT `p_response` TEXT)
BEGIN

    SELECT IF(COUNT(1) > 0,TRUE ,FALSE)
    INTO @v_user_exist
    FROM users u
    WHERE u.geek_user_id = p_user_id;
    
    IF @v_user_exist = 1 THEN
		
        UPDATE users u SET u.login_date = NOW() WHERE u.geek_user_id = p_user_id;
        
	ELSE
    
		INSERT INTO users (geek_user_id, refered_by,status_id, login_date) VALUES (p_user_id, null, 1, NOW());
    
    END IF;
    
    SELECT CONCAT('{
		"response" : {
			"message"    : "',@v_message,'",
			"status"     : "success",
			"statusCode" : 1
		}
	}') INTO p_response;

END;