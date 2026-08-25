-- Checkpoint 6 activates the synthetic A12 fan-variance investigation.
-- All equipment behavior, measurements, documents, and conclusions remain fictional.

INSERT INTO nextera.retrieval_scopes (
  id, scope_code, display_name, scope_type, description, is_active
) VALUES (
  '60000000-0000-4000-8000-000000000004',
  'babcock-site',
  'Babcock Ranch Site',
  'plant',
  'Synthetic site-specific procedures for the Babcock Ranch demo model.',
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
  ('50000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000004', 'read'),
  ('50000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000004', 'read')
ON CONFLICT (principal_id, retrieval_scope_id, permission) DO NOTHING;

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
    '40000000-0000-4000-8000-000000000013',
    '20000000-0000-4000-8000-000000000102',
    '30000000-0000-4000-8000-000000000112',
    'fan_command_percent',
    '2026-08-18 15:09:00+00:00',
    '2026-08-18 15:19:00+00:00',
    84.000000,
    92.000000,
    88.600000,
    92.000000,
    'percent',
    NULL,
    NULL,
    'ten_minute_window',
    'synthetic_historian_adapter',
    'fan-feedback-window-v1',
    '2026-08-18 15:19:05+00:00',
    true
  ),
  (
    '40000000-0000-4000-8000-000000000014',
    '20000000-0000-4000-8000-000000000102',
    '30000000-0000-4000-8000-000000000112',
    'fan_feedback_percent',
    '2026-08-18 15:09:00+00:00',
    '2026-08-18 15:19:00+00:00',
    71.000000,
    84.000000,
    77.000000,
    76.100000,
    'percent',
    NULL,
    NULL,
    'ten_minute_window',
    'synthetic_historian_adapter',
    'fan-feedback-window-v1',
    '2026-08-18 15:19:05+00:00',
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

INSERT INTO nextera.documents (
  id,
  document_code,
  title,
  document_type,
  owning_organization,
  source_system,
  is_synthetic
) VALUES
  (
    '70000000-0000-4000-8000-000000000101',
    'OEM-SD-8400-COOLING',
    'SD-8400 Cooling System, Operations & Fault Response Manual',
    'oem_manual',
    'Solara Dynamics (Synthetic)',
    'google_drive',
    true
  ),
  (
    '70000000-0000-4000-8000-000000000102',
    'SITE-BAB-FAN-INSPECTION',
    'Babcock Ranch Inverter Fan-System Inspection',
    'site_procedure',
    'Babcock Ranch Operations (Synthetic)',
    'google_drive',
    true
  ),
  (
    '70000000-0000-4000-8000-000000000103',
    'CHECKLIST-INV-RETURN-SERVICE',
    'Inverter Cooling-System Return-to-Service Checklist',
    'work_order',
    'Commissioning & Maintenance (Synthetic)',
    'google_drive',
    true
  )
ON CONFLICT (id) DO UPDATE SET
  document_code = excluded.document_code,
  title = excluded.title,
  document_type = excluded.document_type,
  owning_organization = excluded.owning_organization,
  source_system = excluded.source_system,
  is_synthetic = excluded.is_synthetic;

INSERT INTO nextera.document_versions (
  id,
  document_id,
  version_label,
  effective_date,
  approval_status,
  content_sha256,
  s3_bucket,
  s3_key,
  s3_version_id,
  source_uri,
  source_version_id,
  snapshot_uri,
  mime_type,
  page_count,
  is_current,
  ingested_at
) VALUES
  (
    '71000000-0000-4000-8000-000000000101',
    '70000000-0000-4000-8000-000000000101',
    '3.9',
    '2026-04-02',
    'approved',
    '7425d6b5d4991c648394c39b3cd35f74828248805f931e89c9f2e8ac2138752f',
    NULL,
    NULL,
    NULL,
    'https://docs.google.com/document/d/1mtVhbJU6C9cqSgKDoG3cJshvgDLsrzMnF_Jo9jZqA1E/edit?tab=t.0#bookmark=id.79irt63bba28',
    NULL,
    '/evidence/sd-8400-cooling-and-fault-manual-v3.9.pdf',
    'application/pdf',
    3,
    true,
    '2026-08-23 22:45:00+00:00'
  ),
  (
    '71000000-0000-4000-8000-000000000102',
    '70000000-0000-4000-8000-000000000102',
    '1.6',
    '2026-06-30',
    'approved',
    '709f5bd4c5e55fbfc4d96d853a63adb67faee1c4b783826a9f1058fef3fc68c1',
    NULL,
    NULL,
    NULL,
    'https://docs.google.com/document/d/1hPvJh7NJBeRFoAWUtT2eZUuy6f1pc-ZA7bmRo2WyF50/edit?tab=t.0#bookmark=id.6qe9fvqhtwwn',
    NULL,
    '/evidence/babcock-fan-inspection-procedure-v1.6.pdf',
    'application/pdf',
    3,
    true,
    '2026-08-23 22:45:00+00:00'
  ),
  (
    '71000000-0000-4000-8000-000000000103',
    '70000000-0000-4000-8000-000000000103',
    '2.4',
    '2026-07-08',
    'approved',
    'a828ca73d0b1b17722bfe52bef9a8e4b03df7a49a262bc18ac0ff7fd5d41fac5',
    NULL,
    NULL,
    NULL,
    'https://docs.google.com/document/d/1tylFM7Id9AAaerK1qT-LrVg6WAFdAiHVoOXAztEcaZg/edit?tab=t.0#bookmark=id.2vzn91sgl3kl',
    NULL,
    '/evidence/inverter-return-to-service-checklist-v2.4.pdf',
    'application/pdf',
    2,
    true,
    '2026-08-23 22:45:00+00:00'
  )
ON CONFLICT (id) DO UPDATE SET
  version_label = excluded.version_label,
  effective_date = excluded.effective_date,
  approval_status = excluded.approval_status,
  content_sha256 = excluded.content_sha256,
  s3_bucket = excluded.s3_bucket,
  s3_key = excluded.s3_key,
  s3_version_id = excluded.s3_version_id,
  source_uri = coalesce(nextera.document_versions.source_uri, excluded.source_uri),
  source_version_id = coalesce(nextera.document_versions.source_version_id, excluded.source_version_id),
  snapshot_uri = excluded.snapshot_uri,
  mime_type = excluded.mime_type,
  page_count = excluded.page_count,
  is_current = excluded.is_current,
  ingested_at = excluded.ingested_at;

INSERT INTO nextera.document_chunks (
  id,
  document_version_id,
  retrieval_scope_id,
  chunk_index,
  page_start,
  page_end,
  section_heading,
  source_anchor,
  content_text,
  content_sha256,
  token_count
) VALUES
  (
    '72000000-0000-4000-8000-000000000101',
    '71000000-0000-4000-8000-000000000101',
    '60000000-0000-4000-8000-000000000001',
    0,
    3,
    3,
    '8.4 Fault A12 — Cooling Fan Feedback Variance',
    'section-8-4-fault-a12',
    $$Fault A12 is asserted when the derived cooling-fan command/feedback variance exceeds the configured 12-percentage-point threshold during the controller diagnostic window. The inverter enters Maintenance Hold so the cooling system can be inspected before return to service.

A12 establishes that commanded and reported fan speed disagreed beyond the configured limit. It does not, by itself, prove a failed fan. Obstruction, connector or wiring conditions, feedback sensing, and intermittent mechanical drag remain possible until inspected.

Keep the inverter in Maintenance Hold and confirm the event and diagnostic window with the control room. Inspect accessible intake screens, exhaust openings, fan guards, and the exterior cooling-air path for obstruction, contamination, or damage. Compare fan command and fan feedback; treat missing, unstable, or persistently divergent feedback as unresolved. Use the approved site procedure before any internal inspection and do not open energized compartments for this check. Apply the approved return-to-service checklist after corrective work; do not clear A12 solely because the alarm is acknowledged.

High ambient temperature can increase fan demand, but ambient temperature alone does not explain excessive command/feedback variance or establish component failure.
$$,
    'b7e8a3f6d0325b673351b048f0d76be54220c0740a997cf66a7c57eabd7e0165',
    183
  ),
  (
    '72000000-0000-4000-8000-000000000102',
    '71000000-0000-4000-8000-000000000102',
    '60000000-0000-4000-8000-000000000004',
    0,
    3,
    3,
    '5.2 Authorized fan-system inspection',
    'section-5-2-authorized-fan-inspection',
    $$Use this sequence for INV-102 while it remains in Maintenance Hold after fault A12. Notify the control room that inspection is beginning.

From the exterior, inspect intake screens, exhaust openings, fan guards, and the visible cooling-air path for vegetation, dust loading, loose material, water, or physical damage. Review fan command and fan-feedback trends for the same time window. Record whether feedback is present, stable, and responsive when command changes.

If the latest variance remains above 12 percentage points, feedback is missing or unstable, or abnormal noise or vibration is reported, keep the inverter in Maintenance Hold and create a qualified-maintenance work order. If corrective work is performed, record the disposition and use the approved return-to-service checklist. Acknowledging A12 is not sufficient for release.

Escalate whenever access beyond exterior inspection is required, debris cannot be safely removed under the current work authorization, or command/feedback disagreement persists after the exterior cooling path is confirmed clear.
$$,
    'f71c135b9a9211d754397569666334b3ea55935aeb8784fb7ad680cd85d6f04b',
    150
  ),
  (
    '72000000-0000-4000-8000-000000000103',
    '71000000-0000-4000-8000-000000000103',
    '60000000-0000-4000-8000-000000000004',
    0,
    2,
    2,
    '3. Return-to-service acceptance criteria',
    'section-3-return-to-service-criteria',
    $$Complete every applicable item before releasing an SD-8400 inverter from an A12 Maintenance Hold. An acknowledged alarm is not evidence that the underlying condition has cleared.

Record the authorized inspection or maintenance disposition, including any obstruction removed and any qualified work performed. Confirm intake screens, exhaust openings, guards, and the exterior cooling-air path are clear and restored to their approved configuration. Confirm fan feedback is present and stable. After fan command is stable at or above 80 percent, verify command/feedback variance remains at or below 5 percentage points for ten continuous minutes. Confirm no new A12 event occurs during the ten-minute verification interval and no abnormal fan noise or vibration is reported. Obtain control-room authorization, record the release, and monitor the next loaded operating interval for recurrence.

If any acceptance criterion is unmet, feedback is missing or unstable, variance remains above 5 percentage points, or A12 repeats, retain Maintenance Hold and escalate to qualified maintenance.
$$,
    '78b007c6a3660c17a0271fbce889d0c9a3a01aa31c058f7e4247d5bfdeee1028',
    142
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
  id,
  document_version_id,
  fault_code,
  equipment_model,
  section_heading,
  relevance_note
) VALUES
  (
    '73000000-0000-4000-8000-000000000101',
    '71000000-0000-4000-8000-000000000101',
    'A12',
    'SD-8400 (Synthetic)',
    '8.4 Fault A12 — Cooling Fan Feedback Variance',
    'Exact OEM definition, interpretation boundary, and required A12 checks.'
  ),
  (
    '73000000-0000-4000-8000-000000000102',
    '71000000-0000-4000-8000-000000000102',
    'A12',
    'SD-8400 (Synthetic)',
    '5.2 Authorized fan-system inspection',
    'Approved Babcock Ranch exterior inspection and escalation sequence.'
  ),
  (
    '73000000-0000-4000-8000-000000000103',
    '71000000-0000-4000-8000-000000000103',
    'A12',
    'SD-8400 (Synthetic)',
    '3. Return-to-service acceptance criteria',
    'Approved A12 maintenance-release verification criteria.'
  )
ON CONFLICT (id) DO UPDATE SET
  fault_code = excluded.fault_code,
  equipment_model = excluded.equipment_model,
  section_heading = excluded.section_heading,
  relevance_note = excluded.relevance_note;

INSERT INTO nextera.document_equipment_links (
  id,
  document_version_id,
  equipment_id,
  equipment_model,
  relationship_type
) VALUES
  (
    '74000000-0000-4000-8000-000000000101',
    '71000000-0000-4000-8000-000000000101',
    NULL,
    'SD-8400 (Synthetic)',
    'applies_to'
  ),
  (
    '74000000-0000-4000-8000-000000000102',
    '71000000-0000-4000-8000-000000000102',
    '20000000-0000-4000-8000-000000000102',
    'SD-8400 (Synthetic)',
    'applies_to'
  ),
  (
    '74000000-0000-4000-8000-000000000103',
    '71000000-0000-4000-8000-000000000103',
    NULL,
    'SD-8400 (Synthetic)',
    'applies_to'
  )
ON CONFLICT (id) DO UPDATE SET
  equipment_id = excluded.equipment_id,
  equipment_model = excluded.equipment_model,
  relationship_type = excluded.relationship_type;
