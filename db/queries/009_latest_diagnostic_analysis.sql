-- Most recent completed deterministic analysis for an incident and demo principal.
SELECT
  run.id AS diagnostic_run_id,
  run.diagnostic_rule_code,
  run.diagnostic_rule_version,
  run.evidence_state,
  answer.answer_text,
  answer.recommended_action,
  answer.confidence_label,
  answer.confidence_basis
FROM nextera.diagnostic_runs AS run
JOIN nextera.demo_principals AS principal
  ON principal.id = run.requested_by_principal_id
JOIN nextera.analysis_answers AS answer
  ON answer.diagnostic_run_id = run.id
WHERE run.fault_event_id = '30000000-0000-4000-8000-000000000017'
  AND principal.principal_code = 'field-tech-demo'
  AND run.run_status = 'completed'
ORDER BY run.started_at DESC, run.id
LIMIT 1;
