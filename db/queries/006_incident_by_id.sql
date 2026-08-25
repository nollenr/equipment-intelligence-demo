SELECT
  p.id AS plant_id,
  p.plant_code,
  p.display_name AS plant_name,
  p.operator_name,
  p.state_code,
  p.timezone_name,
  e.id AS equipment_id,
  e.equipment_code,
  e.display_name AS equipment_name,
  e.equipment_type,
  e.manufacturer,
  e.model,
  e.serial_number,
  e.firmware_version,
  e.commissioned_on,
  e.operating_status,
  f.id AS fault_event_id,
  f.fault_code,
  f.fault_name,
  f.event_time,
  f.cleared_time,
  f.severity,
  f.event_status,
  f.operating_state_before,
  f.operating_state_after,
  f.source_system,
  f.source_event_id,
  f.summary
FROM nextera.equipment_fault_events AS f
JOIN nextera.equipment AS e ON e.id = f.equipment_id
JOIN nextera.plants AS p ON p.id = e.plant_id
WHERE f.id = '30000000-0000-4000-8000-000000000017'
LIMIT 1;
