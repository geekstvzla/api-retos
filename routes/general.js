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

router.put('/update-exchange-rate', async function(req, res, next)
{

    try {
        
        let response = await axios.get('https://rates.dolarvzla.com/bcv/current.json', { timeout: 10000 });
        let current = response.data && response.data.current ? response.data.current : null;

        if (!current || typeof current.usd !== 'number' || typeof current.eur !== 'number') {
            return res.status(500).send({
                response: {
                    message: 'Respuesta inválida de la API de tasas',
                    status: 'error',
                    statusCode: 0
                }
            });
        }

        let rates = {
            usd: Number(current.usd),
            eur: Number(current.eur)
        };

        let result = await generalModel.updateExchangeRate(rates);
        res.send(result);

    } catch (error) {
   
        res.status(500).send({
            response: {
                message: 'No se pudo actualizar la tasa de cambio',
                status: 'error',
                statusCode: 0,
                error: error.message || error
            }
        });

    }

});

module.exports = router;
