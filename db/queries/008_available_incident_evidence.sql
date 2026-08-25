-- Authorized exact-match evidence for a resolved incident/equipment/principal.
SELECT
  d.document_code,
  d.title,
  dv.version_label,
  dc.page_start,
  dc.section_heading,
  rs.scope_code
FROM nextera.demo_principals AS principal
JOIN nextera.retrieval_scope_permissions AS permission
  ON permission.principal_id = principal.id AND permission.permission = 'read'
JOIN nextera.retrieval_scopes AS rs
  ON rs.id = permission.retrieval_scope_id AND rs.is_active
JOIN nextera.document_chunks AS dc
  ON dc.retrieval_scope_id = rs.id
JOIN nextera.document_versions AS dv
  ON dv.id = dc.document_version_id AND dv.is_current AND dv.approval_status = 'approved'
JOIN nextera.documents AS d
  ON d.id = dv.document_id
JOIN nextera.document_fault_code_links AS fault_link
  ON fault_link.document_version_id = dv.id
  AND fault_link.fault_code = 'B17'
  AND fault_link.equipment_model = 'HPS-2500X (Synthetic)'
  AND fault_link.section_heading = dc.section_heading
WHERE principal.principal_code = 'field-tech-demo'
  AND principal.is_active
  AND EXISTS (
    SELECT 1
    FROM nextera.document_equipment_links AS equipment_link
    WHERE equipment_link.document_version_id = dv.id
      AND (
        equipment_link.equipment_id = '20000000-0000-4000-8000-000000000042'
        OR equipment_link.equipment_model = 'HPS-2500X (Synthetic)'
      )
  )
ORDER BY d.document_type, d.title, dc.chunk_index;
