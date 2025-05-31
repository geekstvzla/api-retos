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
           
            var message = langData.activateUserAccount.success.sendEmail;

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

    axios.get(process.env.API_GEEKST+'/users/get-access-code', { params: params})
    .then(async function (rs) {
       
        if(rs.data.response.statusCode === 0) {

            message = langData.accessCode.error.userDoesntExist;

        } else if(rs.data.response.statusCode === 1) {
           
            let emailParams = {accessCode: rs.data.response.accessCode, email: email, langId: langId};
            mail.userAccessCode(emailParams);

            message = langData.accessCode.success.sendEmail;

        } else if(rs.data.response.statusCode === 2) {

            message = langData.accessCode.warning.userInactive;

        } else if(rs.data.response.statusCode === 3) {

            let url = process.env.APP_URL+":"+process.env.APP_PORT+"/activate-user-account?userId="+rs.data.response.userId+"&langId="+langId;
            let emailParams = {url: url, email: email, langId: langId};
            mail.activateUserAccount(emailParams);

            message = langData.accessCode.warning.userPendingVerification;

        } else {

            message = rs.data.response.message;

        };

        res.send({
            message: message,
            status: rs.data.response.status,
            statusCode: rs.data.response.statusCode
        });

    })
    .catch(function (error) {

        console.log("<-- ERROR -->");
        console.log(error);
        res.send(error);

    });

});

router.post('/sign-in', async function(req, res, next) {

    let email = req.query.email;
    let langId = req.query.langId;
    let accessCode = req.query.accessCode;
    let params = {accessCode: accessCode, email: email};
    const langData = langs(langId);
    var message = "";

    axios.post(process.env.API_GEEKST+'/users/sign-in', null, { params: params})
    .then( async function (rs) {

        var userData = "";
        
        if(rs.data.response.statusCode === 1) {

            let signInParams = [rs.data.response.userId, langId];
            let data = await usersModel.signIn(signInParams);
            message = langData.signIn.success;
            userData = {
                avatar: rs.data.response.avatar,
                userId: rs.data.response.userId,
                username: rs.data.response.username
            };

        } else if(rs.data.response.statusCode === 2) {

            let emailParams = {accessCode: rs.data.response.accessCode, email: email, langId: langId};
            mail.userAccessCode(emailParams);

            message = langData.signIn.warning.accessCodeHasExpired;

        } else if(rs.data.response.statusCode === 3) {

            message = langData.signIn.error.accessCodeIsInvalid;

        } else if(rs.data.response.statusCode === 5) {

            let url = process.env.APP_URL+":"+process.env.APP_PORT+"/activate-user-account?userId="+rs.data.response.userId+"&langId="+langId;
            let emailParams = {url: url, email: email, langId: langId};
            mail.activateUserAccount(emailParams);

            message = langData.signIn.warning.userPendingVerification;

        }else if(rs.data.response.statusCode === 6) {

            message = langData.signIn.warning.userInactive;

        } else {

            message = langData.signIn.error.other;

        };

        res.send({
            message: message,
            status: rs.data.response.status,
            statusCode: rs.data.response.statusCode,
            userData: userData
        });

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

    axios.post(process.env.API_GEEKST+'/users/sign-up', null, { params: params})
    .then( async function (rs) {
  
        if(rs.data.response.statusCode === 1) {

            let url = process.env.APP_URL+":"+process.env.APP_PORT+"/activate-user-account?userId="+rs.data.response.userId+"&langId="+langId;
            let emailParams = {url: url, email: email, langId: langId};
            mail.newUserAccount(emailParams);

            message = langData.signUp.success;

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

})

module.exports = router;
