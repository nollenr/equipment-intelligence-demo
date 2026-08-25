CREATE TABLE nextera.diagnostic_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES nextera.equipment (id) ON DELETE RESTRICT,
  fault_event_id UUID REFERENCES nextera.equipment_fault_events (id) ON DELETE RESTRICT,
  requested_by_principal_id UUID NOT NULL REFERENCES nextera.demo_principals (id) ON DELETE RESTRICT,
  question_text STRING NOT NULL,
  run_status STRING NOT NULL,
  diagnostic_rule_code STRING NOT NULL,
  diagnostic_rule_version STRING NOT NULL,
  evidence_state STRING NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  response_duration_ms INT8,
  error_code STRING,
  error_message STRING,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT diagnostic_run_status_check CHECK (
    run_status IN ('running', 'completed', 'insufficient_evidence', 'failed')
  ),
  CONSTRAINT diagnostic_evidence_state_check CHECK (
    evidence_state IN ('pending', 'sufficient', 'insufficient', 'conflicting')
  ),
  CONSTRAINT diagnostic_run_time_check CHECK (
    completed_at IS NULL OR completed_at >= started_at
  ),
  CONSTRAINT diagnostic_duration_check CHECK (
    response_duration_ms IS NULL OR response_duration_ms >= 0
  ),
  INDEX diagnostic_runs_by_fault_idx (fault_event_id, started_at DESC)
    STORING (equipment_id, requested_by_principal_id, run_status, evidence_state),
  INDEX diagnostic_runs_by_principal_idx (requested_by_principal_id, started_at DESC)
    STORING (equipment_id, fault_event_id, run_status)
);

CREATE TABLE nextera.diagnostic_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostic_run_id UUID NOT NULL REFERENCES nextera.diagnostic_runs (id) ON DELETE CASCADE,
  finding_code STRING NOT NULL,
  severity STRING NOT NULL,
  title STRING NOT NULL,
  explanation STRING NOT NULL,
  observed_value DECIMAL(18,6),
  threshold_value DECIMAL(18,6),
  unit STRING,
  comparison_operator STRING,
  calculation_expression STRING,
  ordinal INT4 NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT diagnostic_finding_unique UNIQUE (diagnostic_run_id, finding_code),
  CONSTRAINT diagnostic_finding_ordinal_check CHECK (ordinal >= 0),
  CONSTRAINT diagnostic_finding_severity_check CHECK (
    severity IN ('info', 'warning', 'critical')
  )
);

CREATE TABLE nextera.diagnostic_document_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostic_run_id UUID NOT NULL REFERENCES nextera.diagnostic_runs (id) ON DELETE CASCADE,
  document_chunk_id UUID NOT NULL REFERENCES nextera.document_chunks (id) ON DELETE RESTRICT,
  retrieval_scope_id UUID NOT NULL REFERENCES nextera.retrieval_scopes (id) ON DELETE RESTRICT,
  retrieval_method STRING NOT NULL,
  retrieval_rank INT4 NOT NULL,
  cosine_distance DECIMAL(18,12),
  citation_label STRING NOT NULL,
  included_in_generation BOOL NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT diagnostic_document_source_unique UNIQUE (
    diagnostic_run_id, document_chunk_id, retrieval_method
  ),
  CONSTRAINT diagnostic_document_rank_check CHECK (retrieval_rank > 0),
  CONSTRAINT diagnostic_document_method_check CHECK (
    retrieval_method IN ('exact_fault', 'exact_equipment', 'vector')
  ),
  INDEX diagnostic_document_sources_by_run_idx (diagnostic_run_id, retrieval_rank)
    STORING (
      document_chunk_id,
      retrieval_scope_id,
      retrieval_method,
      cosine_distance,
      citation_label,
      included_in_generation
    )
);

CREATE TABLE nextera.diagnostic_metric_sources (
  diagnostic_run_id UUID NOT NULL REFERENCES nextera.diagnostic_runs (id) ON DELETE CASCADE,
  metric_summary_id UUID NOT NULL REFERENCES nextera.equipment_metric_summaries (id) ON DELETE RESTRICT,
  purpose STRING NOT NULL,
  ordinal INT4 NOT NULL,
  PRIMARY KEY (diagnostic_run_id, metric_summary_id),
  CONSTRAINT diagnostic_metric_ordinal_check CHECK (ordinal >= 0)
);

CREATE TABLE nextera.analysis_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostic_run_id UUID NOT NULL UNIQUE REFERENCES nextera.diagnostic_runs (id) ON DELETE CASCADE,
  answer_status STRING NOT NULL,
  answer_text STRING NOT NULL,
  recommended_action STRING,
  confidence_label STRING NOT NULL,
  confidence_basis STRING NOT NULL,
  prompt_template_version STRING NOT NULL,
  generation_provider STRING NOT NULL,
  generation_model STRING NOT NULL,
  embedding_model STRING,
  response_duration_ms INT8 NOT NULL,
  is_fallback BOOL NOT NULL DEFAULT false,
  generated_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT analysis_answer_status_check CHECK (
    answer_status IN ('grounded', 'insufficient_evidence', 'conflicting_evidence', 'failed')
  ),
  CONSTRAINT analysis_answer_confidence_check CHECK (
    confidence_label IN ('high', 'moderate', 'low', 'not_scored')
  ),
  CONSTRAINT analysis_answer_duration_check CHECK (response_duration_ms >= 0)
);

CREATE TABLE nextera.analysis_answer_document_sources (
  answer_id UUID NOT NULL REFERENCES nextera.analysis_answers (id) ON DELETE CASCADE,
  diagnostic_document_source_id UUID NOT NULL REFERENCES nextera.diagnostic_document_sources (id) ON DELETE RESTRICT,
  ordinal INT4 NOT NULL,
  PRIMARY KEY (answer_id, diagnostic_document_source_id),
  CONSTRAINT answer_document_ordinal_check CHECK (ordinal >= 0)
);

CREATE TABLE nextera.analysis_answer_metric_sources (
  answer_id UUID NOT NULL REFERENCES nextera.analysis_answers (id) ON DELETE CASCADE,
  metric_summary_id UUID NOT NULL REFERENCES nextera.equipment_metric_summaries (id) ON DELETE RESTRICT,
  ordinal INT4 NOT NULL,
  PRIMARY KEY (answer_id, metric_summary_id),
  CONSTRAINT answer_metric_ordinal_check CHECK (ordinal >= 0)
);

CREATE TABLE nextera.analysis_answer_finding_sources (
  answer_id UUID NOT NULL REFERENCES nextera.analysis_answers (id) ON DELETE CASCADE,
  diagnostic_finding_id UUID NOT NULL REFERENCES nextera.diagnostic_findings (id) ON DELETE RESTRICT,
  ordinal INT4 NOT NULL,
  PRIMARY KEY (answer_id, diagnostic_finding_id),
  CONSTRAINT answer_finding_ordinal_check CHECK (ordinal >= 0)
);
