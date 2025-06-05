CREATE VIEW vw_event_cards AS
SELECT e.event_id,
       e.title,
       e.featured_image,
       e.departure_date,
       e.departure_place_name
FROM events e;