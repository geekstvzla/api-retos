var express = require('express');
const fs = require('fs').promises;
const path = require('path');
var router = express.Router();
var mail = require('../models/emails.js');
var eventsModel = require('../models/events.js');
var productsModel = require('../models/products.js');
const axios = require('axios');
require('dotenv').config();

const langs = (lang) => {

    let langData = require('../langs/events/' + lang + '.json');
    return langData;

}

router.get('/active-events', async function (req, res, next) {

    let langId = req.query.langId;
    const langData = langs(langId);

    let params = [langId];
    let data = await eventsModel.activeEvents(params);
    res.send(data);

});

router.get('/check-point', async function (req, res, next) {

    let checkPointId = req.query.checkPointId;
    let eventEditionId = req.query.eventEditionId;
    let langId = req.query.langId;
    let userId = req.query.userId;
    const langData = langs(langId);

    let params = [eventEditionId, userId, checkPointId, langId];
    let data = await eventsModel.checkPoint(params);

    res.render('checkPoint', { name: data.fullname, documentId: data.document_id, enrollNumber: data.enroll_number, title: 'Checkpoint' });

});

router.get('/event-additional-accessories', async function (req, res, next) {

    let langId = req.query.langId;
    let eventEditionId = req.query.eventEditionId;
    const langData = langs(langId);

    let params = [eventEditionId, langId];
    let data = await eventsModel.eventAdditionalAccessories(params);
    res.send(data);

});

router.get('/event-data-for-storage', async function (req, res, next) {

    let langId = req.query.langId;
    let slug = req.query.slug;
    const langData = langs(langId);

    let params = [slug, langId];
    let data = await eventsModel.eventDataForStorage(params);
    res.send(data);

});

router.get('/event-detail', async function (req, res, next) {

    let eventEditionId = req.query.eventEditionId;
    let eventId = req.query.eventId;
    let langId = req.query.langId;
    const langData = langs(langId);

    let params = [eventId, eventEditionId, langId];
    let data = await eventsModel.eventDetail(params);
    res.send(data);

});

router.get('/event-edition-paymethods', async function (req, res, next) {

    let eventEditionId = req.query.eventEditionId;
    let langId = req.query.langId;
    const langData = langs(langId);

    let params = [langId, eventEditionId];
    let data = await eventsModel.eventEditionPaymethods(params);
    res.send(data);

});

router.get('/event-edition-paymethod-detail', async function (req, res, next) {

    let eventEditionId = req.query.eventEditionId;
    let langId = req.query.langId;
    const langData = langs(langId);
    let paymentMethodId = req.query.paymentMethodId;

    let params = [eventEditionId, langId, paymentMethodId];
    let data = await eventsModel.eventEditionPaymethodDetail(params);
    res.send(data);

});

router.get('/event-modalities', async function (req, res, next) {

    let eventEditionId = req.query.eventEditionId;
    let eventId = req.query.eventId;
    let langId = req.query.langId;
    const langData = langs(langId);

    let params = [eventEditionId, langId];
    let data = await eventsModel.eventModalities(params);
    res.send(data);

});

router.get('/event-modality-kits', async function (req, res, next) {

    let eventEditionId = req.query.eventEditionId;
    let langId = req.query.langId;
    let typeEventModeId = req.query.typeEventModeId;
    const langData = langs(langId);

    let params = [eventEditionId, typeEventModeId, langId];
    let data = await eventsModel.eventModalityKits(params);
    res.send(data);

});

router.get('/event-participants-list', async function (req, res, next) {

    let eventEditionId = req.query.eventEditionId;
    let eventEditionTypeId = parseInt(req.query.eventEditionTypeId);
    let langId = req.query.langId;
    let userId = req.query.userId;
    const langData = langs(langId);

    var checkPermission = await eventsModel.checkPermissionSeeParticipantsList([eventEditionId, userId, langId]);

    if (checkPermission.response.seeParticipants === 1) {

        if (eventEditionTypeId === 1) { // Evento pago

            let params = [eventEditionId, eventEditionId];
            var paginatedListing = await eventsModel.payEventParticipantsList(params); // Se pagina
            var noPaginatedListing = await eventsModel.payEventParticipantsList(params); // Sin paginar

        } else if (eventEditionTypeId === 3) { // Recuadación de fondos

            let params = [eventEditionId, eventEditionId];
            var paginatedListing = await eventsModel.donationEventParticipantsList(params); // Se pagina
            var noPaginatedListing = await eventsModel.donationEventParticipantsList(params); // Sin paginar

        }

        let accessories = await eventsModel.getEditionAccessoriesList(eventEditionId);
        let purchasedMap = await eventsModel.getEventEditionPurchasedAccessoriesMap(eventEditionId);

        const attachAccessoriesToParticipants = (list) => {

            return (list || []).map(p => {

                const pObj = { ...p };

                const enrolledAccMap = (p.enrolled_user_id && purchasedMap[`enrolled_${p.enrolled_user_id}`]) || {};
                const userAccMap = (p.enrolled_user_db_id && purchasedMap[`user_${p.enrolled_user_db_id}`]) || {};

                accessories.forEach(acc => {
                    const qtyEnrolled = enrolledAccMap[acc.product_id] || 0;
                    const qtyUser = userAccMap[acc.product_id] || 0;
                    pObj[acc.title] = qtyEnrolled + qtyUser;
                });

                return pObj;

            });

        };

        paginatedListing = attachAccessoriesToParticipants(paginatedListing);
        noPaginatedListing = attachAccessoriesToParticipants(noPaginatedListing);

        res.send({
            response: {
                accessories: accessories,
                paginatedListing: paginatedListing,
                noPaginatedListing: noPaginatedListing,
                status: "success",
                statusCode: 1
            }
        });

    } else {

        res.send({
            response: {
                message: "No tienes permisos para ver esta información",
                status: "error",
                statusCode: 1
            }
        });

    }

});

router.get('/kit-items', async function (req, res, next) {

    let langId = req.query.langId;
    let kitId = req.query.kitId;
    const langData = langs(langId);

    let params = [kitId, langId];
    let data = await eventsModel.kitItems(params);
    res.send(data);

});

router.get('/kit-items-exchange', async function (req, res, next) {

    let kitId = req.query.kitId;
    let langId = req.query.langId;
    const langData = langs(langId);

    let params = [kitId, langId];
    let data = await eventsModel.kitItemsExchange(params);
    res.send(data);

});

router.post('/user-enroll', async function (req, res, next) {

    let editionId = req.body.editionId;
    let kitAttrs = req.body.kitAttrs;
    let kitId = req.body.kitId;
    let langId = req.body.langId;
    let locality = req.body.locality;
    let modalityId = req.body.modalityId;
    let operationNumber = (req.body.operationNumber) ? req.body.operationNumber : '';
    let paymentDay = (req.body.paymentDay) ? req.body.paymentDay : '';
    let paymentMethodId = (req.body.paymentMethodId) ? req.body.paymentMethodId : '';
    let regionId = req.body.regionId;
    let userEmail = req.body.userEmail;
    let userId = req.body.userId;
    let userName = req.body.userName;
    let voucherFile = (req.files) ? req.files.voucherFile : '';
    let fileExt = (req.files) ? (voucherFile.name.split('.').at(-1)) : '';
    const langData = langs(langId);

    let selectedAccessories = [];
    if (req.body.selectedAccessories) {

        try {

            selectedAccessories = typeof req.body.selectedAccessories === 'string'
                ? JSON.parse(req.body.selectedAccessories)
                : req.body.selectedAccessories;

        } catch (e) {

            selectedAccessories = [];

        }

    }

    var params = [userId, editionId, kitId, modalityId, operationNumber, paymentDay, paymentMethodId, langId, kitAttrs, fileExt];

    let data = await eventsModel.userEnroll(params);
    if (data.response.status === "success") {

        if (selectedAccessories && selectedAccessories.length > 0) {

            const totalAccessoriesAmount = selectedAccessories.reduce((sum, acc) => {
                const itemPrice = parseFloat(acc.price !== undefined && acc.price !== null ? acc.price : (acc.unit_price || acc.unitPrice || 0));
                const itemQty = parseInt(acc.quantity || acc.qty || 1);
                const itemSubtotal = (acc.subtotal !== undefined && acc.subtotal !== null && !isNaN(parseFloat(acc.subtotal)))
                    ? parseFloat(acc.subtotal)
                    : itemPrice * itemQty;
                return sum + itemSubtotal;
            }, 0);

            let accessoryCurrencyId = selectedAccessories[0].currencyId || selectedAccessories[0].currency_id || selectedAccessories[0].default_currency_id || null;

            if (!accessoryCurrencyId) {
                const firstProductId = selectedAccessories[0].productId || selectedAccessories[0].product_id || selectedAccessories[0].id;
                if (firstProductId) {
                    accessoryCurrencyId = await productsModel.getProductDefaultCurrencyId(firstProductId);
                }
            }

            const orderData = {
                userId: userId,
                eventEditionId: editionId,
                eventEditionEnrolledUserId: data.response.enrollData ? data.response.enrollData.eventEditionEnrolledUserId : null,
                totalAmount: totalAccessoriesAmount,
                currencyId: accessoryCurrencyId || 1,
                operationNumber: operationNumber,
                paymentDate: paymentDay,
                voucherFile: data.response.enrollData ? data.response.enrollData.voucherName : '',
                items: selectedAccessories
            };

            try {

                await productsModel.createOrderFromEnrollment(orderData);

            } catch (orderErr) {

                console.log("Error al crear la orden de compra:", orderErr);

            }

            try {

                const productIds = selectedAccessories.map(acc => acc.productId || acc.product_id || acc.id).filter(Boolean);

                if (productIds.length > 0) {

                    const contactsInfo = await productsModel.getProductsSupplierContacts(productIds);

                    const supplierMap = {};
                    contactsInfo.forEach(row => {

                        if (!supplierMap[row.supplier_id]) {

                            supplierMap[row.supplier_id] = {
                                supplierName: row.supplier_name,
                                contacts: [],
                                items: []
                            };

                        }

                        if (row.contact_email && !supplierMap[row.supplier_id].contacts.some(c => c.email === row.contact_email)) {

                            supplierMap[row.supplier_id].contacts.push({
                                name: row.contact_name,
                                email: row.contact_email
                            });

                        }

                    });

                    selectedAccessories.forEach(acc => {

                        const pid = acc.productId || acc.product_id || acc.id;
                        const match = contactsInfo.find(c => Number(c.product_id) === Number(pid));

                        if (match && supplierMap[match.supplier_id]) {
                            supplierMap[match.supplier_id].items.push(acc);
                        }

                    });

                    for (const supplierId in supplierMap) {

                        const sGroup = supplierMap[supplierId];

                        if (sGroup.contacts.length > 0 && sGroup.items.length > 0) {

                            const supplierEmails = sGroup.contacts.map(c => c.email).join(', ');
                            await mail.supplierSaleNotification({
                                email: supplierEmails,
                                contactName: sGroup.contacts.map(c => c.name).join(', '),
                                supplierName: sGroup.supplierName,
                                userName: userName,
                                userEmail: userEmail,
                                enrollNumber: data.response.enrollData ? data.response.enrollData.enrollNumber : '',
                                eventTitle: data.response.enrollData ? data.response.enrollData.eventTitle : '',
                                items: sGroup.items,
                                langId: langId
                            });

                        }

                    }

                }

            } catch (supplierEmailErr) {

                console.log("Error al notificar a los proveedores:", supplierEmailErr);

            }
        }

        var toEmails = data.response.contacts.map(item => item.email).join(', ');
        var emailParams = {
            email: toEmails,
            enrollNumber: data.response.enrollData.enrollNumber,
            eventEdition: data.response.enrollData.eventEdition,
            eventTitle: data.response.enrollData.eventTitle,
            langId: langId,
            userName: userName,
            purchasedAccessories: selectedAccessories
        };

        if (voucherFile !== '') {

            emailParams.voucher = [{
                filename: data.response.enrollData.voucherName,
                content: voucherFile.data
            }];

        }

        var mailRs = await mail.newUserEnroll(emailParams);

        var emailParams = {
            contacts: data.response.contacts,
            email: userEmail,
            enrollNumber: data.response.enrollData.enrollNumber,
            eventEdition: data.response.enrollData.eventEdition,
            eventKit: data.response.enrollData.eventKit,
            eventModality: data.response.enrollData.eventModality,
            eventTitle: data.response.enrollData.eventTitle,
            eventWhatsappEnrolledGroup: data.response.eventWhatsappEnrolledGroup,
            kitItems: data.response.kitItems,
            langId: langId,
            userName: userName,
            purchasedAccessories: selectedAccessories
        };

        var mailRs = await mail.congratsForEnroll(emailParams);

        params = { locality: locality, regionId: regionId, userId: userId };
        axios.post(process.env.API_GEEKST + '/users/update-user-region', null, { params: params })
            .then(async function (rs) {

                //Logica si es necesario

            })
            .catch(function (error) {

                console.log(error);

                res.send(error);

            });

        data.response.message = langData.userEnroll.success;

    } else if (data.response.status === "warning") {

        data.response.message = langData.userEnroll.warning.alreadyEnrolled;

    } else {

        data.response.message = langData.userEnroll.error.other;

    }

    res.send({
        response: {
            message: data.response.message,
            status: data.response.status
        }
    });

});

router.get('/user-enrolled', async function (req, res, next) {

    let eventEditionId = req.query.eventEditionId;
    let langId = req.query.langId;
    let userId = req.query.userId;
    const langData = langs(langId);

    let params = [eventEditionId, userId, langId];
    let data = await eventsModel.userEnrolled(params);

    res.send(data);

});

router.get('/user-enrolled-qr-code', async function (req, res, next) {

    let eventEditionId = req.query.eventEditionId;
    let langId = req.query.langId;
    let enrollNumber = req.query.enrollNumber;
    const langData = langs(langId);

    let params = [eventEditionId, enrollNumber];
    let data = await eventsModel.userEnrolledQRCode(params);
    res.send(data);

});

module.exports = router;
