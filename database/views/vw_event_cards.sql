CREATE VIEW vw_event_cards AS
SELECT e.event_id,
       e.title,
       e.banner_image,
       e.featured_image,
       ee.departure_date,
       ee.departure_place_name,
       ee.departure_place_url_map,
       ee.event_edition_id,
       ee.description AS event_edition,
       e.slug AS event_slug
FROM events e
INNER JOIN event_edition ee ON ee.event_id = e.event_id
WHERE ee.status_id = 1;