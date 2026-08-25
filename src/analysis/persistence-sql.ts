export const insertDiagnosticRunQuery = `
  INSERT INTO nextera.diagnostic_runs (
    id,
    equipment_id,
    fault_event_id,
    requested_by_principal_id,
    question_text,
    run_status,
    diagnostic_rule_code,
    diagnostic_rule_version,
    evidence_state,
    started_at,
    completed_at,
    response_duration_ms
  ) VALUES (
    $1, $2, $3, $4, $5,
    'completed',
    'thermal_derating_b17',
    '1.0',
    'sufficient',
    $6, $7, $8
  )
`;

export const insertDiagnosticFindingsQuery = `
  INSERT INTO nextera.diagnostic_findings (
    id,
    diagnostic_run_id,
    finding_code,
    severity,
    title,
    explanation,
    observed_value,
    threshold_value,
    unit,
    comparison_operator,
    calculation_expression,
    ordinal
  ) VALUES
    ($2, $1, 'controller_threshold_exceeded', 'warning', 'Controller threshold exceeded', $5, $6, $7, 'degC', '>', $8, 0),
    ($3, $1, 'protective_derating_confirmed', 'info', 'Protective derating confirmed', $9, $10, NULL, 'percent_rated', NULL, $11, 1),
    ($4, $1, 'ambient_context_recorded', 'info', 'High-ambient context recorded', $12, $13, NULL, 'degC', NULL, $14, 2)
`;

export const insertDiagnosticMetricSourcesQuery = `
  INSERT INTO nextera.diagnostic_metric_sources (
    diagnostic_run_id,
    metric_summary_id,
    purpose,
    ordinal
  ) VALUES
    ($1, $2, 'controller threshold evaluation', 0),
    ($1, $3, 'operating-state corroboration', 1),
    ($1, $4, 'ambient context', 2)
`;

export const insertDiagnosticDocumentSourcesQuery = `
  INSERT INTO nextera.diagnostic_document_sources (
    id,
    diagnostic_run_id,
    document_chunk_id,
    retrieval_scope_id,
    retrieval_method,
    retrieval_rank,
    cosine_distance,
    citation_label,
    included_in_generation
  ) VALUES
    ($2, $1, $3, $4, $5, $6, $7, $8, $9),
    ($10, $1, $11, $12, $13, $14, $15, $16, $17)
`;

export const insertAnalysisAnswerQuery = `
  INSERT INTO nextera.analysis_answers (
    id,
    diagnostic_run_id,
    answer_status,
    answer_text,
    recommended_action,
    confidence_label,
    confidence_basis,
    prompt_template_version,
    generation_provider,
    generation_model,
    embedding_model,
    response_duration_ms,
    is_fallback,
    generated_at
  ) VALUES (
    $1,
    $2,
    'grounded',
    $3,
    $4,
    'high',
    $5,
    $6,
    $7,
    $8,
    $9,
    $10,
    $11,
    $12
  )
`;

export const insertAnswerDocumentSourcesQuery = `
  INSERT INTO nextera.analysis_answer_document_sources (
    answer_id,
    diagnostic_document_source_id,
    ordinal
  ) VALUES
    ($1, $2, 0),
    ($1, $3, 1)
`;

export const insertAnswerMetricSourcesQuery = `
  INSERT INTO nextera.analysis_answer_metric_sources (
    answer_id,
    metric_summary_id,
    ordinal
  ) VALUES
    ($1, $2, 0),
    ($1, $3, 1),
    ($1, $4, 2)
`;

export const insertAnswerFindingSourcesQuery = `
  INSERT INTO nextera.analysis_answer_finding_sources (
    answer_id,
    diagnostic_finding_id,
    ordinal
  ) VALUES
    ($1, $2, 0),
    ($1, $3, 1),
    ($1, $4, 2)
`;
