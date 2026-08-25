export const healthQuery = `
  SELECT
    current_database() AS database_name,
    current_user AS sql_user,
    version() AS server_version,
    now() AS checked_at
`;

export const canonicalIncidentQuery = `
  SELECT
    p.id AS plant_id,
    p.plant_code,
    p.display_name AS plant_name,
    p.operator_name,
    e.id AS equipment_id,
    e.equipment_code,
    e.display_name AS equipment_name,
    e.equipment_type,
    e.manufacturer,
    e.model,
    e.firmware_version,
    e.operating_status,
    f.id AS fault_event_id,
    f.fault_code,
    f.fault_name,
    f.event_time,
    f.severity,
    f.event_status,
    f.operating_state_before,
    f.operating_state_after,
    f.summary
  FROM nextera.plants AS p
  JOIN nextera.equipment AS e
    ON e.plant_id = p.id
  JOIN nextera.equipment_fault_events AS f
    ON f.equipment_id = e.id
  WHERE p.plant_code = $1
    AND e.equipment_code = $2
    AND f.fault_code = $3
  ORDER BY f.event_time DESC
  LIMIT 1
`;

export const fleetSummaryQuery = `
  SELECT
    (SELECT count(*) FROM nextera.plants) AS facility_count,
    (SELECT count(*) FROM nextera.equipment) AS monitored_asset_count,
    (
      SELECT count(*)
      FROM nextera.equipment
      WHERE operating_status <> 'normal'
    ) AS assets_on_watch_count,
    (
      SELECT count(*)
      FROM nextera.equipment_fault_events
      WHERE event_status IN ('active', 'acknowledged')
    ) AS open_incident_count
`;

export const fleetFacilitiesQuery = `
  WITH incident_rollup AS (
    SELECT
      equipment_id,
      count(*) FILTER (
        WHERE event_status IN ('active', 'acknowledged')
      ) AS open_incident_count,
      max(event_time) AS latest_event_time
    FROM nextera.equipment_fault_events
    GROUP BY equipment_id
  )
  SELECT
    p.id AS plant_id,
    p.plant_code,
    p.display_name AS plant_name,
    p.state_code,
    p.timezone_name,
    count(e.id) AS asset_count,
    count(e.id) FILTER (WHERE e.operating_status = 'normal') AS normal_asset_count,
    count(e.id) FILTER (WHERE e.operating_status <> 'normal') AS watch_asset_count,
    coalesce(sum(ir.open_incident_count), 0) AS open_incident_count,
    max(ir.latest_event_time) AS latest_event_time
  FROM nextera.plants AS p
  LEFT JOIN nextera.equipment AS e
    ON e.plant_id = p.id
  LEFT JOIN incident_rollup AS ir
    ON ir.equipment_id = e.id
  GROUP BY
    p.id,
    p.plant_code,
    p.display_name,
    p.state_code,
    p.timezone_name
  ORDER BY
    CASE WHEN p.plant_code = 'FPL-MANATEE-SOLAR' THEN 0 ELSE 1 END,
    open_incident_count DESC,
    watch_asset_count DESC,
    p.display_name
`;

export const assetInventoryQuery = `
  WITH ranked_events AS (
    SELECT
      f.equipment_id,
      f.id AS fault_event_id,
      f.fault_code,
      f.fault_name,
      f.event_status,
      f.event_time,
      row_number() OVER (
        PARTITION BY f.equipment_id
        ORDER BY
          CASE f.event_status
            WHEN 'active' THEN 0
            WHEN 'acknowledged' THEN 1
            ELSE 2
          END,
          f.event_time DESC,
          f.id
      ) AS event_rank
    FROM nextera.equipment_fault_events AS f
    WHERE f.source_system <> 'synthetic_fleet_history_adapter'
  )
  SELECT
    e.id AS equipment_id,
    e.equipment_code,
    e.display_name AS equipment_name,
    e.equipment_type,
    e.manufacturer,
    e.model,
    e.serial_number,
    e.firmware_version,
    e.commissioned_on,
    e.operating_status,
    p.id AS plant_id,
    p.plant_code,
    p.display_name AS plant_name,
    p.state_code,
    re.fault_event_id,
    re.fault_code,
    re.fault_name,
    re.event_status,
    re.event_time
  FROM nextera.equipment AS e
  JOIN nextera.plants AS p
    ON p.id = e.plant_id
  LEFT JOIN ranked_events AS re
    ON re.equipment_id = e.id
    AND re.event_rank = 1
  ORDER BY
    CASE WHEN p.plant_code = 'FPL-MANATEE-SOLAR' THEN 0 ELSE 1 END,
    p.display_name,
    e.equipment_type,
    e.equipment_code
`;

export const recentIncidentsQuery = `
  WITH incident_queue AS (
    SELECT
      f.id AS fault_event_id,
      f.fault_code,
      f.fault_name,
      f.event_time,
      f.severity,
      f.event_status,
      f.operating_state_after,
      f.summary,
      e.id AS equipment_id,
      e.equipment_code,
      e.display_name AS equipment_name,
      e.operating_status,
      p.id AS plant_id,
      p.plant_code,
      p.display_name AS plant_name
    FROM nextera.equipment_fault_events AS f
    JOIN nextera.equipment AS e
      ON e.id = f.equipment_id
    JOIN nextera.plants AS p
      ON p.id = e.plant_id
    WHERE f.source_system <> 'synthetic_fleet_history_adapter'
  ),
  recent_cleared_incidents AS (
    SELECT fault_event_id
    FROM incident_queue
    WHERE event_status = 'cleared'
    ORDER BY event_time DESC, fault_event_id
    LIMIT 3
  )
  SELECT
    iq.fault_event_id,
    iq.fault_code,
    iq.fault_name,
    iq.event_time,
    iq.severity,
    iq.event_status,
    iq.operating_state_after,
    iq.summary,
    iq.equipment_id,
    iq.equipment_code,
    iq.equipment_name,
    iq.operating_status,
    iq.plant_id,
    iq.plant_code,
    iq.plant_name
  FROM incident_queue AS iq
  WHERE iq.event_status IN ('active', 'acknowledged')
    OR iq.fault_event_id IN (
      SELECT fault_event_id
      FROM recent_cleared_incidents
    )
  ORDER BY
    CASE iq.event_status
      WHEN 'active' THEN 0
      WHEN 'acknowledged' THEN 1
      ELSE 2
    END,
    iq.event_time DESC,
    iq.fault_event_id
`;

export const incidentByIdQuery = `
  SELECT
    p.id AS plant_id,
    p.plant_code,
    p.display_name AS plant_name,
    p.operator_name,
    p.state_code,
    p.timezone_name,
    e.id AS equipment_id,
    e.equipment_code,
    e.display_name AS equipment_name,
    e.equipment_type,
    e.manufacturer,
    e.model,
    e.serial_number,
    e.firmware_version,
    e.commissioned_on,
    e.operating_status,
    f.id AS fault_event_id,
    f.fault_code,
    f.fault_name,
    f.event_time,
    f.cleared_time,
    f.severity,
    f.event_status,
    f.operating_state_before,
    f.operating_state_after,
    f.source_system,
    f.source_event_id,
    f.summary
  FROM nextera.equipment_fault_events AS f
  JOIN nextera.equipment AS e
    ON e.id = f.equipment_id
  JOIN nextera.plants AS p
    ON p.id = e.plant_id
  WHERE f.id = $1
  LIMIT 1
`;

export const incidentMetricsQuery = `
  SELECT
    m.id AS metric_summary_id,
    m.metric_name,
    m.window_start,
    m.window_end,
    m.minimum_value,
    m.maximum_value,
    m.average_value,
    m.latest_value,
    m.unit,
    m.threshold_value,
    m.threshold_operator,
    CASE
      WHEN m.threshold_value IS NULL THEN NULL
      WHEN m.threshold_operator IN ('>', '>=')
        THEN greatest(m.maximum_value - m.threshold_value, 0)
      WHEN m.threshold_operator IN ('<', '<=')
        THEN greatest(m.threshold_value - m.minimum_value, 0)
      ELSE abs(m.latest_value - m.threshold_value)
    END AS threshold_exceedance,
    m.aggregation_method,
    m.source_system,
    m.diagnostic_version
  FROM nextera.equipment_metric_summaries AS m
  WHERE m.fault_event_id = $1
  ORDER BY m.metric_name
`;

export const availableIncidentEvidenceQuery = `
  SELECT
    principal.id AS principal_id,
    d.id AS document_id,
    d.document_code,
    d.title,
    d.document_type,
    d.owning_organization,
    d.source_system,
    dv.id AS document_version_id,
    dv.version_label,
    dv.effective_date,
    dv.content_sha256 AS version_content_sha256,
    dv.source_uri,
    dv.source_version_id,
    dv.snapshot_uri,
    dv.page_count,
    dc.id AS document_chunk_id,
    dc.page_start,
    dc.page_end,
    dc.section_heading,
    dc.source_anchor,
    dc.content_text,
    dc.content_sha256 AS chunk_content_sha256,
    rs.id AS retrieval_scope_id,
    rs.scope_code,
    rs.display_name AS retrieval_scope_name,
    rs.scope_type,
    fault_link.relevance_note
  FROM nextera.demo_principals AS principal
  JOIN nextera.retrieval_scope_permissions AS permission
    ON permission.principal_id = principal.id
    AND permission.permission = 'read'
  JOIN nextera.retrieval_scopes AS rs
    ON rs.id = permission.retrieval_scope_id
    AND rs.is_active
  JOIN nextera.document_chunks AS dc
    ON dc.retrieval_scope_id = rs.id
  JOIN nextera.document_versions AS dv
    ON dv.id = dc.document_version_id
    AND dv.is_current
    AND dv.approval_status = 'approved'
  JOIN nextera.documents AS d
    ON d.id = dv.document_id
  JOIN nextera.document_fault_code_links AS fault_link
    ON fault_link.document_version_id = dv.id
    AND fault_link.fault_code = $2
    AND (fault_link.equipment_model IS NULL OR fault_link.equipment_model = $3)
    AND fault_link.section_heading = dc.section_heading
  WHERE principal.principal_code = $1
    AND principal.is_active
    AND EXISTS (
      SELECT 1
      FROM nextera.document_equipment_links AS equipment_link
      WHERE equipment_link.document_version_id = dv.id
        AND (
          equipment_link.equipment_id = $4
          OR equipment_link.equipment_model = $3
        )
    )
  ORDER BY
    CASE d.document_type
      WHEN 'oem_manual' THEN 0
      WHEN 'site_procedure' THEN 1
      WHEN 'fleet_bulletin' THEN 2
      ELSE 3
    END,
    d.title,
    dc.chunk_index
`;

export const latestDiagnosticAnalysisQuery = `
  SELECT
    run.id AS diagnostic_run_id,
    run.question_text,
    run.run_status,
    run.diagnostic_rule_code,
    run.diagnostic_rule_version,
    run.evidence_state,
    run.started_at,
    run.completed_at,
    run.response_duration_ms,
    answer.id AS answer_id,
    answer.answer_status,
    answer.answer_text,
    answer.recommended_action,
    answer.confidence_label,
    answer.confidence_basis,
    answer.prompt_template_version,
    answer.generation_provider,
    answer.generation_model,
    answer.embedding_model,
    answer.is_fallback,
    answer.generated_at
  FROM nextera.diagnostic_runs AS run
  JOIN nextera.demo_principals AS principal
    ON principal.id = run.requested_by_principal_id
  JOIN nextera.analysis_answers AS answer
    ON answer.diagnostic_run_id = run.id
  WHERE run.fault_event_id = $1
    AND principal.principal_code = $2
    AND run.run_status = 'completed'
  ORDER BY run.started_at DESC, run.id
  LIMIT 1
`;

export const diagnosticFindingsQuery = `
  SELECT
    id AS diagnostic_finding_id,
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
  FROM nextera.diagnostic_findings
  WHERE diagnostic_run_id = $1
  ORDER BY ordinal, id
`;

export const diagnosticDocumentSourcesQuery = `
  SELECT
    source.id AS diagnostic_document_source_id,
    source.retrieval_method,
    source.retrieval_rank,
    source.cosine_distance,
    source.citation_label,
    source.included_in_generation,
    d.id AS document_id,
    d.document_code,
    d.title,
    d.document_type,
    d.owning_organization,
    d.source_system,
    dv.id AS document_version_id,
    dv.version_label,
    dv.effective_date,
    dv.content_sha256 AS version_content_sha256,
    dv.source_uri,
    dv.source_version_id,
    dv.snapshot_uri,
    chunk.id AS document_chunk_id,
    chunk.page_start,
    chunk.page_end,
    chunk.section_heading,
    chunk.source_anchor,
    chunk.content_text,
    chunk.content_sha256 AS chunk_content_sha256,
    scope.id AS retrieval_scope_id,
    scope.scope_code,
    scope.display_name AS retrieval_scope_name,
    scope.scope_type
  FROM nextera.diagnostic_document_sources AS source
  JOIN nextera.document_chunks AS chunk
    ON chunk.id = source.document_chunk_id
  JOIN nextera.document_versions AS dv
    ON dv.id = chunk.document_version_id
  JOIN nextera.documents AS d
    ON d.id = dv.document_id
  JOIN nextera.retrieval_scopes AS scope
    ON scope.id = source.retrieval_scope_id
  WHERE source.diagnostic_run_id = $1
  ORDER BY source.retrieval_rank, source.id
`;

const fleetCorrelationEventSetCte = `
  WITH anchor_event AS (
    SELECT
      fault.id AS fault_event_id,
      fault.fault_code,
      fault.event_time,
      equipment.model
    FROM nextera.equipment_fault_events AS fault
    JOIN nextera.equipment AS equipment
      ON equipment.id = fault.equipment_id
    WHERE fault.id = $1
  ),
  matching_events AS (
    SELECT
      fault.id AS fault_event_id,
      fault.event_time,
      fault.event_status,
      fault.severity,
      equipment.id AS equipment_id,
      equipment.equipment_code,
      equipment.display_name AS equipment_name,
      equipment.model,
      plant.id AS plant_id,
      plant.plant_code,
      plant.display_name AS plant_name,
      controller.id AS controller_metric_id,
      controller.maximum_value AS controller_peak,
      controller.threshold_value AS controller_threshold,
      ambient.id AS ambient_metric_id,
      ambient.maximum_value AS ambient_peak
    FROM anchor_event AS anchor
    JOIN nextera.equipment AS equipment
      ON equipment.model = anchor.model
    JOIN nextera.equipment_fault_events AS fault
      ON fault.equipment_id = equipment.id
      AND fault.fault_code = anchor.fault_code
      AND fault.event_time >= anchor.event_time - INTERVAL '30 days'
      AND fault.event_time < anchor.event_time
    JOIN nextera.plants AS plant
      ON plant.id = equipment.plant_id
    JOIN nextera.equipment_metric_summaries AS controller
      ON controller.fault_event_id = fault.id
      AND controller.metric_name = 'controller_temperature'
    JOIN nextera.equipment_metric_summaries AS ambient
      ON ambient.fault_event_id = fault.id
      AND ambient.metric_name = 'ambient_air_temperature'
  )
`;

export const fleetCorrelationEventsQuery = `
  ${fleetCorrelationEventSetCte}
  SELECT
    fault_event_id,
    event_time,
    event_status,
    severity,
    equipment_id,
    equipment_code,
    equipment_name,
    model,
    plant_id,
    plant_code,
    plant_name,
    controller_metric_id,
    controller_peak,
    controller_threshold,
    ambient_metric_id,
    ambient_peak,
    ambient_peak >= $2 AS high_ambient_context
  FROM matching_events
  ORDER BY event_time DESC, fault_event_id
`;

export const fleetCorrelationSummaryQuery = `
  ${fleetCorrelationEventSetCte}
  SELECT
    count(*) AS event_count,
    count(DISTINCT equipment_id) AS equipment_count,
    count(DISTINCT plant_id) AS facility_count,
    count(*) FILTER (WHERE ambient_peak >= $2) AS high_ambient_event_count,
    count(*) FILTER (WHERE ambient_peak < $2) AS below_context_event_count,
    round(avg(ambient_peak), 1) AS average_ambient_peak,
    round(avg(controller_peak), 1) AS average_controller_peak,
    round(
      100.0 * count(*) FILTER (WHERE ambient_peak >= $2) / nullif(count(*), 0),
      1
    ) AS high_ambient_share_percent
  FROM matching_events
`;

export const fleetCorrelationEvidenceQuery = `
  SELECT
    principal.id AS principal_id,
    document.id AS document_id,
    document.document_code,
    document.title,
    document.document_type,
    document.owning_organization,
    document.source_system,
    version.id AS document_version_id,
    version.version_label,
    version.effective_date,
    version.content_sha256 AS version_content_sha256,
    version.source_uri,
    version.source_version_id,
    version.snapshot_uri,
    chunk.id AS document_chunk_id,
    chunk.page_start,
    chunk.page_end,
    chunk.section_heading,
    chunk.source_anchor,
    chunk.content_text,
    chunk.content_sha256 AS chunk_content_sha256,
    scope.id AS retrieval_scope_id,
    scope.scope_code,
    scope.display_name AS retrieval_scope_name,
    scope.scope_type,
    fault_link.relevance_note
  FROM nextera.demo_principals AS principal
  JOIN nextera.retrieval_scope_permissions AS permission
    ON permission.principal_id = principal.id
    AND permission.permission = 'read'
  JOIN nextera.retrieval_scopes AS scope
    ON scope.id = permission.retrieval_scope_id
    AND scope.is_active
    AND scope.scope_type = 'engineering_restricted'
  JOIN nextera.document_chunks AS chunk
    ON chunk.retrieval_scope_id = scope.id
  JOIN nextera.document_versions AS version
    ON version.id = chunk.document_version_id
    AND version.is_current
    AND version.approval_status = 'approved'
  JOIN nextera.documents AS document
    ON document.id = version.document_id
    AND document.document_type = 'fleet_bulletin'
  JOIN nextera.document_fault_code_links AS fault_link
    ON fault_link.document_version_id = version.id
    AND fault_link.fault_code = $2
    AND (fault_link.equipment_model IS NULL OR fault_link.equipment_model = $3)
    AND fault_link.section_heading = chunk.section_heading
  WHERE principal.principal_code = $1
    AND principal.is_active
  ORDER BY document.title, chunk.chunk_index
`;

export const latestFleetCorrelationAnalysisQuery = `
  SELECT
    run.id AS diagnostic_run_id,
    run.question_text,
    run.run_status,
    run.diagnostic_rule_code,
    run.diagnostic_rule_version,
    run.evidence_state,
    run.started_at,
    run.completed_at,
    run.response_duration_ms,
    answer.id AS answer_id,
    answer.answer_status,
    answer.answer_text,
    answer.recommended_action,
    answer.confidence_label,
    answer.confidence_basis,
    answer.prompt_template_version,
    answer.generation_provider,
    answer.generation_model,
    answer.embedding_model,
    answer.is_fallback,
    answer.generated_at
  FROM nextera.diagnostic_runs AS run
  JOIN nextera.demo_principals AS principal
    ON principal.id = run.requested_by_principal_id
  JOIN nextera.analysis_answers AS answer
    ON answer.diagnostic_run_id = run.id
  WHERE run.fault_event_id = $1
    AND principal.principal_code = $2
    AND run.diagnostic_rule_code = 'fleet_b17_weather_correlation'
    AND run.run_status = 'completed'
  ORDER BY run.started_at DESC, run.id
  LIMIT 1
`;

export const diagnosticFaultEventSourcesQuery = `
  SELECT
    source.fault_event_id,
    source.purpose,
    source.ordinal,
    fault.event_time,
    equipment.equipment_code,
    plant.display_name AS plant_name
  FROM nextera.diagnostic_fault_event_sources AS source
  JOIN nextera.equipment_fault_events AS fault
    ON fault.id = source.fault_event_id
  JOIN nextera.equipment AS equipment
    ON equipment.id = fault.equipment_id
  JOIN nextera.plants AS plant
    ON plant.id = equipment.plant_id
  WHERE source.diagnostic_run_id = $1
  ORDER BY source.ordinal, source.fault_event_id
`;
