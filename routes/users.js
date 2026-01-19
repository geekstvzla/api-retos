var express = require('express');
var router = express.Router();
var mail = require('../models/emails.js');
var usersModel = require('../models/users.js');
const axios = require('axios');
require('dotenv').config();

const langs = (lang) => {

    let langData = require('../langs/users/'+lang+'.json');
    return langData;

}

router.post('/activate-user-account', async function(req, res, next) 
{

    let langId = req.query.langId;
    let userId = req.query.userId;
    let params = {userId: userId, langId: langId};
    const langData = langs(langId);

    axios.post(process.env.API_GEEKST+'/users/activate-user-account', null, { params: params})
    .then( async function (rs) {
      
        if(rs.data.response.statusCode === 0) {

            var message = langData.activateUserAccount.error.userDoesntExist;

        }else if(rs.data.response.statusCode === 1) {
           
            var message = langData.activateUserAccount.success;

        } else if(rs.data.response.statusCode === 2) {

            var message = langData.activateUserAccount.warning.activated;

        } else if(rs.data.response.statusCode === 3) {

            var message = langData.activateUserAccount.error.technicalSupport;

        } else {

            var message = rs.data.response.message;

        };

        res.send({
            message: message,
            name: rs.data.response.name,
            status: rs.data.response.status,
            statusCode: rs.data.response.statusCode
        });

    })
    .catch(function (error) {

        console.log("<-- ERROR -->");
        console.log(error);
        res.send(error);

    });
    

})

router.get('/check-username', async function(req, res, next) 
{

    let langId = req.query.langId;
    let username = req.query.username;
    let params = {username: username, langId: langId};

    axios.get(process.env.API_GEEKST+'/users/check-username', { params: params})
    .then( async function (rs) {
        
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

router.get('/get-access-code', async function(req, res, next) 
{

    let email = req.query.email;
    let langId = req.query.langId;
    let params = {email: email, langId: langId};
    const langData = langs(langId);
    var message = "";
    var status = "";
    var statusCode = 0;
res.send({"p": "hola"});
return;
    axios.get(process.env.API_GEEKST+'/users/get-access-code', { params: params})
    .then(async function (rs) {
        
        status = rs.data.response.status;
        statusCode = rs.data.response.statusCode;
       
        if(rs.data.response.statusCode === 0) {

            message = langData.accessCode.error.userDoesntExist;
            
        } else if(rs.data.response.statusCode === 1) {
           
            let emailParams = {accessCode: rs.data.response.accessCode, email: email, langId: langId};
            let mailRs = await mail.userAccessCode(emailParams);
            
            if(mailRs.statusCode === 4) {

                message = mailRs.message;
                status = mailRs.status;
                statusCode = mailRs.statusCode;

            } else {

                message = langData.accessCode.success.sendEmail;
                
            }            

        } else if(rs.data.response.statusCode === 2) {

            message = langData.accessCode.warning.userInactive;

        } else if(rs.data.response.statusCode === 3) {

            let url = process.env.APP_URL+":"+process.env.APP_PORT+"/activate-user-account?userId="+rs.data.response.userId+"&langId="+langId;
            let emailParams = {url: url, email: email, langId: langId};
            let mailRs = await mail.activateUserAccount(emailParams);

            if(mailRs.statusCode === 4) {

                message = mailRs.message;
                status = mailRs.status;
                statusCode = mailRs.statusCode;

            } else {

                message = langData.accessCode.warning.userPendingVerification;
                
            }

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

router.get('/get-blood-types', async function(req, res, next) 
{

    let langId = req.query.langId;
    let params = {langId: langId};
    const langData = langs(langId);
    var message = "";
   
    axios.get(process.env.API_GEEKST+'/users/get-blood-types', { params: params})
    .then(async function (rs) {
      
        if(rs.data.response.statusCode === 1) {

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

router.get('/get-countries-phone-codes', async function(req, res, next) 
{

    let langId = req.query.langId;
    let params = {langId: langId};
    const langData = langs(langId);
    var message = "";
   
    axios.get(process.env.API_GEEKST+'/users/get-countries-phone-codes', { params: params})
    .then(async function (rs) {
      
        if(rs.data.response.statusCode === 1) {

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

router.get('/get-document-types', async function(req, res, next) 
{

    let langId = req.query.langId;
    let params = {langId: langId};
    const langData = langs(langId);
    var message = "";
   
    axios.get(process.env.API_GEEKST+'/users/get-document-types', { params: params})
    .then(async function (rs) {
      
        if(rs.data.response.statusCode === 1) {

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

router.get('/get-gender-types', async function(req, res, next)
{

    let langId = req.query.langId;
    let params = {langId: langId};
    const langData = langs(langId);
    var message = "";
   
    axios.get(process.env.API_GEEKST+'/users/get-gender-types', { params: params})
    .then(async function (rs) {
      
        if(rs.data.response.statusCode === 1) {

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

router.get('/get-user-data', async function(req, res, next) 
{

    let userId = req.query.userId;
    let langId = req.query.langId;
    let params = {userId: userId, langId: langId};
    const langData = langs(langId);
    var message = "";
   
    axios.get(process.env.API_GEEKST+'/users/get-user-data', { params: params})
    .then(async function (rs) {
      
        if(rs.data.response.statusCode === 1) {

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

router.post('/sign-in', async function(req, res, next) {

    const email = req.query.email;
    let langId = req.query.langId;
    let accessCode = req.query.accessCode;
    let params = {accessCode: accessCode, email: email, langId: langId};
    const langData = langs(langId);
    var message = "";
    var status = "";
    var statusCode = 0;

    axios.post(process.env.API_GEEKST+'/users/sign-in', null, { params: params})
    .then( async function (rs) {

        status = rs.data.response.status;
        statusCode = rs.data.response.statusCode;

        if(rs.data.response.statusCode === 1) {

            let signInParams = [rs.data.response.userId, langId];
            let data = await usersModel.signIn(signInParams);
            message = langData.signIn.success;
            userData = {
                avatar: rs.data.response.avatar,
                email: email,
                id: rs.data.response.userId,
                name: rs.data.response.name,
                username: rs.data.response.username
            };

            res.send({
                message: message,
                status: rs.data.response.status,
                statusCode: rs.data.response.statusCode,
                userData: userData
            });

        } else { 
        
            if(rs.data.response.statusCode === 2) {

                let emailParams = {accessCode: rs.data.response.accessCode, email: email, langId: langId};
                let mailRs = await mail.userAccessCode(emailParams);

                if(mailRs.statusCode === 4) {

                    message = mailRs.message;
                    status = mailRs.status;
                    statusCode = mailRs.statusCode;

                } else {

                    message = langData.signIn.warning.accessCodeHasExpired;
                    
                }

            } else if(rs.data.response.statusCode === 3) {

                message = langData.signIn.error.accessCodeIsInvalid;

            } else if(rs.data.response.statusCode === 5) {

                let url = process.env.APP_URL+":"+process.env.APP_PORT+"/activate-user-account?userId="+rs.data.response.userId+"&langId="+langId;
                let emailParams = {url: url, email: email, langId: langId};
                let mailRs = await mail.activateUserAccount(emailParams);

                if(mailRs.statusCode === 4) {

                    message = mailRs.message;
                    status = mailRs.status;
                    statusCode = mailRs.statusCode;

                } else {

                    message = langData.signIn.warning.userPendingVerification;
                    
                }

            } else if(rs.data.response.statusCode === 6) {

                message = langData.signIn.warning.userInactive;

            } else {

                message = langData.signIn.error.other;

            };

            res.send({
                message: message,
                status: rs.data.response.status,
                statusCode: rs.data.response.statusCode
            });

        }

    })
    .catch(function (error) {
        console.log(error);

        res.send(error);

    });

});

router.post('/sign-up', async function(req, res, next) {

    let email = req.query.email;
    let langId = req.query.langId;
    let username = req.query.username;
    let params = {email: email, langId: langId, username: username};
    const langData = langs(langId);
    var message = "";
    var status = "";
    var statusCode = 0;

    axios.post(process.env.API_GEEKST+'/users/sign-up', null, { params: params})
    .then( async function (rs) {

        status = rs.data.response.status;
        statusCode = rs.data.response.statusCode;
  
        if(rs.data.response.statusCode === 1) {

            let url = process.env.APP_URL+":"+process.env.APP_PORT+"/activate-user-account?userId="+rs.data.response.userId+"&langId="+langId;
            let emailParams = {url: url, email: email, langId: langId};
            let mailRs = await mail.newUserAccount(emailParams);

            if(mailRs.statusCode === 4) {

                message = mailRs.message;
                status = mailRs.status;
                statusCode = mailRs.statusCode;

            } else {

                message = langData.signUp.success;
                
            }

        } else if(rs.data.response.statusCode === 2) {

            message = langData.signUp.error.alreadyRegisteredEmail;

        } else if(rs.data.response.statusCode === 3) {

            message = langData.signUp.warning.alreadyRegisteredUsername;

        } else {

            message = langData.signUp.error.other;

        };

        res.send({
            message: message,
            status: rs.data.response.status,
            statusCode: rs.data.response.statusCode
        });

    })
    .catch(function (error) {
        console.log(error);

        res.send(error);

    });

});

router.post('/update-user-data', async function(req, res, next) {

    const email = req.query.email;
    const langId = req.query.langId
 
    let params = {
        userId: req.query.userId, 
        firstName: req.query.firstName, 
        middleName: req.query.middleName,
        lastName: req.query.lastName,
        secondLastName: req.query.secondLastName,
        documentTypeId: req.query.documentTypeId,
        document: req.query.document,
        birthday: req.query.birthday,
        genderId: req.query.genderId,
        bloodTypeId: req.query.bloodTypeId,
        countryPhoneCode: req.query.countryPhoneCode,
        phoneNumber: req.query.phoneNumber,
        countryEmergencyPhoneCode: req.query.countryEmergencyPhoneCode,
        emergencyPhoneNumber: req.query.emergencyPhoneNumber,
        medicalCondition: req.query.medicalCondition,
        langId: langId
    };
    
    const langData = langs(langId);
    var message = "";
    var status = "";
    var statusCode = 0;

    axios.post(process.env.API_GEEKST+'/users/update-user-data', null, { params: params})
    .then( async function (rs) {

        status = rs.data.response.status;
        statusCode = rs.data.response.statusCode;

        if(rs.data.response.statusCode === 0) {

            message = langData.updateUserData.error.userDoesntExist;

        } else if(rs.data.response.statusCode === 1) {

            let emailParams = {email: email, langId: langId};
            let mailRs = await mail.updateUserData(emailParams);
         
            if(mailRs.statusCode === 4) {
              
                message = mailRs.message;
                status = mailRs.status;
                statusCode = mailRs.statusCode;

            } else {

                message = langData.updateUserData.success;
                
            }

        } else if(rs.data.response.statusCode === 2) {

            message = langData.updateUserData.error.userInactive;

        } else if(rs.data.response.statusCode === 3) {

            message = langData.updateUserData.error.pendingVerification;

        } else {

            message = langData.updateUserData.error.other;

        };

        res.send({
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

module.exports = router;
