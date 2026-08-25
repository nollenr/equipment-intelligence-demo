CREATE TABLE nextera.plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_code STRING NOT NULL UNIQUE,
  display_name STRING NOT NULL,
  operator_name STRING NOT NULL,
  facility_type STRING NOT NULL,
  city STRING,
  state_code STRING,
  country_code STRING NOT NULL DEFAULT 'US',
  timezone_name STRING NOT NULL,
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  is_synthetic BOOL NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now() ON UPDATE now(),
  CONSTRAINT plants_synthetic_only CHECK (is_synthetic),
  CONSTRAINT plants_country_code_length CHECK (length(country_code) = 2),
  CONSTRAINT plants_state_code_length CHECK (state_code IS NULL OR length(state_code) = 2)
);

CREATE TABLE nextera.equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES nextera.plants (id) ON DELETE CASCADE,
  equipment_code STRING NOT NULL,
  display_name STRING NOT NULL,
  equipment_type STRING NOT NULL,
  manufacturer STRING NOT NULL,
  model STRING NOT NULL,
  serial_number STRING NOT NULL,
  firmware_version STRING,
  commissioned_on DATE,
  operating_status STRING NOT NULL,
  logical_home_region STRING NOT NULL,
  is_synthetic BOOL NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now() ON UPDATE now(),
  CONSTRAINT equipment_plant_code_unique UNIQUE (plant_id, equipment_code),
  CONSTRAINT equipment_serial_unique UNIQUE (serial_number),
  CONSTRAINT equipment_status_check CHECK (
    operating_status IN ('normal', 'derated', 'faulted', 'offline', 'maintenance')
  ),
  CONSTRAINT equipment_synthetic_only CHECK (is_synthetic),
  INDEX equipment_by_plant_type_idx (plant_id, equipment_type)
    STORING (equipment_code, display_name, model, operating_status)
);

CREATE TABLE nextera.equipment_fault_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES nextera.equipment (id) ON DELETE CASCADE,
  fault_code STRING NOT NULL,
  fault_name STRING NOT NULL,
  event_time TIMESTAMPTZ NOT NULL,
  cleared_time TIMESTAMPTZ,
  severity STRING NOT NULL,
  event_status STRING NOT NULL,
  operating_state_before STRING,
  operating_state_after STRING,
  source_system STRING NOT NULL,
  source_event_id STRING NOT NULL,
  summary STRING NOT NULL,
  is_synthetic BOOL NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fault_source_event_unique UNIQUE (source_system, source_event_id),
  CONSTRAINT fault_time_order_check CHECK (cleared_time IS NULL OR cleared_time >= event_time),
  CONSTRAINT fault_severity_check CHECK (severity IN ('info', 'warning', 'critical')),
  CONSTRAINT fault_status_check CHECK (event_status IN ('active', 'cleared', 'acknowledged')),
  CONSTRAINT fault_synthetic_only CHECK (is_synthetic),
  INDEX fault_by_equipment_code_time_idx (equipment_id, fault_code, event_time DESC)
    STORING (fault_name, severity, event_status, operating_state_after),
  INDEX fault_by_time_idx (event_time DESC)
    STORING (equipment_id, fault_code, severity, event_status)
);

CREATE TABLE nextera.equipment_metric_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES nextera.equipment (id) ON DELETE CASCADE,
  fault_event_id UUID REFERENCES nextera.equipment_fault_events (id) ON DELETE CASCADE,
  metric_name STRING NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  minimum_value DECIMAL(18,6),
  maximum_value DECIMAL(18,6),
  average_value DECIMAL(18,6),
  latest_value DECIMAL(18,6),
  unit STRING NOT NULL,
  threshold_value DECIMAL(18,6),
  threshold_operator STRING,
  aggregation_method STRING NOT NULL,
  source_system STRING NOT NULL,
  diagnostic_version STRING NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL,
  is_synthetic BOOL NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT metric_window_check CHECK (window_end > window_start),
  CONSTRAINT metric_threshold_operator_check CHECK (
    threshold_operator IS NULL OR threshold_operator IN ('>', '>=', '<', '<=', '=')
  ),
  CONSTRAINT metric_threshold_pair_check CHECK (
    (threshold_value IS NULL AND threshold_operator IS NULL)
    OR (threshold_value IS NOT NULL AND threshold_operator IS NOT NULL)
  ),
  CONSTRAINT metric_synthetic_only CHECK (is_synthetic),
  CONSTRAINT metric_window_unique UNIQUE (
    equipment_id, fault_event_id, metric_name, window_start, window_end
  ),
  INDEX metric_by_fault_idx (fault_event_id, metric_name)
    STORING (
      window_start,
      window_end,
      minimum_value,
      maximum_value,
      average_value,
      latest_value,
      unit,
      threshold_value,
      threshold_operator,
      diagnostic_version
    )
);
