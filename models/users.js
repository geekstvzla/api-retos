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
                                      SELECT COUNT(*)
                                      FROM event_edition_enrolled_users eeeu_total
                                      WHERE eeeu_total.event_edition_id = ee.event_edition_id
                                  ) AS total_participants,
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

        let langId = 'esp';
        let eventEditionId = null;
        let userId = null;

        if (Array.isArray(params)) {
            langId = params[0] || 'esp';
            eventEditionId = params[1] || null;
            userId = params[params.length - 1] || null;
        } else if (params && typeof params === 'object') {
            langId = params.langId || 'esp';
            eventEditionId = params.eventEditionId || null;
            userId = params.userId || null;
        }

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
                                          ORDER BY eeeuka.event_edition_enrolled_users_kit_attrs_id DESC
                                          LIMIT 1
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
                                          ORDER BY eeeuka.event_edition_enrolled_users_kit_attrs_id DESC
                                          LIMIT 1
                                      ),
                                      'ESP'
                                  ) AS gender,
                                  (
								      SELECT eerp.payment_date 
                                      FROM event_edition_reported_payment eerp 
                                      WHERE eerp.user_id = eeeu.user_id 
                                      AND eerp.event_edition_id = eeeu.event_edition_id
                                      ORDER BY eerp.event_edition_reported_payment_id DESC
                                      LIMIT 1
                                  ) AS payment_date,
								  (
									  SELECT eerp.operation_number 
                                      FROM event_edition_reported_payment eerp 
                                      WHERE eerp.user_id = eeeu.user_id 
                                      AND eerp.event_edition_id = eeeu.event_edition_id
                                      ORDER BY eerp.event_edition_reported_payment_id DESC
                                      LIMIT 1
                                  ) AS operation_number,
                                  ee.event_id,
                                  eeeu.event_edition_id,
                                  eeeu.event_edition_enrolled_user_id,
                                  eeeu.user_id,
                                  COALESCE(NULLIF(eeeu.payment_installments, 0), 1) AS payment_installments,
                                  eemk.price AS kit_price,
                                  COALESCE(eemk.payment_installments_config, ee.payment_installments_config) AS payment_installments_config,
                                  COALESCE(c.symbol, '$') AS currency_symbol,
                                  COALESCE(c.abbreviation, 'USD') AS currency_abbreviation,
                                  (
                                      SELECT eerp.voucher_file 
                                      FROM event_edition_reported_payment eerp 
                                      WHERE eerp.user_id = eeeu.user_id 
                                      AND eerp.event_edition_id = eeeu.event_edition_id
                                      ORDER BY eerp.event_edition_reported_payment_id DESC
                                      LIMIT 1
                                  ) AS voucher_file,
                                  eecc.image AS certificate_image
                           FROM event_edition_enrolled_users eeeu
                               JOIN event_edition ee ON ee.event_edition_id = eeeu.event_edition_id
                               LEFT JOIN event_edition_mode_kit eemk ON eemk.event_edition_mode_kit_id = eeeu.event_edition_mode_kit_id
                               LEFT JOIN event_edition_currencies eec ON eec.event_edition_id = ee.event_edition_id AND eec.default = 1
                               LEFT JOIN currencies c ON c.currency_id = eec.currency_id
                               LEFT JOIN event_edition_certificate_config eecc ON eeeu.event_edition_id = eecc.event_edition_id
                               JOIN users u2 ON u2.user_id = eeeu.user_id
                               LEFT JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.user_secure_id usi ON usi.secure_id = u2.geek_user_id
                               LEFT JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.users u ON u.user_id = usi.user_id
                           WHERE eeeu.event_edition_id = ?
                           AND (
                               eeeu.user_id = (SELECT u_sub.user_id FROM users u_sub WHERE u_sub.geek_user_id = ? LIMIT 1)
                               OR eeeu.user_id = ?
                               OR u2.geek_user_id = ?
                           )
                           ORDER BY eeeu.enroll_number ASC;`;

        const queryParams = [langId, eventEditionId, userId, userId, userId];

        db.query(queryString, queryParams, async function (err, result) {

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

                if (result && result[0]) {
                    const row = result[0];
                    const apiPublic = process.env.API_PUBLIC || '';
                    const fs = require('fs');
                    const path = require('path');

                    const findVoucherUrl = (vf, instNum) => {
                        if (!row.event_id || !row.event_edition_id || !row.enroll_number) return null;
                        const cleanVf = vf ? String(vf).trim() : '';

                        if (cleanVf.startsWith('http://') || cleanVf.startsWith('https://')) {
                            return cleanVf;
                        }
                        if (cleanVf.startsWith('/')) {
                            const fullDisk1 = path.resolve(__dirname, '../public', cleanVf.replace(/^\//, ''));
                            if (fs.existsSync(fullDisk1)) return `${apiPublic}${cleanVf}`;
                            const fullDisk2 = path.resolve(__dirname, '..', cleanVf.replace(/^\//, ''));
                            if (fs.existsSync(fullDisk2)) return `${apiPublic}${cleanVf}`;
                        }

                        // Carpetas candidatas donde puede residir el voucher
                        const dirCandidates = [
                            path.resolve(__dirname, `../public/images/events/event-${row.event_id}/edition-${row.event_edition_id}/enrollments/${row.enroll_number}`),
                            path.resolve(__dirname, `../images/events/event-${row.event_id}/edition-${row.event_edition_id}/enrollments/${row.enroll_number}`),
                            path.resolve(__dirname, `../public/images/events/event-${row.event_id}/edition/-${row.event_edition_id}/enrollments/${row.enroll_number}`),
                            path.resolve(__dirname, `../images/events/event-${row.event_id}/edition/-${row.event_edition_id}/enrollments/${row.enroll_number}`)
                        ];

                        const candidates = [
                            cleanVf,
                            instNum === 1 ? `${row.enroll_number}-voucher.webp` : null,
                            instNum === 1 ? `${row.enroll_number}-voucher.jpg` : null,
                            instNum === 1 ? `${row.enroll_number}-voucher.jpeg` : null,
                            instNum === 1 ? `${row.enroll_number}-voucher.png` : null,
                            instNum === 1 ? `${row.enroll_number}-voucher.pdf` : null,
                            instNum ? `${row.enroll_number}-voucher-${instNum}.webp` : null,
                            instNum ? `${row.enroll_number}-voucher-${instNum}.pdf` : null,
                            instNum ? `${row.enroll_number}-voucher-${instNum}.jpg` : null,
                            instNum ? `${row.enroll_number}-voucher-${instNum}.jpeg` : null,
                            instNum ? `${row.enroll_number}-voucher-${instNum}.png` : null,
                            instNum ? `${row.enroll_number}-cuota-${instNum}.webp` : null,
                            instNum ? `${row.enroll_number}-cuota-${instNum}.jpg` : null,
                            instNum ? `${row.enroll_number}-cuota-${instNum}.png` : null,
                            instNum ? `${row.enroll_number}-cuota-${instNum}.pdf` : null
                        ].filter(Boolean);

                        for (const enrollDir of dirCandidates) {
                            if (!fs.existsSync(enrollDir)) continue;
                            for (const fname of candidates) {
                                const diskPath = path.join(enrollDir, fname);
                                if (fs.existsSync(diskPath)) {
                                    const relPath = enrollDir.includes('edition/-') 
                                        ? `/images/events/event-${row.event_id}/edition/-${row.event_edition_id}/enrollments/${row.enroll_number}/${fname}`
                                        : `/images/events/event-${row.event_id}/edition-${row.event_edition_id}/enrollments/${row.enroll_number}/${fname}`;
                                    return `${apiPublic}${relPath}`;
                                }
                            }
                        }

                        if (cleanVf) {
                            const fb1 = path.resolve(__dirname, `../public/images/events/${cleanVf}`);
                            if (fs.existsSync(fb1)) return `${apiPublic}/images/events/${cleanVf}`;
                            const fb2 = path.resolve(__dirname, `../public/images/${cleanVf}`);
                            if (fs.existsSync(fb2)) return `${apiPublic}/images/${cleanVf}`;
                            const fb3 = path.resolve(__dirname, `../images/events/${cleanVf}`);
                            if (fs.existsSync(fb3)) return `${apiPublic}/images/events/${cleanVf}`;
                            const fb4 = path.resolve(__dirname, `../images/${cleanVf}`);
                            if (fs.existsSync(fb4)) return `${apiPublic}/images/${cleanVf}`;
                        }
                        return null;
                    };

                    row.voucher_url = findVoucherUrl(row.voucher_file, 1);

                    // Consultar todos los pagos reportados para esta inscripción
                    const dayjs = require('dayjs');
                    const { calculateInstallmentsBreakdown } = require('../utils/installments.js');
                    let paymentsQuery = `SELECT eerp.event_edition_reported_payment_id,
                                                COALESCE(eerp.installment_number, 1) AS installment_number,
                                                DATE_FORMAT(eerp.payment_date, '%d/%m/%Y') AS payment_date,
                                                DATE_FORMAT(eerp.payment_date, '%Y-%m-%d') AS raw_payment_date,
                                                eerp.operation_number,
                                                eerp.amount,
                                                eerp.voucher_file,
                                                eerp.payment_method_id,
                                                eerp.status_id,
                                                (
                                                    SELECT pml.description 
                                                    FROM payment_methods_lang pml 
                                                    WHERE pml.payment_method_id = eerp.payment_method_id 
                                                    AND pml.language_id = 1
                                                    LIMIT 1
                                                ) AS payment_method
                                         FROM event_edition_reported_payment eerp
                                         WHERE eerp.event_edition_enrolled_user_id = ?
                                            OR (eerp.user_id = ? AND eerp.event_edition_id = ?)
                                         ORDER BY COALESCE(eerp.installment_number, 1) ASC, eerp.event_edition_reported_payment_id ASC;`;

                    db.query(paymentsQuery, [row.event_edition_enrolled_user_id, row.user_id, row.event_edition_id], function (pErr, paymentsRows) {
                        if (pErr) {
                            console.error("Error al consultar pagos reportados en event_edition_reported_payment:", pErr);
                        }
                        let reportedPayments = (!pErr && paymentsRows) ? paymentsRows : [];

                        // Fallback de seguridad: si no se encontraron pagos o falló la consulta pero la inscripción tiene datos de pago inicial en la fila principal
                        if (reportedPayments.length === 0 && (row.operation_number || row.payment_date || row.voucher_file)) {
                            reportedPayments = [{
                                event_edition_reported_payment_id: null,
                                installment_number: 1,
                                payment_date: row.payment_date ? dayjs(row.payment_date).format('DD/MM/YYYY') : '',
                                raw_payment_date: row.payment_date ? dayjs(row.payment_date).format('YYYY-MM-DD') : '',
                                operation_number: row.operation_number || '',
                                amount: null,
                                voucher_file: row.voucher_file || '',
                                payment_method_id: null,
                                payment_method: '',
                                status_id: 1
                            }];
                        }

                        const numInst = Number(row.payment_installments) || 1;
                        const breakdownData = calculateInstallmentsBreakdown(row.kit_price, numInst, row.payment_installments_config);
                        const installmentsList = breakdownData ? breakdownData.installments : [];

                        row.installments = installmentsList.map((inst, idx) => {
                            const payment = reportedPayments.find(p => Number(p.installment_number) === Number(inst.number))
                                         || (idx === 0 && reportedPayments.length > 0 ? reportedPayments[0] : null);

                            let instVoucherUrl = null;
                            let instIsPdf = false;

                            if (payment) {
                                instVoucherUrl = findVoucherUrl(payment.voucher_file, inst.number);
                                if (instVoucherUrl) {
                                    instIsPdf = instVoucherUrl.toLowerCase().split('?')[0].endsWith('.pdf');
                                }
                            }

                            return {
                                number: inst.number,
                                amount: inst.amount,
                                formattedAmount: inst.formattedAmount,
                                percentage: inst.percentage,
                                percentageLabel: inst.percentageLabel,
                                isReported: !!payment,
                                paymentDate: payment ? (payment.payment_date || '') : '',
                                rawPaymentDate: payment ? (payment.raw_payment_date || '') : '',
                                operationNumber: payment ? (payment.operation_number || '') : '',
                                paymentMethod: payment ? (payment.payment_method || '') : '',
                                paymentMethodId: payment ? (payment.payment_method_id || null) : null,
                                voucherFile: payment ? (payment.voucher_file || '') : '',
                                voucherUrl: instVoucherUrl,
                                isPdf: instIsPdf,
                                statusId: payment ? payment.status_id : null
                            };
                        });

                        row.has_custom_installments = breakdownData ? breakdownData.isCustom : false;

                        resolve(row);
                    });
                } else {
                    resolve(result ? result[0] : null);
                }
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

const reportEnrollmentInstallment = (params) => {
    return new Promise(async function (resolve, reject) {
        const {
            userId,
            eventEditionId,
            installmentNumber = 1,
            targetInstallments = [installmentNumber],
            operationNumber = '',
            paymentDay = '',
            paymentMethodId = 1,
            amount = null,
            voucherFile = null,
            langId = 'esp'
        } = params;

        // 1. Obtener la inscripción del usuario, organizadores y datos del evento
        let enrollQuery = `SELECT eeeu.event_edition_enrolled_user_id,
                                  eeeu.user_id,
                                  eeeu.enroll_number,
                                  eeeu.event_edition_id,
                                  ee.event_id,
                                  e.title AS event_title,
                                  ee.description AS event_edition,
                                  DATE_FORMAT(ee.departure_date, '%Y-%m-%d %H:%i:%s') AS departure_date,
                                  u.first_name,
                                  u.last_name,
                                  u.email AS user_email,
                                  COALESCE(c.symbol, '$') AS currency_symbol,
                                  eemk.price AS kit_price,
                                  COALESCE(eemk.payment_installments_config, ee.payment_installments_config) AS payment_installments_config,
                                  COALESCE(NULLIF(eeeu.payment_installments, 0), 1) AS payment_installments
                           FROM event_edition_enrolled_users eeeu
                               JOIN event_edition ee ON ee.event_edition_id = eeeu.event_edition_id
                               LEFT JOIN events e ON e.event_id = ee.event_id
                               LEFT JOIN event_edition_mode_kit eemk ON eemk.event_edition_mode_kit_id = eeeu.event_edition_mode_kit_id
                               LEFT JOIN event_edition_currencies eec ON eec.event_edition_id = ee.event_edition_id AND eec.default = 1
                               LEFT JOIN currencies c ON c.currency_id = eec.currency_id
                               JOIN users u2 ON u2.user_id = eeeu.user_id
                               LEFT JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.user_secure_id usi ON usi.secure_id = u2.geek_user_id
                               LEFT JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.users u ON u.user_id = usi.user_id
                           WHERE eeeu.event_edition_id = ?
                             AND (usi.secure_id = ? OR eeeu.user_id = ? OR u2.geek_user_id = ?)
                           LIMIT 1;`;

        db.query(enrollQuery, [eventEditionId, userId, userId, userId], async function (err, enrollRows) {
            if (err) {
                console.error("Error en enrollQuery de reportEnrollmentInstallment:", err);
            }
            if (err || !enrollRows || enrollRows.length === 0) {
                return resolve({
                    response: {
                        status: 'error',
                        message: 'No se encontró la inscripción del usuario.'
                    }
                });
            }

            const enrollment = enrollRows[0];
            const eventId = enrollment.event_id;
            const enrollNumber = enrollment.enroll_number;
            const enrolledUserId = enrollment.event_edition_enrolled_user_id;
            const dbUserId = enrollment.user_id;
            const eventTitle = enrollment.event_title || 'Evento';
            const eventEdition = enrollment.event_edition || '';
            const userName = `${enrollment.first_name || ''} ${enrollment.last_name || ''}`.trim() || 'Participante';
            const currencySymbol = enrollment.currency_symbol || '$';

            // REGLA 2: Los vouchers de pago se podrán modificar hasta un día antes de la caminata (evento).
            // El mismo día del evento (00:00:00) o posterior, ya no se puede modificar.
            if (enrollment.departure_date) {
                const dayjs = require('dayjs');
                let eventDate = dayjs(enrollment.departure_date);
                if (eventDate.isValid()) {
                    const startOfEventDay = eventDate.startOf('day');
                    if (dayjs().isAfter(startOfEventDay) || dayjs().isSame(startOfEventDay)) {
                        return resolve({
                            response: {
                                status: 'error',
                                message: 'El plazo para registrar o modificar comprobantes de pago finalizó (disponible hasta un día antes de la actividad).'
                            }
                        });
                    }
                }
            }

            // Normalizar lista de cuotas a procesar
            let cuotasList = Array.isArray(targetInstallments) && targetInstallments.length > 0 
                ? [...new Set(targetInstallments.map(n => Number(n)).filter(n => !isNaN(n) && n > 0))] 
                : [Number(installmentNumber) || 1];
            cuotasList.sort((a, b) => a - b);

            const isAdvance = cuotasList.length > 1;
            const firstCuota = cuotasList[0];

            let savedFilesMap = {}; // cuotaNumber => fileName
            let voucherBufferForEmail = null;
            let primaryVoucherUrl = null;
            let primaryVoucherFileName = '';

            // 2. Guardar y procesar el comprobante si fue enviado
            if (voucherFile && voucherFile.data) {
                try {
                    const fsSync = require('fs');
                    const path = require('path');
                    const sharp = require('sharp');

                    const origExt = (path.extname(voucherFile.name || '') || '').toLowerCase();
                    const isPdf = origExt === '.pdf' || (voucherFile.mimetype && voucherFile.mimetype.includes('pdf'));

                    const targetDir = path.resolve(__dirname, `../public/images/events/event-${eventId}/edition-${eventEditionId}/enrollments/${enrollNumber}`);
                    if (!fsSync.existsSync(targetDir)) {
                        fsSync.mkdirSync(targetDir, { recursive: true });
                    }

                    if (isPdf) {
                        primaryVoucherFileName = `${enrollNumber}-voucher-${firstCuota}.pdf`;
                        const primaryPath = path.join(targetDir, primaryVoucherFileName);
                        if (voucherFile.mv) {
                            await voucherFile.mv(primaryPath);
                        } else {
                            fsSync.writeFileSync(primaryPath, voucherFile.data);
                        }
                        savedFilesMap[firstCuota] = primaryVoucherFileName;
                        voucherBufferForEmail = fsSync.readFileSync(primaryPath);

                        // Copiar para las demás cuotas si es adelanto
                        for (let i = 1; i < cuotasList.length; i++) {
                            const cNum = cuotasList[i];
                            const cFileName = `${enrollNumber}-voucher-${cNum}.pdf`;
                            const cPath = path.join(targetDir, cFileName);
                            fsSync.copyFileSync(primaryPath, cPath);
                            savedFilesMap[cNum] = cFileName;
                        }
                    } else {
                        primaryVoucherFileName = `${enrollNumber}-voucher-${firstCuota}.webp`;
                        const primaryPath = path.join(targetDir, primaryVoucherFileName);

                        // Reducción máxima de peso en WebP sin pérdida de calidad
                        const webpBuffer = await sharp(voucherFile.data)
                            .rotate()
                            .resize({
                                width: 1800,
                                height: 1800,
                                fit: 'inside',
                                withoutEnlargement: true
                            })
                            .webp({
                                quality: 82,
                                effort: 6,
                                smartSubsample: true
                            })
                            .toBuffer();

                        fsSync.writeFileSync(primaryPath, webpBuffer);
                        savedFilesMap[firstCuota] = primaryVoucherFileName;
                        voucherBufferForEmail = webpBuffer;

                        // Copiar para las demás cuotas si es adelanto
                        for (let i = 1; i < cuotasList.length; i++) {
                            const cNum = cuotasList[i];
                            const cFileName = `${enrollNumber}-voucher-${cNum}.webp`;
                            const cPath = path.join(targetDir, cFileName);
                            fsSync.writeFileSync(cPath, webpBuffer);
                            savedFilesMap[cNum] = cFileName;
                        }
                    }

                    const apiPublic = process.env.API_PUBLIC || '';
                    primaryVoucherUrl = `${apiPublic}/images/events/event-${eventId}/edition-${eventEditionId}/enrollments/${enrollNumber}/${primaryVoucherFileName}`;
                } catch (saveErr) {
                    console.error('Error guardando comprobante en formato webp:', saveErr);
                }
            }

            // 3. Verificar si alguna de las cuotas ya existía (para detectar modificación vs registro inicial)
            let checkQuery = `SELECT event_edition_reported_payment_id, installment_number, voucher_file 
                              FROM event_edition_reported_payment 
                              WHERE event_edition_enrolled_user_id = ? 
                                AND installment_number IN (?);`;

            db.query(checkQuery, [enrolledUserId, cuotasList], async function (chkErr, existingRows) {
                if (chkErr) {
                    return resolve({
                        response: {
                            status: 'error',
                            message: 'Error al verificar pagos anteriores de las cuotas.'
                        }
                    });
                }

                const existingMap = {};
                if (existingRows && existingRows.length > 0) {
                    existingRows.forEach(r => {
                        existingMap[r.installment_number] = r;
                    });
                }

                // Si al menos una cuota ya tenía registro previo, se considera modificación
                const isModification = existingRows && existingRows.length > 0;

                // 4. Actualizar o Insertar cada cuota en la base de datos
                const { calculateInstallmentsBreakdown } = require('../utils/installments.js');
                const breakdownData = calculateInstallmentsBreakdown(enrollment.kit_price, enrollment.payment_installments, enrollment.payment_installments_config);

                for (const cNum of cuotasList) {
                    const existingRow = existingMap[cNum];
                    const vFile = savedFilesMap[cNum] || (existingRow ? existingRow.voucher_file : primaryVoucherFileName) || '';

                    const instBreakdown = breakdownData?.installments?.find(i => Number(i.number) === Number(cNum));
                    let cuotaAmount = null;
                    if (cuotasList.length > 1 && instBreakdown) {
                        cuotaAmount = instBreakdown.amount;
                    } else if (amount !== undefined && amount !== null && !isNaN(amount)) {
                        cuotaAmount = amount;
                    } else if (instBreakdown) {
                        cuotaAmount = instBreakdown.amount;
                    }

                    if (existingRow) {
                        let updateQuery = `UPDATE event_edition_reported_payment
                                           SET payment_method_id = ?,
                                               payment_date = ?,
                                               operation_number = ?,
                                               amount = ?,
                                               voucher_file = ?,
                                               status_id = 1
                                           WHERE event_edition_reported_payment_id = ?;`;
                        await new Promise((res) => {
                            db.query(updateQuery, [paymentMethodId, paymentDay, operationNumber, cuotaAmount, vFile, existingRow.event_edition_reported_payment_id], res);
                        });
                    } else {
                        let insertQuery = `INSERT INTO event_edition_reported_payment(
                                               event_edition_enrolled_user_id,
                                               user_id,
                                               event_edition_id,
                                               payment_method_id,
                                               payment_date,
                                               operation_number,
                                               amount,
                                               voucher_file,
                                               installment_number,
                                               status_id
                                           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1);`;
                        await new Promise((res) => {
                            db.query(insertQuery, [enrolledUserId, dbUserId, eventEditionId, paymentMethodId, paymentDay, operationNumber, cuotaAmount, vFile, cNum], res);
                        });
                    }
                }

                // 5. Obtener nombre del método de pago
                let paymentMethodName = 'No especificado';
                try {
                    const [pmRows] = await new Promise((res) => {
                        db.query(`SELECT pml.description FROM payment_methods_lang pml WHERE pml.payment_method_id = ? AND pml.language_id = 1 LIMIT 1`, [paymentMethodId], (err, rows) => res([rows]));
                    });
                    if (pmRows && pmRows.length > 0) {
                        paymentMethodName = pmRows[0].description;
                    }
                } catch (pmErr) {
                    console.error("Error buscando nombre de método de pago:", pmErr);
                }

                // 6. Enviar notificación por correo a los organizadores del evento (REGLAS 3 y 4)
                try {
                    const contactsQuery = `SELECT eec.full_name, eec.email 
                                           FROM event_edition_contacts eec 
                                           WHERE eec.event_edition_id = ? AND eec.status_id = 1;`;
                    
                    const contactRows = await new Promise((res) => {
                        db.query(contactsQuery, [eventEditionId], (cErr, rows) => {
                            if (cErr) {
                                console.error("[REPORT EMAIL ERROR] Error consultando organizadores:", cErr);
                                return res([]);
                            }
                            res(rows || []);
                        });
                    });

                    // Extraer correos válidos evitando cadenas con texto adicional
                    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
                    const validEmails = [];
                    contactRows.forEach(c => {
                        if (c.email) {
                            const match = c.email.match(emailRegex);
                            if (match && !validEmails.includes(match[0])) {
                                validEmails.push(match[0]);
                            }
                        }
                    });

                    if (validEmails.length > 0) {
                        const toEmails = validEmails.join(', ');
                        const mail = require('./emails.js');
                        const installmentsLabel = cuotasList.length === 1 
                            ? `Cuota #${cuotasList[0]}` 
                            : `Cuotas #${cuotasList.join(' y #')}`;

                        const emailParams = {
                            email: toEmails,
                            userName: userName,
                            enrollNumber: enrollNumber,
                            eventTitle: eventTitle,
                            eventEdition: eventEdition,
                            installmentsLabel: installmentsLabel,
                            operationNumber: operationNumber,
                            paymentDay: paymentDay,
                            paymentMethod: paymentMethodName,
                            amount: amount ? parseFloat(amount).toFixed(2) : null,
                            currencySymbol: currencySymbol,
                            isModification: isModification,
                            isAdvance: isAdvance,
                            langId: langId
                        };

                        if (primaryVoucherFileName) {
                            try {
                                if (voucherBufferForEmail) {
                                    emailParams.voucher = [{
                                        filename: primaryVoucherFileName,
                                        content: voucherBufferForEmail
                                    }];
                                } else {
                                    const fsSync = require('fs');
                                    const path = require('path');
                                    const checkPath = path.resolve(__dirname, `../public/images/events/event-${eventId}/edition-${eventEditionId}/enrollments/${enrollNumber}/${primaryVoucherFileName}`);
                                    if (fsSync.existsSync(checkPath) && fsSync.statSync(checkPath).isFile()) {
                                        emailParams.voucher = [{
                                            filename: primaryVoucherFileName,
                                            content: fsSync.readFileSync(checkPath)
                                        }];
                                    }
                                }
                            } catch (attErr) {
                                console.warn("[REPORT EMAIL WARNING] No se pudo adjuntar el archivo del comprobante:", attErr.message);
                            }
                        }

                        console.log(`[REPORT EMAIL] Enviando notificación a organizadores (${toEmails}) sobre ${installmentsLabel}...`);
                        mail.reportedInstallment(emailParams)
                            .then(mailResult => {
                                console.log("[REPORT EMAIL SUCCESS] Notificación enviada exitosamente a los organizadores:", mailResult);
                            })
                            .catch(mErr => {
                                console.error("[REPORT EMAIL ERROR] Error al enviar email a organizadores:", mErr);
                            });
                    } else {
                        console.warn(`[REPORT EMAIL WARNING] No se encontraron contactos activos con correo para la edición ${eventEditionId}`);
                    }
                } catch (emailErr) {
                    console.error("[REPORT EMAIL ERROR] Error general procesando email de organizadores:", emailErr);
                }

                const cuotasFeedbackLabel = cuotasList.length === 1 ? `Cuota #${cuotasList[0]}` : `Cuotas #${cuotasList.join(', #')}`;
                return resolve({
                    response: {
                        status: 'success',
                        message: isModification
                            ? `Comprobante de ${cuotasFeedbackLabel} modificado exitosamente.`
                            : `Comprobante de ${cuotasFeedbackLabel} registrado exitosamente.`,
                        voucherUrl: primaryVoucherUrl,
                        voucherFile: primaryVoucherFileName,
                        installmentNumber: firstCuota,
                        targetInstallments: cuotasList
                    }
                });
            });
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
    reportEnrollmentInstallment,
    signIn,
    svgCertificate,
    updateMyEventSportsTeam,
    userData
}