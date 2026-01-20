const nodemailer = require("nodemailer");
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
        user: process.env.MAIL_TOKEN2,
        pass: process.env.MAIL_PASSWORD,
    },
    secure: false/* ,
    token: process.env.MAIL_TOKEN*/
});

module.exports = transporter;