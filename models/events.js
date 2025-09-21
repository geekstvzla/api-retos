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
                                  ec.event_edition_id
                           FROM vw_event_cards ec;`;

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
                console.log(result)
                resolve({
                    events: result
                });
                
            }
    
        });

    }).catch(function(error) {

        reject(error);
      
    });

}

const eventDetail = (params) => {

    return new Promise(function(resolve, reject) { 

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
                                  ehi.event_distances
                           FROM vw_event_header_info ehi
                           WHERE ehi.event_id = ?
                           AND ehi.event_edition_id = ?;`;

        db.query(queryString, [params[0], params[1]], async function(err, result) {

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

        reject(error);
      
    });

}

const eventModalities = (params) => {

    return new Promise(function(resolve, reject) { 

        let queryString = `SELECT eem.type_event_mode_id,
                                  eem.event_edition_id,
                                  teml.language_id,
                                  teml.description AS mode,
                                  l.code AS lang_code,
                                  teml.status_id AS mode_status_id
                           FROM event_edition_mode eem
                           INNER JOIN type_event_modes tem ON tem.type_event_mode_id = eem.type_event_mode_id
                           INNER JOIN type_event_modes_lang teml ON teml.type_event_mode_id = tem.type_event_mode_id
                           INNER JOIN languages l ON l.language_id = teml.language_id
                           WHERE eem.event_edition_id = ?
                           AND UPPER(l.code) = UPPER(?);`;

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

        reject(error);
      
    });

}

const eventModalityKits = (params) => {

    return new Promise(function(resolve, reject) { 

        let queryString = `SELECT eemk.event_edition_mode_kit_id,
                                eemk.description,
                                eemk.price,
                                cl.description AS currency_desc,
                                c.symbol AS currency_symbol
                           FROM event_edition_mode_kit eemk
                           INNER JOIN currencies c ON c.currency_id = eemk.currency_id
                           INNER JOIN currencies_lang cl ON cl.currency_id = c.currency_id
                           INNER JOIN languages l ON l.language_id = cl.language_id
                           WHERE eemk.event_edition_mode_id = ?
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

        reject(error);
      
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
                 
                resolve(result);
                
            }
    
        });

    }).catch(function(error) {

        reject(error);
      
    });

}

module.exports = {
    activeEvents,
    eventDetail,
    eventModalities,
    eventModalityKits,
    kitItems
}