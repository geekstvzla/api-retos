CREATE VIEW vw_orders AS 
SELECT o.order_id,
       o.user_id,
       u.username,
       o.code,
       o.order_type_id,
       ot.description AS order_type,
       o.product_id,
       p.name AS product,
       o.weighing_unit_id,
       wu.abbreviation AS weighing_unit_abb,
       o.amount AS product_amount,
       o.price,
       o.currency_id,
       c.description AS currency,
       c.symbol AS currency_symbol,
       o.latitude,
       o.longitude,
       o.created_date,
       o.status_id,
       (SELECT s.description FROM status s WHERE s.table = 'orders' AND s.value = o.status_id) AS status
FROM orders o 
INNER JOIN order_types ot ON ot.order_type_id = o.order_type_id
INNER JOIN products p ON p.product_id = o.product_id
INNER JOIN weighing_units wu ON wu.weighing_unit_id = o.weighing_unit_id
INNER JOIN currencies c ON c.currency_id = o.currency_id
INNER JOIN users u ON u.user_id = o.user_id;