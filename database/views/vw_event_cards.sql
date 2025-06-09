CREATE VIEW vw_event_cards AS
SELECT e.event_id,
       e.title,
       e.featured_image,
       e.departure_date,
       e.departure_place_name,
       e.departure_place_url_map,
       e.departure_place_url_map
FROM events e;