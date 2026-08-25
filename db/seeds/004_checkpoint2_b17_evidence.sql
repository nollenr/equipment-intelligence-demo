-- Google Docs are the intended canonical source. Snapshot URIs are live until corporate URLs are configured.
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
    '70000000-0000-4000-8000-000000000001',
    'OEM-HPS-2500X-OM',
    'HPS-2500X Installation, Operations & Maintenance Manual',
    'oem_manual',
    'Helios Power Systems (Synthetic)',
    'google_drive',
    true
  ),
  (
    '70000000-0000-4000-8000-000000000002',
    'SITE-MAN-COOLING-INSPECTION',
    'Manatee Inverter Cooling-System Inspection',
    'site_procedure',
    'FPL Manatee Solar Energy Center (Synthetic)',
    'google_drive',
    true
  ),
  (
    '70000000-0000-4000-8000-000000000003',
    'FLEET-B17-HIGH-AMBIENT',
    'B17 Events During High-Ambient Operation',
    'fleet_bulletin',
    'Fleet Reliability Engineering (Synthetic)',
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
    '71000000-0000-4000-8000-000000000001',
    '70000000-0000-4000-8000-000000000001',
    '4.2',
    '2026-03-01',
    'approved',
    '3201f077368d4267fae09780aff83bcabb09c83eedf7ea95c549fa4735d79052',
    NULL,
    NULL,
    NULL,
    'https://docs.google.com/document/d/14W8wzxaFnKKhVQ7BSGLLbKiivRLPnOcP-0PzVHQiCr0/edit?tab=t.0#bookmark=id.21d0z9um6x2s',
    NULL,
    '/evidence/hps-2500x-operations-manual-v4.2.pdf',
    'application/pdf',
    3,
    true,
    '2026-08-23 19:00:00+00:00'
  ),
  (
    '71000000-0000-4000-8000-000000000002',
    '70000000-0000-4000-8000-000000000002',
    '2.1',
    '2026-06-15',
    'approved',
    '60a9a61dff097383493f7d928d0247b463a3b0cf37608698db2ecf8b4a43a2a9',
    NULL,
    NULL,
    NULL,
    'https://docs.google.com/document/d/1wnsBvTH5j9KNLrVVHX0uJHK6zh1T9RBtMlRpUT7mtpA/edit?tab=t.0#bookmark=id.9ocau7t8i5rv',
    NULL,
    '/evidence/manatee-cooling-inspection-procedure-v2.1.pdf',
    'application/pdf',
    3,
    true,
    '2026-08-23 19:00:00+00:00'
  ),
  (
    '71000000-0000-4000-8000-000000000003',
    '70000000-0000-4000-8000-000000000003',
    '1.3',
    '2026-07-10',
    'approved',
    '16b641821d0f20a8bed4e983dc94ba6851d688141d5e1a544529a5806f4965b8',
    NULL,
    NULL,
    NULL,
    'https://docs.google.com/document/d/1jJXcZx73qZzyK7Dh9zNy0k-kGvxCD0I4aOcP1xppVdk/edit?tab=t.0#bookmark=id.u8jycdxnprrg',
    NULL,
    '/evidence/fleet-b17-high-ambient-bulletin-v1.3.pdf',
    'application/pdf',
    2,
    true,
    '2026-08-23 19:00:00+00:00'
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
    '72000000-0000-4000-8000-000000000001',
    '71000000-0000-4000-8000-000000000001',
    '60000000-0000-4000-8000-000000000001',
    0,
    3,
    3,
    '7.3 Fault B17 — Controller Thermal Derating',
    'section-7-3-fault-b17',
    $$Fault B17 is asserted when controller temperature exceeds the configured 75 °C derating threshold. The inverter remains connected and reduces active-power output to protect controller electronics. A B17 event changes the operating state from Full Output to Derated. It is a protective derating event, not evidence by itself of a failed controller or a full inverter trip.

Before reset or return to full output: verify controller temperature is trending downward and has remained below 70 °C for at least five minutes; inspect cooling-air intake and exhaust paths for obstruction or contamination; confirm cooling-fan feedback is present and does not show sustained variance from command; confirm the ambient-temperature input is plausible; and use the approved site procedure to acknowledge the event and restore service. Escalate repeated B17 events to reliability engineering. High ambient temperature can reduce thermal margin, but it does not by itself establish root cause.
$$,
    '773204ed2c4cc9478150daaab395d39e9aae564cdaab3de117ab0037e69a123f',
    148
  ),
  (
    '72000000-0000-4000-8000-000000000002',
    '71000000-0000-4000-8000-000000000002',
    '60000000-0000-4000-8000-000000000002',
    0,
    2,
    2,
    '4.2 Authorized inspection sequence',
    'section-4-2-authorized-inspection',
    $$Use this procedure when an HPS-2500X inverter remains online in a B17 derated state. Stop and use the site’s higher-severity response if the asset is faulted, offline, damaged, or presents an unsafe condition.

Authorized inspection sequence: record controller-temperature peak, configured threshold, ambient-temperature peak, and current active-power output. From the exterior, inspect intake screens and exhaust openings for visible obstruction, vegetation, dust loading, or water intrusion. Review fan command and fan-feedback indications. If feedback is missing or unstable, place the inverter in maintenance hold and escalate. Confirm temperature is declining after derating. If temperature is stable or rising, do not reset; notify the control room and reliability engineering. When OEM recovery criteria are met, acknowledge B17 through the approved operator interface and monitor for ten minutes. Do not reset solely because output is reduced; the protective state must be understood and the cooling path checked first.
$$,
    'd6e30909dc054abe2d6782456fe278a3c4a2ee22cc97dabaf5f4af5fb2e8561c',
    139
  ),
  (
    '72000000-0000-4000-8000-000000000003',
    '71000000-0000-4000-8000-000000000003',
    '60000000-0000-4000-8000-000000000003',
    0,
    2,
    2,
    '2. Fleet Pattern and Engineering Guidance',
    'section-2-fleet-pattern',
    $$Synthetic fleet review found that B17 frequency increased when ambient temperature exceeded 35 °C and cooling-path restriction was also present. Ambient temperature alone was not a sufficient predictor. Treat 35 °C as a fleet-analysis context threshold, not an OEM trip or derating setpoint. Do not infer fan failure or contamination from temperature and weather data alone. For repeated B17 events, compare affected units with same-model peers and review inspection results. Retain the exact metric window, document versions, and field disposition with each diagnostic run.

For the Manatee example, a 36.8 °C ambient peak provides relevant context, while the 78.4 °C controller peak versus the 75 °C OEM threshold establishes the deterministic exceedance.
$$,
    'd6acffed105319f6ddbc0ddc08800c79405eb7f085973101b399a3980a7ac1f6',
    105
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
  ('73000000-0000-4000-8000-000000000001', '71000000-0000-4000-8000-000000000001', 'B17', 'HPS-2500X (Synthetic)', '7.3 Fault B17 — Controller Thermal Derating', 'Exact OEM fault definition and recovery criteria.'),
  ('73000000-0000-4000-8000-000000000002', '71000000-0000-4000-8000-000000000002', 'B17', 'HPS-2500X (Synthetic)', '4.2 Authorized inspection sequence', 'Approved Manatee inspection and escalation sequence.'),
  ('73000000-0000-4000-8000-000000000003', '71000000-0000-4000-8000-000000000003', 'B17', 'HPS-2500X (Synthetic)', '2. Fleet Pattern and Engineering Guidance', 'Restricted fleet context for B17 during high ambient conditions.')
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
  ('74000000-0000-4000-8000-000000000001', '71000000-0000-4000-8000-000000000001', NULL, 'HPS-2500X (Synthetic)', 'applies_to'),
  ('74000000-0000-4000-8000-000000000002', '71000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000042', 'HPS-2500X (Synthetic)', 'applies_to'),
  ('74000000-0000-4000-8000-000000000003', '71000000-0000-4000-8000-000000000003', NULL, 'HPS-2500X (Synthetic)', 'applies_to')
ON CONFLICT (id) DO UPDATE SET
  equipment_id = excluded.equipment_id,
  equipment_model = excluded.equipment_model,
  relationship_type = excluded.relationship_type;
