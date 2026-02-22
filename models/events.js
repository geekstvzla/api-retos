require('dotenv').config()
let db = require('../config/database.js')

const activeEvents = (params) => {

    return new Promise(function(resolve, reject) { 

        let queryString = `SELECT ec.event_id,
                                  ec.title,
                                  CONCAT('${process.env.API_PUBLIC+"/images/events/"}',ec.featured_image) AS featured_image,
                                  ec.departure_date,
                                  ec.departure_place_name,
                                  ec.departure_place_url_map,
                                  ec.event_edition_id,
                                  ec.event_slug,
                                  ec.event_type_id,
                                  ec.event_type,
                                  ec.event_modes
                           FROM vw_event_cards ec
                           WHERE UPPER(ec.language_code) = UPPER(?);`;

        db.query(queryString, params, async function(err, result) {

            if(err) {
    
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

    }).catch(function(error) {

        return(error);
      
    });

}

const checkPoint = (params) => {

    return new Promise(function(resolve, reject) 
    { 
      
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
      
        db.query(queryString, params, async function(err, result) {

            if(err) {

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

    }).catch(function(error) 
    {

        console.log("ERROR enrolling user")
        console.log(error)
        return error
      
    })

}

const eventAdditionalAccessories = (params) => {

    return new Promise(async function(resolve, reject) { 

        let queryString = `SELECT eeoi.event_edition_optional_item_id AS item_id,
                                  eeoi.description AS item,
                                  eeoi.price,
                                  eeoi.quantity AS item_quantity,
                                  eeoi.currency_id,
                                  cl.description AS currency_desc,
                                  c.abbreviation AS currency_abb,
                                  c.symbol AS currency_symbol,
                                  c.decimals AS currency_decimals
                           FROM event_edition_optional_item eeoi
                           INNER JOIN currencies c ON c.currency_id = eeoi.currency_id
                           INNER JOIN currencies_lang cl ON cl.currency_id =  c.currency_id
                           INNER JOIN languages l ON l.language_id = cl.language_id
                           WHERE eeoi.event_edition_id = ?
                           AND UPPER(l.code) = UPPER(?)
                           AND eeoi.status_id = 1;`;

        db.query(queryString, params, async function(err, result) {

            if(err) {
    
                reject({
                    response: {
                        error: err,
                        message: "Error al tratar de ejecutar la consulta",
                        status: "error",
                        statusCode: 0
                    }
                });
    
            } else {
                
                
                for(var i = 0; i < result.length; i++) {

                    let params = [result[i]["item_id"]]
                    result[i]["multimedia"] = await eventAdditionalAccessoriesMedia(params);
  
                }
                
                resolve(result);
                
            }
    
        });

    }).catch(function(error) {

        console.log(error)
        return(error);
      
    });

}

const eventAdditionalAccessoriesMedia = (params) => {

    return new Promise(function(resolve, reject) { 

        let queryString = `SELECT ee.event_edition_id AS edition_id,
                                  ee.event_id,
                                  eeoim.event_edition_optional_item_id AS optional_item_id,
                                  eeoim.media_file,
                                  CONCAT('${process.env.API_PUBLIC+"/images/events/event-"}', ee.event_id,'/edition-', ee.event_edition_id,'/accessories/', eeoim.media_file) AS url_media 
                           FROM event_edition_optional_item_media eeoim
                           INNER JOIN event_edition_optional_item eeoi ON eeoi.event_edition_optional_item_id = eeoim.event_edition_optional_item_id
                           INNER JOIN event_edition ee ON ee.event_edition_id = eeoi.event_edition_id
                           WHERE eeoim.event_edition_optional_item_id = ?
                           AND eeoim.status_id = 1`;
      
        db.query(queryString, params, async function(err, result) {

            if(err) {
    
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

    }).catch(function(error) {

        return(error);
      
    });

}

const eventDataForStorage = (params) => {

    return new Promise(async function(resolve, reject) { 

        let queryString = `SELECT ec.event_id,
                                  ec.title,
                                  CONCAT('${process.env.API_PUBLIC+"/images/events/"}',ec.featured_image) AS featured_image,
                                  ec.departure_date,
                                  ec.departure_place_name,
                                  ec.departure_place_url_map,
                                  ec.event_edition_id,
                                  ec.event_slug,
                                  ec.event_type_id
                           FROM vw_event_cards ec
                           WHERE ec.event_slug = ?;`;

        db.query(queryString, params, async function(err, result) {

            if(err) {
    
                reject({
                    response: {
                        message: "Error al tratar de ejecutar la consulta",
                        status: "error",
                        statusCode: 0
                    }
                });
    
            } else {
                
                for(var i = 0; i < result.length; i++) {
                    
                    let modesParams = [result[i].event_edition_id, params[0]];
                    result[i].event_modes = await eventModalities(modesParams);

                }
          
                resolve({
                    event: result[0]
                });
                
            }
    
        });

    }).catch(function(error) {
     
        return(error);
      
    });

}

const eventDetail = (params) => {

    return new Promise(async function(resolve, reject) { 

        let queryString = `SELECT ehi.event_id,
                                  ehi.title,
                                  CONCAT('${process.env.API_PUBLIC+"/images/events/"}',ehi.banner_image) AS banner_image,
                                  CONCAT('${process.env.API_PUBLIC+"/images/events/"}',ehi.featured_image) AS featured_image,
                                  ehi.departure_date,
                                  ehi.departure_place_name,
                                  ehi.departure_place_url_map,
                                  ehi.event_edition_id,
                                  ehi.event_edition,
                                  ehi.arrival_place_name,
                                  ehi.enrollment_end_date,
                                  ehi.event_distances,
                                  (
                                      SELECT COUNT(1) FROM vw_event_edition_optional_item eeoi
                                      WHERE eeoi.event_edition_id = ehi.event_edition_id
                                      AND UPPER(eeoi.code) = UPPER(?)
                                  ) AS has_accessories,
                                  ehi.whatsapp_group,
                                  ehi.event_type_id,
                                  ehi.event_type
                           FROM vw_event_header_info ehi
                           WHERE ehi.event_id = ?
                           AND ehi.event_edition_id = ?
                           AND UPPER(ehi.language_code) = UPPER(?);`;

        db.query(queryString, [params[2], params[0], params[1], params[2]], async function(err, result) {

            if(err) {
    
                reject({
                    response: {
                        message: "Error al tratar de ejecutar la consulta",
                        status: "error",
                        statusCode: 0
                    }
                });
    
            } else {
                
                let modesParams = [result[0].event_edition_id, params[2]];
                result[0].event_modes = await eventModalities(modesParams);

                resolve({response: result[0]});
                
            }
    
        });

    }).catch(function(error) {

        return(error);
      
    });

}

const eventEditionContacts = (eventEditionId) => {

    return new Promise(function(resolve, reject) {

        let queryString = `SELECT eec.full_name,
                                  eec.email,
                                  eec.phone_number,
                                  eec.whatsapp_number
                           FROM event_edition_contacts eec
                           WHERE eec.event_edition_id = ?
                           AND eec.status_id = 1;`;

        db.query(queryString, [eventEditionId], async function(err, result) {

            if(err) {

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

    }).catch(function(error) {

        return(error);

    });

}

const eventEditionUserKitItems = (params) => {

    return new Promise(function(resolve, reject) {

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

        db.query(queryString, params, async function(err, result) {

            if(err) {

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

    }).catch(function(error) {
     
        return(error);
      
    });

}
    

const eventModalities = (params) => {

    return new Promise(function(resolve, reject) { 

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

        db.query(queryString, params, async function(err, result) {

            if(err) {
    
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

    }).catch(function(error) {
     
        return(error);
      
    });

}

const eventModalityKits = (params) => {

    return new Promise(function(resolve, reject) { 

        let queryString = `SELECT eemk.event_edition_mode_kit_id AS kitId,
                                  eemk.description AS kit,
                                  eemk.price AS priceUnformatted,
                                  c.currency_id AS currencyId,
                                  cl.description AS currencyDesc,
                                  c.symbol AS currencySymbol,
                                  CONCAT(c.symbol, FORMAT(eemk.price, c.decimals, 'de_DE')) AS priceFormatted
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
                           ORDER BY eemk.description, eemk.price ASC;`;

        db.query(queryString, params, async function(err, result) {

            if(err) {
    
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

    }).catch(function(error) {

        return(error);
      
    });

}

const eventEditionPaymethods = (params) => {

    return new Promise(function(resolve, reject) {

        let queryString = `SELECT pm.payment_method_id,
                                  pml.description AS payment_method
                           FROM payment_methods pm
                           INNER JOIN payment_methods_lang pml ON pml.payment_method_id = pm.payment_method_id
                           INNER JOIN languages l ON l.language_id = pml.language_id
                           INNER JOIN event_edition_payment_methods eepm ON eepm.payment_method_id = pm.payment_method_id
                           WHERE UPPER(l.code) = UPPER(?)
                           AND eepm.event_edition_id = ?
                           AND pm.status_id = 1;`;

        db.query(queryString, params, async function(err, result) {

            if(err) {   

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

    }).catch(function(error) {

        return(error);
    
    });

}

const eventEditionPaymethodDetail = (params) => {

    return new Promise(function(resolve, reject) { 

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

        db.query(queryString, params, async function(err, result) {

            if(err) {   

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

    }).catch(function(error) {

        return(error);
    
    });

}

const kitItems = (params) => {

    return new Promise(function(resolve, reject) {

        let queryString = `SELECT event_edition_mode_kit_item_id AS itemId,
                                  event_edition_mode_kit_id AS kitId,
                                  description AS item
                           FROM event_edition_mode_kit_item
                           WHERE event_edition_mode_kit_id = ?
                           AND status_id = 1;`;

        db.query(queryString, params, async function(err, result) {

            if(err) {
    
                reject({
                    response: {
                        message: "Error al tratar de ejecutar la consulta",
                        status: "error",
                        statusCode: 0
                    }
                });
    
            } else {
              
                if(result.length > 0) {

                    for(var i = 0; i < result.length; i++) {

                        result[i].attrs = await kitItemsAttrs([result[i].itemId, params[1]]);

                    }

                } 

                resolve(result);
                
            }
    
        });

    }).catch(function(error) {

        return(error);
      
    });

}

const kitItemsAttrs = (params) => {

    return new Promise(function(resolve, reject) {

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

        db.query(queryString, params, async function(err, result) {

            if(err) {
    
                reject({
                    response: {
                        message: "Error al tratar de ejecutar la consulta",
                        status: "error",
                        statusCode: 0
                    }
                });
    
            } else {
                 
                if(result.length > 0) {
                   
                    for(var i = 0; i < result.length; i++) {
                       
                        result[i].attrValues = await kitItemsAttrsValues([result[i].attrId, params[1]]);

                    }

                } 

                resolve(result);
                
            }
    
        });

    }).catch(function(error) {

        return(error);
      
    });

}

const kitItemsAttrsValues = (params) => {
  
    return new Promise(function(resolve, reject) {

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

        db.query(queryString, params, async function(err, result) {

            if(err) {
    
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

    }).catch(function(error) {

        return(error);
      
    });

}

const kitItemsExchange = (params) => {

    return new Promise(function(resolve, reject) {

        let queryString = `SELECT  c.currency_id AS currencyId,
                                   cl.description AS currencyDesc,
                                   c.symbol AS currencySymbol,
                                   CASE eec.default
                                       WHEN 1 THEN
                                           eemk.price
                                       WHEN 0 THEN
                                           ROUND((eemk.price * (SELECT ce.rate FROM currencies_exchange ce WHERE ce.to_currency_id = eec.currency_id)),8)
                                       END AS priceUnformatted,
                                   CASE eec.default
                                       WHEN 1 THEN
                                           CONCAT(c.symbol,'', FORMAT(eemk.price, c.decimals, 'de_DE'))
                                       WHEN 0 THEN
                                           CONCAT(c.symbol,'', FORMAT((eemk.price * (SELECT ce.rate FROM currencies_exchange ce WHERE ce.to_currency_id = eec.currency_id)), c.decimals, 'de_DE'))
                                       END AS priceFormatted
                           FROM event_edition_mode_kit eemk
                           INNER JOIN event_edition_mode eem ON eem.event_edition_mode_id =  eemk.event_edition_mode_id
                           INNER JOIN event_edition_currencies eec ON eec.event_edition_id = eem.event_edition_id
                           INNER JOIN currencies c ON c.currency_id = eec.currency_id
                           INNER JOIN currencies_lang cl ON cl.currency_id = c.currency_id
                           INNER JOIN languages l ON l.language_id = cl.language_id
                           WHERE eemk.event_edition_mode_kit_id = ?
                           AND UPPER(l.code) = UPPER(?)
                           ORDER BY eemk.description, eemk.price ASC;`;

        db.query(queryString, params, async function(err, result) {

            if(err) {

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

    }).catch(function(error) {
        return(error);
    });

}

const userEnroll = (params) => {

    return new Promise(function(resolve, reject) 
    { 
      
        let queryString = `CALL sp_user_enroll(?,?,?,?,?,?,?,?,?,?,@response);`
        db.query(queryString, params, function(err, result) 
        {

            if(err) 
            {
    
                reject({
                    error: err,
                    response: "error"
                })
    
            } 
            else 
            {
                     
                db.query('SELECT @response as response', async (err2, result2) => 
                {

                    if(err2) 
                    {
                        
                        reject({
                            error: err,
                            response: "Error fetching data from the database"
                        })
          
                    } 
                    else 
                    {
                   
                        let outputParam = JSON.parse(result2[0].response);

                        if(outputParam.response.status === "success") {

                            outputParam.response.contacts = await eventEditionContacts(params[1]);
                            let userKitItemsParams = [params[1], params[0], params[2], params[2]];
                            outputParam.response.kitItems = await eventEditionUserKitItems(userKitItemsParams);

                        }
                        
                        resolve(outputParam);
                        
                    }   

                })
    
            }
    
        })

    }).catch(function(error) 
    {

        console.log("ERROR enrolling user")
        console.log(error)
        return error
      
    })

}

const userEnrolled = (params) => {

    return new Promise(function(resolve, reject) 
    { 

        let queryString = `SELECT eeeu.enroll_number,
                                  CONCAT(u.first_name, " ", u.last_name) AS name,
                                  eemk.description kit,
                                  ee.event_type_id,
                                  e.title AS event_title,
                                  tvml.description event_mode,
                                  ee.whatsapp_group
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
      
        db.query(queryString, params, async function(err, result) {
         
            if(err) {

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
                let userKitItemsParams = [params[0], params[1], params[8], params[8]];
                result[0].kitItems = await eventEditionUserKitItems(userKitItemsParams);
                
                resolve(result[0]);

            }       

        });

    }).catch(function(error) 
    {

        console.log("ERROR enrolling user")
        console.log(error)
        return error
      
    })

}

const userEnrolledQRCode = (params) => {

    return new Promise(function(resolve, reject) 
    { 

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
      
        db.query(queryString, params, async function(err, result) {
            
            if(err) {

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

    }).catch(function(error) 
    {

        console.log("ERROR enrolling user")
        console.log(error)
        return error
      
    })

}

module.exports = {
    activeEvents,
    checkPoint,
    eventAdditionalAccessories,
    eventDataForStorage,
    eventDetail,
    eventEditionContacts,
    eventEditionUserKitItems,
    eventEditionPaymethods,
    eventEditionPaymethodDetail,
    eventModalities,
    eventModalityKits,
    kitItems,
    kitItemsExchange,
    userEnroll,
    userEnrolled,
    userEnrolledQRCode
}