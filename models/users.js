require('dotenv').config()
let db = require('../config/database.js')

const eventsUserEnrolled = (params) => {

    return new Promise(function(resolve, reject) {

        let queryString = `SELECT eeeu.event_edition_id,
                                  e.title,
                                  CONCAT('${process.env.API_PUBLIC+"/images/events/"}',e.featured_image) AS featured_image,
                                  DATE_FORMAT(ee.departure_date, '%Y-%m-%d %h:%i:%s %p') AS departure_date,
                                  ee.description AS event_edition,
                                  etl.description AS event_type,
                                  ee.event_type_id,
                                  (
                                      SELECT GROUP_CONCAT(teml.description SEPARATOR ', ') AS event_modes
                                      FROM event_edition_mode eem
                                          JOIN type_event_modes tem ON tem.type_event_mode_id = eem.type_event_mode_id
                                          JOIN type_event_modes_lang teml ON teml.type_event_mode_id = eem.type_event_mode_id
                                          JOIN languages l2 ON l2.language_id = teml.language_id
                                          WHERE eem.status_id = 1
                                          AND l2.language_id = l.language_id
                                          AND eem.event_edition_id = ee.event_edition_id
                                  ) AS event_modes
                           FROM event_edition_enrolled_users eeeu
                               INNER JOIN event_edition ee ON ee.event_edition_id = eeeu.event_edition_id
                               INNER JOIN events e ON e.event_id = ee.event_id
                               INNER JOIN event_types et ON et.event_type_id = ee.event_type_id
                               INNER JOIN event_types_lang etl ON etl.event_type_id = et.event_type_id
                               INNER JOIN languages l ON l.language_id = etl.language_id
                           WHERE eeeu.user_id = (
                               SELECT u.user_id FROM users u WHERE u.geek_user_id = ?
                           )
                           AND UPPER(l.code) = UPPER(?)
                           ORDER BY ee.departure_date ASC;`;

        db.query(queryString, params, async function(err, result) {
         
            if(err) {

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

    }).catch(function(error) {
        return(error);
    });

}

const myEvetInfoEnrollment = (params) => {

    return new Promise(function(resolve, reject) {

        let queryString = `SELECT eeeu.enroll_number,
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
                                  eerp.payment_date,
                                  eerp.operation_number
                           FROM event_edition_enrolled_users eeeu
                               JOIN event_edition_reported_payment eerp ON eerp.user_id = eeeu.user_id
                               JOIN users u2 ON u2.user_id = eerp.user_id
                               JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.user_secure_id usi ON usi.secure_id = u2.geek_user_id
                               JOIN \`${process.env.DB_USER_GEEK_SCHEMA}\`.users u ON u.user_id = usi.user_id
                               JOIN payment_methods pm ON pm.payment_method_id = eerp.payment_method_id
                           WHERE eeeu.event_edition_id = ?
                           AND eerp.event_edition_id = ?
                           AND eeeu.user_id = (
                               SELECT u.user_id FROM users u WHERE u.geek_user_id = ?
                         )
                           ORDER BY eeeu.enroll_number ASC;`;

        db.query(queryString, params, async function(err, result) {
         
            if(err) {

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

    }).catch(function(error) {
        return(error);
    });
    
}

const signIn = (params) => {

    return new Promise(function(resolve, reject) { 

        let queryString = `CALL sp_sign_in(?,?,@response);`;
        db.query(queryString, params, function(err, result) {

            if(err) {
    
                reject({
                    response: {
                        message: "Error executing stored procedure sp_sign_in in line 155",
                        status: "error",
                        statusCode: 0,
                        error: err
                    }
                });
    
            } else {
                
                db.query('SELECT @response as response', (err2, result2) => {

                    if(err2) {
    
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

    }).catch(function(error) {

        return(error);
      
    });
    
};

module.exports = {
    eventsUserEnrolled,
    myEvetInfoEnrollment,
    signIn
}