CREATE VIEW vw_event_cards AS
SELECT e.event_id,
       e.title,
       e.banner_image,
       e.featured_image,
       e.departure_date,
       e.departure_place_name,
       e.departure_place_url_map,
       ee.event_edition_id,
       ee.description AS event_edition
FROM events e
INNER JOIN event_edition ee ON ee.event_id = e.event_id
WHERE ee.status_id = 1;