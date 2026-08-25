-- The fleet-correlation history is synthetic. Facility names remain based on public information.
-- A mixed same-model population across sites makes the fleet analysis useful without implying
-- that these assets, events, or measurements exist in NextEra's actual fleet.
UPDATE nextera.equipment
SET
  manufacturer = 'Helios Power Systems (Synthetic)',
  model = 'HPS-2500X (Synthetic)',
  firmware_version = '4.2.7-syn'
WHERE (plant_id, equipment_code) IN (
  ('10000000-0000-4000-8000-000000000002'::UUID, 'INV-107'),
  ('10000000-0000-4000-8000-000000000002'::UUID, 'INV-111'),
  ('10000000-0000-4000-8000-000000000002'::UUID, 'INV-114'),
  ('10000000-0000-4000-8000-000000000003'::UUID, 'INV-205'),
  ('10000000-0000-4000-8000-000000000003'::UUID, 'INV-209')
);

WITH correlation_events (
  id,
  plant_id,
  equipment_code,
  event_time,
  cleared_time,
  source_event_id
) AS (
  VALUES
    ('31000000-0000-4000-8000-000000000001'::UUID, '10000000-0000-4000-8000-000000000002'::UUID, 'INV-107', '2026-08-12 19:06:00+00:00'::TIMESTAMPTZ, '2026-08-12 19:32:00+00:00'::TIMESTAMPTZ, 'SYN-BAB-INV107-20260812-B17'),
    ('31000000-0000-4000-8000-000000000002'::UUID, '10000000-0000-4000-8000-000000000001'::UUID, 'INV-039', '2026-08-11 18:21:00+00:00'::TIMESTAMPTZ, '2026-08-11 18:48:00+00:00'::TIMESTAMPTZ, 'SYN-MAN-INV039-20260811-B17'),
    ('31000000-0000-4000-8000-000000000003'::UUID, '10000000-0000-4000-8000-000000000003'::UUID, 'INV-205', '2026-08-09 19:14:00+00:00'::TIMESTAMPTZ, '2026-08-09 19:41:00+00:00'::TIMESTAMPTZ, 'SYN-CIT-INV205-20260809-B17'),
    ('31000000-0000-4000-8000-000000000004'::UUID, '10000000-0000-4000-8000-000000000001'::UUID, 'INV-041', '2026-08-07 18:55:00+00:00'::TIMESTAMPTZ, '2026-08-07 19:19:00+00:00'::TIMESTAMPTZ, 'SYN-MAN-INV041-20260807-B17'),
    ('31000000-0000-4000-8000-000000000005'::UUID, '10000000-0000-4000-8000-000000000002'::UUID, 'INV-111', '2026-08-03 19:32:00+00:00'::TIMESTAMPTZ, '2026-08-03 19:58:00+00:00'::TIMESTAMPTZ, 'SYN-BAB-INV111-20260803-B17'),
    ('31000000-0000-4000-8000-000000000006'::UUID, '10000000-0000-4000-8000-000000000001'::UUID, 'INV-034', '2026-07-29 18:47:00+00:00'::TIMESTAMPTZ, '2026-07-29 19:10:00+00:00'::TIMESTAMPTZ, 'SYN-MAN-INV034-20260729-B17'),
    ('31000000-0000-4000-8000-000000000007'::UUID, '10000000-0000-4000-8000-000000000003'::UUID, 'INV-209', '2026-07-24 19:03:00+00:00'::TIMESTAMPTZ, '2026-07-24 19:29:00+00:00'::TIMESTAMPTZ, 'SYN-CIT-INV209-20260724-B17'),
    ('31000000-0000-4000-8000-000000000008'::UUID, '10000000-0000-4000-8000-000000000002'::UUID, 'INV-114', '2026-07-20 18:38:00+00:00'::TIMESTAMPTZ, '2026-07-20 19:01:00+00:00'::TIMESTAMPTZ, 'SYN-BAB-INV114-20260720-B17')
)
INSERT INTO nextera.equipment_fault_events (
  id,
  equipment_id,
  fault_code,
  fault_name,
  event_time,
  cleared_time,
  severity,
  event_status,
  operating_state_before,
  operating_state_after,
  source_system,
  source_event_id,
  summary,
  is_synthetic
)
SELECT
  correlation_events.id,
  equipment.id,
  'B17',
  'Controller thermal derating',
  correlation_events.event_time,
  correlation_events.cleared_time,
  'warning',
  'cleared',
  'full_output',
  'derated',
  'synthetic_fleet_history_adapter',
  correlation_events.source_event_id,
  'Synthetic B17 event retained for the 30-day same-model fleet comparison.',
  true
FROM correlation_events
JOIN nextera.equipment AS equipment
  ON equipment.plant_id = correlation_events.plant_id
  AND equipment.equipment_code = correlation_events.equipment_code
ON CONFLICT (id) DO UPDATE SET
  equipment_id = excluded.equipment_id,
  fault_code = excluded.fault_code,
  fault_name = excluded.fault_name,
  event_time = excluded.event_time,
  cleared_time = excluded.cleared_time,
  severity = excluded.severity,
  event_status = excluded.event_status,
  operating_state_before = excluded.operating_state_before,
  operating_state_after = excluded.operating_state_after,
  source_system = excluded.source_system,
  source_event_id = excluded.source_event_id,
  summary = excluded.summary,
  is_synthetic = excluded.is_synthetic;

WITH metric_values (
  id,
  fault_event_id,
  metric_name,
  window_start,
  window_end,
  minimum_value,
  maximum_value,
  average_value,
  latest_value,
  unit,
  threshold_value,
  threshold_operator,
  source_system
) AS (
  VALUES
    ('42000000-0000-4000-8000-000000000001'::UUID, '31000000-0000-4000-8000-000000000001'::UUID, 'controller_temperature', '2026-08-12 19:01:00+00:00'::TIMESTAMPTZ, '2026-08-12 19:11:00+00:00'::TIMESTAMPTZ, 73.200000, 80.100000, 77.400000, 78.700000, 'degC', 75.000000, '>', 'synthetic_historian_adapter'),
    ('42000000-0000-4000-8000-000000000002'::UUID, '31000000-0000-4000-8000-000000000001'::UUID, 'ambient_air_temperature', '2026-08-12 19:01:00+00:00'::TIMESTAMPTZ, '2026-08-12 19:11:00+00:00'::TIMESTAMPTZ, 37.500000, 38.400000, 38.000000, 38.200000, 'degC', NULL, NULL, 'synthetic_weather_adapter'),
    ('42000000-0000-4000-8000-000000000003'::UUID, '31000000-0000-4000-8000-000000000002'::UUID, 'controller_temperature', '2026-08-11 18:16:00+00:00'::TIMESTAMPTZ, '2026-08-11 18:26:00+00:00'::TIMESTAMPTZ, 72.800000, 79.000000, 76.900000, 77.900000, 'degC', 75.000000, '>', 'synthetic_historian_adapter'),
    ('42000000-0000-4000-8000-000000000004'::UUID, '31000000-0000-4000-8000-000000000002'::UUID, 'ambient_air_temperature', '2026-08-11 18:16:00+00:00'::TIMESTAMPTZ, '2026-08-11 18:26:00+00:00'::TIMESTAMPTZ, 36.300000, 37.100000, 36.700000, 36.900000, 'degC', NULL, NULL, 'synthetic_weather_adapter'),
    ('42000000-0000-4000-8000-000000000005'::UUID, '31000000-0000-4000-8000-000000000003'::UUID, 'controller_temperature', '2026-08-09 19:09:00+00:00'::TIMESTAMPTZ, '2026-08-09 19:19:00+00:00'::TIMESTAMPTZ, 72.900000, 78.900000, 76.800000, 77.600000, 'degC', 75.000000, '>', 'synthetic_historian_adapter'),
    ('42000000-0000-4000-8000-000000000006'::UUID, '31000000-0000-4000-8000-000000000003'::UUID, 'ambient_air_temperature', '2026-08-09 19:09:00+00:00'::TIMESTAMPTZ, '2026-08-09 19:19:00+00:00'::TIMESTAMPTZ, 36.700000, 37.500000, 37.100000, 37.300000, 'degC', NULL, NULL, 'synthetic_weather_adapter'),
    ('42000000-0000-4000-8000-000000000007'::UUID, '31000000-0000-4000-8000-000000000004'::UUID, 'controller_temperature', '2026-08-07 18:50:00+00:00'::TIMESTAMPTZ, '2026-08-07 19:00:00+00:00'::TIMESTAMPTZ, 72.400000, 77.900000, 76.200000, 77.100000, 'degC', 75.000000, '>', 'synthetic_historian_adapter'),
    ('42000000-0000-4000-8000-000000000008'::UUID, '31000000-0000-4000-8000-000000000004'::UUID, 'ambient_air_temperature', '2026-08-07 18:50:00+00:00'::TIMESTAMPTZ, '2026-08-07 19:00:00+00:00'::TIMESTAMPTZ, 35.500000, 36.200000, 35.900000, 36.000000, 'degC', NULL, NULL, 'synthetic_weather_adapter'),
    ('42000000-0000-4000-8000-000000000009'::UUID, '31000000-0000-4000-8000-000000000005'::UUID, 'controller_temperature', '2026-08-03 19:27:00+00:00'::TIMESTAMPTZ, '2026-08-03 19:37:00+00:00'::TIMESTAMPTZ, 72.300000, 77.600000, 76.000000, 76.900000, 'degC', 75.000000, '>', 'synthetic_historian_adapter'),
    ('42000000-0000-4000-8000-000000000010'::UUID, '31000000-0000-4000-8000-000000000005'::UUID, 'ambient_air_temperature', '2026-08-03 19:27:00+00:00'::TIMESTAMPTZ, '2026-08-03 19:37:00+00:00'::TIMESTAMPTZ, 34.900000, 35.600000, 35.300000, 35.400000, 'degC', NULL, NULL, 'synthetic_weather_adapter'),
    ('42000000-0000-4000-8000-000000000011'::UUID, '31000000-0000-4000-8000-000000000006'::UUID, 'controller_temperature', '2026-07-29 18:42:00+00:00'::TIMESTAMPTZ, '2026-07-29 18:52:00+00:00'::TIMESTAMPTZ, 71.900000, 76.200000, 74.900000, 75.700000, 'degC', 75.000000, '>', 'synthetic_historian_adapter'),
    ('42000000-0000-4000-8000-000000000012'::UUID, '31000000-0000-4000-8000-000000000006'::UUID, 'ambient_air_temperature', '2026-07-29 18:42:00+00:00'::TIMESTAMPTZ, '2026-07-29 18:52:00+00:00'::TIMESTAMPTZ, 33.400000, 34.100000, 33.800000, 34.000000, 'degC', NULL, NULL, 'synthetic_weather_adapter'),
    ('42000000-0000-4000-8000-000000000013'::UUID, '31000000-0000-4000-8000-000000000007'::UUID, 'controller_temperature', '2026-07-24 18:58:00+00:00'::TIMESTAMPTZ, '2026-07-24 19:08:00+00:00'::TIMESTAMPTZ, 72.000000, 77.200000, 75.700000, 76.500000, 'degC', 75.000000, '>', 'synthetic_historian_adapter'),
    ('42000000-0000-4000-8000-000000000014'::UUID, '31000000-0000-4000-8000-000000000007'::UUID, 'ambient_air_temperature', '2026-07-24 18:58:00+00:00'::TIMESTAMPTZ, '2026-07-24 19:08:00+00:00'::TIMESTAMPTZ, 34.500000, 35.200000, 34.900000, 35.100000, 'degC', NULL, NULL, 'synthetic_weather_adapter'),
    ('42000000-0000-4000-8000-000000000015'::UUID, '31000000-0000-4000-8000-000000000008'::UUID, 'controller_temperature', '2026-07-20 18:33:00+00:00'::TIMESTAMPTZ, '2026-07-20 18:43:00+00:00'::TIMESTAMPTZ, 71.600000, 75.800000, 74.500000, 75.300000, 'degC', 75.000000, '>', 'synthetic_historian_adapter'),
    ('42000000-0000-4000-8000-000000000016'::UUID, '31000000-0000-4000-8000-000000000008'::UUID, 'ambient_air_temperature', '2026-07-20 18:33:00+00:00'::TIMESTAMPTZ, '2026-07-20 18:43:00+00:00'::TIMESTAMPTZ, 32.100000, 32.800000, 32.500000, 32.700000, 'degC', NULL, NULL, 'synthetic_weather_adapter')
)
INSERT INTO nextera.equipment_metric_summaries (
  id,
  equipment_id,
  fault_event_id,
  metric_name,
  window_start,
  window_end,
  minimum_value,
  maximum_value,
  average_value,
  latest_value,
  unit,
  threshold_value,
  threshold_operator,
  aggregation_method,
  source_system,
  diagnostic_version,
  calculated_at,
  is_synthetic
)
SELECT
  metric_values.id,
  fault_event.equipment_id,
  metric_values.fault_event_id,
  metric_values.metric_name,
  metric_values.window_start,
  metric_values.window_end,
  metric_values.minimum_value,
  metric_values.maximum_value,
  metric_values.average_value,
  metric_values.latest_value,
  metric_values.unit,
  metric_values.threshold_value,
  metric_values.threshold_operator,
  'ten_minute_window',
  metric_values.source_system,
  'fleet-correlation-window-v1',
  metric_values.window_end + INTERVAL '5 seconds',
  true
FROM metric_values
JOIN nextera.equipment_fault_events AS fault_event
  ON fault_event.id = metric_values.fault_event_id
ON CONFLICT (id) DO UPDATE SET
  equipment_id = excluded.equipment_id,
  fault_event_id = excluded.fault_event_id,
  metric_name = excluded.metric_name,
  window_start = excluded.window_start,
  window_end = excluded.window_end,
  minimum_value = excluded.minimum_value,
  maximum_value = excluded.maximum_value,
  average_value = excluded.average_value,
  latest_value = excluded.latest_value,
  unit = excluded.unit,
  threshold_value = excluded.threshold_value,
  threshold_operator = excluded.threshold_operator,
  aggregation_method = excluded.aggregation_method,
  source_system = excluded.source_system,
  diagnostic_version = excluded.diagnostic_version,
  calculated_at = excluded.calculated_at,
  is_synthetic = excluded.is_synthetic;
