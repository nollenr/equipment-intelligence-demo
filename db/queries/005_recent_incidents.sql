SELECT
  f.id AS fault_event_id,
  f.fault_code,
  f.fault_name,
  f.event_time,
  f.severity,
  f.event_status,
  f.summary,
  e.id AS equipment_id,
  e.equipment_code,
  e.display_name AS equipment_name,
  e.operating_status,
  p.id AS plant_id,
  p.plant_code,
  p.display_name AS plant_name
FROM nextera.equipment_fault_events AS f
JOIN nextera.equipment AS e ON e.id = f.equipment_id
JOIN nextera.plants AS p ON p.id = e.plant_id
ORDER BY
  CASE f.event_status
    WHEN 'active' THEN 0
    WHEN 'acknowledged' THEN 1
    ELSE 2
  END,
  f.event_time DESC,
  f.id
LIMIT 6;
