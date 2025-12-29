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

router.get('/event-data-for-storage', async function(req, res, next)
{

    let langId = req.query.langId;
    let slug = req.query.slug;
    const langData = langs(langId);

    let params = [slug, langId];
    let data = await eventsModel.eventDataForStorage(params);
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

router.get('/event-edition-paymethods', async function(req, res, next)
{

    let eventEditionId = req.query.eventEditionId;
    let langId = req.query.langId;
    const langData = langs(langId);

    let params = [langId, eventEditionId];
    let data = await eventsModel.eventEditionPaymethods(params);
    res.send(data);

});

router.get('/event-edition-paymethod-detail', async function(req, res, next)
{

    let eventEditionId = req.query.eventEditionId;
    let langId = req.query.langId;
    const langData = langs(langId);
    let paymentMethodId = req.query.paymentMethodId;

    let params = [eventEditionId, langId, paymentMethodId];
    let data = await eventsModel.eventEditionPaymethodDetail(params);
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

router.get('/kit-items-exchange', async function(req, res, next)
{

    let kitId = req.query.kitId;
    let langId = req.query.langId;
    const langData = langs(langId);

    let params = [kitId, langId];
    let data = await eventsModel.kitItemsExchange(params);
    res.send(data);

});

module.exports = router;
