WITH incident_rollup AS (
  SELECT
    equipment_id,
    count(*) FILTER (WHERE event_status IN ('active', 'acknowledged')) AS open_incident_count,
    max(event_time) AS latest_event_time
  FROM nextera.equipment_fault_events
  GROUP BY equipment_id
)
SELECT
  p.id AS plant_id,
  p.plant_code,
  p.display_name AS plant_name,
  p.state_code,
  p.timezone_name,
  count(e.id) AS asset_count,
  count(e.id) FILTER (WHERE e.operating_status = 'normal') AS normal_asset_count,
  count(e.id) FILTER (WHERE e.operating_status <> 'normal') AS watch_asset_count,
  coalesce(sum(ir.open_incident_count), 0) AS open_incident_count,
  max(ir.latest_event_time) AS latest_event_time
FROM nextera.plants AS p
LEFT JOIN nextera.equipment AS e ON e.plant_id = p.id
LEFT JOIN incident_rollup AS ir ON ir.equipment_id = e.id
GROUP BY p.id, p.plant_code, p.display_name, p.state_code, p.timezone_name
ORDER BY
  CASE WHEN p.plant_code = 'FPL-MANATEE-SOLAR' THEN 0 ELSE 1 END,
  open_incident_count DESC,
  watch_asset_count DESC,
  p.display_name;
