let transporter = require('../config/mail.js');
const Email = require('email-templates');
const path = require('path');

/*const checkEmail = async (params) =>
{

    let locale = translation(params.langId);
    params.from = '"Sumando Kilometros" <contacto@sumandokilometros.com.ve>';
    params.locals = {};
    params.template = 'congratsForEnroll/' + locale;
   
    let mailRs = await sendEmailTemplate(params);
    return mailRs;

}
*/
const congratsForEnroll = async (params) => {

    let locale = translation(params.langId);
    params.from = '"Sumando Kilometros" <contacto@sumandokilometros.com.ve>';
    params.lang = locale;
    params.locals = {
        contacts: params.contacts,
        eventEdition: params.eventEdition,
        eventTitle: params.eventTitle,
        userName: params.userName,
        purchasedAccessories: params.purchasedAccessories
    };
    params.template = 'congratsForEnroll/' + locale;

    let mailRs = await sendEmailTemplate(params);
    return mailRs;

}

const newUserAccount = async (params) => {

    let locale = translation(params.langId);
    params.from = '"Sumando Kilometros" <contacto@sumandokilometros.com.ve>';
    params.lang = locale;
    params.locals = { activationCode: params.activationCode };
    params.template = 'newUserAccount/' + locale;

    let mailRs = await sendEmailTemplate(params);
    return mailRs;

}

const userAccessCode = async (params) => {

    let locale = translation(params.langId);
    params.from = '"Sumando Kilometros" <contacto@sumandokilometros.com.ve>';
    params.lang = locale;
    params.locals = { accessCode: params.accessCode };
    params.template = 'userAccessCode/' + locale;

    let mailRs = await sendEmailTemplate(params);
    return mailRs;

};

const updateUserData = async (params) => {

    let locale = translation(params.langId);
    params.from = '"Sumando Kilometros" <contacto@sumandokilometros.com.ve>';
    params.lang = locale;
    params.template = 'updateUserData/' + locale;

    let mailRs = await sendEmailTemplate(params);
    return mailRs;

};

const newUserEnroll = async (params) => {

    let locale = translation(params.langId);
    params.attachments = (params.voucher) ? params.voucher : [];
    params.from = '"Sumando Kilometros" <contacto@sumandokilometros.com.ve>';
    params.lang = locale;
    params.locals = {
        eventEdition: params.eventEdition,
        eventTitle: params.eventTitle,
        userName: params.userName,
        purchasedAccessories: params.purchasedAccessories
    };
    params.template = 'newUserEnroll/' + locale;

    let mailRs = await sendEmailTemplate(params);
    return mailRs;

}

const supplierSaleNotification = async (params) => {

    let locale = translation(params.langId);
    params.from = '"Sumando Kilometros" <contacto@sumandokilometros.com.ve>';
    params.lang = locale;
    params.template = 'supplierSaleNotification/' + locale;

    let mailRs = await sendEmailTemplate(params);
    return mailRs;

}

const teamCreatedUser = async (params) => {

    let locale = translation(params.langId);
    params.from = '"Sumando Kilometros" <contacto@sumandokilometros.com.ve>';
    params.lang = locale;
    params.locals = {
        userName: params.userName,
        teamName: params.teamName
    };
    params.template = 'teamCreatedUser/' + locale;

    let mailRs = await sendEmailTemplate(params);
    return mailRs;

}

const teamCreatedAdmin = async (params) => {

    let locale = translation(params.langId);
    params.from = '"Sumando Kilometros" <contacto@sumandokilometros.com.ve>';
    params.lang = locale;
    params.locals = {
        adminName: params.adminName,
        teamName: params.teamName,
        creatorName: params.creatorName,
        creatorEmail: params.creatorEmail,
        createdAt: params.createdAt
    };
    params.template = 'teamCreatedAdmin/' + locale;

    let mailRs = await sendEmailTemplate(params);
    return mailRs;

}

const teamInvitation = async (params) => {

    let locale = translation(params.langId);
    params.from = '"Sumando Kilometros" <contacto@sumandokilometros.com.ve>';
    params.lang = locale;
    params.locals = {
        userName: params.userName,
        teamName: params.teamName,
        acceptUrl: params.acceptUrl,
        rejectUrl: params.rejectUrl
    };
    params.template = 'teamInvitation/' + locale;

    let mailRs = await sendEmailTemplate(params);
    return mailRs;

}

const sendEmailTemplate = (params) => {

    return new Promise(function (resolve, reject) {

        // Asegurar que el logo del encabezado esté siempre adjunto
        let attachments = [];
        if (params.attachments) {
            attachments = Array.isArray(params.attachments) ? [...params.attachments] : [params.attachments];
        }

        const hasLogo = attachments.some(att => att.cid === 'logo');
        if (!hasLogo) {
            attachments.push({
                filename: 'logo-menu-letras-negras.jpg',
                path: path.join(
                    process.cwd(),
                    'public',
                    'images',
                    'logo-menu-letras-negras.jpg'
                ),
                cid: 'logo'
            });
        }

        const email = new Email({

            message: {
                attachments: attachments,
                from: params.from,
                to: params.email
            },
            preview: (process.env.MAIL_PREVIEW === "true"),
            send: true,
            transport: transporter
        });

        email
            .send({
                template: params.template,
                locals: params
            })
            .then(function () {

                resolve({
                    message: "Email enviado con éxito!",
                    status: "success",
                    statusCode: 1
                });

            })
            .catch(function (error) {

                if (error.code == "EDNS") {

                    var message = "Error de conexión con el servidor que envia el correo.";

                } else {

                    var message = "Ocurrió un error al tratar de enviar el correo.";

                }
                console.log(error)
                resolve({
                    error: error,
                    message: message,
                    status: "error",
                    statusCode: 4
                });

            });

    }).catch(function (error) {

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

const teamMemberRemoved = async (params) => {

    let locale = translation(params.langId);
    params.from = '"Sumando Kilometros" <contacto@sumandokilometros.com.ve>';
    params.lang = locale;
    params.locals = {
        userName: params.userName,
        teamName: params.teamName
    };
    params.template = 'teamMemberRemoved/' + locale;

    let mailRs = await sendEmailTemplate(params);
    return mailRs;

};

module.exports = {
    //checkEmail,
    congratsForEnroll,
    newUserAccount,
    userAccessCode,
    updateUserData,
    newUserEnroll,
    supplierSaleNotification,
    teamCreatedUser,
    teamCreatedAdmin,
    teamInvitation,
    teamMemberRemoved
}