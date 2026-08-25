-- Facility names are public. All equipment records below are synthetic.
-- Four support assets per site make the inventory representative beyond inverters.
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
  (gen_random_uuid(), '10000000-0000-4000-8000-000000000001', 'TRK-01', 'Tracker Controller 1', 'tracker_controller', 'TrackRight Controls (Synthetic)', 'TRC-8 (Synthetic)', 'SYN-MAN-TRK-01', '2.6.3-syn', '2024-02-15', 'normal', 'aws-us-east-1', true),
  (gen_random_uuid(), '10000000-0000-4000-8000-000000000001', 'TRK-02', 'Tracker Controller 2', 'tracker_controller', 'TrackRight Controls (Synthetic)', 'TRC-8 (Synthetic)', 'SYN-MAN-TRK-02', '2.6.3-syn', '2024-02-15', 'normal', 'aws-us-east-1', true),
  (gen_random_uuid(), '10000000-0000-4000-8000-000000000001', 'WST-01', 'Weather Station 1', 'weather_station', 'Meteora Instruments (Synthetic)', 'WX-500 (Synthetic)', 'SYN-MAN-WST-01', '2.8.0-syn', '2024-02-15', 'normal', 'aws-us-east-1', true),
  (gen_random_uuid(), '10000000-0000-4000-8000-000000000001', 'XFM-01', 'Step-up Transformer 1', 'step_up_transformer', 'GridLink Systems (Synthetic)', 'GLT-250 (Synthetic)', 'SYN-MAN-XFM-01', NULL, '2024-02-15', 'normal', 'aws-us-east-1', true),
  (gen_random_uuid(), '10000000-0000-4000-8000-000000000002', 'TRK-01', 'Tracker Controller 1', 'tracker_controller', 'TrackRight Controls (Synthetic)', 'TRC-8 (Synthetic)', 'SYN-BAB-TRK-01', '2.6.1-syn', '2023-11-06', 'normal', 'aws-us-east-1', true),
  (gen_random_uuid(), '10000000-0000-4000-8000-000000000002', 'TRK-02', 'Tracker Controller 2', 'tracker_controller', 'TrackRight Controls (Synthetic)', 'TRC-8 (Synthetic)', 'SYN-BAB-TRK-02', '2.6.1-syn', '2023-11-06', 'normal', 'aws-us-east-1', true),
  (gen_random_uuid(), '10000000-0000-4000-8000-000000000002', 'WST-01', 'Weather Station 1', 'weather_station', 'Meteora Instruments (Synthetic)', 'WX-500 (Synthetic)', 'SYN-BAB-WST-01', '2.7.8-syn', '2023-11-06', 'normal', 'aws-us-east-1', true),
  (gen_random_uuid(), '10000000-0000-4000-8000-000000000002', 'XFM-01', 'Step-up Transformer 1', 'step_up_transformer', 'GridLink Systems (Synthetic)', 'GLT-250 (Synthetic)', 'SYN-BAB-XFM-01', NULL, '2023-11-06', 'normal', 'aws-us-east-1', true),
  (gen_random_uuid(), '10000000-0000-4000-8000-000000000003', 'TRK-01', 'Tracker Controller 1', 'tracker_controller', 'TrackRight Controls (Synthetic)', 'TRC-8 (Synthetic)', 'SYN-CIT-TRK-01', '2.5.9-syn', '2022-08-22', 'normal', 'aws-us-east-1', true),
  (gen_random_uuid(), '10000000-0000-4000-8000-000000000003', 'TRK-02', 'Tracker Controller 2', 'tracker_controller', 'TrackRight Controls (Synthetic)', 'TRC-8 (Synthetic)', 'SYN-CIT-TRK-02', '2.5.9-syn', '2022-08-22', 'normal', 'aws-us-east-1', true),
  (gen_random_uuid(), '10000000-0000-4000-8000-000000000003', 'WST-01', 'Weather Station 1', 'weather_station', 'Meteora Instruments (Synthetic)', 'WX-500 (Synthetic)', 'SYN-CIT-WST-01', '2.7.2-syn', '2022-08-22', 'normal', 'aws-us-east-1', true),
  (gen_random_uuid(), '10000000-0000-4000-8000-000000000003', 'XFM-01', 'Step-up Transformer 1', 'step_up_transformer', 'GridLink Systems (Synthetic)', 'GLT-250 (Synthetic)', 'SYN-CIT-XFM-01', NULL, '2022-08-22', 'normal', 'aws-us-east-1', true)
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
