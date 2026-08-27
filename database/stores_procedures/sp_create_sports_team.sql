DROP PROCEDURE IF EXISTS `sp_create_sports_team`;

DELIMITER $$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_create_sports_team`(
    IN `p_name` VARCHAR(150),
    IN `p_slug` VARCHAR(180),
    IN `p_logo` VARCHAR(255),
    IN `p_regionId` INT,
    IN `p_createdByUserId` BIGINT,
    IN `p_members` LONGTEXT,
    OUT `p_response` TEXT
)
BEGIN

    DECLARE v_teamId INT DEFAULT 0;
    DECLARE v_slug VARCHAR(180);
    DECLARE v_membersCount INT DEFAULT 0;
    DECLARE v_i INT DEFAULT 0;
    DECLARE v_memberItem JSON;
    DECLARE v_memberId BIGINT DEFAULT 0;
    DECLARE v_creatorRoleExists INT DEFAULT 0;
    DECLARE v_isLeaderRaw VARCHAR(10);
    DECLARE v_memberRoleId INT DEFAULT 2;

    -- Validar nombre del equipo
    IF p_name IS NULL OR TRIM(p_name) = '' THEN
    
        SELECT CONCAT('{
            "response": {
                "message": "El nombre del equipo es obligatorio",
                "status": "error",
                "statusCode": 0
            }
        }') INTO p_response;

    -- Validar selección de Región/Ubicación
    ELSEIF p_regionId IS NULL OR p_regionId = 0 THEN
    
        SELECT CONCAT('{
            "response": {
                "message": "Debe seleccionar una parroquia/ubicación válida",
                "status": "error",
                "statusCode": 0
            }
        }') INTO p_response;

    ELSE
    
        -- Generar slug si no se proporcionó uno válido
        IF p_slug IS NULL OR TRIM(p_slug) = '' THEN
        
            SET v_slug = LOWER(TRIM(p_name));
            SET v_slug = REPLACE(v_slug, ' ', '-');
            SET v_slug = REPLACE(v_slug, 'á', 'a');
            SET v_slug = REPLACE(v_slug, 'é', 'e');
            SET v_slug = REPLACE(v_slug, 'í', 'i');
            SET v_slug = REPLACE(v_slug, 'ó', 'o');
            SET v_slug = REPLACE(v_slug, 'ú', 'u');
            SET v_slug = REPLACE(v_slug, 'ñ', 'n');

            IF EXISTS (SELECT 1 FROM sports_teams WHERE slug = v_slug) THEN
            
                SET v_slug = CONCAT(v_slug, '-', UNIX_TIMESTAMP());
                
            END IF;
            
        ELSE
        
            SET v_slug = LOWER(TRIM(p_slug));
            
        END IF;

        -- Registrar el nuevo equipo deportivo en la tabla sports_teams
        INSERT INTO sports_teams (
            name,
            slug,
            region_id,
            created_by_user_id,
            status_id,
            created_at
        ) VALUES (
            TRIM(p_name),
            v_slug,
            p_regionId,
            IFNULL(p_createdByUserId, 1),
            1,
            NOW()
        );

        SET v_teamId = LAST_INSERT_ID();
        
        UPDATE sports_teams SET logo = CONCAT(v_teamId,'/',p_logo) WHERE sports_team_id = v_teamId;

        -- Registrar miembros asociados en la tabla sports_team_members
        IF p_members IS NOT NULL AND JSON_VALID(p_members) THEN
        
            SET v_membersCount = JSON_LENGTH(p_members);

            WHILE v_i < v_membersCount DO
            
                SELECT JSON_EXTRACT(p_members, CONCAT('$[', v_i, ']')) INTO v_memberItem;
                SELECT JSON_UNQUOTE(CAST(JSON_EXTRACT(v_memberItem, '$.id') AS CHAR CHARACTER SET utf8mb4)) INTO v_memberId;

                SELECT JSON_UNQUOTE(CAST(JSON_EXTRACT(v_memberItem, '$.isLeader') AS CHAR CHARACTER SET utf8mb4)) INTO v_isLeaderRaw;
                IF v_isLeaderRaw IS NULL THEN
                    SELECT JSON_UNQUOTE(CAST(JSON_EXTRACT(v_memberItem, '$.is_leader') AS CHAR CHARACTER SET utf8mb4)) INTO v_isLeaderRaw;
                END IF;

                IF v_isLeaderRaw = 'true' OR v_isLeaderRaw = '1' THEN
                    SET v_memberRoleId = 1; -- Role 1: LEADER
                ELSE
                    SET v_memberRoleId = 2; -- Role 2: MEMBER
                END IF;

                -- Registrar en sports_team_members con su correspondiente rol (1: Líder, 2: Miembro)
				INSERT INTO sports_team_members (
					sports_team_id,
					user_id,
					role_id,
					status_id,
					joined_at,
					created_at,
					updated_at
				) VALUES (
					v_teamId,
					v_memberId,
					v_memberRoleId,
					IF(v_memberId = p_createdByUserId, 1, 2), -- Status 1: Creador/Aceptado, Status 2: Pendiente
					NOW(),
					NOW(),
					NOW()
				);
                
                IF v_memberId = p_createdByUserId THEN
					SET v_creatorRoleExists = 1;
				END IF;
                
                SET v_i = v_i + 1;
                
            END WHILE;
            
        END IF;

        -- Garantizar que el creador quede registrado como líder del equipo si aún no se ha agregado
        IF p_createdByUserId IS NOT NULL AND p_createdByUserId > 0 AND v_creatorRoleExists = 0 THEN
        
            INSERT INTO sports_team_members (
                sports_team_id,
                user_id,
                role_id,
                status_id,
                joined_at,
                created_at,
                updated_at
            ) VALUES (
                v_teamId,
                p_createdByUserId,
                1,
                1,
                NOW(),
                NOW(),
                NOW()
            );
            
        END IF;

        -- Retornar estructura de respuesta JSON exitosa con el teamId
        SELECT CONCAT('{
            "response": {
                "teamId": ', v_teamId, ',
                "message": "Equipo deportivo creado exitosamente",
                "status": "success",
                "statusCode": 1
            }
        }') INTO p_response;

    END IF;
END