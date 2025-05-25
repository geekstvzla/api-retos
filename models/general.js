require('dotenv').config()
let db = require('../config/database.js')

const activeCurrencies = () => {

    return new Promise(function(resolve, reject) { 

        let queryString = `SELECT c.currency_id,
                                  c.description currency_desc,
                                  c.symbol currency_symbol
                           FROM currencies c
                           WHERE c.status_id = 1
                           ORDER BY c.description ASC;`
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

module.exports = {
    activeCurrencies
}