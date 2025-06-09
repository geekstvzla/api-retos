require('dotenv').config()
let db = require('../config/database.js')

const activeEvents = (params) => {

    return new Promise(function(resolve, reject) { 

        let queryString = `SELECT ec.event_id,
                                  ec.title,
                                  CONCAT('${process.env.API_PUBLIC+"/images/events/"}',ec.featured_image) AS featured_image,
                                  ec.departure_date,
                                  ec.departure_place_name,
                                  ec.departure_place_url_map
                           FROM vw_event_cards ec;`;
        db.query(queryString, params, function(err, result) {

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
                    response: {
                        events: result
                    }
                });
                
            }
    
        });

    }).catch(function(error) {

        return(error);
      
    });

}

module.exports = {
    activeEvents
}