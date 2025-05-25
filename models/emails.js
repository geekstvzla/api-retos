let transporter = require('../config/mail.js');
const Email = require('email-templates');

const activateUserAccount = (params) => 
{
    
    let locale = translation(params.langId)
    params.from = '"Gimtastic" <contacto@gimtastic.com.ve>'
    params.template = 'activateUserAccount/' + locale
    sendEmailTemplate(params)

}

const newUserAccount = (params) => 
{

    let locale = translation(params.langId)
    params.from = '"Gimtastic" <contacto@gimtastic.com.ve>'
    params.locals = { url: params.url }
    params.template = 'newUserAccount/' + locale
    sendEmailTemplate(params)

}

const userAccessCode = async (params) => 
{

    let locale = translation(params.langId);
    params.from = '"Gimtastic" <contacto@gimtastic.com.ve>';
    params.locals = { accessCode: params.accessCode };
    params.template = 'userAccessCode/' + locale;
    sendEmailTemplate(params);

};

const sendEmailTemplate = (params) => {

    const email = new Email({
        message: {
            from: params.from
        },
        preview: true,
        send: true,
        transport: transporter
    });

    email
    .send({
        template: params.template,
        message: {
            to: params.email
        },
        locals: params
    });/*
    .then(console.log)
    .catch(console.error)*/

}

const translation = (lang) => {

    lang = parseInt(lang)
    var text = {}

    switch (lang) {
        case 1:
            text = 'es'
            break
        case 2:
            text = 'en'
            break
        default:
            text = 'es'
            break
    }

    return text

}

module.exports = {
    activateUserAccount,
    newUserAccount,
    userAccessCode
}