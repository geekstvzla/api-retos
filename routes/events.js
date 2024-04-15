var express = require('express')
var router = express.Router()
var encryption = require('../utils/encryption.js')
var mail = require('../models/emails.js')
var eventsModel = require('../models/events.js')
require('dotenv').config()

router.get('/active-events', async function(req, res, next) 
{

    let data = await eventsModel.activeEvents()
    res.send(data);

})

router.get('/event-data', async function(req, res, next) 
{

    let data = await eventsModel.eventData()
    res.send(data);

})

module.exports = router;
