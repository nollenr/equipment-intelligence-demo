SELECT
  (SELECT count(*) FROM nextera.plants) AS facility_count,
  (SELECT count(*) FROM nextera.equipment) AS monitored_asset_count,
  (
    SELECT count(*)
    FROM nextera.equipment
    WHERE operating_status <> 'normal'
  ) AS assets_on_watch_count,
  (
    SELECT count(*)
    FROM nextera.equipment_fault_events
    WHERE event_status IN ('active', 'acknowledged')
  ) AS open_incident_count;
