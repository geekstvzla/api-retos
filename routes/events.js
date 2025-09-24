var express = require('express');
var router = express.Router();
var eventsModel = require('../models/events.js');
require('dotenv').config();

const langs = (lang) => {

    let langData = require('../langs/users/'+lang+'.json');
    return langData;

}

router.get('/active-events', async function(req, res, next) 
{

    let langId = req.query.langId;
    const langData = langs(langId);

    let params = [langId];
    let data = await eventsModel.activeEvents(params);
    res.send(data);

});

router.get('/event-additional-accessories', async function(req, res, next)
{

    let langId = req.query.langId;
    let eventEditionId = req.query.eventEditionId;
    const langData = langs(langId);

    let params = [eventEditionId, langId];
    let data = await eventsModel.eventAdditionalAccessories(params);
    res.send(data);

});

router.get('/event-detail', async function(req, res, next)
{

    let eventEditionId = req.query.eventEditionId;
    let eventId = req.query.eventId;
    let langId = req.query.langId;
    const langData = langs(langId);

    let params = [eventId, eventEditionId, langId];
    let data = await eventsModel.eventDetail(params);
    res.send(data);

});

router.get('/event-modalities', async function(req, res, next)
{

    let eventEditionId = req.query.eventEditionId;
    let eventId = req.query.eventId;
    let langId = req.query.langId;
    const langData = langs(langId);

    let params = [eventEditionId, langId];
    let data = await eventsModel.eventModalities(params);
    res.send(data);

});

router.get('/event-modality-kits', async function(req, res, next)
{

    let langId = req.query.langId;
    let typeEventModeId = req.query.typeEventModeId;
    const langData = langs(langId);

    let params = [typeEventModeId, langId];
    let data = await eventsModel.eventModalityKits(params);
    res.send(data);

});

router.get('/kit-items', async function(req, res, next)
{

    let langId = req.query.langId;
    let kitId = req.query.kitId;
    const langData = langs(langId);

    let params = [kitId];
    let data = await eventsModel.kitItems(params);
    res.send(data);

});

module.exports = router;
