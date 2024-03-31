require('dotenv').config()
let db = require('../config/database.js')

const activateAccount = (params) => {

    return new Promise(function(resolve, reject) { 

        let queryString = `CALL sp_activate_account_user(?,?,@response);`
        db.query(queryString, params, function(err, result) {

            if(err) {
    
                reject({
                    response: {
                        message: "Error al tratar de ejecutar la consulta",
                        status: "error",
                        statusCode: 0
                    }
                })
    
            } else {

                db.query('SELECT @response as response', (err2, result2) => {

                    if(err2) {
    
                        reject({
                            response: {
                                message: "Error al tratar de ejecutar la consulta",
                                status: "error",
                                statusCode: 0
                            }
                        })
            
                    } else {
                    
                        let outputParam = JSON.parse(result2[0].response);
                        resolve(outputParam)
                        
                    }   

                })
    
            }
    
        })

    }).catch(function(error) {

        return(error)
      
    })

}

const checkUsername = (params) => {

    return new Promise(function(resolve, reject) { 

        let queryString = `SELECT IF(COUNT(1) > 0, false, true) username_available 
                           FROM users u
                           WHERE LOWER(u.username) = LOWER(?);`
        db.query(queryString, params, function(err, result) {

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
                        usernameAvailable: result[0].username_available
                    }
                })
    
            }
    
        })

    }).catch(function(error) {

        return(error)
      
    })

}

const recoverUserPassword = (params) => {

    return new Promise(function(resolve, reject) { 

        let queryString = `CALL sp_recover_user_password(?,?,@response);`
        db.query(queryString, params, function(err, result) {

            if(err) {
    
                reject({
                    response: {
                        message: "Error executing stored procedure sp_recover_user_password in line 60",
                        status: "error",
                        statusCode: 0,
                        error: err
                    }
                })
    
            } else {

                db.query('SELECT @response as response', (err2, result2) => {

                    if(err2) {
    
                        reject({
                            response: {
                                message: "Error when trying to execute the query in line 76",
                                status: "error",
                                statusCode: 0,
                                error: err2
                            }
                        })
            
                    } else {
                    
                        let outputParam = JSON.parse(result2[0].response);
                        resolve(outputParam)
                        
                    }   

                })
    
            }
    
        })

    }).catch(function(error) {

        return(error)
      
    })

}

const signIn = (params) => {

    return new Promise(function(resolve, reject) { 

        let queryString = `CALL sp_sign_in(?,?,?,@response);`
        db.query(queryString, params, function(err, result) {

            if(err) {
    
                reject({
                    response: {
                        message: "Error executing stored procedure sp_sign_in in line 155",
                        status: "error",
                        statusCode: 0,
                        error: err
                    }
                })
    
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
                        })
            
                    } else {
                    
                        let outputParam = JSON.parse(result2[0].response);

                        if(outputParam.response.avatar) {
                            outputParam.response.avatar = process.env.APP_URL+":"+process.env.APP_PORT+"/images/users/"+outputParam.response.avatar
                        }

                        resolve(outputParam)
                        
                    }   

                })
    
            }
    
        })

    }).catch(function(error) {

        return(error)
      
    })
    
}

const signUp = (params) => {

    return new Promise(function(resolve, reject) { 

        let queryString = `CALL sp_sign_up(?,?,?,?,@response);`
        db.query(queryString, params, function(err, result) {

            if(err) {
    
                reject({
                    response: {
                        message: "Error executing stored procedure sp_sign_up in line 214",
                        status: "error",
                        statusCode: 0
                    }
                })
    
            } else {

                db.query('SELECT @response as response', (err2, result2) => {

                    if(err2) {
    
                        reject({
                            response: {
                                message: "Error when trying to execute the query in line 188",
                                status: "error",
                                statusCode: 0
                            }
                        })
            
                    } else {
                    
                        let outputParam = JSON.parse(result2[0].response);
                        resolve(outputParam)
                        
                    }   

                })
    
            }
    
        })

    }).catch(function(error) {

        return(error)
      
    })
    
}

module.exports = {
    activateAccount,
    checkUsername,
    recoverUserPassword,
    signIn,
    signUp
}