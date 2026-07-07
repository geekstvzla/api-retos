require('dotenv').config();
let db = require('../config/database.js');
const axios = require('axios');

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
      
    });

}

const updateExchangeRate = (rates) => {

    return new Promise(function(resolve, reject) {

        const queryCurrencies = `SELECT currency_id, symbol FROM currencies WHERE symbol IN ('Bs', '$', '€')`;

        db.query(queryCurrencies, [], function(err, currencies) {

            if (err) {
                return reject({
                    response: {
                        message: "Error al consultar las monedas en la base de datos",
                        status: "error",
                        statusCode: 0,
                        error: err.message || err
                    }
                });
            }

            const currencyMap = {};
            currencies.forEach(item => {
                currencyMap[item.symbol] = item.currency_id;
            });

            const bsId = currencyMap['Bs'];
            const usdId = currencyMap['$'];
            const eurId = currencyMap['€'];

            if (!bsId || !usdId || !eurId) {
                return reject({
                    response: {
                        message: "No se encontró la configuración de monedas necesaria en la base de datos",
                        status: "error",
                        statusCode: 0
                    }
                });
            }

            const updatePair = (fromId, toId, rate) => {

                return new Promise(function(resolvePair, rejectPair) {

                    const querySelect = `SELECT currencies_exchange_id FROM currencies_exchange WHERE from_currency_id = ? AND to_currency_id = ? LIMIT 1`;
                    db.query(querySelect, [fromId, toId], function(errSelect, rows) {
                        
                        if (errSelect) {
                            return rejectPair(errSelect);
                        }

                        if (rows.length > 0) {

                            const updateSql = `UPDATE currencies_exchange SET rate = ? WHERE currencies_exchange_id = ?`;
                            db.query(updateSql, [rate, rows[0].currencies_exchange_id], function(errUpdate) {
                                
                                if (errUpdate) {
                                    return rejectPair(errUpdate);
                                }

                                resolvePair();

                            });

                        } else {

                            const insertSql = `INSERT INTO currencies_exchange (from_currency_id, to_currency_id, rate, status_id) VALUES (?, ?, ?, 1)`;
                            db.query(insertSql, [fromId, toId, rate], function(errInsert) {
                                
                                if (errInsert) {
                                    return rejectPair(errInsert);
                                }

                                resolvePair();

                            });

                        }

                    });

                });
            };

            Promise.all([
                updatePair(usdId, bsId, rates.usd),
                updatePair(eurId, bsId, rates.eur)
            ])
            .then(() => {

                resolve({
                    response: {
                        message: "Tasas de cambio actualizadas correctamente",
                        status: "success",
                        statusCode: 1,
                        rates: rates
                    }
                });
                
            })
            .catch(errorUpdate => {
                reject({
                    response: {
                        message: "Error al actualizar las tasas de cambio",
                        status: "error",
                        statusCode: 0,
                        error: errorUpdate.message || errorUpdate
                    }
                });
            });
        });

    }).catch(function(error) {
        return(error);
    });
};

module.exports = {
    activeCurrencies,
    updateExchangeRate
}