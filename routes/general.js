var express = require('express')
var router = express.Router()
var generalModel = require('../models/general.js')
require('dotenv').config()

router.get('/active-currencies', async function(req, res, next)
{

    let data = await generalModel.activeCurrencies()
    res.send(data);

});

router.get('/countries', async function(req, res, next)
{

    let data = await generalModel.countries()
    res.send(data);

});

router.get('/country-regions', async function(req, res, next)
{

    let countryId = req.query.countryId;
    let langId = req.query.langId;
    let level = req.query.level;
    let parentRegionId = req.query.parentRegionId;
    let params = [countryId, level, parentRegionId];

    let data = await generalModel.countryRegions(params);
    res.send(data);

});


module.exports = router;
