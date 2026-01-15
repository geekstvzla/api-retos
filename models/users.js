require('dotenv').config()
let db = require('../config/database.js')

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
    signIn
}