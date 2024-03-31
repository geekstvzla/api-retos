let transporter = require('../config/mail.js')
const Email = require('email-templates')

const activateUserAccount = (params) => 
{
    
    let locale = translation(params.langId)
    params.from = '"LA TRIVELA" <contacto@latrivela.com.ve>'
    params.template = 'activateUserAccount'    
    sendEmailTemplate(params)

}

const sendEmailTemplate = (params) => 
{

    const email = new Email({
        i18n: {},
        message: {
            from: params.from
        },
        preview: false,
        send: true,
        transport: transporter
    })

    email
    .send({
        template: params.template,
        message: {
            to: params.email
        },
        locals: params.locals
    })/*
    .then(console.log)
    .catch(console.error)*/

}

const newUserAccount = (params) => 
{

    params.from = '"LA TRIVELA" <contacto@latrivela.com.ve>'
    params.locals = { url: params.url }
    params.template = 'newUserAccount'
    sendEmailTemplate(params)

}

const recoverUserPassword = async (params) => 
{

    params.from = '"LA TRIVELA" <contacto@latrivela.com.ve>'
    params.locals = { password: params.password }
    params.template = 'recoverUserPassword'
    sendEmailTemplate(params)

}

const translation = (lang) => {

    var text = {}
    switch (lang) {
        case 1:
            text = es
            break
        case 2:
            text = en
            break
        default:
            text = es
            break
    }

    return text

}

module.exports = {
    activateUserAccount,
    newUserAccount,
    recoverUserPassword
}