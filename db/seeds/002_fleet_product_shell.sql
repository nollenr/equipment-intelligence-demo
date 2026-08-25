-- Facility names are public. All assets, events, states, measurements, and conclusions are synthetic.
INSERT INTO nextera.plants (
  id,
  plant_code,
  display_name,
  operator_name,
  facility_type,
  city,
  state_code,
  country_code,
  timezone_name,
  latitude,
  longitude,
  is_synthetic
) VALUES
  (
    '10000000-0000-4000-8000-000000000002',
    'FPL-BABCOCK-RANCH-SOLAR',
    'FPL Babcock Ranch Solar Energy Center',
    'Florida Power & Light Company',
    'solar_energy_center',
    NULL,
    'FL',
    'US',
    'America/New_York',
    NULL,
    NULL,
    true
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'FPL-CITRUS-SOLAR',
    'FPL Citrus Solar Energy Center',
    'Florida Power & Light Company',
    'solar_energy_center',
    NULL,
    'FL',
    'US',
    'America/New_York',
    NULL,
    NULL,
    true
  )
ON CONFLICT (id) DO UPDATE SET
  plant_code = excluded.plant_code,
  display_name = excluded.display_name,
  operator_name = excluded.operator_name,
  facility_type = excluded.facility_type,
  city = excluded.city,
  state_code = excluded.state_code,
  country_code = excluded.country_code,
  timezone_name = excluded.timezone_name,
  is_synthetic = excluded.is_synthetic;

INSERT INTO nextera.equipment (
  id,
  plant_id,
  equipment_code,
  display_name,
  equipment_type,
  manufacturer,
  model,
  serial_number,
  firmware_version,
  commissioned_on,
  operating_status,
  logical_home_region,
  is_synthetic
) VALUES
  ('20000000-0000-4000-8000-000000000039', '10000000-0000-4000-8000-000000000001', 'INV-039', 'Inverter 39', 'solar_inverter', 'Helios Power Systems (Synthetic)', 'HPS-2500X (Synthetic)', 'SYN-MAN-INV-039', '4.2.7-syn', '2024-02-15', 'normal', 'aws-us-east-1', true),
  ('20000000-0000-4000-8000-000000000040', '10000000-0000-4000-8000-000000000001', 'INV-040', 'Inverter 40', 'solar_inverter', 'Helios Power Systems (Synthetic)', 'HPS-2500X (Synthetic)', 'SYN-MAN-INV-040', '4.2.7-syn', '2024-02-15', 'normal', 'aws-us-east-1', true),
  ('20000000-0000-4000-8000-000000000041', '10000000-0000-4000-8000-000000000001', 'INV-041', 'Inverter 41', 'solar_inverter', 'Helios Power Systems (Synthetic)', 'HPS-2500X (Synthetic)', 'SYN-MAN-INV-041', '4.2.7-syn', '2024-02-15', 'normal', 'aws-us-east-1', true),
  ('20000000-0000-4000-8000-000000000101', '10000000-0000-4000-8000-000000000002', 'INV-101', 'Inverter 101', 'solar_inverter', 'Solara Dynamics (Synthetic)', 'SD-8400 (Synthetic)', 'SYN-BAB-INV-101', '3.9.1-syn', '2023-11-06', 'normal', 'aws-us-east-1', true),
  ('20000000-0000-4000-8000-000000000102', '10000000-0000-4000-8000-000000000002', 'INV-102', 'Inverter 102', 'solar_inverter', 'Solara Dynamics (Synthetic)', 'SD-8400 (Synthetic)', 'SYN-BAB-INV-102', '3.9.1-syn', '2023-11-06', 'maintenance', 'aws-us-east-1', true),
  ('20000000-0000-4000-8000-000000000103', '10000000-0000-4000-8000-000000000002', 'INV-103', 'Inverter 103', 'solar_inverter', 'Solara Dynamics (Synthetic)', 'SD-8400 (Synthetic)', 'SYN-BAB-INV-103', '3.9.1-syn', '2023-11-06', 'normal', 'aws-us-east-1', true),
  ('20000000-0000-4000-8000-000000000201', '10000000-0000-4000-8000-000000000003', 'INV-201', 'Inverter 201', 'solar_inverter', 'Arcfield Energy (Synthetic)', 'AE-7200 (Synthetic)', 'SYN-CIT-INV-201', '5.1.4-syn', '2022-08-22', 'normal', 'aws-us-east-1', true),
  ('20000000-0000-4000-8000-000000000202', '10000000-0000-4000-8000-000000000003', 'INV-202', 'Inverter 202', 'solar_inverter', 'Arcfield Energy (Synthetic)', 'AE-7200 (Synthetic)', 'SYN-CIT-INV-202', '5.1.4-syn', '2022-08-22', 'normal', 'aws-us-east-1', true),
  ('20000000-0000-4000-8000-000000000203', '10000000-0000-4000-8000-000000000003', 'INV-203', 'Inverter 203', 'solar_inverter', 'Arcfield Energy (Synthetic)', 'AE-7200 (Synthetic)', 'SYN-CIT-INV-203', '5.1.4-syn', '2022-08-22', 'normal', 'aws-us-east-1', true)
ON CONFLICT (id) DO UPDATE SET
  plant_id = excluded.plant_id,
  equipment_code = excluded.equipment_code,
  display_name = excluded.display_name,
  equipment_type = excluded.equipment_type,
  manufacturer = excluded.manufacturer,
  model = excluded.model,
  serial_number = excluded.serial_number,
  firmware_version = excluded.firmware_version,
  commissioned_on = excluded.commissioned_on,
  operating_status = excluded.operating_status,
  logical_home_region = excluded.logical_home_region,
  is_synthetic = excluded.is_synthetic;

-- Expand the modeled fleet to 16 assets per facility without inventing additional incidents.
-- The plant/equipment-code key makes this repeatable while UUID primary keys remain distributed.
WITH fleet_asset_ranges (
  plant_id,
  serial_prefix,
  manufacturer,
  model,
  firmware_version,
  commissioned_on,
  first_asset_number,
  last_asset_number
) AS (
  VALUES
    ('10000000-0000-4000-8000-000000000001'::UUID, 'SYN-MAN-INV-', 'Helios Power Systems (Synthetic)', 'HPS-2500X (Synthetic)', '4.2.7-syn', '2024-02-15'::DATE, 27, 38),
    ('10000000-0000-4000-8000-000000000002'::UUID, 'SYN-BAB-INV-', 'Solara Dynamics (Synthetic)', 'SD-8400 (Synthetic)', '3.9.1-syn', '2023-11-06'::DATE, 104, 116),
    ('10000000-0000-4000-8000-000000000003'::UUID, 'SYN-CIT-INV-', 'Arcfield Energy (Synthetic)', 'AE-7200 (Synthetic)', '5.1.4-syn', '2022-08-22'::DATE, 204, 216)
),
expanded_assets AS (
  SELECT
    gen_random_uuid() AS id,
    ranges.plant_id,
    'INV-' || lpad(asset_number::STRING, 3, '0') AS equipment_code,
    'Inverter ' || asset_number::STRING AS display_name,
    'solar_inverter' AS equipment_type,
    ranges.manufacturer,
    ranges.model,
    ranges.serial_prefix || lpad(asset_number::STRING, 3, '0') AS serial_number,
    ranges.firmware_version,
    ranges.commissioned_on,
    'normal' AS operating_status,
    'aws-us-east-1' AS logical_home_region,
    true AS is_synthetic
  FROM fleet_asset_ranges AS ranges,
  LATERAL generate_series(ranges.first_asset_number, ranges.last_asset_number) AS assets(asset_number)
)
INSERT INTO nextera.equipment (
  id,
  plant_id,
  equipment_code,
  display_name,
  equipment_type,
  manufacturer,
  model,
  serial_number,
  firmware_version,
  commissioned_on,
  operating_status,
  logical_home_region,
  is_synthetic
)
SELECT
  id,
  plant_id,
  equipment_code,
  display_name,
  equipment_type,
  manufacturer,
  model,
  serial_number,
  firmware_version,
  commissioned_on,
  operating_status,
  logical_home_region,
  is_synthetic
FROM expanded_assets
ON CONFLICT (plant_id, equipment_code) DO UPDATE SET
  display_name = excluded.display_name,
  equipment_type = excluded.equipment_type,
  manufacturer = excluded.manufacturer,
  model = excluded.model,
  serial_number = excluded.serial_number,
  firmware_version = excluded.firmware_version,
  commissioned_on = excluded.commissioned_on,
  operating_status = excluded.operating_status,
  logical_home_region = excluded.logical_home_region,
  is_synthetic = excluded.is_synthetic;

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
) VALUES
  (
    '30000000-0000-4000-8000-000000000112',
    '20000000-0000-4000-8000-000000000102',
    'A12',
    'Cooling fan feedback variance',
    '2026-08-18 15:14:00+00:00',
    NULL,
    'warning',
    'acknowledged',
    'full_output',
    'maintenance_hold',
    'synthetic_historian_adapter',
    'SYN-BAB-INV102-20260818-A12',
    'Synthetic fan feedback variance placed the inverter into a planned inspection hold.',
    true
  ),
  (
    '30000000-0000-4000-8000-000000000204',
    '20000000-0000-4000-8000-000000000202',
    'C04',
    'Telemetry communications timeout',
    '2026-08-20 12:08:00+00:00',
    '2026-08-20 12:20:00+00:00',
    'warning',
    'cleared',
    'full_output',
    'full_output',
    'synthetic_historian_adapter',
    'SYN-CIT-INV202-20260820-C04',
    'Synthetic telemetry timeout cleared after communications were restored.',
    true
  )
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
) VALUES
  ('40000000-0000-4000-8000-000000000011', '20000000-0000-4000-8000-000000000102', '30000000-0000-4000-8000-000000000112', 'fan_speed_variance', '2026-08-18 15:09:00+00:00', '2026-08-18 15:19:00+00:00', 4.100000, 17.200000, 11.600000, 15.900000, 'percent', 12.000000, '>', 'ten_minute_window', 'synthetic_historian_adapter', 'fan-feedback-window-v1', '2026-08-18 15:19:05+00:00', true),
  ('40000000-0000-4000-8000-000000000012', '20000000-0000-4000-8000-000000000102', '30000000-0000-4000-8000-000000000112', 'ambient_air_temperature', '2026-08-18 15:09:00+00:00', '2026-08-18 15:19:00+00:00', 37.200000, 38.200000, 37.700000, 38.000000, 'degC', NULL, NULL, 'ten_minute_window', 'synthetic_weather_adapter', 'fan-feedback-window-v1', '2026-08-18 15:19:05+00:00', true),
  ('40000000-0000-4000-8000-000000000021', '20000000-0000-4000-8000-000000000202', '30000000-0000-4000-8000-000000000204', 'telemetry_gap_duration', '2026-08-20 12:03:00+00:00', '2026-08-20 12:13:00+00:00', 0.000000, 384.000000, 156.000000, 384.000000, 'seconds', 300.000000, '>', 'ten_minute_window', 'synthetic_historian_adapter', 'telemetry-health-window-v1', '2026-08-20 12:13:05+00:00', true),
  ('40000000-0000-4000-8000-000000000022', '20000000-0000-4000-8000-000000000202', '30000000-0000-4000-8000-000000000204', 'active_power_output', '2026-08-20 12:03:00+00:00', '2026-08-20 12:13:00+00:00', 91.000000, 96.000000, 93.600000, 95.000000, 'percent_rated', NULL, NULL, 'ten_minute_window', 'synthetic_historian_adapter', 'telemetry-health-window-v1', '2026-08-20 12:13:05+00:00', true)
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
