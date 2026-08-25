export const insertFleetCorrelationRunQuery = `
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
    'fleet_b17_weather_correlation',
    '1.0',
    'sufficient',
    $6, $7, $8
  )
`;

export const insertFleetCorrelationFindingsQuery = `
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
    ($2, $1, 'same_model_b17_recurrence', 'warning', 'Same-model recurrence observed', $5, $6, NULL, 'events', NULL, $7, 0),
    ($3, $1, 'high_ambient_association', 'info', 'High-ambient association observed', $8, $9, NULL, 'percent_events', NULL, $10, 1),
    ($4, $1, 'causality_not_established', 'info', 'Causality not established', $11, NULL, NULL, NULL, NULL, $12, 2)
`;

export const insertFleetCorrelationEventSourcesQuery = `
  INSERT INTO nextera.diagnostic_fault_event_sources (
    diagnostic_run_id,
    fault_event_id,
    purpose,
    ordinal
  )
  SELECT
    $1,
    fault.id,
    'comparator',
    (row_number() OVER (ORDER BY fault.event_time DESC, fault.id) - 1)::INT4
  FROM nextera.equipment_fault_events AS fault
  WHERE fault.id = ANY($2::UUID[])
`;

export const insertFleetCorrelationMetricSourcesQuery = `
  INSERT INTO nextera.diagnostic_metric_sources (
    diagnostic_run_id,
    metric_summary_id,
    purpose,
    ordinal
  )
  SELECT
    $1,
    metric.id,
    CASE metric.metric_name
      WHEN 'controller_temperature' THEN 'same-model B17 controller peak'
      ELSE 'weather context at event time'
    END,
    (row_number() OVER (
      ORDER BY fault.event_time DESC, fault.id, metric.metric_name
    ) - 1)::INT4
  FROM nextera.equipment_metric_summaries AS metric
  JOIN nextera.equipment_fault_events AS fault
    ON fault.id = metric.fault_event_id
  WHERE fault.id = ANY($2::UUID[])
    AND metric.metric_name IN ('ambient_air_temperature', 'controller_temperature')
`;

export const insertFleetCorrelationDocumentSourceQuery = `
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
  ) VALUES ($1, $2, $3, $4, $5, 1, $6, $7, $8)
`;

export const insertFleetCorrelationAnswerQuery = `
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
    'moderate',
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

export const insertFleetCorrelationAnswerDocumentSourceQuery = `
  INSERT INTO nextera.analysis_answer_document_sources (
    answer_id,
    diagnostic_document_source_id,
    ordinal
  ) VALUES ($1, $2, 0)
`;

export const insertFleetCorrelationAnswerMetricSourcesQuery = `
  INSERT INTO nextera.analysis_answer_metric_sources (
    answer_id,
    metric_summary_id,
    ordinal
  )
  SELECT
    $1,
    metric.id,
    (row_number() OVER (
      ORDER BY fault.event_time DESC, fault.id, metric.metric_name
    ) - 1)::INT4
  FROM nextera.equipment_metric_summaries AS metric
  JOIN nextera.equipment_fault_events AS fault
    ON fault.id = metric.fault_event_id
  WHERE fault.id = ANY($2::UUID[])
    AND metric.metric_name IN ('ambient_air_temperature', 'controller_temperature')
`;

export const insertFleetCorrelationAnswerFindingSourcesQuery = `
  INSERT INTO nextera.analysis_answer_finding_sources (
    answer_id,
    diagnostic_finding_id,
    ordinal
  ) VALUES
    ($1, $2, 0),
    ($1, $3, 1),
    ($1, $4, 2)
`;
