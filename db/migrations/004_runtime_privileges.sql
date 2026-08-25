GRANT USAGE ON SCHEMA nextera TO nextera_app_read;
GRANT USAGE ON SCHEMA nextera TO nextera_app_runtime;

GRANT SELECT ON TABLE
  nextera.plants,
  nextera.equipment,
  nextera.equipment_fault_events,
  nextera.equipment_metric_summaries,
  nextera.demo_principals,
  nextera.retrieval_scopes,
  nextera.retrieval_scope_permissions,
  nextera.documents,
  nextera.document_versions,
  nextera.document_chunks,
  nextera.document_fault_code_links,
  nextera.document_equipment_links,
  nextera.diagnostic_runs,
  nextera.diagnostic_findings,
  nextera.diagnostic_document_sources,
  nextera.diagnostic_metric_sources,
  nextera.analysis_answers,
  nextera.analysis_answer_document_sources,
  nextera.analysis_answer_metric_sources,
  nextera.analysis_answer_finding_sources
TO nextera_app_read;

GRANT INSERT, UPDATE ON TABLE
  nextera.diagnostic_runs,
  nextera.diagnostic_findings,
  nextera.diagnostic_document_sources,
  nextera.diagnostic_metric_sources,
  nextera.analysis_answers,
  nextera.analysis_answer_document_sources,
  nextera.analysis_answer_metric_sources,
  nextera.analysis_answer_finding_sources
TO nextera_app_runtime;
