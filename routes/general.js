var express = require('express')
var router = express.Router()
var generalModel = require('../models/general.js')
require('dotenv').config()

router.get('/active-currencies', async function(req, res, next)
{

    let data = await generalModel.activeCurrencies()
    res.send(data);

})

module.exports = router;
