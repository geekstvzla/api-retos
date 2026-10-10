require('dotenv').config();
let db = require('../config/database.js');

const eventsUser = (params) => {

    return new Promise(function (resolve, reject) {

        let queryString = `SELECT DISTINCT ee.event_edition_id,
                                  e.title,
                                  CONCAT('${process.env.API_PUBLIC + "/images/events/"}',ee.featured_image) AS featured_image,
                                  DATE_FORMAT(ee.departure_date, '%Y-%m-%d %h:%i:%s %p') AS departure_date,
                                  ee.description AS event_edition,
                                  etl.description AS event_type,
                                  ee.event_type_id,
                                  (
                                      SELECT GROUP_CONCAT(DISTINCT teml.description SEPARATOR ', ') AS event_modes
                                      FROM event_edition_mode eem
                                          JOIN type_event_modes tem ON tem.type_event_mode_id = eem.type_event_mode_id
                                          JOIN type_event_modes_lang teml ON teml.type_event_mode_id = eem.type_event_mode_id
                                          JOIN languages l2 ON l2.language_id = teml.language_id
                                          WHERE eem.status_id = 1
                                          AND l2.language_id = l.language_id
                                          AND eem.event_edition_id = ee.event_edition_id
                                  ) AS event_modes,
                                  (
                                      SELECT COUNT(*)
                                      FROM event_edition_enrolled_users eeeu
                                      WHERE eeeu.event_edition_id = ee.event_edition_id
                                      AND eeeu.user_id = (
                                          SELECT u.user_id FROM users u WHERE u.geek_user_id = ?
                                      )
                                  ) AS enrolled,
                                  (
                                    SELECT IF(COUNT(eeuc.see_participants) = 0, 0, eeuc.see_participants) 
                                    FROM event_edition_user_control eeuc
                                    WHERE eeuc.event_edition_id = ee.event_edition_id
                                    AND eeuc.user_id = (
                                        SELECT u.user_id FROM users u WHERE u.geek_user_id = ?
                                    )
                                  ) AS see_participants
                           FROM event_edition ee
                                INNER JOIN events e ON e.event_id = ee.event_id
                                INNER JOIN event_types et ON ee.event_type_id = et.event_type_id
                                INNER JOIN event_types_lang etl ON et.event_type_id = etl.event_type_id 
                                INNER JOIN languages l ON l.language_id = etl.language_id
                           WHERE (
                               EXISTS (
                                   SELECT 1 
                                   FROM event_edition_enrolled_users eeeu
                                   WHERE eeeu.event_edition_id = ee.event_edition_id 
                                   AND eeeu.user_id = (
                                       SELECT u.user_id FROM users u WHERE u.geek_user_id = ?
                                   )
                               )
                               OR EXISTS (
                                   SELECT 1 
                                   FROM event_edition_user_control eeuc
                                   WHERE eeuc.event_edition_id = ee.event_edition_id 
                                   AND eeuc.user_id = (
                                       SELECT u.user_id FROM users u WHERE u.geek_user_id = ?
                                   )
                               )
                           )
                           AND UPPER(l.code) = UPPER(?)
                           ORDER BY ee.departure_date DESC;`;

        db.query(queryString, params, async function (err, result) {

            if (err) {

                reject({
                    response: {
                        error: err,
                        message: "Error al tratar de ejecutar la consulta linea 36",
                        status: "error",
                        statusCode: 0
                    }
                });

            } else {

                resolve(result);
            }
        });

    }).catch(function (error) {
        return (error);
    });

}

const myEvetInfoEnrollment = (params) => {

    return new Promise(function (resolve, reject) {

        let queryString = `SELECT eeeu.enroll_number,
                                  eeeu.sport_team_id AS sports_team_id,
                                  DATE_FORMAT(ee.departure_date, '%Y-%m-%d %H:%i:%s') AS departure_date,
                                  (
                                          SELECT teml.description 
                                          FROM type_event_modes_lang teml
                                              JOIN languages l ON l.language_id = teml.language_id
                                              LEFT JOIN event_edition_mode eem ON eem.type_event_mode_id = teml.type_event_mode_id
                                              LEFT JOIN event_edition_mode_kit eemk ON eemk.event_edition_mode_id = eem.event_edition_mode_id
                                          WHERE teml.type_event_mode_id = eeeu.event_edition_mode_id
                                             OR (eemk.event_edition_mode_kit_id = eeeu.event_edition_mode_kit_id AND eeeu.event_edition_mode_kit_id IS NOT NULL)
                                             OR (eem.event_edition_mode_id = eeeu.event_edition_mode_id AND eeeu.event_edition_mode_id IS NOT NULL)
                                          ORDER BY (UPPER(l.code) = UPPER(?)) DESC
                                          LIMIT 1
                                      ) AS mode,
                                  (
                                      SELECT eemk.description 
                                      FROM event_edition_mode_kit eemk
                                      WHERE eemk.event_edition_mode_kit_id = eeeu.event_edition_mode_kit_id
                                  ) AS kit,
                                  fn_get_user_event_attr_value(
                                      eeeu.event_edition_id,
                                      eeeu.user_id,
                                      1,
                                      (
                                          SELECT eeeuka.attribute_value_id 
                                          FROM event_edition_enrolled_users_kit_attrs eeeuka 
                                          WHERE eeeuka.event_edition_enrolled_user_id = eeeu.event_edition_enrolled_user_id
                                          AND eeeuka.attribute_id = 1
                                      ),
                                      'ESP'
                                  ) AS size,
                                  fn_get_user_event_attr_value(
                                      eeeu.event_edition_id,
                                      eeeu.user_id,
                                      2,
                                      (
                                          SELECT eeeuka.attribute_value_id 
                                          FROM event_edition_enrolled_users_kit_attrs eeeuka 
                                          WHERE eeeuka.event_edition_enrolled_user_id = eeeu.event_edition_enrolled_user_id
                                          AND eeeuka.attribute_id = 2
                                      ),
                                      'ESP'
                                  ) AS gender,
                                  (
								      SELECT eerp.payment_date 
                                      FROM event_edition_reported_payment eerp 
                                      WHERE eerp.user_id = eeeu.user_id 
                                      AND eerp.event_edition_id = ?
                                  ) AS payment_date,
								  (
									  SELECT eerp.operation_number 
                                      FROM event_edition_reported_payment eerp 
                                      WHERE eerp.user_id = eeeu.user_id 
                                      AND eerp.event_edition_id = ?
                                  ) AS operation_number,
                                  eecc.image AS certificate_image
                           FROM event_edition_enrolled_users eeeu
                               JOIN event_edition ee ON ee.event_edition_id = eeeu.event_edition_id
                               LEFT JOIN event_edition_certificate_config eecc ON eeeu.event_edition_id = eecc.event_edition_id
                               JOIN users u2 ON u2.user_id = eeeu.user_id
                               JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.user_secure_id usi ON usi.secure_id = u2.geek_user_id
                               JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.users u ON u.user_id = usi.user_id
                           WHERE eeeu.event_edition_id = ?
                           AND eeeu.user_id = (
                               SELECT u.user_id FROM users u WHERE u.geek_user_id = ?
                         )
                           ORDER BY eeeu.enroll_number ASC;`;

        db.query(queryString, params, async function (err, result) {

            if (err) {

                reject({
                    response: {
                        error: err,
                        message: "Error al tratar de ejecutar la consulta linea 36",
                        status: "error",
                        statusCode: 0
                    }
                });

            } else {

                resolve(result[0]);
            }
        });

    }).catch(function (error) {
        return (error);
    });

}

const myEventCertificateInfo = (params) => {

    return new Promise(function (resolve, reject) {

        let queryString = `SELECT u.first_name,
                                  u.last_name,
                                  u.document_id,
                                  CONCAT('${process.env.API_PUBLIC + "/images/events/"}', eecc.image) AS certificate_image,
                                  eecc.height AS certificate_height,
                                  eecc.width AS certificate_width,
                                  DATE_FORMAT(ee.departure_date, '%Y-%m-%d %H:%i:%s') AS departure_date,
                                  eecc.font_size,
                                  eecc.font_color,
                                  eecc.x_name_position,
                                  eecc.y_name_position,
                                  eecc.orientation
                           FROM event_edition_enrolled_users eeeu
                               JOIN event_edition_certificate_config eecc ON eeeu.event_edition_id = eecc.event_edition_id
                               JOIN users u2 ON u2.user_id = eeeu.user_id
                               JOIN event_edition ee ON ee.event_edition_id = eeeu.event_edition_id
                               JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.user_secure_id usi ON usi.secure_id = u2.geek_user_id
                               JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.users u ON u.user_id = usi.user_id
                           WHERE eeeu.event_edition_id = ?
                           AND eeeu.user_id = (
                               SELECT uu.user_id FROM users uu WHERE uu.geek_user_id = ?
                           );`;

        db.query(queryString, params, function (err, result) {

            if (err) {

                reject({
                    response: {
                        error: err,
                        message: "Error al tratar de ejecutar la consulta linea 189",
                        status: "error",
                        statusCode: 0
                    }
                });

            } else {

                resolve(result[0]);
            }
        });

    }).catch(function (error) {
        return (error);
    });

};

const signIn = (params) => {

    return new Promise(function (resolve, reject) {

        let queryString = `CALL sp_sign_in(?,?,@response);`;
        db.query(queryString, params, function (err, result) {

            if (err) {

                reject({
                    response: {
                        message: "Error executing stored procedure sp_sign_in in line 219",
                        status: "error",
                        statusCode: 0,
                        error: err
                    }
                });

            } else {

                db.query('SELECT @response as response', (err2, result2) => {

                    if (err2) {

                        reject({
                            response: {
                                message: "Error when trying to execute the query in line 171",
                                status: "error",
                                statusCode: 0,
                                error: err2
                            }
                        });

                    } else {

                        let outputParam = JSON.parse(result2[0].response);
                        resolve(outputParam);

                    };

                });

            };

        });

    }).catch(function (error) {

        return (error);

    });

};

const svgCertificate = (params) => {

    let svgStructure = `<svg xmlns="http://www.w3.org/2000/svg"
        width="${params.width}"
        height="${params.height}"
        viewBox="0 0 ${params.width} ${params.height}">

        <!-- Imagen del certificado -->
        <image href="${params.image}"
            x="0"
            y="0"
            width="${params.width}"
            height="${params.height}"/>

        <!-- Nombre -->
        <text
            id="nombre"
            x="${params.xNamePosition}"
            y="${params.yNamePosition}"
            text-anchor="middle"
            font-family="Georgia"
            font-size="${params.fontSize}"
            fill="${params.fontColor}">

            ${params.participantName}

        </text>

    </svg>`;

    //return Buffer.from(svgStructure, 'utf-8');
    return svgStructure;

}

const userData = (geekUserId) => {

    return new Promise(function (resolve, reject) {

        let queryString = `SELECT user_id
                           FROM users u
                           WHERE u.geek_user_id = ?;`;

        db.query(queryString, [geekUserId], function (err, result) {

            if (err) {

                reject({
                    response: {
                        error: err,
                        message: "Error al tratar de ejecutar la consulta linea 325",
                        status: "error",
                        statusCode: 0
                    }
                });

            } else {

                resolve(result[0]);
            }
        });

    }).catch(function (error) {

        return (error);

    });

};

const updateMyEventSportsTeam = (eventEditionId, userId, sportsTeamId) => {
    return new Promise(function (resolve, reject) {
        let teamId = (sportsTeamId !== null && sportsTeamId !== undefined && sportsTeamId !== '') ? parseInt(sportsTeamId) : null;

        let checkQuery = `SELECT departure_date FROM event_edition WHERE event_edition_id = ?;`;
        db.query(checkQuery, [eventEditionId], function (errCheck, resCheck) {
            if (!errCheck && resCheck && resCheck.length > 0 && resCheck[0].departure_date) {
                let depDate = new Date(resCheck[0].departure_date);
                if (depDate < new Date()) {
                    return resolve({
                        response: {
                            message: "No se puede actualizar el equipo deportivo porque el evento ya ha transcurrido.",
                            status: "warning",
                            statusCode: 0
                        }
                    });
                }
            }

            let queryString = `UPDATE event_edition_enrolled_users eeeu
                               SET eeeu.sport_team_id = ?
                               WHERE eeeu.event_edition_id = ?
                               AND eeeu.user_id = (
                                   SELECT u.user_id FROM users u WHERE u.geek_user_id = ?
                               );`;

            db.query(queryString, [teamId, eventEditionId, userId], function (err, result) {
                if (err) {
                    reject({
                        response: {
                            error: err,
                            message: "Error al tratar de actualizar el equipo deportivo",
                            status: "error",
                            statusCode: 0
                        }
                    });
                } else {
                    resolve({
                        response: {
                            message: "Equipo deportivo actualizado con éxito",
                            status: "success",
                            statusCode: 1
                        }
                    });
                }
            });
        });
    }).catch(function (error) {
        return error;
    });
};

const ensureBirthdayLogsTable = () => {
    return new Promise((resolve, reject) => {
        const query = `
            CREATE TABLE IF NOT EXISTS birthday_email_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                email VARCHAR(255) NOT NULL,
                birthday DATE NOT NULL,
                year_sent INT NOT NULL,
                sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(20) NOT NULL DEFAULT 'SENT',
                error_message TEXT NULL,
                UNIQUE KEY idx_user_year (user_id, year_sent),
                KEY idx_sent_at (sent_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `;
        db.query(query, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

const getBirthdayUsersToday = ({ targetDate = null, force = false } = {}) => {
    return new Promise(async (resolve, reject) => {
        try {
            await ensureBirthdayLogsTable();

            const dateExpression = targetDate ? 'DATE(?)' : 'CURDATE()';
            const queryParams = [];

            // Parameter for YEAR(targetDate) in LEFT JOIN
            if (targetDate) queryParams.push(targetDate);

            // Parameter for force flag
            queryParams.push(force ? 1 : 0);

            // Parameters for MONTH and DAY checks
            if (targetDate) {
                queryParams.push(targetDate, targetDate, targetDate, targetDate, targetDate);
            }

            const queryString = `
                SELECT DISTINCT
                    gu.user_id,
                    gu.email,
                    gu.first_name,
                    gu.last_name,
                    gu.username,
                    DATE_FORMAT(gu.birthday, '%Y-%m-%d') AS birthday,
                    COALESCE(NULLIF(TRIM(gu.first_name), ''), gu.username, 'Atleta') AS display_name,
                    COALESCE(NULLIF(TRIM(CONCAT(COALESCE(gu.first_name, ''), ' ', COALESCE(gu.last_name, ''))), ''), gu.username, 'Atleta') AS full_name
                FROM users ru
                JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.user_secure_id usi ON usi.secure_id = ru.geek_user_id
                JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.users gu ON gu.user_id = usi.user_id
                LEFT JOIN birthday_email_logs bel 
                       ON bel.user_id = gu.user_id 
                      AND bel.year_sent = YEAR(${dateExpression})
                      AND bel.status = 'SENT'
                WHERE (ru.status_id = 1 OR ru.status_id = '1')
                  AND (gu.status_id = 1 OR gu.status_id = '1')
                  AND gu.email IS NOT NULL 
                  AND TRIM(gu.email) != ''
                  AND gu.birthday IS NOT NULL
                  AND (? = 1 OR bel.id IS NULL)
                  AND (
                      (MONTH(gu.birthday) = MONTH(${dateExpression}) AND DAY(gu.birthday) = DAY(${dateExpression}))
                      OR (
                          MONTH(gu.birthday) = 2 AND DAY(gu.birthday) = 29
                          AND MONTH(${dateExpression}) = 2 AND DAY(${dateExpression}) = 28
                          AND DAY(LAST_DAY(${dateExpression})) = 28
                      )
                  )
                ORDER BY gu.first_name ASC, gu.last_name ASC;
            `;

            db.query(queryString, queryParams, (err, results) => {
                if (err) {
                    return reject({
                        response: {
                            error: err,
                            message: "Error al consultar los cumpleañeros del día",
                            status: "error",
                            statusCode: 0
                        }
                    });
                }

                const formattedResults = (results || []).map(u => {
                    const primerNombre = u.first_name ? u.first_name.trim().split(/\s+/)[0] : '';
                    const primerApellido = u.last_name ? u.last_name.trim().split(/\s+/)[0] : '';
                    const primerNombrePrimerApellido = (primerNombre && primerApellido)
                        ? `${primerNombre} ${primerApellido}`
                        : (primerNombre || primerApellido || u.username || 'Atleta');

                    return {
                        ...u,
                        display_name: primerNombrePrimerApellido,
                        first_and_last_name: primerNombrePrimerApellido
                    };
                });

                resolve(formattedResults);
            });
        } catch (error) {
            reject(error);
        }
    });
};

const logBirthdayEmail = (data) => {
    return new Promise((resolve, reject) => {
        const query = `
            INSERT INTO birthday_email_logs (user_id, email, birthday, year_sent, status, error_message)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                status = VALUES(status),
                error_message = VALUES(error_message),
                sent_at = CURRENT_TIMESTAMP;
        `;
        const values = [
            data.userId,
            data.email,
            data.birthday,
            data.yearSent || (data.targetDate ? new Date(data.targetDate).getFullYear() : new Date().getFullYear()),
            data.status || 'SENT',
            data.errorMessage || null
        ];

        db.query(query, values, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

const getBirthdayEmailLogs = ({ year = null, limit = 50 } = {}) => {
    return new Promise((resolve, reject) => {
        let query = `
            SELECT bel.id, bel.user_id, bel.email, DATE_FORMAT(bel.birthday, '%Y-%m-%d') as birthday,
                   bel.year_sent, DATE_FORMAT(bel.sent_at, '%Y-%m-%d %H:%i:%s') as sent_at,
                   bel.status, bel.error_message
            FROM birthday_email_logs bel
        `;
        const params = [];
        if (year) {
            query += ` WHERE bel.year_sent = ?`;
            params.push(year);
        }
        query += ` ORDER BY bel.sent_at DESC LIMIT ?`;
        params.push(parseInt(limit) || 50);

        db.query(query, params, (err, results) => {
            if (err) return reject(err);
            resolve(results || []);
        });
    });
};

module.exports = {
    ensureBirthdayLogsTable,
    eventsUser,
    getBirthdayEmailLogs,
    getBirthdayUsersToday,
    logBirthdayEmail,
    myEvetInfoEnrollment,
    myEventCertificateInfo,
    signIn,
    svgCertificate,
    updateMyEventSportsTeam,
    userData
}