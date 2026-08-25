CREATE TABLE nextera.diagnostic_fault_event_sources (
  diagnostic_run_id UUID NOT NULL REFERENCES nextera.diagnostic_runs (id) ON DELETE CASCADE,
  fault_event_id UUID NOT NULL REFERENCES nextera.equipment_fault_events (id) ON DELETE RESTRICT,
  purpose STRING NOT NULL,
  ordinal INT4 NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (diagnostic_run_id, fault_event_id),
  CONSTRAINT diagnostic_fault_event_source_purpose_check CHECK (
    purpose IN ('anchor', 'comparator')
  ),
  CONSTRAINT diagnostic_fault_event_source_ordinal_check CHECK (ordinal >= 0),
  INDEX diagnostic_fault_event_sources_by_event_idx (fault_event_id, diagnostic_run_id)
    STORING (purpose, ordinal)
);

GRANT SELECT ON TABLE
  nextera.diagnostic_fault_event_sources
TO nextera_app_read;

GRANT INSERT, UPDATE ON TABLE
  nextera.diagnostic_fault_event_sources
TO nextera_app_runtime;
