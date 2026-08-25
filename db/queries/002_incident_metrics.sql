SELECT
  m.metric_name,
  m.window_start,
  m.window_end,
  m.minimum_value,
  m.maximum_value,
  m.average_value,
  m.latest_value,
  m.unit,
  m.threshold_value,
  m.threshold_operator,
  CASE
    WHEN m.threshold_value IS NULL THEN NULL
    ELSE m.maximum_value - m.threshold_value
  END AS maximum_threshold_exceedance,
  m.diagnostic_version
FROM nextera.equipment_metric_summaries AS m
WHERE m.fault_event_id = '30000000-0000-4000-8000-000000000017'
ORDER BY m.metric_name;
