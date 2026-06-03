var express = require('express');
var router = express.Router();
var generalModel = require('../models/general.js');
const axios = require('axios');
require('dotenv').config();

router.get('/active-currencies', async function(req, res, next)
{

    let data = await generalModel.activeCurrencies();
    res.send(data);

});

router.get('/countries', async function(req, res, next)
{

    axios.get(process.env.API_GEEKST+'/general/countries', {})
    .then( async function (rs) {

        res.send(rs.data);

    })
    .catch(function (error) {

        console.log("<-- ERROR -->");
        console.log(error);
        res.send(error);

    });

});

router.get('/country-regions', async function(req, res, next)
{

    let countryId = req.query.countryId;
    let langId = req.query.langId;
    let level = req.query.level;
    let parentRegionId = req.query.parentRegionId;
    let params = {countryId: countryId, level: level, parentRegionId: parentRegionId};

    axios.get(process.env.API_GEEKST+'/general/country-regions', { params: params })
    .then( async function (rs) {
       
        res.send(rs.data);

    })
    .catch(function (error) {

        console.log("<-- ERROR -->");
        console.log(error);
        res.send(error);

    });

});


module.exports = router;
