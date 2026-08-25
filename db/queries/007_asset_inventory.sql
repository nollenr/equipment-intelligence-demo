-- Live monitored-asset inventory. Sorting and filtering are applied in the UI for this small demo corpus.
WITH ranked_events AS (
  SELECT
    f.equipment_id,
    f.id AS fault_event_id,
    f.fault_code,
    f.fault_name,
    f.event_status,
    f.event_time,
    row_number() OVER (
      PARTITION BY f.equipment_id
      ORDER BY
        CASE f.event_status
          WHEN 'active' THEN 0
          WHEN 'acknowledged' THEN 1
          ELSE 2
        END,
        f.event_time DESC,
        f.id
    ) AS event_rank
  FROM nextera.equipment_fault_events AS f
)
SELECT
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
  p.id AS plant_id,
  p.plant_code,
  p.display_name AS plant_name,
  p.state_code,
  re.fault_event_id,
  re.fault_code,
  re.fault_name,
  re.event_status,
  re.event_time
FROM nextera.equipment AS e
JOIN nextera.plants AS p
  ON p.id = e.plant_id
LEFT JOIN ranked_events AS re
  ON re.equipment_id = e.id
  AND re.event_rank = 1
ORDER BY
  CASE WHEN p.plant_code = 'FPL-MANATEE-SOLAR' THEN 0 ELSE 1 END,
  p.display_name,
  e.equipment_type,
  e.equipment_code;
