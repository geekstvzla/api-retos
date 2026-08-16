DROP PROCEDURE IF EXISTS `sp_create_order_from_enrollment`;

DELIMITER $$

CREATE PROCEDURE `sp_create_order_from_enrollment`(
    IN `p_userId` VARCHAR(255),
    IN `p_eventEditionId` INT,
    IN `p_eventEditionEnrolledUserId` INT,
    IN `p_totalAmount` DECIMAL(30,8),
    IN `p_currencyId` INT,
    IN `p_operationNumber` VARCHAR(255),
    IN `p_paymentDate` DATETIME,
    IN `p_voucherFile` TEXT,
    IN `p_items` LONGTEXT,
    OUT `p_response` TEXT
)
BEGIN
    DECLARE v_userId BIGINT UNSIGNED;
    DECLARE v_orderId INT;
    DECLARE v_itemsCount INT DEFAULT 0;
    DECLARE v_i INT DEFAULT 0;
    DECLARE v_productId INT;
    DECLARE v_quantity INT;
    DECLARE v_unitPrice DECIMAL(30,8);
    DECLARE v_subtotal DECIMAL(30,8);
    DECLARE v_item JSON;

    -- Obtener el user_id de la tabla users mediante geek_user_id o user_id
    SELECT u.user_id 
    INTO v_userId 
    FROM users u 
    WHERE u.geek_user_id = p_userId OR u.user_id = p_userId 
    LIMIT 1;

    IF v_userId IS NULL THEN
        SELECT CONCAT('{
            "response": {
                "message": "Error al registrar la orden: Usuario no encontrado",
                "status": "error",
                "statusCode": 0
            }
        }') INTO p_response;
    ELSE
        -- Registrar la orden en product_orders
        INSERT INTO product_orders (
            user_id,
            event_edition_id,
            event_edition_enrolled_user_id,
            total_amount,
            currency_id,
            operation_number,
            payment_date,
            voucher_file,
            status_id
        ) VALUES (
            v_userId,
            p_eventEditionId,
            p_eventEditionEnrolledUserId,
            IFNULL(p_totalAmount, 0),
            IFNULL(p_currencyId, 1),
            p_operationNumber,
            p_paymentDate,
            p_voucherFile,
            1
        );

        SET v_orderId = LAST_INSERT_ID();

        -- Registrar el detalle de productos en product_order_items
        IF p_items IS NOT NULL AND JSON_VALID(p_items) THEN
            SET v_itemsCount = JSON_LENGTH(p_items);
            
            WHILE v_i < v_itemsCount DO
                SELECT JSON_EXTRACT(p_items, CONCAT('$[', v_i, ']')) INTO v_item;
                
                -- Extraer product_id probando productId, product_id o id
                SELECT JSON_UNQUOTE(CAST(JSON_EXTRACT(v_item, '$.productId') AS CHAR CHARACTER SET utf8mb4)) INTO v_productId;
                IF v_productId IS NULL THEN
                    SELECT JSON_UNQUOTE(CAST(JSON_EXTRACT(v_item, '$.product_id') AS CHAR CHARACTER SET utf8mb4)) INTO v_productId;
                END IF;
                IF v_productId IS NULL THEN
                    SELECT JSON_UNQUOTE(CAST(JSON_EXTRACT(v_item, '$.id') AS CHAR CHARACTER SET utf8mb4)) INTO v_productId;
                END IF;

                -- Extraer cantidad probando quantity o qty
                SELECT CAST(JSON_UNQUOTE(CAST(JSON_EXTRACT(v_item, '$.quantity') AS CHAR CHARACTER SET utf8mb4)) AS SIGNED) INTO v_quantity;
                IF v_quantity IS NULL THEN
                    SELECT CAST(JSON_UNQUOTE(CAST(JSON_EXTRACT(v_item, '$.qty') AS CHAR CHARACTER SET utf8mb4)) AS SIGNED) INTO v_quantity;
                END IF;
                IF v_quantity IS NULL THEN
                    SET v_quantity = 1;
                END IF;

                -- Extraer precio unitario probando price, unitPrice o unit_price
                SELECT CAST(JSON_UNQUOTE(CAST(JSON_EXTRACT(v_item, '$.price') AS CHAR CHARACTER SET utf8mb4)) AS DECIMAL(30,8)) INTO v_unitPrice;
                IF v_unitPrice IS NULL THEN
                    SELECT CAST(JSON_UNQUOTE(CAST(JSON_EXTRACT(v_item, '$.unitPrice') AS CHAR CHARACTER SET utf8mb4)) AS DECIMAL(30,8)) INTO v_unitPrice;
                END IF;
                IF v_unitPrice IS NULL THEN
                    SELECT CAST(JSON_UNQUOTE(CAST(JSON_EXTRACT(v_item, '$.unit_price') AS CHAR CHARACTER SET utf8mb4)) AS DECIMAL(30,8)) INTO v_unitPrice;
                END IF;
                IF v_unitPrice IS NULL THEN
                    SET v_unitPrice = 0.00;
                END IF;

                -- Extraer subtotal probando subtotal o calculando unitPrice * quantity (monto original)
                SELECT CAST(JSON_UNQUOTE(CAST(JSON_EXTRACT(v_item, '$.subtotal') AS CHAR CHARACTER SET utf8mb4)) AS DECIMAL(30,8)) INTO v_subtotal;
                IF v_subtotal IS NULL THEN
                    SET v_subtotal = v_unitPrice * v_quantity;
                END IF;

                IF v_productId IS NOT NULL THEN
                    INSERT INTO product_order_items (
                        product_order_id,
                        product_id,
                        quantity,
                        unit_price,
                        subtotal
                    ) VALUES (
                        v_orderId,
                        v_productId,
                        v_quantity,
                        v_unitPrice,
                        v_subtotal
                    );
                END IF;

                SET v_i = v_i + 1;
            END WHILE;
        END IF;

        SELECT CONCAT('{
            "response": {
                "orderId": ', v_orderId, ',
                "message": "Orden creada exitosamente",
                "status": "success",
                "statusCode": 1
            }
        }') INTO p_response;
    END IF;
END $$

DELIMITER ;
