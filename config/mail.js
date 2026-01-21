const nodemailer = require("nodemailer");
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: false,
    auth: {
        user: process.env.MAIL_USER,
        pass: (process.env.MAIL_PASSWORD === "") ? process.env.MAIL_TOKEN : process.env.MAIL_PASSWORD,
    },
    /*,
    token: process.env.MAIL_TOKEN*/
});

module.exports = transporter;