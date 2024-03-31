var mysql = require('mysql')
require('dotenv').config()

let settings = {
    host    : process.env.DB_HOST,
    user    : process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
}

let db = mysql.createConnection(settings)
  
module.exports = db