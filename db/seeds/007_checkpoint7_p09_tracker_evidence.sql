-- Checkpoint 7 activates a synthetic tracker-controller P09 vertical slice.
-- All equipment behavior, measurements, documents, limits, and conclusions are fictional.

UPDATE nextera.equipment
SET operating_status = 'maintenance'
WHERE plant_id = '10000000-0000-4000-8000-000000000003'
  AND equipment_code = 'TRK-01';

INSERT INTO nextera.equipment_fault_events (
  id, equipment_id, fault_code, fault_name, event_time, cleared_time,
  severity, event_status, operating_state_before, operating_state_after,
  source_system, source_event_id, summary, is_synthetic
)
SELECT
  '30000000-0000-4000-8000-000000000201',
  e.id,
  'P09',
  'Tracker position deviation',
  '2026-08-22 17:26:00+00:00',
  NULL,
  'warning',
  'active',
  'automatic_tracking',
  'safe_stow_hold',
  'synthetic_scada_adapter',
  'SYN-CIT-TRK01-20260822-P09',
  'Synthetic commanded-versus-measured position deviation placed the tracker row in Safe Stow Hold.',
  true
FROM nextera.equipment AS e
WHERE e.plant_id = '10000000-0000-4000-8000-000000000003'
  AND e.equipment_code = 'TRK-01'
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
  id, equipment_id, fault_event_id, metric_name, window_start, window_end,
  minimum_value, maximum_value, average_value, latest_value, unit,
  threshold_value, threshold_operator, aggregation_method, source_system,
  diagnostic_version, calculated_at, is_synthetic
)
SELECT
  values_to_insert.id,
  e.id,
  '30000000-0000-4000-8000-000000000201',
  values_to_insert.metric_name,
  '2026-08-22 17:21:00+00:00',
  '2026-08-22 17:31:00+00:00',
  values_to_insert.minimum_value,
  values_to_insert.maximum_value,
  values_to_insert.average_value,
  values_to_insert.latest_value,
  values_to_insert.unit,
  values_to_insert.threshold_value,
  values_to_insert.threshold_operator,
  'ten_minute_window',
  'synthetic_scada_adapter',
  'tracker-position-window-v1',
  '2026-08-22 17:31:05+00:00',
  true
FROM nextera.equipment AS e
CROSS JOIN (
  VALUES
    ('40000000-0000-4000-8000-000000000201'::UUID, 'tracker_position_deviation', 2.100000, 15.100000, 9.400000, 13.600000, 'degrees', 5.000000, '>'),
    ('40000000-0000-4000-8000-000000000202'::UUID, 'tracker_commanded_angle', 25.000000, 32.000000, 29.100000, 32.000000, 'degrees', NULL, NULL),
    ('40000000-0000-4000-8000-000000000203'::UUID, 'tracker_measured_angle', 17.100000, 23.000000, 19.700000, 18.400000, 'degrees', NULL, NULL),
    ('40000000-0000-4000-8000-000000000204'::UUID, 'tracker_drive_motor_current', 4.200000, 8.700000, 7.100000, 8.200000, 'amperes', 7.500000, '>')
) AS values_to_insert (
  id, metric_name, minimum_value, maximum_value, average_value,
  latest_value, unit, threshold_value, threshold_operator
)
WHERE e.plant_id = '10000000-0000-4000-8000-000000000003'
  AND e.equipment_code = 'TRK-01'
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

INSERT INTO nextera.retrieval_scopes (
  id, scope_code, display_name, scope_type, description, is_active
) VALUES (
  '60000000-0000-4000-8000-000000000005',
  'citrus-site',
  'Citrus Solar Site',
  'plant',
  'Synthetic site-specific procedures for the Citrus Solar demo model.',
  true
) ON CONFLICT (id) DO UPDATE SET
  scope_code = excluded.scope_code,
  display_name = excluded.display_name,
  scope_type = excluded.scope_type,
  description = excluded.description,
  is_active = excluded.is_active;

INSERT INTO nextera.retrieval_scope_permissions (
  principal_id, retrieval_scope_id, permission
) VALUES
  ('50000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000005', 'read'),
  ('50000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000005', 'read')
ON CONFLICT (principal_id, retrieval_scope_id, permission) DO NOTHING;

INSERT INTO nextera.documents (
  id, document_code, title, document_type, owning_organization, source_system, is_synthetic
) VALUES
  ('70000000-0000-4000-8000-000000000201', 'OEM-TRC8-POSITION', 'TRC-8 Operations, Position Feedback & Fault Response Manual', 'oem_manual', 'TrackRight Controls (Synthetic)', 'google_drive', true),
  ('70000000-0000-4000-8000-000000000202', 'SITE-CIT-TRACKER-INSPECTION', 'Citrus Tracker-Row Inspection', 'site_procedure', 'Citrus Solar Operations (Synthetic)', 'google_drive', true),
  ('70000000-0000-4000-8000-000000000203', 'CHECKLIST-TRK-RETURN-AUTO', 'Tracker Return-to-Automatic Checklist', 'work_order', 'Commissioning & Maintenance (Synthetic)', 'google_drive', true)
ON CONFLICT (id) DO UPDATE SET
  document_code = excluded.document_code,
  title = excluded.title,
  document_type = excluded.document_type,
  owning_organization = excluded.owning_organization,
  source_system = excluded.source_system,
  is_synthetic = excluded.is_synthetic;

INSERT INTO nextera.document_versions (
  id, document_id, version_label, effective_date, approval_status, content_sha256,
  s3_bucket, s3_key, s3_version_id, source_uri, source_version_id, snapshot_uri,
  mime_type, page_count, is_current, ingested_at
) VALUES
  ('71000000-0000-4000-8000-000000000201', '70000000-0000-4000-8000-000000000201', '2.7', '2026-05-14', 'approved', '64878e5b7e455f8907e6cd78d067327e032e6a777c4a337ee40887ce44bb54a2', NULL, NULL, NULL, 'https://docs.google.com/document/d/1KiG-L5ZFPfDf28mQOTbAs2ugnWQZqWST83ywMhPhs40/edit?tab=t.0#bookmark=id.xrqf121q45o1', NULL, '/evidence/trc-8-tracker-controller-manual-v2.7.pdf', 'application/pdf', 3, true, '2026-08-23 23:30:00+00:00'),
  ('71000000-0000-4000-8000-000000000202', '70000000-0000-4000-8000-000000000202', '1.4', '2026-07-02', 'approved', 'e3a2ce1d5a9f0eb408ecb1cc1b331f03b0eaceb9d5c9333dd2526b642e47a81e', NULL, NULL, NULL, 'https://docs.google.com/document/d/1cqAPDIhou1H4xWBsF7AxQyYShl438OFJTO_DPR3KcFE/edit?tab=t.0#bookmark=id.mi8l4r25kmwf', NULL, '/evidence/citrus-tracker-row-inspection-procedure-v1.4.pdf', 'application/pdf', 3, true, '2026-08-23 23:30:00+00:00'),
  ('71000000-0000-4000-8000-000000000203', '70000000-0000-4000-8000-000000000203', '2.0', '2026-07-16', 'approved', '9fa099af81f58fc84f4da2b23a1410135635a6e1675091182184fe2488d2f1c1', NULL, NULL, NULL, 'https://docs.google.com/document/d/1_33jsvqOJwX_rSuM4iPXGF1PRwkBxjAERfb_uJvNZLU/edit?tab=t.0#bookmark=id.h2vh1ozhbu1u', NULL, '/evidence/tracker-return-to-automatic-checklist-v2.0.pdf', 'application/pdf', 2, true, '2026-08-23 23:30:00+00:00')
ON CONFLICT (id) DO UPDATE SET
  version_label = excluded.version_label,
  effective_date = excluded.effective_date,
  approval_status = excluded.approval_status,
  content_sha256 = excluded.content_sha256,
  source_uri = coalesce(nextera.document_versions.source_uri, excluded.source_uri),
  source_version_id = coalesce(nextera.document_versions.source_version_id, excluded.source_version_id),
  snapshot_uri = excluded.snapshot_uri,
  mime_type = excluded.mime_type,
  page_count = excluded.page_count,
  is_current = excluded.is_current,
  ingested_at = excluded.ingested_at;

INSERT INTO nextera.document_chunks (
  id, document_version_id, retrieval_scope_id, chunk_index, page_start, page_end,
  section_heading, source_anchor, content_text, content_sha256, token_count
) VALUES
  (
    '72000000-0000-4000-8000-000000000201',
    '71000000-0000-4000-8000-000000000201',
    '60000000-0000-4000-8000-000000000001',
    0, 3, 3,
    '6.3 Fault P09 — Tracker Position Deviation',
    'section-6-3-fault-p09',
    $$Fault P09 is asserted when absolute commanded-versus-measured row-position deviation exceeds 5.0 degrees during the controller diagnostic window. The affected row enters Safe Stow Hold and automatic motion is inhibited pending inspection.

P09 establishes that commanded and measured position disagreed beyond the configured limit. It does not, by itself, prove a failed actuator, position sensor, drive, or linkage. Obstruction, row interference, mechanical drag, feedback sensing, and control-path conditions remain possible until inspected.

Confirm the asset, event window, and Safe Stow Hold. Review commanded angle, measured angle, position deviation, and drive-motor current for the same window. From outside the movement envelope, inspect the visible row path and structure for vegetation, debris, row-to-row interference, displaced modules, or damaged members. Do not command motion, enter the movement envelope, or touch drive components under this diagnostic step. Use the approved site procedure and return-to-automatic checklist before release.

Elevated drive current is consistent with increased loading, but neither current nor position deviation alone establishes the underlying cause.$$
    , '99615e30582c188ab0c85fbae5ce4f70f51479f381c8be90861166f00de74a54', 156
  ),
  (
    '72000000-0000-4000-8000-000000000202',
    '71000000-0000-4000-8000-000000000202',
    '60000000-0000-4000-8000-000000000005',
    0, 3, 3,
    '4.2 Authorized tracker-row inspection',
    'section-4-2-authorized-tracker-inspection',
    $$Use this sequence for TRK-01 while it remains in Safe Stow Hold after fault P09. Notify the control room that observation is beginning.

From outside the movement envelope, inspect the row path for vegetation, windblown debris, pooled material, and row-to-row or module-to-module interference. Observe visible modules, supports, torque-tube alignment, linkage, and drive housing for displacement, bending, loose material, or impact evidence. Do not touch components.

Compare commanded and measured angle over the event window. Record whether feedback is present, stable, and responsive; also record abnormal or sustained drive-current loading.

If deviation remains above 5.0 degrees, feedback is missing or unstable, drive current remains above 7.5 amperes, or the path is not visibly clear, retain Safe Stow Hold and create a qualified-maintenance work order. Escalate whenever a check requires entry into the movement envelope, an obstruction cannot be safely characterized from outside the exclusion zone, or disagreement or elevated loading persists after the visible path is confirmed clear.$$
    , '564598d4247a09359b367915f4d2b9fcf561257c3093bec52fb3cda0fb51d650', 150
  ),
  (
    '72000000-0000-4000-8000-000000000203',
    '71000000-0000-4000-8000-000000000203',
    '60000000-0000-4000-8000-000000000005',
    0, 2, 2,
    '3. Return-to-automatic acceptance criteria',
    'section-3-return-to-automatic-criteria',
    $$Complete every applicable item before releasing a TRC-8 tracker row from P09 Safe Stow Hold. Acknowledging the alarm does not establish that the underlying condition has cleared.

Record the authorized inspection or maintenance disposition and confirm the movement envelope is clear of people, vehicles, tools, vegetation, debris, and row interference. Confirm position feedback is present and stable before a qualified operator initiates supervised motion under the approved motion-control procedure.

Complete three supervised commanded moves. For each move, verify absolute commanded-versus-measured deviation remains at or below 2.0 degrees. Verify drive-motor current remains at or below 6.5 amperes during each move and no abnormal noise, vibration, binding, or new P09 event is observed. Obtain control-room authorization, record the release to Automatic Tracking, and monitor the next tracking interval for recurrence.

If any criterion is unmet, feedback is missing or unstable, deviation exceeds 2.0 degrees, drive current exceeds 6.5 amperes, or P09 repeats, retain Safe Stow Hold and escalate to qualified maintenance.$$
    , '3cdbbda224f8e4f467bbdf2f0db8ff793625cdfdbd671fe0f270f307c2f699f5', 147
  )
ON CONFLICT (id) DO UPDATE SET
  retrieval_scope_id = excluded.retrieval_scope_id,
  chunk_index = excluded.chunk_index,
  page_start = excluded.page_start,
  page_end = excluded.page_end,
  section_heading = excluded.section_heading,
  source_anchor = excluded.source_anchor,
  content_text = excluded.content_text,
  content_sha256 = excluded.content_sha256,
  token_count = excluded.token_count;

INSERT INTO nextera.document_fault_code_links (
  id, document_version_id, fault_code, equipment_model, section_heading, relevance_note
) VALUES
  ('73000000-0000-4000-8000-000000000201', '71000000-0000-4000-8000-000000000201', 'P09', 'TRC-8 (Synthetic)', '6.3 Fault P09 — Tracker Position Deviation', 'Exact OEM definition, interpretation boundary, and P09 response.'),
  ('73000000-0000-4000-8000-000000000202', '71000000-0000-4000-8000-000000000202', 'P09', 'TRC-8 (Synthetic)', '4.2 Authorized tracker-row inspection', 'Approved Citrus exterior inspection and escalation sequence.'),
  ('73000000-0000-4000-8000-000000000203', '71000000-0000-4000-8000-000000000203', 'P09', 'TRC-8 (Synthetic)', '3. Return-to-automatic acceptance criteria', 'Approved P09 controlled-motion release criteria.')
ON CONFLICT (id) DO UPDATE SET
  fault_code = excluded.fault_code,
  equipment_model = excluded.equipment_model,
  section_heading = excluded.section_heading,
  relevance_note = excluded.relevance_note;

INSERT INTO nextera.document_equipment_links (
  id, document_version_id, equipment_id, equipment_model, relationship_type
)
SELECT
  values_to_insert.id,
  values_to_insert.document_version_id,
  CASE WHEN values_to_insert.asset_specific THEN e.id ELSE NULL END,
  'TRC-8 (Synthetic)',
  'applies_to'
FROM nextera.equipment AS e
CROSS JOIN (
  VALUES
    ('74000000-0000-4000-8000-000000000201'::UUID, '71000000-0000-4000-8000-000000000201'::UUID, false),
    ('74000000-0000-4000-8000-000000000202'::UUID, '71000000-0000-4000-8000-000000000202'::UUID, true),
    ('74000000-0000-4000-8000-000000000203'::UUID, '71000000-0000-4000-8000-000000000203'::UUID, false)
) AS values_to_insert (id, document_version_id, asset_specific)
WHERE e.plant_id = '10000000-0000-4000-8000-000000000003'
  AND e.equipment_code = 'TRK-01'
ON CONFLICT (id) DO UPDATE SET
  equipment_id = excluded.equipment_id,
  equipment_model = excluded.equipment_model,
  relationship_type = excluded.relationship_type;
