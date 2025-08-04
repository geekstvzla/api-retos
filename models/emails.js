let transporter = require('../config/mail.js');
const Email = require('email-templates');

const activateUserAccount = async (params) => 
{
    
    let locale = translation(params.langId);
    params.from = '"Sumando Kilometros" <contacto@sumandokilometros.com.ve>';
    params.template = 'activateUserAccount/' + locale;
    
    let mailRs = await sendEmailTemplate(params);
    return mailRs;

}

const newUserAccount = async (params) => 
{

    let locale = translation(params.langId);
    params.from = '"Sumando Kilometros" <contacto@sumandokilometros.com.ve>';
    params.locals = { url: params.url };
    params.template = 'newUserAccount/' + locale;
   
    let mailRs = await sendEmailTemplate(params);
    return mailRs;

}

const userAccessCode = async (params) => 
{

    let locale = translation(params.langId);
    params.from = '"Sumando Kilometros" <contacto@sumandokilometros.com.ve>';
    params.locals = { accessCode: params.accessCode };
    params.template = 'userAccessCode/' + locale;

    let mailRs = await sendEmailTemplate(params);
    return mailRs;

};

const updateUserData = async (params) => 
{

    let locale = translation(params.langId);
    params.from = '"Sumando Kilometros" <contacto@sumandokilometros.com.ve>';
    params.template = 'updateUserData/' + locale;

    let mailRs = await sendEmailTemplate(params);
    return mailRs;

};

const sendEmailTemplate = (params) => {

    return new Promise(function(resolve, reject) { 

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
        })
        .then(function() {
           
            resolve({
                message: "Email enviado con éxito!",
                status: "success",
                statusCode: 1
            });

        })
        .catch(function (error) {

            if(error.code == "EDNS") {

                var message = "Error de conexión con el servidor que envia el correo.";

            } else {

                var message = "Ocurrió un error al tratar de enviar el correo.";

            }

            resolve({
                error: error,
                message: message,
                status: "error",
                statusCode: 4
            });
            
        });

    }).catch(function(error) {

        reject(error);
      
    });


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

    return text;

}

module.exports = {
    activateUserAccount,
    newUserAccount,
    userAccessCode,
    updateUserData
}