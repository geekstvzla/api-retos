require('dotenv').config()
let db = require('../config/database.js')

const activeEvents = () => {

    return new Promise(function(resolve, reject) { 

        let queryString = `SELECT e.event_id,
                                  e.event_title,
                                  e.event_cover_image
                           FROM vw_active_events e
                           WHERE e.event_status_id = 1;`
        db.query(queryString, null, function(err, result) {

            if(err) {
    
                reject({
                    response: {
                        message: "Error al tratar de ejecutar la consulta",
                        status: "error",
                        statusCode: 0
                    }
                })
    
            } else {
    
                resolve({
                    response: {
                        status: "success",
                        statusCode: 1,
                        events: result
                    }
                })
    
            }
    
        })

    }).catch(function(error) {

        return(error)
      
    })

}

const eventData = () => {

    return new Promise(function(resolve, reject) { 

        let queryString = `SELECT e.event_id,
                                  e.event_title,
                                  e.event_cover_image
                           FROM vw_active_events e
                           WHERE e.event_status_id = 1;`
        db.query(queryString, null, function(err, result) {

            if(err) {
    
                reject({
                    response: {
                        message: "Error al tratar de ejecutar la consulta",
                        status: "error",
                        statusCode: 0
                    }
                })
    
            } else {
    
                resolve({
                    response: {
                        status: "success",
                        statusCode: 1,
                        data: result[0]
                    }
                })
    
            }
    
        })

    }).catch(function(error) {

        return(error)
      
    })

}

module.exports = {
    activeEvents,
    eventData
}