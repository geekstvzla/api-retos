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

        return(error);
      
    });

}

const eventAdditionalAccessories = (params) => {

    return new Promise(function(resolve, reject) { 

        let queryString = `SELECT eeoi.event_edition_optional_item_id AS item_id,
                                  eeoi.description AS item,
                                  eeoi.quantity AS item_quantity,
                                  eeoi.currency_id,
                                  cl.description AS currency_desc,
                                  c.abbreviation AS currency_abb,
                                  c.symbol AS currency_symbol
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
                 
                resolve(result);
                
            }
    
        });

    }).catch(function(error) {
        console.log(error)
        return(error);
      
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

                let accessoriesParams = [result[0].event_edition_id, params[2]];
                let accessories = await eventAdditionalAccessories(accessoriesParams);
                result[0].has_accessories = accessories.length;

                resolve({response: result[0]});
                
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
        console.log(error)
        return(error);
      
    });

}

const eventModalityKits = (params) => {

    return new Promise(function(resolve, reject) { 

        let queryString = `SELECT eemk.event_edition_mode_kit_id AS kitId,
                                  eemk.description AS kit,
                                  eemk.price,
                                  cl.description AS currencyDesc,
                                  c.symbol AS currencySymbol
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
                 
                resolve(result);
                
            }
    
        });

    }).catch(function(error) {

        return(error);
      
    });

}

module.exports = {
    activeEvents,
    eventAdditionalAccessories,
    eventDetail,
    eventModalities,
    eventModalityKits,
    kitItems
}