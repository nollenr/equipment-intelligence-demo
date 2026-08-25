export const insertP09DiagnosticRunQuery = `
  INSERT INTO nextera.diagnostic_runs (
    id, equipment_id, fault_event_id, requested_by_principal_id, question_text,
    run_status, diagnostic_rule_code, diagnostic_rule_version, evidence_state,
    started_at, completed_at, response_duration_ms
  ) VALUES (
    $1, $2, $3, $4, $5,
    'completed', 'tracker_position_deviation_p09', '1.0', 'sufficient',
    $6, $7, $8
  )
`;

export const insertP09DiagnosticFindingsQuery = `
  INSERT INTO nextera.diagnostic_findings (
    id, diagnostic_run_id, finding_code, severity, title, explanation,
    observed_value, threshold_value, unit, comparison_operator,
    calculation_expression, ordinal
  ) VALUES
    ($2, $1, 'position_deviation_threshold_exceeded', 'warning', 'Position deviation threshold exceeded', $5, $6, $7, 'degrees', '>', $8, 0),
    ($3, $1, 'command_measurement_mismatch_confirmed', 'warning', 'Command/measurement mismatch confirmed', $9, $10, $11, 'degrees', '>', $12, 1),
    ($4, $1, 'drive_current_context_recorded', 'info', 'Drive-current context recorded', $13, $14, $15, 'amperes', '>', $16, 2)
`;

export const insertP09MetricSourcesQuery = `
  INSERT INTO nextera.diagnostic_metric_sources (
    diagnostic_run_id, metric_summary_id, purpose, ordinal
  ) VALUES
    ($1, $2, 'position deviation threshold evaluation', 0),
    ($1, $3, 'commanded angle corroboration', 1),
    ($1, $4, 'measured angle corroboration', 2),
    ($1, $5, 'drive-current loading context', 3)
`;

export const insertP09DocumentSourcesQuery = `
  INSERT INTO nextera.diagnostic_document_sources (
    id, diagnostic_run_id, document_chunk_id, retrieval_scope_id,
    retrieval_method, retrieval_rank, cosine_distance, citation_label,
    included_in_generation
  ) VALUES
    ($2, $1, $3, $4, $5, $6, $7, $8, $9),
    ($10, $1, $11, $12, $13, $14, $15, $16, $17),
    ($18, $1, $19, $20, $21, $22, $23, $24, $25)
`;

export const insertP09AnalysisAnswerQuery = `
  INSERT INTO nextera.analysis_answers (
    id, diagnostic_run_id, answer_status, answer_text, recommended_action,
    confidence_label, confidence_basis, prompt_template_version,
    generation_provider, generation_model, embedding_model,
    response_duration_ms, is_fallback, generated_at
  ) VALUES (
    $1, $2, 'grounded', $3, $4, 'high', $5, $6, $7, $8, $9, $10, $11, $12
  )
`;

export const insertP09AnswerDocumentSourcesQuery = `
  INSERT INTO nextera.analysis_answer_document_sources (
    answer_id, diagnostic_document_source_id, ordinal
  ) VALUES ($1, $2, 0), ($1, $3, 1), ($1, $4, 2)
`;

export const insertP09AnswerMetricSourcesQuery = `
  INSERT INTO nextera.analysis_answer_metric_sources (
    answer_id, metric_summary_id, ordinal
  ) VALUES ($1, $2, 0), ($1, $3, 1), ($1, $4, 2), ($1, $5, 3)
`;

export const insertP09AnswerFindingSourcesQuery = `
  INSERT INTO nextera.analysis_answer_finding_sources (
    answer_id, diagnostic_finding_id, ordinal
  ) VALUES ($1, $2, 0), ($1, $3, 1), ($1, $4, 2)
`;
