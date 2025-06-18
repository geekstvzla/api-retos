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
                    result[i].event_modes = await eventModes(modesParams);

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
                                  ehi.enrollment_end_date
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
                result[0].event_modes = await eventModes(modesParams);

                let distancesParams = [result[0].event_edition_id];
                result[0].event_distances = await eventDistances(distancesParams);

                resolve({response: result[0]});
                
            }
    
        });

    }).catch(function(error) {

        return(error);
      
    });

}

const eventDistances = (params) => {

    return new Promise(function(resolve, reject) { 

        let queryString = `SELECT distance
                           FROM event_edition_distances
                           WHERE edition_event_id = ?;`;

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

const eventModes = (params) => {

    return new Promise(function(resolve, reject) { 

        let queryString = `SELECT eem.event_edition_id,
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

        return(error);
      
    });

}

module.exports = {
    activeEvents,
    eventDetail
}