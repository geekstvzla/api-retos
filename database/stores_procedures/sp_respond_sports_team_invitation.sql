DROP PROCEDURE IF EXISTS `sp_respond_sports_team_invitation`;

DELIMITER $$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_respond_sports_team_invitation`(
    IN `p_teamId` INT,
    IN `p_userId` BIGINT,
    IN `p_action` VARCHAR(20),
    OUT `p_response` TEXT
)
BEGIN

    DECLARE v_currentStatus INT DEFAULT NULL;
    DECLARE v_newStatusId INT DEFAULT 0;
    DECLARE v_actionMessage VARCHAR(255) DEFAULT '';

    -- Validar parámetros requeridos
    IF p_teamId IS NULL OR p_teamId = 0 OR p_userId IS NULL OR p_userId = 0 OR p_action IS NULL OR TRIM(p_action) = '' THEN

        SELECT CONCAT('{
            "response": {
                "message": "Parámetros requeridos faltantes",
                "status": "error",
                "statusCode": 0
            }
        }') INTO p_response;

    ELSE

        -- Determinar nuevo estatus y mensaje según la acción
        IF LOWER(TRIM(p_action)) = 'accept' OR p_action = '1' THEN
            SET v_newStatusId = 1;
            SET v_actionMessage = 'Invitación aceptada exitosamente. ¡Ya eres parte del equipo!';
        ELSEIF LOWER(TRIM(p_action)) = 'reject' OR p_action = '3' THEN
            SET v_newStatusId = 3;
            SET v_actionMessage = 'Has rechazado la invitación al equipo.';
        ELSE
            SET v_newStatusId = 0;
        END IF;

        IF v_newStatusId = 0 THEN

            SELECT CONCAT('{
                "response": {
                    "message": "Acción no válida. Use accept o reject.",
                    "status": "error",
                    "statusCode": 0
                }
            }') INTO p_response;

        ELSE

            -- Verificar estatus actual del miembro en el equipo
            SELECT status_id INTO v_currentStatus
            FROM sports_team_members
            WHERE sports_team_id = p_teamId AND user_id = p_userId
            LIMIT 1;

            IF v_currentStatus IS NULL THEN

                SELECT CONCAT('{
                    "response": {
                        "message": "No se encontró el registro de invitación para este usuario en el equipo.",
                        "status": "warning",
                        "statusCode": 2
                    }
                }') INTO p_response;

            ELSEIF v_currentStatus != 2 THEN

                SELECT CONCAT('{
                    "response": {
                        "message": "La invitación ya fue respondida anteriormente o no está en estado pendiente.",
                        "status": "warning",
                        "statusCode": 2
                    }
                }') INTO p_response;

            ELSE

                -- Actualizar estatus del miembro a 1 (Aceptado) o 3 (Rechazado)
                UPDATE sports_team_members
                SET status_id = v_newStatusId,
                    updated_at = NOW()
                WHERE sports_team_id = p_teamId AND user_id = p_userId AND status_id = 2;

                SELECT CONCAT('{
                    "response": {
                        "teamId": ', p_teamId, ',
                        "userId": ', p_userId, ',
                        "action": "', LOWER(TRIM(p_action)), '",
                        "newStatusId": ', v_newStatusId, ',
                        "message": "', v_actionMessage, '",
                        "status": "success",
                        "statusCode": 1
                    }
                }') INTO p_response;

            END IF;

        END IF;

    END IF;

END $$

DELIMITER ;
