-- Public facility identity is factual; every equipment/event/measurement detail is synthetic.
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
) VALUES (
  '10000000-0000-4000-8000-000000000001',
  'FPL-MANATEE-SOLAR',
  'FPL Manatee Solar Energy Center',
  'Florida Power & Light Company',
  'solar_energy_center',
  'Parrish',
  'FL',
  'US',
  'America/New_York',
  NULL,
  NULL,
  true
) ON CONFLICT (id) DO UPDATE SET
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
) VALUES (
  '20000000-0000-4000-8000-000000000042',
  '10000000-0000-4000-8000-000000000001',
  'INV-042',
  'Inverter 42',
  'solar_inverter',
  'Helios Power Systems (Synthetic)',
  'HPS-2500X (Synthetic)',
  'SYN-MAN-INV-042',
  '4.2.7-syn',
  '2024-02-15',
  'derated',
  'aws-us-east-1',
  true
) ON CONFLICT (id) DO UPDATE SET
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
) VALUES (
  '30000000-0000-4000-8000-000000000017',
  '20000000-0000-4000-8000-000000000042',
  'B17',
  'Controller thermal derating',
  '2026-08-14 18:42:00+00:00',
  NULL,
  'warning',
  'active',
  'full_output',
  'derated',
  'synthetic_historian_adapter',
  'SYN-MAN-INV042-20260814-B17',
  'Synthetic B17 event recorded after controller temperature exceeded the configured derating threshold.',
  true
) ON CONFLICT (id) DO UPDATE SET
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
  (
    '40000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000042',
    '30000000-0000-4000-8000-000000000017',
    'controller_temperature',
    '2026-08-14 18:37:00+00:00',
    '2026-08-14 18:47:00+00:00',
    72.600000,
    78.400000,
    76.100000,
    77.800000,
    'degC',
    75.000000,
    '>',
    'ten_minute_window',
    'synthetic_historian_adapter',
    'thermal-window-v1',
    '2026-08-14 18:47:05+00:00',
    true
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000042',
    '30000000-0000-4000-8000-000000000017',
    'ambient_air_temperature',
    '2026-08-14 18:37:00+00:00',
    '2026-08-14 18:47:00+00:00',
    35.900000,
    36.800000,
    36.400000,
    36.500000,
    'degC',
    NULL,
    NULL,
    'ten_minute_window',
    'synthetic_weather_adapter',
    'thermal-window-v1',
    '2026-08-14 18:47:05+00:00',
    true
  ),
  (
    '40000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000042',
    '30000000-0000-4000-8000-000000000017',
    'active_power_output',
    '2026-08-14 18:37:00+00:00',
    '2026-08-14 18:47:00+00:00',
    62.000000,
    98.000000,
    79.300000,
    64.000000,
    'percent_rated',
    NULL,
    NULL,
    'ten_minute_window',
    'synthetic_historian_adapter',
    'thermal-window-v1',
    '2026-08-14 18:47:05+00:00',
    true
  )
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

INSERT INTO nextera.demo_principals (
  id, principal_code, display_name, persona, is_active
) VALUES
  (
    '50000000-0000-4000-8000-000000000001',
    'field-tech-demo',
    'Field Technician Demo',
    'field_technician',
    true
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    'fleet-engineer-demo',
    'Fleet Engineer Demo',
    'reliability_engineer',
    true
  )
ON CONFLICT (id) DO UPDATE SET
  principal_code = excluded.principal_code,
  display_name = excluded.display_name,
  persona = excluded.persona,
  is_active = excluded.is_active;

INSERT INTO nextera.retrieval_scopes (
  id, scope_code, display_name, scope_type, description, is_active
) VALUES
  (
    '60000000-0000-4000-8000-000000000001',
    'fleet-general',
    'Fleet General',
    'fleet',
    'Synthetic fleet-wide manuals and approved general guidance.',
    true
  ),
  (
    '60000000-0000-4000-8000-000000000002',
    'manatee-site',
    'Manatee Site',
    'plant',
    'Synthetic site-specific procedures for the Manatee demo model.',
    true
  ),
  (
    '60000000-0000-4000-8000-000000000003',
    'engineering-restricted',
    'Engineering Restricted',
    'engineering_restricted',
    'Synthetic engineering bulletins restricted to reliability personnel.',
    true
  )
ON CONFLICT (id) DO UPDATE SET
  scope_code = excluded.scope_code,
  display_name = excluded.display_name,
  scope_type = excluded.scope_type,
  description = excluded.description,
  is_active = excluded.is_active;

INSERT INTO nextera.retrieval_scope_permissions (
  principal_id, retrieval_scope_id, permission
) VALUES
  (
    '50000000-0000-4000-8000-000000000001',
    '60000000-0000-4000-8000-000000000001',
    'read'
  ),
  (
    '50000000-0000-4000-8000-000000000001',
    '60000000-0000-4000-8000-000000000002',
    'read'
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    '60000000-0000-4000-8000-000000000001',
    'read'
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    '60000000-0000-4000-8000-000000000002',
    'read'
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    '60000000-0000-4000-8000-000000000003',
    'read'
  )
ON CONFLICT (principal_id, retrieval_scope_id, permission) DO NOTHING;
