#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  printf 'DATABASE_URL is required. Run through scripts/run-with-runtime-env.sh.\n' >&2
  exit 2
fi

cockroach sql --url "${DATABASE_URL}" --format=table --execute "SHOW TABLES FROM nextera;"

for table_name in \
  equipment_fault_events \
  equipment_metric_summaries \
  document_chunks \
  diagnostic_runs \
  diagnostic_findings \
  diagnostic_document_sources \
  analysis_answers; do
  cockroach sql \
    --url "${DATABASE_URL}" \
    --format=table \
    --execute "SHOW CREATE TABLE nextera.${table_name};"
done
