CREATE PROCEDURE `sp_create_order`(
	IN p_order_type_id INT(1),
    IN p_product_id INT,
    IN p_currency_id INT,
    IN p_amount DECIMAL(20,2),
    IN p_price DECIMAL(20,2),
    IN p_weighing_unit_id INT(1),
    IN p_latitude TEXT,
    IN p_longitude TEXT,
    IN p_lang_id INT,
    IN p_user_id INT,
    IN p_confirmed INT,
    OUT p_response TEXT
)
BEGIN
	
    -- Check if the product the user is trying to attach to the order exists
	SELECT IF(COUNT(1) > 0,TRUE, FALSE),
           status_id
    INTO @v_product_exists,
         @v_product_status_id
    FROM products p
    WHERE p.product_id = p_product_id;
    
    IF p_confirmed = 0 THEN
    
		-- Check if exists an similar order
		SELECT IF(COUNT(1) > 0,TRUE, FALSE),
               o.code
		INTO @v_order_exists,
             @v_order_code
		FROM orders o
		WHERE user_id = p_user_id
		AND product_id = p_product_id
		AND order_type_id = p_order_type_id
		AND amount = p_amount
		AND price = p_price
		AND latitude = p_latitude
		AND longitude = p_longitude
		AND weighing_unit_id = p_weighing_unit_id
		AND currency_id = p_currency_id
		AND DATE_FORMAT(created_date, '%Y-%m-%d %H') = DATE_FORMAT(NOW(), '%Y-%m-%d %H')
		AND status_id = 1;
    
    ELSE
    
		SET @v_order_exists = 0;
    
    END IF;
    
    IF @v_product_exists = 1 AND @v_product_status_id = 1 AND @v_order_exists = 0  THEN
        
		INSERT INTO orders (order_type_id, product_id, weighing_unit_id, amount, price, currency_id, latitude, longitude, user_id, created_date, status_id) 
        VALUES (p_order_type_id, p_product_id, p_weighing_unit_id, p_amount, p_price, p_currency_id, p_latitude, p_longitude, p_user_id, NOW(), 1);
        
	    SELECT LAST_INSERT_ID() INTO @v_order_id;
        SELECT CONCAT(p_product_id,p_user_id,p_order_type_id,@v_order_id) INTO @v_order_code;
        
        UPDATE orders o SET o.code = @v_order_code WHERE o.order_id = @v_order_id;
        
		IF p_order_type_id = 1 THEN -- Sell orders
			SELECT fn_messages('SP_CREATE_ORDER', 1, 1, p_lang_id) INTO @v_message_data;
        ELSE -- Buy orders
			SELECT fn_messages('SP_CREATE_ORDER', 3, 1, p_lang_id) INTO @v_message_data;			
        END IF;

		SELECT JSON_UNQUOTE(JSON_EXTRACT(@v_message_data, '$.message')) INTO @v_message;
	
		SELECT CONCAT('{
			"response" : {
				"message"    : "',@v_message,'",
				"status"     : "success",
				"statusCode" : 1
			}
		}') INTO p_response;
	
    ELSEIF @v_product_exists = 1 AND @v_product_status_id = 2 THEN
    
		SELECT fn_messages('SP_CREATE_ORDER', 2, 1, p_lang_id) INTO @v_message_data;
		SELECT JSON_UNQUOTE(JSON_EXTRACT(@v_message_data, '$.message')) INTO @v_message;
        
        SELECT CONCAT('{
			"response" : {
				"message"    : "',@v_message,'",
				"status"     : "error",
				"statusCode" : 2
			}
        }') INTO p_response;
        
	ELSEIF @v_order_exists = 1 THEN
    
		SELECT fn_messages('SP_CREATE_ORDER', 4, 1, p_lang_id) INTO @v_message_data;
		SELECT JSON_UNQUOTE(JSON_EXTRACT(@v_message_data, '$.message')) INTO @v_message;
        
        SET @v_message = REPLACE(@v_message, '####', @v_order_code);
     
        SELECT CONCAT('{
			"response" : {
				"message"    : "',@v_message,'",
				"status"     : "error",
				"statusCode" : 4
			}
        }') INTO p_response;
    
    ELSE
		
        SELECT fn_messages('SP_CREATE_ORDER', 0, 1, p_lang_id) INTO @v_message_data;
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