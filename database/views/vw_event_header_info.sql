CREATE OR REPLACE VIEW vw_event_header_info AS
SELECT e.event_id,
       e.title,
       e.featured_image,
       e.banner_image,
       e.short_description,
       ee.departure_date,
       ee.departure_place_name,
       ee.departure_place_url_map,
       ee.enrollment_start_date,
       ee.enrollment_end_date,
       ee.arrival_place_name,
       ee.event_edition_id,
       ee.description AS event_edition,
       ee.distances AS event_distances
FROM events e
INNER JOIN event_edition ee ON ee.event_id = e.event_id
WHERE ee.status_id = 1;