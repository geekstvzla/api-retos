require('dotenv').config();
let db = require('../config/database.js');

const activeProducts = (params) => {
    return new Promise(function (resolve, reject) {
        let langCode = (params && params.length > 0) ? params[0] : null;
        let whereClause = `WHERE pc.status_id = 1`;
        let queryParams = [];

        if (langCode) {
            whereClause += ` AND (pc.language_code IS NULL OR UPPER(pc.language_code) = UPPER(?))`;
            queryParams.push(langCode);
        }

        let queryString = `SELECT pc.product_id,
                                  pc.product_category_id,
                                  pc.category_name,
                                  pc.category_slug,
                                  pc.category_description,
                                  pc.language_code,
                                  pc.title,
                                  pc.short_description,
                                  pc.description,
                                  pc.slug,
                                  pc.sku,
                                  pc.price,
                                  pc.stock,
                                  CONCAT('${process.env.API_PUBLIC || ''}/images/products/', pc.featured_image) AS featured_image,
                                  pc.status_id,
                                  pc.created_at
                           FROM vw_product_cards pc
                           ${whereClause}
                           ORDER BY pc.created_at DESC;`;

        db.query(queryString, queryParams, function (err, result) {
            if (err) {
                reject({
                    response: {
                        message: "Error al consultar los productos",
                        status: "error",
                        statusCode: 0,
                        error: err.message || err
                    }
                });
            } else {
                resolve({
                    response: {
                        products: result,
                        status: "success",
                        statusCode: 1
                    }
                });
            }
        });
    }).catch(function (error) {
        return error;
    });
};

const getProductBySlug = (params) => {
    return new Promise(function (resolve, reject) {
        let slug = params && params[0] ? params[0] : null;
        let langCode = params && params[1] ? params[1] : null;

        let whereClause = `WHERE pc.slug = ? AND pc.status_id = 1`;
        let queryParams = [slug];

        if (langCode) {
            whereClause += ` AND (pc.language_code IS NULL OR UPPER(pc.language_code) = UPPER(?))`;
            queryParams.push(langCode);
        }

        let queryString = `SELECT pc.product_id,
                                  pc.product_category_id,
                                  pc.category_name,
                                  pc.category_slug,
                                  pc.category_description,
                                  pc.language_code,
                                  pc.title,
                                  pc.short_description,
                                  pc.description,
                                  pc.slug,
                                  pc.sku,
                                  pc.price,
                                  pc.stock,
                                  CONCAT('${process.env.API_PUBLIC || ''}/images/products/', pc.featured_image) AS featured_image,
                                  pc.status_id,
                                  pc.created_at
                           FROM vw_product_cards pc
                           ${whereClause}
                           LIMIT 1;`;

        db.query(queryString, queryParams, function (err, result) {
            if (err) {
                reject({
                    response: {
                        message: "Error al buscar el producto por slug",
                        status: "error",
                        statusCode: 0
                    }
                });
            } else if (result.length === 0) {
                resolve({
                    response: {
                        product: null,
                        message: "Producto no encontrado",
                        status: "warning",
                        statusCode: 0
                    }
                });
            } else {
                let product = result[0];
                let imagesQuery = `SELECT product_image_id,
                                          CONCAT('${process.env.API_PUBLIC || ''}/images/products/', image_url) AS image_url,
                                          display_order
                                   FROM product_images
                                   WHERE product_id = ? AND status_id = 1
                                   ORDER BY display_order ASC;`;

                db.query(imagesQuery, [product.product_id], function (imgErr, imgResult) {
                    product.gallery = imgErr ? [] : imgResult;

                    let currenciesQuery = `SELECT c.currency_id,
                                                  c.description AS currency_desc,
                                                  c.symbol AS currency_symbol,
                                                  pc.default AS is_default
                                           FROM product_currencies pc
                                           INNER JOIN currencies c ON c.currency_id = pc.currency_id
                                           WHERE pc.product_id = ? AND pc.status_id = 1
                                           ORDER BY pc.default DESC, c.description ASC;`;

                    db.query(currenciesQuery, [product.product_id], function (currErr, currResult) {
                        product.currencies = currErr ? [] : currResult;
                        resolve({
                            response: {
                                product: product,
                                status: "success",
                                statusCode: 1
                            }
                        });
                    });
                });
            }
        });
    }).catch(function (error) {
        return error;
    });
};

const createOrder = (orderData) => {
    return new Promise(function (resolve, reject) {
        const { userId, totalAmount, currencyId, items } = orderData;

        let insertOrderSql = `INSERT INTO product_orders (user_id, total_amount, currency_id, status_id)
                             VALUES (?, ?, ?, 1)`;

        db.query(insertOrderSql, [userId, totalAmount, currencyId], function (err, result) {
            if (err) {
                return reject({
                    response: {
                        message: "Error al registrar la orden de compra",
                        status: "error",
                        statusCode: 0,
                        error: err.message || err
                    }
                });
            }

            const orderId = result.insertId;

            if (!items || items.length === 0) {
                return resolve({
                    response: {
                        orderId: orderId,
                        message: "Orden creada sin items",
                        status: "success",
                        statusCode: 1
                    }
                });
            }

            const itemValues = items.map(item => [
                orderId,
                item.productId,
                item.quantity,
                item.unitPrice,
                item.subtotal
            ]);

            let insertItemsSql = `INSERT INTO product_order_items (product_order_id, product_id, quantity, unit_price, subtotal)
                                  VALUES ?`;

            db.query(insertItemsSql, [itemValues], function (itemsErr) {
                if (itemsErr) {
                    return reject({
                        response: {
                            message: "Error al guardar el detalle de los productos de la orden",
                            status: "error",
                            statusCode: 0,
                            error: itemsErr.message || itemsErr
                        }
                    });
                }

                resolve({
                    response: {
                        orderId: orderId,
                        message: "Orden creada exitosamente",
                        status: "success",
                        statusCode: 1
                    }
                });
            });
        });
    }).catch(function (error) {
        return error;
    });
};

const reportOrderPayment = (paymentData) => {
    return new Promise(function (resolve, reject) {
        const { orderId, paymentDate, operationNumber, voucherFile, statusId } = paymentData;

        let updateSql = `UPDATE product_orders
                         SET payment_date = ?,
                             operation_number = ?,
                             voucher_file = ?,
                             status_id = ?
                         WHERE product_order_id = ?`;

        db.query(updateSql, [paymentDate, operationNumber, voucherFile, statusId || 2, orderId], function (err, result) {
            if (err) {
                reject({
                    response: {
                        message: "Error al actualizar el pago reportado de la orden",
                        status: "error",
                        statusCode: 0
                    }
                });
            } else {
                resolve({
                    response: {
                        message: "Reporte de pago guardado correctamente",
                        status: "success",
                        statusCode: 1
                    }
                });
            }
        });
    }).catch(function (error) {
        return error;
    });
};

const getProductsByEventEdition = (params) => {
    return new Promise(function (resolve, reject) {
        let eventEditionId = params && params[0] ? params[0] : null;
        let langCode = params && params[1] ? params[1] : null;

        if (!eventEditionId) {
            return reject({
                response: {
                    message: "ID de edición de evento requerido",
                    status: "error",
                    statusCode: 0
                }
            });
        }

        let whereClause = `WHERE eep.event_edition_id = ? AND eep.status_id = 1 AND pc.status_id = 1`;
        let queryParams = [eventEditionId];

        if (langCode) {
            whereClause += ` AND (pc.language_code IS NULL OR UPPER(pc.language_code) = UPPER(?))`;
            queryParams.push(langCode);
        }

        let queryString = `SELECT eep.event_edition_product_id,
                                  eep.event_edition_id,
                                  eep.display_order,
                                  eep.is_featured,
                                  eep.custom_price,
                                  COALESCE(eep.custom_price, pc.price) AS effective_price,
                                  pc.product_id,
                                  pc.product_category_id,
                                  pc.category_name,
                                  pc.category_slug,
                                  pc.title,
                                  pc.short_description,
                                  pc.description,
                                  pc.slug,
                                  pc.sku,
                                  pc.price AS catalog_price,
                                  pc.stock,
                                  CONCAT('${process.env.API_PUBLIC || ''}/images/products/', pc.featured_image) AS featured_image,
                                  pc.status_id,
                                  pc.created_at
                           FROM event_edition_products eep
                           INNER JOIN vw_product_cards pc ON pc.product_id = eep.product_id
                           ${whereClause}
                           ORDER BY eep.display_order ASC, eep.created_at DESC;`;

        db.query(queryString, queryParams, function (err, result) {
            if (err) {
                reject({
                    response: {
                        message: "Error al obtener productos de la edición del evento",
                        status: "error",
                        statusCode: 0,
                        error: err.message || err
                    }
                });
            } else {
                resolve({
                    response: {
                        products: result,
                        status: "success",
                        statusCode: 1
                    }
                });
            }
        });
    }).catch(function (error) {
        return error;
    });
};

const assignProductToEventEdition = (data) => {
    return new Promise(function (resolve, reject) {
        const { eventEditionId, productId, customPrice, displayOrder, isFeatured } = data;

        if (!eventEditionId || !productId) {
            return reject({
                response: {
                    message: "ID de edición de evento y ID de producto son requeridos",
                    status: "error",
                    statusCode: 0
                }
            });
        }

        let sql = `INSERT INTO event_edition_products 
                   (event_edition_id, product_id, custom_price, display_order, is_featured, status_id)
                   VALUES (?, ?, ?, ?, ?, 1)
                   ON DUPLICATE KEY UPDATE 
                       custom_price = VALUES(custom_price),
                       display_order = VALUES(display_order),
                       is_featured = VALUES(is_featured),
                       status_id = 1;`;

        let queryParams = [
            eventEditionId,
            productId,
            customPrice || null,
            displayOrder || 0,
            isFeatured ? 1 : 0
        ];

        db.query(sql, queryParams, function (err, result) {
            if (err) {
                reject({
                    response: {
                        message: "Error al enlazar producto a la edición de evento",
                        status: "error",
                        statusCode: 0,
                        error: err.message || err
                    }
                });
            } else {
                resolve({
                    response: {
                        message: "Producto enlazado exitosamente a la edición del evento",
                        status: "success",
                        statusCode: 1
                    }
                });
            }
        });
    }).catch(function (error) {
        return error;
    });
};

const removeProductFromEventEdition = (params) => {
    return new Promise(function (resolve, reject) {
        let eventEditionId = params && params[0] ? params[0] : null;
        let productId = params && params[1] ? params[1] : null;

        if (!eventEditionId || !productId) {
            return reject({
                response: {
                    message: "IDs de edición de evento y producto son requeridos",
                    status: "error",
                    statusCode: 0
                }
            });
        }

        let sql = `UPDATE event_edition_products SET status_id = 0 WHERE event_edition_id = ? AND product_id = ?`;

        db.query(sql, [eventEditionId, productId], function (err, result) {
            if (err) {
                reject({
                    response: {
                        message: "Error al desvincular el producto de la edición de evento",
                        status: "error",
                        statusCode: 0
                    }
                });
            } else {
                resolve({
                    response: {
                        message: "Producto desvinculado exitosamente",
                        status: "success",
                        statusCode: 1
                    }
                });
            }
        });
    }).catch(function (error) {
        return error;
    });
};

module.exports = {
    activeProducts,
    getProductBySlug,
    createOrder,
    reportOrderPayment,
    getProductsByEventEdition,
    assignProductToEventEdition,
    removeProductFromEventEdition
};

