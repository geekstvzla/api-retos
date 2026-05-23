require('dotenv').config()
let db = require('../config/database.js')

const activeCurrencies = () => {

    return new Promise(function(resolve, reject) { 

        let queryString = `SELECT c.currency_id,
                                  c.description currency_desc,
                                  c.symbol currency_symbol
                           FROM currencies c
                           WHERE c.status_id = 1
                           ORDER BY c.description ASC;`;
        db.query(queryString, [], function(err, result) {

            if(err) {
    
                reject({
                    response: {
                        message: "Error al tratar de ejecutar la consulta en la linea 8",
                        status: "error",
                        statusCode: 0
                    }
                })
    
            } else {
    
                resolve({
                    response: {
                        currencies: result,
                        status: "success",
                        statusCode: 1
                    }
                })
    
            }
    
        })

    }).catch(function(error) {

        return(error)
      
    })

}

const countries = () => {

    return new Promise(function(resolve, reject) { 

        let queryString = `SELECT c.country_id,
                                  c.description,
                                  c.alpha_2_code,
                                  c.alpha_3_code,
                                  c.phone_code
                           FROM countries c
                           WHERE c.status_id = 1
                           ORDER BY c.description ASC;`;
        db.query(queryString, [], function(err, result) {

            if(err) {
    
                reject({
                    response: {
                        message: "Error al tratar de ejecutar la consulta en la linea 60",
                        status: "error",
                        statusCode: 0
                    }
                })
    
            } else {
    
                resolve({
                    response: {
                        countries: result,
                        status: "success",
                        statusCode: 1
                    }
                })
    
            }
    
        })

    }).catch(function(error) {

        return(error)
      
    })

}

const countryRegions = (params) => {

    return new Promise(function(resolve, reject) { 

        let queryString = `SELECT cr.country_region_id,
                                  cr.description ,
                                  cr.parent_region_id
                           FROM country_regions cr
                           WHERE country_id = ?
                           AND level = ?
                           AND (parent_region_id = ? OR parent_region_id IS NULL)
                           AND status_id = 1
                           ORDER BY cr.description ASC;`;
        db.query(queryString, params, function(err, result) {

            if(err) {
    
                reject({
                    response: {
                        message: "Error al tratar de ejecutar la consulta en la linea 104",
                        status: "error",
                        statusCode: 0
                    }
                })
    
            } else {
    
                resolve({
                    response: {
                        regions: result,
                        status: "success",
                        statusCode: 1
                    }
                })
    
            }
    
        })

    }).catch(function(error) {

        return(error)
      
    })

}

module.exports = {
    activeCurrencies,
    countries,
    countryRegions
}