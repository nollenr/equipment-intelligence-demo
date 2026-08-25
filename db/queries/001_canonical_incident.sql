-- Application form uses bound parameters: plant code, equipment code, fault code.
SELECT
  p.plant_code,
  p.display_name AS plant_name,
  e.equipment_code,
  e.display_name AS equipment_name,
  e.model,
  e.firmware_version,
  e.operating_status,
  f.id AS fault_event_id,
  f.fault_code,
  f.fault_name,
  f.event_time,
  f.severity,
  f.event_status,
  f.operating_state_after,
  f.summary
FROM nextera.plants AS p
JOIN nextera.equipment AS e ON e.plant_id = p.id
JOIN nextera.equipment_fault_events AS f ON f.equipment_id = e.id
WHERE p.plant_code = 'FPL-MANATEE-SOLAR'
  AND e.equipment_code = 'INV-042'
  AND f.fault_code = 'B17'
ORDER BY f.event_time DESC
LIMIT 1;
