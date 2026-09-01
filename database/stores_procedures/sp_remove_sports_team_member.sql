DROP PROCEDURE IF EXISTS `sp_remove_sports_team_member`;

DELIMITER $$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_remove_sports_team_member`(
    IN `p_teamId` INT,
    IN `p_requestingUserId` BIGINT,
    IN `p_targetUserId` BIGINT,
    OUT `p_response` TEXT
)
BEGIN

    DECLARE v_isLeader INT DEFAULT 0;
    DECLARE v_targetStatus INT DEFAULT NULL;
    DECLARE v_creatorUserId BIGINT DEFAULT NULL;

    -- Validar parámetros requeridos
    IF p_teamId IS NULL OR p_teamId = 0 OR p_requestingUserId IS NULL OR p_requestingUserId = 0 OR p_targetUserId IS NULL OR p_targetUserId = 0 THEN

        SELECT CONCAT('{
            "response": {
                "message": "Parámetros requeridos faltantes",
                "status": "error",
                "statusCode": 0
            }
        }') INTO p_response;

    ELSE

        -- Obtener creador del equipo
        SELECT created_by_user_id INTO v_creatorUserId
        FROM sports_teams
        WHERE sports_team_id = p_teamId AND status_id = 1
        LIMIT 1;

        -- Verificar si el usuario solicitante es líder del equipo (creador o role_id = 1)
        IF v_creatorUserId IS NOT NULL AND v_creatorUserId = p_requestingUserId THEN
            SET v_isLeader = 1;
        ELSE
            SELECT COUNT(*) INTO v_isLeader
            FROM sports_team_members
            WHERE sports_team_id = p_teamId AND user_id = p_requestingUserId AND role_id = 1 AND status_id = 1;
        END IF;

        -- Verificar estado actual del miembro a eliminar
        SELECT status_id INTO v_targetStatus
        FROM sports_team_members
        WHERE sports_team_id = p_teamId AND user_id = p_targetUserId AND status_id = 1
        LIMIT 1;

        IF v_targetStatus IS NULL THEN

            SELECT CONCAT('{
                "response": {
                    "message": "El miembro no fue encontrado o no está activo en este equipo deportivo.",
                    "status": "warning",
                    "statusCode": 2
                }
            }') INTO p_response;

        ELSE

            -- Regla de permisos:
            -- Si es líder (v_isLeader > 0): puede eliminar a cualquier miembro.
            -- Si no es líder (v_isLeader = 0): sólo puede eliminarse a sí mismo (p_requestingUserId = p_targetUserId).
            IF v_isLeader = 0 AND p_requestingUserId != p_targetUserId THEN

                SELECT CONCAT('{
                    "response": {
                        "message": "No tiene permisos para eliminar a otros miembros del equipo. Solo un líder puede eliminar a otros miembros.",
                        "status": "error",
                        "statusCode": 0
                    }
                }') INTO p_response;

            ELSE

                -- Desactivar/eliminar miembro (status_id = 3 -> Inactivo/Removido)
                UPDATE sports_team_members
                SET status_id = 3,
                    updated_at = NOW()
                WHERE sports_team_id = p_teamId AND user_id = p_targetUserId AND status_id = 1;

                SELECT CONCAT('{
                    "response": {
                        "teamId": ', p_teamId, ',
                        "targetUserId": ', p_targetUserId, ',
                        "requestingUserId": ', p_requestingUserId, ',
                        "message": "Miembro eliminado del equipo deportivo exitosamente.",
                        "status": "success",
                        "statusCode": 1
                    }
                }') INTO p_response;

            END IF;

        END IF;

    END IF;

END $$

DELIMITER ;
