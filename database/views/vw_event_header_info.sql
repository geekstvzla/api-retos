CREATE VIEW vw_event_header_info AS
SELECT e.event_id,
       e.title,
       e.featured_image,
       e.banner_image,
       e.short_description,
       e.departure_date,
       e.departure_place_name,
       e.departure_place_url_map,
       e.enrollment_start_date,
       e.enrollment_end_date,
       e.arrival_place_name,
       ee.event_edition_id,
       ee.description AS event_edition,
       ee.distances AS event_distances,
       ee.includes AS event_includes
FROM events e
INNER JOIN event_edition ee ON ee.event_id = e.event_id;