CREATE PROCEDURE `sp_user_enroll`(IN `p_userId` TEXT, IN `p_editionId` INT, IN `p_kitId` INT, IN `p_modalityId` INT, IN `p_operationNumber` TEXT, IN `p_paymentDay` DATE, IN `p_paymentMethodId` INT, IN `p_langId` VARCHAR(3), IN `p_attrs` TEXT, IN `p_fileExtention` TEXT, OUT `p_response` TEXT)
BEGIN

    SELECT IF(COUNT(1) > 0 ,TRUE ,FALSE),
           u.user_id,
		   u.status_id
    INTO @v_userExist,
         @v_userId,
         @v_userStatusId
    FROM users u
    WHERE u.geek_user_id = p_userId;
    
    IF @v_userExist = 1 AND @v_userStatusId = 1 THEN
    
		SELECT COUNT(1) 
        INTO @v_userEnrolled 
        FROM event_edition_enrolled_users 
        WHERE user_id = @v_userId
        AND event_edition_id = p_editionId
        AND status_id IN(1);
        
        IF @v_userEnrolled > 0 THEN
        
			SELECT CONCAT('{
				"response" : {
					"message"    : "El usuario ya se encuentra registrado.",
					"status"     : "warning",
					"statusCode" : 1
				}
			}') INTO p_response;
        
        ELSE
    
			SELECT IF(COUNT(1) > 0 ,TRUE ,FALSE),
				   ee.status_id,
                   ee.event_type_id
			INTO @v_eventEditionExist,
				 @v_eventEditionStatusId,
                 @v_eventTypeId
			FROM event_edition ee
			WHERE ee.event_edition_id = p_editionId;
			
			IF @v_eventEditionExist = 1 AND @v_eventEditionStatusId = 1 THEN
			
				SELECT IF(COUNT(1) > 0 ,TRUE ,FALSE),
					   eem.status_id
				INTO @v_modalityIExist,
					 @v_eventEditionModeStatusId
				FROM event_edition_mode eem
				WHERE eem.event_edition_id = p_editionId
                AND eem.type_event_mode_id = p_modalityId;
				
				IF @v_modalityIExist = 1 AND @v_eventEditionModeStatusId = 1 THEN
				
					SELECT IF(COUNT(1) > 0 ,TRUE ,FALSE),
						   eemk.status_id
					INTO @v_kitExist,
						 @v_eventEditionModeKitStatusId
					FROM event_edition_mode_kit eemk
					WHERE eemk.event_edition_mode_kit_id = p_kitId;
					
					IF @v_kitExist = 1 AND @v_eventEditionModeKitStatusId = 1 THEN
                        
                        SET @v_enroll_number = fn_get_enroll_number(p_editionId);
						-- SELECT JSON_UNQUOTE(JSON_EXTRACT(@v_enroll_number, '$.enrollNumber')) INTO @v_enroll_number;
                        SELECT JSON_UNQUOTE(CAST(JSON_EXTRACT(@v_enroll_number, "$.enrollNumber") AS CHAR CHARACTER SET utf8mb4)) INTO @v_enroll_number;
                        
                        INSERT INTO event_edition_enrolled_users(
                            enroll_number,
							user_id, 
							event_edition_id, 
							event_edition_mode_id, 
							event_edition_mode_kit_id, 
							status_id
						) VALUES (
                            @v_enroll_number,
							@v_userId, 
							p_editionId, 
							p_modalityId, 
							p_kitId, 
							1
						);
                        
                        SELECT LAST_INSERT_ID() INTO @v_eventEditionEnrolledUserId;
                        
                        SET @attrs_created = 0;
						SET @i = 0;
						SET @items = JSON_LENGTH(p_attrs);
                        
                        WHILE @i < @items DO

							SELECT JSON_EXTRACT(p_attrs, CONCAT('$[',@i,']')) INTO @v_attr;
							-- SELECT JSON_UNQUOTE(JSON_EXTRACT(@v_attr, '$.attrValId')) INTO @v_attrValId;
                            SELECT JSON_UNQUOTE(CAST(JSON_EXTRACT(@v_attr, "$.attrValId") AS CHAR CHARACTER SET utf8mb4)) INTO @v_attrValId;
							SELECT JSON_EXTRACT(@v_attr, '$.attrId') INTO @v_attrId;
                            
                            INSERT INTO event_edition_enrolled_users_kit_attrs(
                                event_edition_enrolled_user_id,
                                attribute_id,
                                attribute_value_id,
                                status_id
                            ) VALUES (
                                @v_eventEditionEnrolledUserId,
                                @v_attrId,
                                @v_attrValId,
                                1
                            );
                            
						    SET @i = @i + 1;

		                END WHILE;
                        
                        IF @v_eventTypeId = 1 OR @v_eventTypeId = 3 THEN -- 1 Evento pago, 3 Evento Recaudación de fondos
							
							SET @v_filename = CONCAT(@v_enroll_number,'-voucher.',p_fileExtention);
                            
							INSERT INTO event_edition_reported_payment(
								event_edition_enrolled_user_id,
								user_id, 
								event_edition_id, 
								payment_method_id, 
								payment_date, 
								operation_number,
								voucher_file,
								status_id
							) VALUES (
								@v_eventEditionEnrolledUserId,
								@v_userId, 
								p_editionId, 
								p_paymentMethodId, 
								p_paymentDay, 
								p_operationNumber, 
								@v_filename,
								1
							);
                            
						ELSE
                        
						    SET @v_filename = '';
                            
						END IF;
                        
                        SELECT ei.title,
							   ei.event_edition,
                               ei.whatsapp_general_group,
                               ei.whatsapp_enrolled_group
						INTO @v_event_title,
                             @v_event_edition,
                             @v_whatsapp_general_group,
                             @v_whatsapp_enrolled_group
						FROM vw_event_header_info ei
						WHERE ei.event_edition_id = p_editionId
                        AND UPPER(ei.language_code) = UPPER(p_langId);
                        
                        SELECT teml.description AS modality INTO @v_modality
						FROM type_event_modes tem
						INNER JOIN type_event_modes_lang teml ON teml.type_event_mode_id = tem.type_event_mode_id
						INNER JOIN languages l ON l.language_id = teml.language_id
						WHERE tem.type_event_mode_id = p_modalityId
						AND UPPER(l.code) = UPPER(p_langId);
                        
                        SELECT eemk.description INTO @v_kit
                        FROM event_edition_mode_kit eemk 
                        WHERE eemk.event_edition_mode_kit_id = p_kitId;
						
						SELECT CONCAT('{
							"response" : {
                                "enrollData"   : {
                                    "enrollNumber"       : "',@v_enroll_number,'",
                                    "eventEdition"       : "',@v_event_edition,'",
                                    "eventKit"           : "',@v_kit,'",
                                    "eventModality"      : "',@v_modality,'",
                                    "eventTitle"         : "',@v_event_title,'",
                                    "voucherName"        : "',@v_filename,'"
                                }, 
                                "eventWhatsappGeneralGroup" : "',@v_whatsapp_general_group,'",
                                "eventWhatsappEnrolledGroup" : "',@v_whatsapp_enrolled_group,'",
								"message"            : "Usuario registrado con éxito.",
								"status"             : "success",
								"statusCode"         : 1
							}
						}') INTO p_response;
					
					ELSEIF @v_kitExist = 1 AND @v_eventEditionModeKitStatusId != 1 THEN
					
						SELECT CONCAT('{
							"response" : {
								"message"    : "El kit se encuentra inactivo.",
								"status"     : "error",
								"statusCode" : 8
							}
						}') INTO p_response;
					
					ELSE
					
						SELECT CONCAT('{
							"response" : {
								"message"    : "El kit no se encuentra.",
								"status"     : "error",
								"statusCode" : 7
							}
						}') INTO p_response;
					
					END IF;
				
				ELSEIF @v_modalityIExist = 1 AND @v_eventEditionModeStatusId != 1 THEN
				
					SELECT CONCAT('{
						"response" : {
							"message"    : "La modalidad para esta edición del evento se encuentra inactiva.",
							"status"     : "error",
							"statusCode" : 6
						}
					}') INTO p_response;
				
				ELSE
				
					SELECT CONCAT('{
						"response" : {
							"message"    : "La modalidad no existe.",
							"status"     : "error",
							"statusCode" : 5
						}
					}') INTO p_response;
				
				END IF;
				
			ELSEIF @v_eventEditionExist = 1 AND @v_eventEditionStatusId != 1 THEN
			
				SELECT CONCAT('{
					"response" : {
						"message"    : "La edición del evento se encuentra inactiva.",
						"status"     : "error",
						"statusCode" : 4
					}
				}') INTO p_response;
			
			ELSE 
			
				SELECT CONCAT('{
					"response" : {
						"message"    : "La edición del evento no existe.",
						"status"     : "error",
						"statusCode" : 3
					}
				}') INTO p_response;
			
			END IF;
            
		END IF;
            
	ELSEIF @v_userExist = 1 AND @v_userStatusId != 1 THEN
    
        SELECT CONCAT('{
			"response" : {
				"message"    : "El usuario no está activo.",
				"status"     : "error",
				"statusCode" : 2
			}
		}') INTO p_response;
        
	ELSE
    
		SELECT CONCAT('{
			"response" : {
				"message"    : "El usuario no existe.",
				"status"     : "error",
				"statusCode" : 1
			}
		}') INTO p_response;
    
    END IF;

END