var express = require('express');
var router = express.Router();
var productsModel = require('../models/products.js');

/* GET active products catalog */
router.get('/active', async function (req, res, next) {
    let langCode = req.query.langCode || req.query.lang;
    let data = await productsModel.activeProducts(langCode ? [langCode] : []);
    res.send(data);
});

/* GET product detail by slug */
router.get('/detail/:slug', async function (req, res, next) {
    let slug = req.params.slug;
    let langCode = req.query.langCode || req.query.lang;
    let data = await productsModel.getProductBySlug([slug, langCode]);
    res.send(data);
});

/* POST create order */
router.post('/order', async function (req, res, next) {
    let orderData = req.body;
    let data = await productsModel.createOrder(orderData);
    res.send(data);
});

/* POST report payment for an order */
router.post('/report-payment', async function (req, res, next) {
    let paymentData = req.body;
    let data = await productsModel.reportOrderPayment(paymentData);
    res.send(data);
});

/* GET products associated with a specific event edition */
router.get('/event-edition/:eventEditionId?', async function (req, res, next) {

    let eventEditionId = req.params.eventEditionId || req.query.eventEditionId;
    let langCode = req.query.langCode || req.query.lang;

    let data = await productsModel.getProductsByEventEdition([eventEditionId, langCode]);
    res.send(data);

});

/* POST assign product to event edition */
router.post('/event-edition/assign', async function (req, res, next) {
    let assignData = req.body;
    let data = await productsModel.assignProductToEventEdition(assignData);
    res.send(data);
});

/* DELETE / POST remove product from event edition */
router.delete('/event-edition/remove', async function (req, res, next) {
    let eventEditionId = req.query.eventEditionId || req.body.eventEditionId;
    let productId = req.query.productId || req.body.productId;
    let data = await productsModel.removeProductFromEventEdition([eventEditionId, productId]);
    res.send(data);
});

module.exports = router;

