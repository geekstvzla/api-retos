require('dotenv').config()
let db = require('../config/database.js')

const activeEvents = (params) => {

    return new Promise(function (resolve, reject) {

        let queryString = `SELECT ec.event_id,
                                  ec.title,
                                  CONCAT('${process.env.API_PUBLIC + "/images/events/"}',ec.featured_image) AS featured_image,
                                  ec.departure_date,
                                  ec.departure_place_name,
                                  ec.departure_place_url_map,
                                  ec.event_edition_id,
                                  ec.event_slug,
                                  ec.event_type_id,
                                  ec.event_type,
                                  ec.event_modes
                           FROM vw_event_cards ec
                           WHERE UPPER(ec.language_code) = UPPER(?)
                           ORDER BY ec.departure_date DESC;`;

        db.query(queryString, params, async function (err, result) {

            if (err) {

                reject({
                    response: {
                        message: "Error al tratar de ejecutar la consulta",
                        status: "error",
                        statusCode: 0
                    }
                });

            } else {

                resolve({
                    events: result
                });

            }

        });

    }).catch(function (error) {

        return (error);

    });

}

const checkPermissionSeeParticipantsList = (params) => {

    return new Promise(function (resolve, reject) {

        let queryString = `SELECT IF(COUNT(eeuc.see_participants) = 0, 0, eeuc.see_participants) AS see_participants
                           FROM event_edition_user_control eeuc
                           WHERE eeuc.event_edition_id = ? 
                           AND eeuc.user_id = (
                               SELECT u.user_id FROM users u WHERE u.geek_user_id = ?
                           )`;

        db.query(queryString, params, async function (err, result) {

            if (err) {

                reject({
                    response: {
                        error: err,
                        message: "Error al tratar de ejecutar la consulta",
                        status: "error",
                        statusCode: 0
                    }
                });

            } else {

                resolve({
                    response: {
                        seeParticipants: result[0]['see_participants'],
                        status: "success",
                        statusCode: 1
                    }
                });
            }

        });

    }).catch(function (error) {

        console.log("ERROR enrolling user")
        console.log(error)
        return error

    })

}

const checkPoint = (params) => {

    return new Promise(function (resolve, reject) {

        let queryString = `SELECT eeeu.user_id,
                                  u.document_id,
                                  CONCAT(u.first_name, ' ', u.last_name) AS fullname,
                                  eeeu.enroll_number
                            FROM event_edition_enrolled_users eeeu
                                JOIN event_edition_reported_payment eerp ON eerp.user_id = eeeu.user_id
                                JOIN users u2 ON u2.user_id = eerp.user_id
                                JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.user_secure_id usi ON usi.secure_id = u2.geek_user_id
                                JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.users u ON u.user_id = usi.user_id
                            WHERE eeeu.event_edition_id = ?
                            AND eeeu.user_id = ?`;

        db.query(queryString, params, async function (err, result) {

            if (err) {

                reject({
                    response: {
                        message: "Error al tratar de ejecutar la consulta",
                        status: "error",
                        statusCode: 0
                    }
                });

            } else {

                resolve(result[0]);
            }

        });

    }).catch(function (error) {

        console.log("ERROR enrolling user")
        console.log(error)
        return error

    })

}

const donationEventParticipantsList = (params) => {

    return new Promise(function (resolve, reject) {

        let queryString = `SELECT eeeu.event_edition_enrolled_user_id AS enrolled_user_id,
                                  eeeu.user_id AS enrolled_user_db_id,
                                  eeeu.enroll_number,
                                  u.document_id,
                                  u.first_name,
                                  u.last_name,
                                  u.phone_number,
                                  u.email,
                                  (
                                      SELECT eemk.description 
                                      FROM event_edition_mode_kit eemk
                                      WHERE eemk.event_edition_mode_kit_id = eeeu.event_edition_mode_kit_id
                                  ) AS kit,
                                  DATE_FORMAT(eerp.payment_date, '%d/%m/%Y') AS payment_date,
                                  eerp.operation_number,
                                  (
                                      SELECT pml.description 
                                      FROM payment_methods_lang pml 
                                      WHERE pml.payment_method_id = pm.payment_method_id 
                                      AND pml.language_id = 1
                                  ) AS payment
                           FROM event_edition_enrolled_users eeeu
                               JOIN users u2 ON u2.user_id = eeeu.user_id
                               JOIN event_edition_reported_payment eerp ON eerp.user_id = eeeu.user_id
                               JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.user_secure_id usi ON usi.secure_id = u2.geek_user_id
                               JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.users u ON u.user_id = usi.user_id
                               JOIN payment_methods pm ON pm.payment_method_id = eerp.payment_method_id
                           WHERE eeeu.event_edition_id = ?
                           AND eerp.event_edition_id = ?
                           ORDER BY eeeu.enroll_number ASC;`;

        db.query(queryString, params, async function (err, result) {

            if (err) {

                reject({
                    response: {
                        error: err,
                        message: "Error al tratar de ejecutar la consulta en la línea 599",
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

const eventAdditionalAccessories = (params) => {

    return new Promise(function (resolve, reject) {

        let eventEditionId = params && params[0] ? params[0] : null;
        let langCode = params && params[1] ? params[1] : null;

        if (!eventEditionId) {
            return resolve({
                response: {
                    products: [],
                    message: "ID de edición de evento requerido",
                    status: "warning",
                    statusCode: 0
                }
            });
        }

        let whereClause = `WHERE eep.event_edition_id = ? AND eep.status_id = 1 AND pc.status_id = 1`;
        let queryParams = [eventEditionId];

        if (langCode) {
            whereClause += ` AND (pc.language_code IS NULL OR UPPER(pc.language_code) = UPPER(?))`;
            queryParams.push(langCode);
        }

        let queryString = `SELECT eep.event_edition_product_id,
                                  eep.event_edition_id,
                                  eep.display_order,
                                  eep.is_featured,
                                  eep.custom_price,
                                  COALESCE(eep.custom_price, pc.price) AS effective_price,
                                  pc.product_id,
                                  pc.product_category_id,
                                  pc.category_name,
                                  pc.category_slug,
                                  pc.title,
                                  pc.short_description,
                                  pc.description,
                                  pc.slug,
                                  pc.sku,
                                  pc.price AS catalog_price,
                                  pc.stock,
                                  CONCAT('${process.env.API_PUBLIC || ''}/images/products/',pc.featured_image) AS featured_image,
                                  pc.status_id,
                                  pc.created_at,
                                  (SELECT pcurr.currency_id FROM product_currencies pcurr WHERE pcurr.product_id = pc.product_id AND pcurr.status_id = 1 ORDER BY pcurr.default DESC, pcurr.product_currencies_id ASC LIMIT 1) AS default_currency_id,
                                  (SELECT c.symbol FROM product_currencies pcurr INNER JOIN currencies c ON c.currency_id = pcurr.currency_id WHERE pcurr.product_id = pc.product_id AND pcurr.status_id = 1 ORDER BY pcurr.default DESC, pcurr.product_currencies_id ASC LIMIT 1) AS default_currency_symbol
                           FROM event_edition_products eep
                           INNER JOIN vw_product_cards pc ON pc.product_id = eep.product_id
                           ${whereClause}
                           ORDER BY eep.display_order ASC, eep.created_at DESC;`;

        db.query(queryString, queryParams, function (err, result) {
            if (err) {
                resolve({
                    response: {
                        products: [],
                        message: "Error al obtener productos de la edición del evento",
                        status: "error",
                        statusCode: 0,
                        error: err.message || err
                    }
                });
            } else {
                resolve({
                    response: {
                        products: result,
                        status: "success",
                        statusCode: 1
                    }
                });
            }
        });
    }).catch(function (error) {
        return {
            response: {
                products: [],
                status: "error",
                statusCode: 0,
                error: error.message || error
            }
        };
    });

}

const eventAdditionalAccessoriesMedia = (params) => {

    return new Promise(function (resolve, reject) {

        let queryString = `SELECT ee.event_edition_id AS edition_id,
                                  ee.event_id,
                                  eeoim.event_edition_optional_item_id AS optional_item_id,
                                  eeoim.media_file,
                                  CONCAT('${process.env.API_PUBLIC + "/images/events/event-"}', ee.event_id,'/edition-', ee.event_edition_id,'/accessories/', eeoim.media_file) AS url_media 
                           FROM event_edition_optional_item_media eeoim
                           INNER JOIN event_edition_optional_item eeoi ON eeoi.event_edition_optional_item_id = eeoim.event_edition_optional_item_id
                           INNER JOIN event_edition ee ON ee.event_edition_id = eeoi.event_edition_id
                           WHERE eeoim.event_edition_optional_item_id = ?
                           AND eeoim.status_id = 1`;

        db.query(queryString, params, async function (err, result) {

            if (err) {

                reject({
                    response: {
                        message: "Error al tratar de ejecutar la consulta",
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

const eventDataForStorage = (params) => {

    return new Promise(async function (resolve, reject) {

        let queryString = `SELECT ec.event_id,
                                  ec.title,
                                  CONCAT('${process.env.API_PUBLIC + "/images/events/"}',ec.featured_image) AS featured_image,
                                  ec.departure_date,
                                  ec.departure_place_name,
                                  ec.departure_place_url_map,
                                  ec.event_edition_id,
                                  ec.event_slug,
                                  ec.event_type_id,
                                  ec.event_type,
                                  IF(ec.banner_image IS NULL, FALSE, TRUE) AS has_banner_image,
                                  CASE
                                      WHEN ec.banner_image IS NULL THEN
                                          '${process.env.API_PUBLIC + "/images/banners/baner_hiking.webp"}' 
                                      ELSE
                                          ec.banner_image
                                  END AS banner_image,
                                  CASE
                                      WHEN ec.banner_image IS NULL THEN
                                          '${process.env.API_PUBLIC + "/images/banners/baner_hiking.webp"}' 
                                      ELSE
                                          ec.banner_image
                                  END AS banner_image,
                                  ec.event_edition,
                                  (
                                        SELECT currency_id
                                        FROM event_edition_currencies eec  
                                        WHERE eec.event_edition_id = ec.event_edition_id
                                        AND eec.default = 1
                                  ) AS default_currency_id
                           FROM vw_event_cards ec
                           WHERE ec.event_slug = ?
                           AND UPPER(ec.language_code) = UPPER(?)`;

        db.query(queryString, params, async function (err, result) {

            if (err) {

                reject({
                    response: {
                        message: "Error al tratar de ejecutar la consulta",
                        status: "error",
                        statusCode: 0
                    }
                });

            } else {

                let modesParams = [result[0].event_edition_id, params[0]];
                result[0].event_modes = await eventModalities(modesParams);

                let currenciesParams = [result[0].event_edition_id, params[1]];
                result[0].event_currencies = await eventEditionCurrencies(currenciesParams);

                resolve({
                    event: result[0]
                });

            }

        });

    }).catch(function (error) {

        return (error);

    });

}

const eventDetail = (params) => {

    return new Promise(async function (resolve, reject) {

        let queryString = `SELECT ehi.event_id,
                                  ehi.title,
                                  CONCAT('${process.env.API_PUBLIC + "/images/events/"}',ehi.banner_image) AS banner_image,
                                  CONCAT('${process.env.API_PUBLIC + "/images/events/"}',ehi.featured_image) AS featured_image,
                                  ehi.departure_date,
                                  ehi.departure_place_name,
                                  ehi.departure_place_url_map,
                                  ehi.event_edition_id,
                                  ehi.event_edition,
                                  ehi.arrival_place_name,
                                  ehi.enrollment_end_date,
                                  ehi.event_distances,
                                  ehi.whatsapp_general_group,
                                  ehi.whatsapp_enrolled_group,
                                  ehi.event_type_id,
                                  ehi.event_type,
                                  ehi.has_additional_accessories
                           FROM vw_event_header_info ehi
                           WHERE ehi.event_id = ?
                           AND ehi.event_edition_id = ?
                           AND UPPER(ehi.language_code) = UPPER(?);`;

        db.query(queryString, [params[0], params[1], params[2]], async function (err, result) {

            if (err) {

                reject({
                    response: {
                        error: err,
                        message: "Error al tratar de ejecutar la consulta",
                        status: "error",
                        statusCode: 0
                    }
                });

            } else {

                let modesParams = [result[0].event_edition_id, params[2]];
                result[0].event_modes = await eventModalities(modesParams);

                resolve({ response: result[0] });

            }

        });

    }).catch(function (error) {

        return (error);

    });

}

const eventEditionContacts = (eventEditionId) => {

    return new Promise(function (resolve, reject) {

        let queryString = `SELECT eec.full_name,
                                  eec.email,
                                  eec.phone_number,
                                  eec.whatsapp_number
                           FROM event_edition_contacts eec
                           WHERE eec.event_edition_id = ?
                           AND eec.status_id = 1;`;

        db.query(queryString, [eventEditionId], async function (err, result) {

            if (err) {

                reject({
                    response: {
                        error: err,
                        message: "Error al tratar de ejecutar la consulta",
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

const eventEditionCurrencies = (params) => {

    return new Promise(function (resolve, reject) {

        let queryString = `SELECT c.currency_id,
                                  cl.description AS currency_desc,
                                  c.abbreviation AS currency_abb,
                                  c.symbol AS currency_symbol,
                                  c.decimals AS currency_decimals
                           FROM event_edition_currencies eec
                           INNER JOIN currencies c ON c.currency_id = eec.currency_id
                           INNER JOIN currencies_lang cl ON cl.currency_id = c.currency_id
                           INNER JOIN languages l ON cl.language_id = l.language_id
                           WHERE eec.event_edition_id = ?
                           AND UPPER(l.code) = UPPER(?)`;

        db.query(queryString, params, async function (err, result) {

            if (err) {

                reject({
                    response: {
                        error: err,
                        message: "Error al tratar de ejecutar la consulta",
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

const eventEditionUserKitItems = (params) => {

    return new Promise(function (resolve, reject) {

        let queryString = `SELECT al.description AS attribute, avl.description AS attribute_value
                           FROM event_edition_enrolled_users eeeu
                               JOIN users u ON u.user_id = eeeu.user_id
                               JOIN event_edition_enrolled_users_kit_attrs eeeuka ON eeeuka.event_edition_enrolled_user_id = eeeu.event_edition_enrolled_user_id
                               JOIN attributes a ON a.attribute_id = eeeuka.attribute_id
                               JOIN attributes_lang al ON al.attribute_id = a.attribute_id
                               JOIN languages l1 ON l1.language_id = al.language_id
                               JOIN attributes_values av ON av.attribute_value_id = eeeuka.attribute_value_id
                               JOIN attributes_values_lang avl ON avl.attribute_value_id = av.attribute_value_id
                               JOIN languages l2 ON l2.language_id = avl.language_id
                           WHERE u.geek_user_id = ?
                           AND eeeu.event_edition_id = ?
                           AND UCASE(l1.code) = UCASE(?)
                           AND UCASE(l2.code) = UCASE(?);`;

        db.query(queryString, params, async function (err, result) {

            if (err) {

                reject({
                    response: {
                        error: err,
                        message: "Error al tratar de ejecutar la consulta",
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


const eventModalities = (params) => {

    return new Promise(function (resolve, reject) {

        let queryString = `SELECT eem.type_event_Mode_id AS typeEventModeId,
                                  eem.event_edition_id AS eventEditionId,
                                  teml.description AS modality
                           FROM event_edition_mode eem
                           INNER JOIN type_event_modes tem ON tem.type_event_mode_id = eem.type_event_mode_id
                           INNER JOIN type_event_modes_lang teml ON teml.type_event_mode_id = tem.type_event_mode_id
                           INNER JOIN languages l ON l.language_id = teml.language_id
                           WHERE eem.event_edition_id = ?
                           AND UPPER(l.code) = UPPER(?)
                           AND teml.status_id = 1;`;

        db.query(queryString, params, async function (err, result) {

            if (err) {

                reject({
                    response: {
                        error: err,
                        message: "Error al tratar de ejecutar la consulta",
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

const eventModalityKits = (params) => {

    return new Promise(function (resolve, reject) {

        let queryString = `SELECT eemk.event_edition_mode_kit_id AS kitId,
                                  eemk.description AS kit,
                                  eemk.price AS priceUnformatted,
                                  c.currency_id AS currencyId,
                                  cl.description AS currencyDesc,
                                  c.symbol AS currencySymbol,
                                  CONCAT(c.symbol, FORMAT(eemk.price, c.decimals, 'de_DE')) AS priceFormatted,
                                  eemk.minimum_price AS minimumPrice
                           FROM event_edition_mode_kit eemk
                           INNER JOIN event_edition_mode eem ON eem.event_edition_mode_id =  eemk.event_edition_mode_id
                           INNER JOIN event_edition_currencies eec ON eec.event_edition_id = eem.event_edition_id
                           INNER JOIN currencies c ON c.currency_id = eec.currency_id
                           INNER JOIN currencies_lang cl ON cl.currency_id = c.currency_id
                           INNER JOIN languages l ON l.language_id = cl.language_id
                           WHERE eem.event_edition_id = ?
                           AND eem.type_event_mode_id = ?
                           AND UPPER(l.code) = UPPER(?)
                           AND eec.default = 1
                           AND eemk.status_id = 1
                           ORDER BY eemk.description, eemk.price ASC;`;

        db.query(queryString, params, async function (err, result) {

            if (err) {

                reject({
                    response: {
                        message: "Error al tratar de ejecutar la consulta",
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

const eventEditionPaymethods = (params) => {

    return new Promise(function (resolve, reject) {

        let queryString = `SELECT pm.payment_method_id,
                                  pml.description AS payment_method
                           FROM payment_methods pm
                           INNER JOIN payment_methods_lang pml ON pml.payment_method_id = pm.payment_method_id
                           INNER JOIN languages l ON l.language_id = pml.language_id
                           INNER JOIN event_edition_payment_methods eepm ON eepm.payment_method_id = pm.payment_method_id
                           WHERE UPPER(l.code) = UPPER(?)
                           AND eepm.event_edition_id = ?
                           AND pm.status_id = 1;`;

        db.query(queryString, params, async function (err, result) {

            if (err) {

                reject({
                    response: {
                        message: "Error al tratar de ejecutar la consulta",
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

const eventEditionPaymethodDetail = (params) => {

    return new Promise(function (resolve, reject) {

        let queryString = `SELECT pmdl.description,
                                  pmdl.help,
                                  eepd.value
                            FROM event_edition_paymethod_details eepd
                            INNER JOIN payment_method_details pmd ON pmd.payment_method_detail_id = eepd.payment_method_detail_id
                            INNER JOIN payment_method_details_lang pmdl ON pmdl.payment_method_detail_id = pmd.payment_method_detail_id
                            INNER JOIN languages l ON l.language_id = pmdl.language_id
                            WHERE eepd.event_edition_id = ?
                            AND UPPER(l.code) = UPPER(?)
                            AND pmd.payment_method_id = ?
                            AND pmd.status_id = 1
                            ORDER BY description ASC`;

        db.query(queryString, params, async function (err, result) {

            if (err) {

                reject({
                    response: {
                        message: "Error al tratar de ejecutar la consulta",
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

const payEventParticipantsList = (params) => {

    return new Promise(function (resolve, reject) {

        let queryString = `SELECT eeeu.event_edition_enrolled_user_id AS enrolled_user_id,
                                  eeeu.user_id AS enrolled_user_db_id,
                                  eeeu.enroll_number,
                                  u.document_id,
                                  u.first_name,
                                  u.last_name,
                                  u.phone_number,
                                  u.email,
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
                                  \`${process.env.DB_USER_GEEK_SCHEMA}\`.fn_get_user_region_levels(u.user_id) AS user_regions,
                                  DATE_FORMAT(eerp.payment_date, '%d/%m/%Y') AS payment_date,
                                  eerp.operation_number,
                                  (
                                      SELECT pml.description 
                                      FROM payment_methods_lang pml 
                                      WHERE pml.payment_method_id = pm.payment_method_id 
                                      AND pml.language_id = 1
                                  ) AS payment
                           FROM event_edition_enrolled_users eeeu
                               JOIN event_edition_reported_payment eerp ON eerp.user_id = eeeu.user_id
                               JOIN users u2 ON u2.user_id = eerp.user_id
                               JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.user_secure_id usi ON usi.secure_id = u2.geek_user_id
                               JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.users u ON u.user_id = usi.user_id
                               JOIN payment_methods pm ON pm.payment_method_id = eerp.payment_method_id
                           WHERE eeeu.event_edition_id = ?
                           AND eerp.event_edition_id = ?
                           ORDER BY eeeu.enroll_number ASC;`;

        db.query(queryString, params, async function (err, result) {

            if (err) {

                reject({
                    response: {
                        error: err,
                        message: "Error al tratar de ejecutar la consulta en la línea 599",
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

const kitItems = (params) => {

    return new Promise(function (resolve, reject) {

        let queryString = `SELECT event_edition_mode_kit_item_id AS itemId,
                                  event_edition_mode_kit_id AS kitId,
                                  description AS item
                           FROM event_edition_mode_kit_item
                           WHERE event_edition_mode_kit_id = ?
                           AND status_id = 1;`;

        db.query(queryString, params, async function (err, result) {

            if (err) {

                reject({
                    response: {
                        message: "Error al tratar de ejecutar la consulta",
                        status: "error",
                        statusCode: 0
                    }
                });

            } else {

                if (result.length > 0) {

                    for (var i = 0; i < result.length; i++) {

                        result[i].attrs = await kitItemsAttrs([result[i].itemId, params[1]]);

                    }

                }

                resolve(result);

            }

        });

    }).catch(function (error) {

        return (error);

    });

}

const kitItemsAttrs = (params) => {

    return new Promise(function (resolve, reject) {

        let queryString = `SELECT eemkia.event_edition_mode_kit_item_id AS itemId,
                                  a.attribute_id AS attrId,
                                  al.description AS attr
                           FROM event_edition_mode_kit_item_attrs eemkia
                           INNER JOIN attributes a ON a.attribute_id = eemkia.attribute_id
                           INNER JOIN attributes_lang al ON al.attribute_id = a.attribute_id
                           INNER JOIN languages l ON l.language_id = al.language_id
                           WHERE event_edition_mode_kit_item_id = ?
                           AND UPPER(l.code) = UPPER(?)
                           AND a.status_id = 1;`;

        db.query(queryString, params, async function (err, result) {

            if (err) {

                reject({
                    response: {
                        message: "Error al tratar de ejecutar la consulta",
                        status: "error",
                        statusCode: 0
                    }
                });

            } else {

                if (result.length > 0) {

                    for (var i = 0; i < result.length; i++) {

                        result[i].attrValues = await kitItemsAttrsValues([result[i].attrId, params[1]]);

                    }

                }

                resolve(result);

            }

        });

    }).catch(function (error) {

        return (error);

    });

}

const kitItemsAttrsValues = (params) => {

    return new Promise(function (resolve, reject) {

        let queryString = `SELECT av.attribute_value_id AS attrValId,
                                  av.attribute_id AS attrId,
                                  avl.description 
                           FROM attributes_values av
                           INNER JOIN attributes_values_lang avl ON avl.attribute_value_id = av.attribute_value_id
                           INNER JOIN languages l ON l.language_id = avl.language_id
                           WHERE av.attribute_id = ?
                           AND UPPER(l.code) = UPPER(?)
                           AND av.status_id = 1
                           ORDER BY av.order ASC;`;

        db.query(queryString, params, async function (err, result) {

            if (err) {

                reject({
                    response: {
                        message: "Error al tratar de ejecutar la consulta",
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

const kitItemsExchange = (params) => {

    return new Promise(function (resolve, reject) {

        let queryString = `SELECT c.currency_id AS currencyId,
                                  cl.description AS currencyDesc,
                                  c.symbol AS currencySymbol,
                                  CASE eec.default
                                      WHEN 1 THEN
                                         eemk.price
                                      WHEN 0 THEN
                                          ROUND(
                                              (
                                                   eemk.price * 
                                                   (
                                                       SELECT ce.rate 
                                                       FROM currencies_exchange ce 
                                                       WHERE ce.to_currency_id = eec.currency_id
                                                       AND ce.from_currency_id = (
                                                                                      SELECT eec2.currency_id 
                                                                                      FROM event_edition_currencies eec2 
                                                                                      WHERE eec2.event_edition_id = eem.event_edition_id 
                                                                                      AND eec2.default = 1 LIMIT 1
                                                                                  )
                                                   )
                                               ),8)
                                      END AS priceUnformatted,
                                  CASE eec.default
                                      WHEN 1 THEN
                                          CONCAT(c.symbol,'', FORMAT(eemk.price, c.decimals, 'de_DE'))
                                      WHEN 0 THEN
                                          CONCAT(
                                              c.symbol,
                                              '', 
                                              FORMAT(
                                                  (
                                                      eemk.price * 
                                                      (
                                                          SELECT ce.rate 
                                                          FROM currencies_exchange ce 
                                                          WHERE ce.to_currency_id = eec.currency_id
                                                          AND ce.from_currency_id = (
                                                                                      SELECT eec2.currency_id 
                                                                                      FROM event_edition_currencies eec2 
                                                                                      WHERE eec2.event_edition_id = eem.event_edition_id 
                                                                                      AND eec2.default = 1 LIMIT 1
                                                                                    )
                                                      )
                                                  ), c.decimals, 'de_DE'))
                                      END AS priceFormatted,
                                      eemk.minimum_price AS minimumPrice
                           FROM event_edition_mode_kit eemk
                           INNER JOIN event_edition_mode eem ON eem.event_edition_mode_id =  eemk.event_edition_mode_id
                           INNER JOIN event_edition_currencies eec ON eec.event_edition_id = eem.event_edition_id
                           INNER JOIN currencies c ON c.currency_id = eec.currency_id
                           INNER JOIN currencies_lang cl ON cl.currency_id = c.currency_id
                           INNER JOIN languages l ON l.language_id = cl.language_id
                           WHERE eemk.event_edition_mode_kit_id = ?
                           AND UPPER(l.code) = UPPER(?)
                           ORDER BY eemk.description, eemk.price ASC;`;

        db.query(queryString, params, async function (err, result) {

            if (err) {

                reject({
                    response: {
                        message: "Error al tratar de ejecutar la consulta",
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

const userEnroll = (params) => {

    return new Promise(function (resolve, reject) {

        let queryString = `CALL sp_user_enroll(?,?,?,?,?,?,?,?,?,?,@response);`
        db.query(queryString, params, function (err, result) {

            if (err) {

                reject({
                    error: err,
                    response: "error"
                })

            }
            else {

                db.query('SELECT @response as response', async (err2, result2) => {

                    if (err2) {

                        reject({
                            error: err,
                            response: "Error fetching data from the database"
                        })

                    }
                    else {

                        let outputParam = JSON.parse(result2[0].response);

                        if (outputParam.response.status === "success") {

                            outputParam.response.contacts = await eventEditionContacts(params[1]);
                            let userKitItemsParams = [params[0], params[1], params[7], params[7]];
                            outputParam.response.kitItems = await eventEditionUserKitItems(userKitItemsParams);

                        }

                        resolve(outputParam);

                    }

                })

            }

        })

    }).catch(function (error) {

        console.log("ERROR enrolling user")
        console.log(error)
        return error

    })

}

const userEnrolled = (params) => {

    return new Promise(function (resolve, reject) {

        let queryString = `SELECT eeeu.enroll_number,
                                  CONCAT(u.first_name, " ", u.last_name) AS name,
                                  eemk.description kit,
                                  ee.event_type_id,
                                  e.title AS event_title,
                                  tvml.description event_mode,
                                  ee.whatsapp_general_group,
                                  ee.whatsapp_enrolled_group
                           FROM event_edition_enrolled_users eeeu
                                JOIN event_edition ee ON ee.event_edition_id = eeeu.event_edition_id
                                JOIN event_edition_mode eem ON eem.event_edition_id = ee.event_edition_id
                                JOIN type_event_modes_lang tvml ON tvml.type_event_mode_id = eem.type_event_mode_id
                                JOIN languages l ON l.language_id = tvml.language_id
                                JOIN events e ON e.event_id = ee.event_id
                                JOIN users u2 ON u2.user_id = eeeu.user_id
                                JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.user_secure_id usi ON usi.secure_id = u2.geek_user_id
                                JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.users u ON u.user_id = usi.user_id
                                JOIN event_edition_mode_kit eemk ON eemk.event_edition_mode_kit_id = eeeu.event_edition_mode_kit_id
                           WHERE eeeu.event_edition_id = ?
                           AND usi.secure_id = ?
                           AND UCASE(l.code) = UCASE(?)`;

        db.query(queryString, params, async function (err, result) {

            if (err) {

                reject({
                    response: {
                        error: err,
                        message: "Error al tratar de ejecutar la consulta",
                        status: "error",
                        statusCode: 0
                    }
                });

            } else {

                result[0].contacts = await eventEditionContacts(params[0]);
                let userKitItemsParams = [params[1], params[0], params[2], params[2]];
                result[0].kitItems = await eventEditionUserKitItems(userKitItemsParams);
                let userAccessoriesParams = [params[1], params[0], params[2]];
                result[0].purchasedAccessories = await eventEditionUserPurchasedAccessories(userAccessoriesParams);

                resolve(result[0]);

            }

        });

    }).catch(function (error) {

        console.log("ERROR enrolling user")
        console.log(error)
        return error

    })

}

const eventEditionUserPurchasedAccessories = (params) => {

    return new Promise(function (resolve, reject) {

        let queryString = `SELECT poi.product_order_item_id,
                                  poi.product_id,
                                  poi.quantity,
                                  poi.unit_price,
                                  poi.subtotal,
                                  pc.title,
                                  pc.short_description,
                                  CASE WHEN pc.featured_image IS NOT NULL AND pc.featured_image != '' 
                                       THEN CONCAT('${process.env.API_PUBLIC || ''}/images/products/', pc.product_id, '/', pc.featured_image) 
                                       ELSE NULL 
                                  END AS featured_image,
                                  c.symbol AS currency_symbol,
                                  c.abbreviation AS currency_abbreviation
                           FROM product_orders po
                           JOIN product_order_items poi ON poi.product_order_id = po.product_order_id
                           JOIN vw_product_cards pc ON pc.product_id = poi.product_id
                           JOIN event_edition_enrolled_users eeeu ON (
                               (po.event_edition_enrolled_user_id IS NOT NULL AND po.event_edition_enrolled_user_id = eeeu.event_edition_enrolled_user_id)
                               OR (po.event_edition_enrolled_user_id IS NULL AND po.event_edition_id = eeeu.event_edition_id)
                           )
                           JOIN users u ON u.user_id = eeeu.user_id
                           LEFT JOIN currencies c ON c.currency_id = po.currency_id
                           WHERE (u.geek_user_id = ? OR po.user_id = ?)
                           AND eeeu.event_edition_id = ?
                           AND (pc.language_code IS NULL OR UPPER(pc.language_code) = UPPER(?))
                           GROUP BY poi.product_order_item_id;`;

        let queryParams = [params[0], params[0], params[1], params[2]];

        db.query(queryString, queryParams, function (err, result) {

            if (err) {
                console.log("Error consultando accesorios comprados:", err);
                resolve([]);
            } else {
                resolve(result || []);
            }

        });

    }).catch(function (error) {

        console.log("Error en eventEditionUserPurchasedAccessories:", error);
        return [];

    });

}

const userEnrolledQRCode = (params) => {

    return new Promise(function (resolve, reject) {

        let queryString = `SELECT eeeu.user_id,
                                  u.document_id,
                                  u.first_name,
                                  u.last_name
                            FROM event_edition_enrolled_users eeeu
                                JOIN event_edition_reported_payment eerp ON eerp.user_id = eeeu.user_id
                                JOIN users u2 ON u2.user_id = eerp.user_id
                                JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.user_secure_id usi ON usi.secure_id = u2.geek_user_id
                                JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.users u ON u.user_id = usi.user_id
                            WHERE eeeu.event_edition_id = ?
                            AND eeeu.enroll_number = ?`;

        db.query(queryString, params, async function (err, result) {

            if (err) {

                reject({
                    response: {
                        error: err,
                        message: "Error al tratar de ejecutar la consulta",
                        status: "error",
                        statusCode: 0
                    }
                });

            } else {

                resolve(result[0]);
            }

        });

    }).catch(function (error) {

        console.log("ERROR enrolling user");
        return error;
    });
};

const getEditionAccessoriesList = (eventEditionId) => {
    return new Promise(function (resolve, reject) {
        if (!eventEditionId) return resolve([]);

        let queryString = `
            SELECT DISTINCT pc.product_id, pc.title
            FROM (
                SELECT eep.product_id
                FROM event_edition_products eep
                WHERE eep.event_edition_id = ? AND eep.status_id = 1
                UNION
                SELECT poi.product_id
                FROM product_orders po
                JOIN product_order_items poi ON poi.product_order_id = po.product_order_id
                WHERE po.event_edition_id = ? AND po.status_id != 0
            ) AS combined
            JOIN vw_product_cards pc ON pc.product_id = combined.product_id
            ORDER BY pc.title ASC;
        `;

        db.query(queryString, [eventEditionId, eventEditionId], function (err, result) {
            if (err) {
                console.log("Error al consultar accesorios de la edición:", err);
                resolve([]);
            } else {
                resolve(result || []);
            }
        });
    }).catch(() => []);
};

const getEventEditionPurchasedAccessoriesMap = (eventEditionId) => {
    return new Promise(function (resolve, reject) {
        if (!eventEditionId) return resolve({});

        let queryString = `
            SELECT 
                po.event_edition_enrolled_user_id,
                po.user_id,
                eeeu.event_edition_enrolled_user_id AS matched_enrolled_user_id,
                eeeu.user_id AS matched_user_id,
                poi.product_id,
                SUM(poi.quantity) AS total_qty
            FROM product_orders po
            JOIN product_order_items poi ON poi.product_order_id = po.product_order_id
            LEFT JOIN event_edition_enrolled_users eeeu ON (
                (po.event_edition_enrolled_user_id IS NOT NULL AND po.event_edition_enrolled_user_id = eeeu.event_edition_enrolled_user_id)
                OR (po.event_edition_id = eeeu.event_edition_id AND po.user_id = eeeu.user_id)
            )
            WHERE po.event_edition_id = ? AND po.status_id != 0
            GROUP BY po.event_edition_enrolled_user_id, po.user_id, eeeu.event_edition_enrolled_user_id, eeeu.user_id, poi.product_id;
        `;

        db.query(queryString, [eventEditionId], function (err, result) {
            if (err) {
                console.log("Error al consultar mapa de accesorios comprados:", err);
                resolve({});
            } else {
                const map = {};
                (result || []).forEach(row => {
                    const keys = [
                        row.matched_enrolled_user_id ? `enrolled_${row.matched_enrolled_user_id}` : null,
                        row.event_edition_enrolled_user_id ? `enrolled_${row.event_edition_enrolled_user_id}` : null,
                        row.matched_user_id ? `user_${row.matched_user_id}` : null,
                        row.user_id ? `user_${row.user_id}` : null
                    ].filter(Boolean);

                    keys.forEach(k => {
                        if (!map[k]) map[k] = {};
                        map[k][row.product_id] = (map[k][row.product_id] || 0) + Number(row.total_qty || 0);
                    });
                });
                resolve(map);
            }
        });
    }).catch(() => ({}));
};

module.exports = {
    activeEvents,
    checkPermissionSeeParticipantsList,
    checkPoint,
    donationEventParticipantsList,
    eventAdditionalAccessories,
    eventDataForStorage,
    eventDetail,
    eventEditionContacts,
    eventEditionCurrencies,
    eventEditionUserKitItems,
    eventEditionUserPurchasedAccessories,
    eventEditionPaymethods,
    eventEditionPaymethodDetail,
    eventModalities,
    eventModalityKits,
    getEditionAccessoriesList,
    getEventEditionPurchasedAccessoriesMap,
    kitItems,
    kitItemsExchange,
    payEventParticipantsList,
    userEnroll,
    userEnrolled,
    userEnrolledQRCode
}