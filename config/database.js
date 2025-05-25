var mysql = require('mysql2');
require('dotenv').config();

let settings = {
    host    : process.env.DB_HOST,
    user    : process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true
};

let db = mysql.createPool(settings);
  
module.exports = db;