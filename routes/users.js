var express = require('express');
var router = express.Router();
var db = require('../config/database.js');
var mail = require('../models/emails.js');
var usersModel = require('../models/users.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const langs = (lang) => {

    let langData = require('../langs/users/' + lang + '.json');
    return langData;

}

router.post('/activate-user-account', async function (req, res, next) {

    let code = req.query.code;
    const langId = req.query.langId;
    let userId = req.query.userId;
    let params = { userId: userId, code: code, langId: langId };
    const langData = langs(langId);

    axios.post(process.env.API_GEEKST + '/users/activate-user-account', null, { params: params })
        .then(async function (rs) {

            var status = rs.data.response.status;
            var statusCode = rs.data.response.statusCode;
            var userStatusId = (rs.data.response.userStatusId) ? rs.data.response.userStatusId : null;

            if (statusCode === 0) {

                var message = langData.activateUserAccount.error.userDoesntExist;

            } else if (statusCode === 1) {

                let signInParams = [rs.data.response.userId, langId];
                let data = await usersModel.signIn(signInParams);

                message = langData.activateUserAccount.success;

            } else if (statusCode === 2) {

                message = langData.activateUserAccount.warning.activated;

            } else if (statusCode === 3) {

                message = langData.activateUserAccount.error.technicalSupport;

            } else if (statusCode === 4) {

                const accessCode = rs.data.response.accessCode;

                let emailParams = { accessCode: accessCode, email: userData.email, langId: langId };
                let mailRs = await mail.userAccessCode(emailParams);

                if (mailRs.statusCode === 4) {

                    message = mailRs.message;
                    status = mailRs.status;
                    statusCode = mailRs.statusCode;

                } else {

                    message = langData.activateUserAccount.warning.codeExpired;

                }

            } else if (statusCode === 5) {

                message = langData.activateUserAccount.error.incorrectCode;

            } else {

                message = rs.data.response.message;

            };

            res.send({
                message: message,
                status: status,
                statusCode: statusCode,
                userStatusId: userStatusId
            });

        })
        .catch(function (error) {

            console.log("<-- ERROR -->");
            console.log(error);
            res.send(error);

        });

})

router.get('/check-username', async function (req, res, next) {

    let langId = req.query.langId;
    let username = req.query.username;
    let params = { username: username, langId: langId };

    axios.get(process.env.API_GEEKST + '/users/check-username', { params: params })
        .then(async function (rs) {

            res.send({
                message: rs.data.response.message,
                status: rs.data.response.status,
                statusCode: rs.data.response.statusCode,
                usernameAvailable: rs.data.response.usernameAvailable
            });

        })
        .catch(function (error) {

            console.log("<-- ERROR -->");
            console.log(error);
            res.send(error);

        });

});

router.get('/get-access-code', async function (req, res, next) {

    let email = req.query.email;
    let langId = req.query.langId;
    let params = { email: email, langId: langId };
    const langData = langs(langId);
    var message = "";
    var status = "";
    var statusCode = 0;

    axios.get(process.env.API_GEEKST + '/users/get-access-code', { params: params })
        .then(async function (rs) {

            status = rs.data.response.status;
            statusCode = rs.data.response.statusCode;

            if (statusCode === 0) {

                message = langData.accessCode.error.userDoesntExist;
                /*let emailParams = {email: email, langId: langId};
                let mailRs = await mail.checkEmail(emailParams);*/

            } else if (statusCode === 1) {

                db.query("INSERT INTO user_access_code_deliveries (email, delivery_status) VALUES (?, 'PENDING')", [email]);

                let emailParams = { accessCode: rs.data.response.accessCode, email: email, langId: langId };
                let mailRs = await mail.userAccessCode(emailParams);

                if (mailRs.statusCode === 4) {

                    message = mailRs.message;
                    status = mailRs.status;
                    statusCode = mailRs.statusCode;

                } else {

                    message = langData.accessCode.success.sendEmail;

                }

            } else if (statusCode === 2) {

                message = langData.accessCode.warning.userInactive;

            } else {

                message = rs.data.response.message;

            };

            res.send({
                message: message,
                status: status,
                statusCode: statusCode
            });

        })
        .catch(function (error) {

            console.log("<-- ERROR -->");
            console.log(error);
            res.send(error);

        });

});

router.post('/mailtrap-webhook', express.json(), async function (req, res) {
    try {
        const events = req.body.events || (Array.isArray(req.body) ? req.body : [req.body]);
        if (Array.isArray(events)) {
            for (const evt of events) {
                const email = evt.email;
                const eventType = evt.event;
                const responseMsg = (evt.response || evt.reason || '').toLowerCase();

                let status = null;
                if (eventType === 'bounce') {
                    status = 'EMAIL_NOT_FOUND';
                } else if (eventType === 'soft_bounce') {
                    if (responseMsg.includes('full') || responseMsg.includes('quota') || responseMsg.includes('4.2.2')) {
                        status = 'MAILBOX_FULL';
                    } else {
                        status = 'MAILBOX_FULL';
                    }
                }

                if (status && email) {
                    await db.promise().query(
                        `UPDATE user_access_code_deliveries 
                         SET delivery_status = ?, error_details = ? 
                         WHERE email = ? 
                         ORDER BY id DESC LIMIT 1;`,
                        [status, evt.response || evt.reason || '', email]
                    );
                }
            }
        }
        res.status(200).send('OK');
    } catch (err) {
        console.error("Error processing mailtrap webhook:", err);
        res.status(500).send('Error');
    }
});

router.get('/check-access-code-delivery', async function (req, res) {
    let email = req.query.email;
    if (!email) {
        return res.json({ status: 'error', deliveryStatus: 'UNKNOWN' });
    }
    try {
        const [rows] = await db.promise().query(
            `SELECT delivery_status, error_details 
             FROM user_access_code_deliveries 
             WHERE email = ? 
             ORDER BY id DESC LIMIT 1;`,
            [email]
        );
        if (rows && rows.length > 0) {
            return res.json({
                status: 'success',
                deliveryStatus: rows[0].delivery_status,
                errorDetails: rows[0].error_details
            });
        }
        return res.json({ status: 'success', deliveryStatus: 'PENDING' });
    } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message });
    }
});

router.get('/get-blood-types', async function (req, res, next) {

    let langId = req.query.langId;
    let params = { langId: langId };
    const langData = langs(langId);
    var message = "";

    axios.get(process.env.API_GEEKST + '/users/get-blood-types', { params: params })
        .then(async function (rs) {

            if (rs.data.response.statusCode === 1) {

                message = langData.getBloodTypes.success;

            } else {

                message = langData.getBloodTypes.error;

            };

            res.send({
                message: message,
                status: rs.data.response.status,
                statusCode: rs.data.response.statusCode,
                bloodTypes: rs.data.response.documentTypes
            });

        })
        .catch(function (error) {

            console.log("<-- ERROR -->");
            console.log(error);
            res.send(error);

        });

});

router.get('/get-countries-phone-codes', async function (req, res, next) {

    let langId = req.query.langId;
    let params = { langId: langId };
    const langData = langs(langId);
    var message = "";

    axios.get(process.env.API_GEEKST + '/users/get-countries-phone-codes', { params: params })
        .then(async function (rs) {

            if (rs.data.response.statusCode === 1) {

                message = langData.getCountriesPhoneCodes.success;

            } else {

                message = langData.getCountriesPhoneCodes.error;

            };

            res.send({
                message: message,
                status: rs.data.response.status,
                statusCode: rs.data.response.statusCode,
                phoneCodes: rs.data.response.phoneCodes
            });

        })
        .catch(function (error) {

            console.log("<-- ERROR -->");
            console.log(error);
            res.send(error);

        });

});

router.get('/get-document-types', async function (req, res, next) {

    let langId = req.query.langId;
    let params = { langId: langId };
    const langData = langs(langId);
    var message = "";

    axios.get(process.env.API_GEEKST + '/users/get-document-types', { params: params })
        .then(async function (rs) {

            if (rs.data.response.statusCode === 1) {

                message = langData.getDocumentTypes.success;

            } else {

                message = langData.getDocumentTypes.error;

            };

            res.send({
                message: message,
                status: rs.data.response.status,
                statusCode: rs.data.response.statusCode,
                documentTypes: rs.data.response.documentTypes
            });

        })
        .catch(function (error) {

            console.log("<-- ERROR -->");
            console.log(error);
            res.send(error);

        });

});

router.get('/get-events-user', async function (req, res, next) {

    let langId = req.query.langId;
    let userId = req.query.userId;
    let params = [userId, userId, userId, userId, langId];

    let data = await usersModel.eventsUser(params);
    res.send({
        events: data
    });

});

router.get('/get-gender-types', async function (req, res, next) {

    let langId = req.query.langId;
    let params = { langId: langId };
    const langData = langs(langId);
    var message = "";

    axios.get(process.env.API_GEEKST + '/users/get-gender-types', { params: params })
        .then(async function (rs) {

            if (rs.data.response.statusCode === 1) {

                message = langData.getGenderTypes.success;

            } else {

                message = langData.getGenderTypes.error;

            };

            res.send({
                message: message,
                status: rs.data.response.status,
                statusCode: rs.data.response.statusCode,
                genderTypes: rs.data.response.genderTypes
            });

        })
        .catch(function (error) {

            console.log("<-- ERROR -->");
            console.log(error);
            res.send(error);

        });

});

router.get('/get-my-event-info-enrollment', async function (req, res, next) {

    try {
        let eventEditionId = req.query.eventEditionId;
        let langId = req.query.langId || 'esp';
        let userId = req.query.userId;
        let params = [langId, eventEditionId, userId];

        let data = await usersModel.myEvetInfoEnrollment(params);
        res.send(data);
    } catch (err) {
        console.error("Error en get-my-event-info-enrollment:", err);
        res.status(500).send({
            response: {
                status: 'error',
                message: 'Error al obtener la información de la inscripción.',
                error: err
            }
        });
    }

});

router.post('/update-my-event-sports-team', async function (req, res, next) {

    let eventEditionId = req.body.eventEditionId;
    let userId = req.body.userId;
    let sportsTeamId = req.body.sportsTeamId;

    let data = await usersModel.updateMyEventSportsTeam(eventEditionId, userId, sportsTeamId);
    res.send(data);

});

router.post('/report-enrollment-installment', async function (req, res, next) {

    try {
        const userId = req.body.userId ? String(req.body.userId).trim() : '';
        const eventEditionId = req.body.eventEditionId ? Number(req.body.eventEditionId) : null;
        const installmentNumber = req.body.installmentNumber ? Number(req.body.installmentNumber) : 1;
        const langId = req.body.langId || 'esp';

        let targetInstallments = [installmentNumber];
        if (req.body.advanceInstallments) {
            let adv = req.body.advanceInstallments;
            if (typeof adv === 'string') {
                try {
                    adv = JSON.parse(adv);
                } catch (e) {
                    adv = adv.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
                }
            }
            if (Array.isArray(adv)) {
                adv.forEach(n => {
                    const num = Number(n);
                    if (!isNaN(num) && !targetInstallments.includes(num)) {
                        targetInstallments.push(num);
                    }
                });
            }
        }
        targetInstallments.sort((a, b) => a - b);

        const operationNumber = req.body.operationNumber ? String(req.body.operationNumber).trim() : '';
        const paymentDay = req.body.paymentDay ? String(req.body.paymentDay).trim() : new Date().toISOString().slice(0, 10);
        const paymentMethodId = req.body.paymentMethodId ? Number(req.body.paymentMethodId) : 1;
        const amount = req.body.amount ? parseFloat(req.body.amount) : null;
        const voucherFile = req.files ? (req.files.voucherFile || req.files.file) : null;

        if (!userId || !eventEditionId) {
            return res.status(400).json({
                response: {
                    status: 'error',
                    message: 'Faltan parámetros obligatorios (userId, eventEditionId).'
                }
            });
        }

        const data = await usersModel.reportEnrollmentInstallment({
            userId,
            eventEditionId,
            installmentNumber,
            targetInstallments,
            operationNumber,
            paymentDay,
            paymentMethodId,
            amount,
            voucherFile,
            langId
        });

        res.json(data);
    } catch (err) {
        console.error('Error reportando cuota:', err);
        res.status(500).json({
            response: {
                status: 'error',
                message: 'Error interno al procesar el comprobante de cuota.'
            }
        });
    }

});

router.get('/get-my-event-info-certificate', async function (req, res, next) {

    let eventEditionId = req.query.eventEditionId;
    let userId = req.query.userId;
    let params = [eventEditionId, userId];

    try {

        let data = await usersModel.myEventCertificateInfo(params);

        if (!data || !data.certificate_image) {
            return res.send(data);
        }

        const participantName = [data.first_name, data.last_name].filter(Boolean).join(' ').trim();
        const pathname = new URL(data.certificate_image).pathname;
        const imagePath = path.join(
            __dirname,
            "../public",
            pathname
        );
        const imageBuffer = fs.readFileSync(imagePath);
        const base64 = imageBuffer.toString("base64");
        const imageHref = `data:image/webp;base64,${base64}`;

        let certificateParams = {
            fontColor: data.font_color,
            fontSize: data.font_size,
            image: imageHref,
            height: data.certificate_height,
            participantName: participantName,
            orientation: data.orientation,
            width: data.certificate_width,
            xNamePosition: data.x_name_position,
            yNamePosition: data.y_name_position
        };

        let svg = await usersModel.svgCertificate(certificateParams);

        return res.send({
            departure_date: data.departure_date,
            svg: {
                image: svg,
                width: data.certificate_width,
                height: data.certificate_height
            }
        });

    } catch (error) {

        console.error('Error generating certificate image:', error);
        res.send(error);

    }

});

router.get('/get-user-data', async function (req, res, next) {

    let userId = req.query.userId;
    let langId = req.query.langId;
    let params = { userId: userId, langId: langId };
    const langData = langs(langId);
    var message = "";

    axios.get(process.env.API_GEEKST + '/users/get-user-data', { params: params })
        .then(async function (rs) {

            let localUserData = await usersModel.userData(userId);
            if (rs.data && rs.data.response && rs.data.response.userData) {
                rs.data.response.userData.local_user_id = localUserData ? localUserData.user_id : null;
                try {
                    const dbConn = require('../config/database.js');
                    const geekSchema = process.env.DB_USER_GEEK_SCHEMA || 'geekst';
                    const [avatarRows] = await dbConn.promise().query(
                        `SELECT u.avatar FROM \`${geekSchema}\`.users u
                         LEFT JOIN \`${geekSchema}\`.user_secure_id usi ON usi.user_id = u.user_id
                         WHERE usi.secure_id = ? OR u.user_id = ? LIMIT 1`,
                        [userId, userId]
                    );
                    if (avatarRows && avatarRows.length > 0 && avatarRows[0].avatar) {
                        rs.data.response.userData.avatar = avatarRows[0].avatar;
                    }
                } catch (e) {
                    console.error('Error fetching avatar in get-user-data:', e);
                }
            }

            if (rs.data.response.statusCode === 1) {

                message = langData.getUserData.success;

            } else {

                message = langData.getUserData.error;

            };

            res.send({
                message: message,
                status: rs.data.response.status,
                statusCode: rs.data.response.statusCode,
                userData: rs.data.response.userData
            });

        })
        .catch(function (error) {

            console.log("<-- ERROR -->");
            console.log(error);
            res.send(error);

        });

});

router.post('/sign-in', async function (req, res, next) {

    const email = req.query.email;
    let langId = req.query.langId;
    let accessCode = req.query.accessCode;
    let params = { accessCode: accessCode, email: email, langId: langId };
    const langData = langs(langId);
    var message = "";
    var status = "";
    var statusCode = 0;

    axios.post(process.env.API_GEEKST + '/users/sign-in', null, { params: params })
        .then(async function (rs) {

            status = rs.data.response.status;
            statusCode = rs.data.response.statusCode;

            if (statusCode === 1) {

                let signInParams = [rs.data.response.userId, langId];
                let data = await usersModel.signIn(signInParams);
                message = langData.signIn.success;

                let userAvatar = rs.data.response.avatar || null;
                try {
                    const dbConn = require('../config/database.js');
                    const geekSchema = process.env.DB_USER_GEEK_SCHEMA || 'geekst';
                    const [avatarRows] = await dbConn.promise().query(
                        `SELECT u.avatar FROM \`${geekSchema}\`.users u
                         LEFT JOIN \`${geekSchema}\`.user_secure_id usi ON usi.user_id = u.user_id
                         WHERE usi.secure_id = ? OR u.user_id = ? LIMIT 1`,
                        [rs.data.response.userId, rs.data.response.userId]
                    );
                    if (avatarRows && avatarRows.length > 0 && avatarRows[0].avatar) {
                        userAvatar = avatarRows[0].avatar;
                    }
                } catch (e) {
                    console.error('Error fetching avatar on sign-in:', e);
                }

                userData = {
                    avatar: userAvatar,
                    documentId: rs.data.response.documentId,
                    email: email,
                    id: rs.data.response.userId,
                    name: rs.data.response.name,
                    username: rs.data.response.username,
                    userStatusId: rs.data.userStatusId
                };

                res.send({
                    message: message,
                    status: rs.data.response.status,
                    statusCode: rs.data.response.statusCode,
                    userData: userData
                });

            } else {

                if (statusCode === 2) {

                    let accessCode = rs.data.response.accessCode.replace(/(\d{3})(\d{3})/, "$1 $2");
                    let emailParams = { accessCode: accessCode, email: email, langId: langId };
                    let mailRs = await mail.userAccessCode(emailParams);

                    if (mailRs.statusCode === 4) {

                        message = mailRs.message;
                        status = mailRs.status;
                        statusCode = mailRs.statusCode;

                    } else {

                        message = langData.signIn.warning.accessCodeHasExpired;

                    }

                } else if (statusCode === 3) {

                    message = langData.signIn.error.accessCodeIsInvalid;

                } else if (statusCode === 5) {

                    message = rs.data.response.message;

                } else {

                    message = langData.signIn.error.other;

                };

                res.send({
                    message: message,
                    status: status,
                    statusCode: statusCode
                });

            }

        })
        .catch(function (error) {
            console.log(error);

            res.send(error);

        });

});

router.post('/google-sign-in', async function (req, res, next) {
    try {
        const credential = req.body?.credential || req.query?.credential;
        const code = req.body?.code || req.query?.code;
        let langId = req.body?.langId || req.query?.langId || 'esp';
        const langData = langs(langId);

        if (!credential && !code) {
            return res.send({
                message: 'No se recibió la credencial de autenticación de Google',
                status: 'error',
                statusCode: 0
            });
        }

        let googlePayload = null;
        if (credential) {
            try {
                const verifyRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
                googlePayload = verifyRes.data;
            } catch (err) {
                console.error('Error validando token de Google:', err.response?.data || err.message);
                return res.send({
                    message: 'Credencial de Google inválida o expirada',
                    status: 'error',
                    statusCode: 0
                });
            }
        } else if (code) {
            try {
                const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
                    code: code,
                    client_id: process.env.GOOGLE_CLIENT_ID,
                    client_secret: process.env.GOOGLE_CLIENT_SECRET,
                    redirect_uri: 'postmessage',
                    grant_type: 'authorization_code'
                });
                const idToken = tokenRes.data.id_token;
                const verifyRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
                googlePayload = verifyRes.data;
            } catch (err) {
                console.error('Error intercambiando código de Google:', err.response?.data || err.message);
                return res.send({
                    message: 'Error al verificar autorización de Google',
                    status: 'error',
                    statusCode: 0
                });
            }
        }

        if (!googlePayload || !googlePayload.email) {
            return res.send({
                message: 'No se pudo obtener información del perfil de Google',
                status: 'error',
                statusCode: 0
            });
        }

        const email = googlePayload.email.toLowerCase().trim();
        const firstName = googlePayload.given_name || (googlePayload.name ? googlePayload.name.split(' ')[0] : 'Usuario');
        const lastName = googlePayload.family_name || (googlePayload.name && googlePayload.name.includes(' ') ? googlePayload.name.split(' ').slice(1).join(' ') : '');
        const googlePicture = googlePayload.picture || null;

        const geekSchema = process.env.DB_USER_GEEK_SCHEMA || 'geekst';

        // 1. Verificar si el usuario ya existe en geekst.users
        const [userRows] = await db.promise().query(
            `SELECT u.user_id, u.document_id, u.username, u.first_name, u.avatar, u.status_id, usi.secure_id 
             FROM \`${geekSchema}\`.users u 
             LEFT JOIN \`${geekSchema}\`.user_secure_id usi ON usi.user_id = u.user_id 
             WHERE LOWER(u.email) = ? LIMIT 1`,
            [email]
        );

        let secureId = null;
        let userData = null;

        if (userRows && userRows.length > 0) {
            const existingUser = userRows[0];

            if (existingUser.status_id === 2) {
                return res.send({
                    message: langData.accessCode?.warning?.userInactive || 'Su cuenta está en estado INACTIVO.',
                    status: 'warning',
                    statusCode: 5
                });
            }

            secureId = existingUser.secure_id;
            if (!secureId) {
                const [uuidRes] = await db.promise().query(`SELECT UUID() as uuid`);
                secureId = uuidRes[0].uuid;
                await db.promise().query(
                    `INSERT INTO \`${geekSchema}\`.user_secure_id (user_id, secure_id) VALUES (?, ?)`,
                    [existingUser.user_id, secureId]
                );
            }

            let currentStatus = existingUser.status_id;
            if (currentStatus === 3) {
                await db.promise().query(
                    `UPDATE \`${geekSchema}\`.users SET status_id = 1 WHERE user_id = ?`,
                    [existingUser.user_id]
                );
                currentStatus = 1;
            }

            let userAvatar = existingUser.avatar;
            if ((!userAvatar || userAvatar === 'default-avatar.webp' || userAvatar === '') && googlePicture) {
                await db.promise().query(
                    `UPDATE \`${geekSchema}\`.users SET avatar = ? WHERE user_id = ?`,
                    [googlePicture, existingUser.user_id]
                );
                userAvatar = googlePicture;
            }

            await usersModel.signIn([secureId, langId]);

            userData = {
                avatar: userAvatar || googlePicture || 'default-avatar.webp',
                documentId: existingUser.document_id || '',
                email: email,
                id: secureId,
                name: existingUser.first_name || existingUser.username,
                username: existingUser.username,
                userStatusId: currentStatus
            };

        } else {
            // 2. Nuevo usuario -> auto-registro
            let baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').toLowerCase().substring(0, 18);
            if (!baseUsername || baseUsername.length < 3) baseUsername = 'user';
            let finalUsername = baseUsername;
            let counter = 1;

            while (true) {
                const [existing] = await db.promise().query(
                    `SELECT user_id FROM \`${geekSchema}\`.users WHERE username = ? LIMIT 1`,
                    [finalUsername]
                );
                if (existing.length === 0) break;
                finalUsername = `${baseUsername.substring(0, 14)}${Math.floor(100 + Math.random() * 900)}`;
                counter++;
                if (counter > 10) {
                    finalUsername = `${baseUsername.substring(0, 10)}${Date.now().toString().slice(-6)}`;
                    break;
                }
            }

            const [insertRes] = await db.promise().query(
                `INSERT INTO \`${geekSchema}\`.users 
                 (email, username, first_name, last_name, avatar, system_id_referred, status_id) 
                 VALUES (?, ?, ?, ?, ?, 1, 1)`,
                [email, finalUsername, firstName, lastName, googlePicture || 'default-avatar.webp']
            );
            const newUserId = insertRes.insertId;

            const [uuidRes] = await db.promise().query(`SELECT UUID() as uuid`);
            secureId = uuidRes[0].uuid;

            await db.promise().query(
                `INSERT INTO \`${geekSchema}\`.user_secure_id (user_id, secure_id) VALUES (?, ?)`,
                [newUserId, secureId]
            );

            await usersModel.signIn([secureId, langId]);

            userData = {
                avatar: googlePicture || 'default-avatar.webp',
                documentId: '',
                email: email,
                id: secureId,
                name: firstName || finalUsername,
                username: finalUsername,
                userStatusId: 1
            };
        }

        return res.send({
            message: langData.signIn?.success || 'Bienvenid@, pronto será redireccionad@',
            status: 'success',
            statusCode: 1,
            userData: userData
        });

    } catch (err) {
        console.error('Error in /google-sign-in:', err);
        return res.send({
            message: 'Error interno del servidor al autenticar con Google',
            status: 'error',
            statusCode: 0
        });
    }
});

router.post('/sign-up', async function (req, res, next) {

    let email = req.query.email;
    let langId = req.query.langId;
    let username = req.query.username;
    let params = { email: email, langId: langId, username: username };
    const langData = langs(langId);
    var message = "";
    var status = "";
    var statusCode = 0;

    axios.post(process.env.API_GEEKST + '/users/sign-up', null, { params: params })
        .then(async function (rs) {

            status = rs.data.response.status;
            statusCode = rs.data.response.statusCode;
            userId = (rs.data.response.userId) ? rs.data.response.userId : null;
            userAvatar = (rs.data.response.userAvatar) ? rs.data.response.userAvatar : null;
            username = (rs.data.response.username) ? rs.data.response.username : null;
            userStatusId = (rs.data.response.userStatusId) ? rs.data.response.userStatusId : null;

            if (rs.data.response.statusCode === 1) {

                /*let baseUrl = (process.env.NODE_ENV === 'production') ? process.env.APP_URL+":"+process.env.APP_PORT : process.env.APP_URL;
                let url = baseUrl+"/activate-user-account?userId="+rs.data.response.userId+"&langId="+langId;*/
                let emailParams = { activationCode: rs.data.response.activationCode, email: email, langId: langId };
                let mailRs = await mail.newUserAccount(emailParams);

                if (mailRs.statusCode === 4) {

                    message = mailRs.message;
                    status = mailRs.status;
                    statusCode = mailRs.statusCode;

                } else {

                    message = langData.signUp.success;

                }

            } else if (rs.data.response.statusCode === 2) {

                message = langData.signUp.error.alreadyRegisteredEmail;

            } else if (rs.data.response.statusCode === 3) {

                message = langData.signUp.warning.alreadyRegisteredUsername;

            } else {

                message = langData.signUp.error.other;

            };

            res.send({
                avatar: userAvatar,
                message: message,
                status: status,
                statusCode: statusCode,
                userId: userId,
                username: username,
                userStatusId: userStatusId
            });

        })
        .catch(function (error) {
            console.log(error);

            res.send(error);

        });

});

router.post('/update-user-data', async function (req, res, next) {

    const payload = Object.keys(req.body || {}).length > 0 ? req.body : req.query;
    const email = payload.email;
    const langId = payload.langId;
    const userId = payload.userId;

    let params = {
        userId: payload.userId,
        firstName: payload.firstName,
        middleName: payload.middleName,
        lastName: payload.lastName,
        secondLastName: payload.secondLastName,
        nickname: payload.nickname,
        documentTypeId: payload.documentTypeId,
        document: payload.document,
        birthday: payload.birthday,
        genderId: payload.genderId,
        bloodTypeId: payload.bloodTypeId,
        countryPhoneCode: payload.countryPhoneCode,
        phoneNumber: payload.phoneNumber,
        countryEmergencyPhoneCode: payload.countryEmergencyPhoneCode,
        emergencyPhoneNumber: payload.emergencyPhoneNumber,
        medicalCondition: payload.medicalCondition,
        langId: langId
    };

    const langData = langs(langId);
    var message = "";
    var status = "";
    var statusCode = 0;
    var savedAvatarPath = null;

    axios.post(process.env.API_GEEKST + '/users/update-user-data', null, { params: params })
        .then(async function (rs) {

            status = rs.data.response.status;
            statusCode = rs.data.response.statusCode;

            if (rs.data.response.statusCode === 0) {

                message = langData.updateUserData.error.userDoesntExist;

            } else if (rs.data.response.statusCode === 1) {

                // Actualizar inmediatamente en retos.users localmente
                try {
                    const dbConn = require('../config/database.js').promise();
                    await dbConn.query(
                        `UPDATE users SET
                            first_name = COALESCE(?, first_name),
                            middle_name = ?,
                            last_name = COALESCE(?, last_name),
                            second_last_name = ?,
                            nickname = ?,
                            document_type_id = COALESCE(?, document_type_id),
                            document_id = COALESCE(?, document_id),
                            birthday = COALESCE(?, birthday),
                            gender_id = COALESCE(?, gender_id),
                            blood_type_id = COALESCE(?, blood_type_id),
                            country_phone_code = COALESCE(?, country_phone_code),
                            phone_number = COALESCE(?, phone_number),
                            country_emergency_phone_code = COALESCE(?, country_emergency_phone_code),
                            emergency_phone_number = COALESCE(?, emergency_phone_number),
                            medical_condition = COALESCE(?, medical_condition)
                         WHERE geek_user_id = ? OR user_id = ?`,
                        [
                            payload.firstName, payload.middleName || null,
                            payload.lastName, payload.secondLastName || null,
                            payload.nickname !== undefined ? payload.nickname : null,
                            payload.documentTypeId, payload.document,
                            payload.birthday || null, payload.genderId || null,
                            payload.bloodTypeId || null, payload.countryPhoneCode,
                            payload.phoneNumber, payload.countryEmergencyPhoneCode,
                            payload.emergencyPhoneNumber, payload.medicalCondition || null,
                            userId, userId
                        ]
                    );
                } catch (localUpdateErr) {
                    console.error('Error actualizando retos.users local:', localUpdateErr);
                }

                // Procesar avatar si fue enviado en el formulario: delegar centralizadamente a api-users
                if (req.files && (req.files.avatar || req.files.photo || req.files.image)) {
                    try {
                        const avatarFile = req.files.avatar || req.files.photo || req.files.image;
                        const fd = new FormData();
                        const blob = new Blob([avatarFile.data], { type: avatarFile.mimetype || 'application/octet-stream' });
                        fd.append('avatar', blob, avatarFile.name || 'avatar.jpg');
                        fd.append('userId', userId);

                        const uploadUrl = `${process.env.API_GEEKST || 'http://localhost:3001'}/users/upload-avatar`;
                        const uploadRs = await axios.post(uploadUrl, fd);

                        if (uploadRs.data && uploadRs.data.avatar) {
                            savedAvatarPath = uploadRs.data.avatar;
                        }
                    } catch (avatarErr) {
                        console.error('Error enviando avatar a api-users desde api-retos:', avatarErr.response?.data || avatarErr.message);
                    }
                }

                let emailParams = { email: email, langId: langId };
                let mailRs = await mail.updateUserData(emailParams);

                if (mailRs.statusCode === 4) {

                    message = mailRs.message;
                    status = mailRs.status;
                    statusCode = mailRs.statusCode;

                } else {

                    message = langData.updateUserData.success;

                }

            } else if (rs.data.response.statusCode === 2) {

                message = langData.updateUserData.error.userInactive;

            } else if (rs.data.response.statusCode === 3) {

                message = langData.updateUserData.error.pendingVerification;

            } else if (rs.data.response.statusCode === 5) {

                message = langData.updateUserData.error.documentExists || rs.data.response.message;

            } else {

                message = langData.updateUserData.error.other;

            };

            res.send({
                avatar: savedAvatarPath,
                message: message,
                status: status,
                statusCode: statusCode
            });

        })
        .catch(function (error) {

            console.log(error);
            res.send(error);

        });

});

router.get('/get-user-region', async function (req, res, next) {

    let params = { userId: req.query.userId };

    axios.get(process.env.API_GEEKST + '/users/get-user-region', { params: params })
        .then(async function (rs) {

            res.send(rs.data);

        })
        .catch(function (error) {

            console.log("<-- ERROR -->");
            console.log(error);
            res.send(error);

        });

});

router.post('/cron/send-birthday-emails', async function (req, res, next) {
    try {
        const { runBirthdayEmails } = require('../scripts/send-birthday-emails');
        const options = {
            dryRun: req.body?.dryRun === true || req.query?.dryRun === 'true',
            force: req.body?.force === true || req.query?.force === 'true',
            targetDate: req.body?.targetDate || req.query?.targetDate || null,
            testEmail: req.body?.testEmail || req.query?.testEmail || null,
            limit: req.body?.limit || req.query?.limit || null
        };

        const result = await runBirthdayEmails(options);
        res.status(200).json({
            status: "success",
            message: "Proceso de cumpleaños ejecutado exitosamente",
            data: result
        });
    } catch (error) {
        console.error("Error al ejecutar cron de cumpleaños vía endpoint:", error);
        res.status(500).json({
            status: "error",
            message: error.message || "Error al ejecutar el proceso de cumpleaños",
            error: error
        });
    }
});

router.get('/cron/birthday-logs', async function (req, res, next) {
    try {
        const year = req.query.year ? parseInt(req.query.year, 10) : null;
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
        const logs = await usersModel.getBirthdayEmailLogs({ year, limit });
        res.status(200).json({
            status: "success",
            data: logs
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message || "Error al obtener historial de correos de cumpleaños",
            error: error
        });
    }
});

/**
 * Webhook de sincronización recibido desde api-users
 * Actualiza los datos del usuario localmente en retos.users
 */
router.post('/sync-profile', async function (req, res, next) {
    try {
        const expectedSecret = process.env.WEBHOOK_SECRET || 'Clickear.2026';
        const incomingSecret = req.headers['x-webhook-secret'];
        if (expectedSecret && incomingSecret && incomingSecret !== expectedSecret) {
            return res.status(403).send({ status: 'error', message: 'Firma o secreto inválido' });
        }

        const { geekUserId, data } = req.body;
        if (!geekUserId || !data) {
            return res.status(400).send({ status: 'error', message: 'Payload de sincronización incompleto' });
        }

        const dbConn = require('../config/database.js').promise();

        // 1. Verificar si el usuario existe en retos.users por geek_user_id o por email
        const [existing] = await dbConn.query(
            `SELECT user_id FROM users WHERE geek_user_id = ? OR (email IS NOT NULL AND LOWER(TRIM(email)) = ?) LIMIT 1`,
            [geekUserId, (data.email || '').toLowerCase().trim()]
        );

        if (existing && existing.length > 0) {
            const localUserId = existing[0].user_id;

            const fields = [];
            const values = [];

            if (data.first_name !== undefined) { fields.push('first_name = ?'); values.push(data.first_name); }
            if (data.middle_name !== undefined) { fields.push('middle_name = ?'); values.push(data.middle_name); }
            if (data.last_name !== undefined) { fields.push('last_name = ?'); values.push(data.last_name); }
            if (data.second_last_name !== undefined) { fields.push('second_last_name = ?'); values.push(data.second_last_name); }
            if (data.email) { fields.push('email = ?'); values.push(data.email); }
            if (data.username) { fields.push('username = ?'); values.push(data.username); }
            if (data.nickname !== undefined) { fields.push('nickname = ?'); values.push(data.nickname); }
            if (data.document_type_id !== undefined) { fields.push('document_type_id = ?'); values.push(data.document_type_id); }
            if (data.document_id !== undefined) { fields.push('document_id = ?'); values.push(data.document_id); }
            if (data.birthday) { fields.push('birthday = ?'); values.push(data.birthday); }
            if (data.gender_id !== undefined) { fields.push('gender_id = ?'); values.push(data.gender_id); }
            if (data.blood_type_id !== undefined) { fields.push('blood_type_id = ?'); values.push(data.blood_type_id); }
            if (data.country_phone_code !== undefined) { fields.push('country_phone_code = ?'); values.push(data.country_phone_code); }
            if (data.phone_number !== undefined) { fields.push('phone_number = ?'); values.push(data.phone_number); }
            if (data.country_emergency_phone_code !== undefined) { fields.push('country_emergency_phone_code = ?'); values.push(data.country_emergency_phone_code); }
            if (data.emergency_phone_number !== undefined) { fields.push('emergency_phone_number = ?'); values.push(data.emergency_phone_number); }
            if (data.medical_condition !== undefined) { fields.push('medical_condition = ?'); values.push(data.medical_condition); }
            if (data.region_id !== undefined) { fields.push('region_id = ?'); values.push(data.region_id); }
            if (data.locality !== undefined) { fields.push('locality = ?'); values.push(data.locality); }
            if (data.avatar) { fields.push('avatar = ?'); values.push(data.avatar); }
            if (geekUserId) { fields.push('geek_user_id = ?'); values.push(geekUserId); }

            if (fields.length > 0) {
                values.push(localUserId);
                await dbConn.query(`UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`, values);
            }

            console.log(`[WEBHOOK SYNC RETOS] Usuario actualizado localmente: user_id ${localUserId} (${geekUserId})`);
            return res.send({ status: 'success', message: 'Usuario sincronizado exitosamente en retos' });
        } else {
            console.log(`[WEBHOOK SYNC RETOS] Usuario ${geekUserId} aún no registrado en retos (ignorado).`);
            return res.send({ status: 'ignored', message: 'Usuario no registrado en retos' });
        }
    } catch (error) {
        console.error('[WEBHOOK SYNC RETOS ERROR]:', error);
        return res.status(500).send({ status: 'error', message: error.message });
    }
});

module.exports = router;
