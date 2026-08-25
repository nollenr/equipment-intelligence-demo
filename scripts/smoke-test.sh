#!/usr/bin/env bash
set -euo pipefail

base_url="${1:-http://127.0.0.1:3000}"
canonical_incident_id="30000000-0000-4000-8000-000000000017"
a12_incident_id="30000000-0000-4000-8000-000000000112"
c04_incident_id="30000000-0000-4000-8000-000000000204"
p09_incident_id="30000000-0000-4000-8000-000000000201"

fleet_html="$(curl --fail --silent --show-error "${base_url}/fleet")"
if [[ "${fleet_html}" != *"/incidents/${canonical_incident_id}"* ]]; then
  printf 'The fleet page does not link to the canonical B17 investigation.\n' >&2
  exit 1
fi
if [[ "${fleet_html}" != *"/incidents/${p09_incident_id}"* || "${fleet_html}" != *"P09"* || "${fleet_html}" != *"TRK-01"* ]]; then
  printf 'The fleet page does not expose the active P09 tracker-controller incident.\n' >&2
  exit 1
fi
if [[ "${fleet_html}" != *'2 active incidents require attention'* || "${fleet_html}" != *'data-active-count="2"'* ]]; then
  printf 'The fleet page does not expose the expected data-driven active attention queue.\n' >&2
  exit 1
fi
if [[ "${fleet_html}" != *'Investigation underway'* || "${fleet_html}" != *"/incidents/${a12_incident_id}"* ]]; then
  printf 'The fleet page does not expose the acknowledged investigation queue.\n' >&2
  exit 1
fi
if [[ "${fleet_html}" != *'href="/fleet/correlation"'* || "${fleet_html}" != *"Fleet Intelligence"* ]]; then
  printf 'The fleet page does not link to the B17 fleet-correlation workflow.\n' >&2
  exit 1
fi
if [[ "${fleet_html}" != *"Change persona"* ]]; then
  printf 'The global persona switcher is missing from the fleet header.\n' >&2
  exit 1
fi
curl --fail --silent --show-error --output /dev/null "${base_url}/api/fleet"
correlation_html="$(curl --fail --silent --show-error --cookie 'nextera_demo_role=fleet-engineer' "${base_url}/fleet/correlation")"
if [[ "${correlation_html}" != *"High-ambient pattern analysis"* || "${correlation_html}" != *"INV-107"* ]]; then
  printf 'The fleet-correlation page is missing its heading or comparison event set.\n' >&2
  exit 1
fi
handoff_question="Are there other inverters that had the same problem and was weather a problem in all of them?"
handoff_html="$(curl \
  --fail \
  --get \
  --silent \
  --show-error \
  --cookie 'nextera_demo_role=fleet-engineer' \
  --data-urlencode "question=${handoff_question}" \
  --data 'run=1' \
  "${base_url}/fleet/correlation")"
if [[ "${handoff_html}" != *"${handoff_question}"* || "${handoff_html}" != *"Engineering scope authorized"* ]]; then
  printf 'The incident-to-fleet handoff did not preserve its question and Fleet Engineer persona.\n' >&2
  exit 1
fi
field_correlation_html="$(curl --fail --silent --show-error --cookie 'nextera_demo_role=field-tech' "${base_url}/fleet/correlation")"
if [[ "${field_correlation_html}" != *"Engineering scope restricted"* ]]; then
  printf 'The Field Technician view does not show the engineering restriction.\n' >&2
  exit 1
fi
persona_response="$(curl \
  --fail \
  --include \
  --silent \
  --show-error \
  --header 'Content-Type: application/json' \
  --data '{"role":"fleet-engineer"}' \
  "${base_url}/api/persona")"
if [[ "${persona_response}" != *'"role":"fleet-engineer"'* || "${persona_response}" != *'nextera_demo_role=fleet-engineer'* ]]; then
  printf 'The global persona endpoint did not return and persist the Fleet Engineer role.\n' >&2
  exit 1
fi
field_correlation_api="$(curl --fail --silent --show-error "${base_url}/api/fleet/correlation?principal=field-tech-demo")"
if [[ "${field_correlation_api}" != *'"access":"engineering_restricted"'* || "${field_correlation_api}" != *'"latestAnalysis":null'* ]]; then
  printf 'The Field Technician API response exposed restricted fleet analysis.\n' >&2
  exit 1
fi
engineering_correlation_api="$(curl --fail --silent --show-error "${base_url}/api/fleet/correlation?principal=fleet-engineer-demo")"
if [[ "${engineering_correlation_api}" != *'"access":"engineering_authorized"'* || "${engineering_correlation_api}" != *'"eventCount":8'* ]]; then
  printf 'The Fleet Engineer API response is missing authorization or the event set.\n' >&2
  exit 1
fi
field_analysis_status="$(curl \
  --silent \
  --show-error \
  --output /dev/null \
  --write-out '%{http_code}' \
  --header 'Content-Type: application/json' \
  --data '{"principalCode":"field-tech-demo","question":"Which other inverters recorded B17?"}' \
  "${base_url}/api/fleet/correlation")"
if [[ "${field_analysis_status}" != "403" ]]; then
  printf 'Expected Field Technician fleet analysis to return 403; received %s.\n' "${field_analysis_status}" >&2
  exit 1
fi
curl --fail --silent --show-error --output /dev/null "${base_url}/assets"
curl --fail --silent --show-error --output /dev/null "${base_url}/api/assets"
curl --fail --silent --show-error --output /dev/null "${base_url}/incidents/${canonical_incident_id}"
curl --fail --silent --show-error --output /dev/null "${base_url}/api/incidents/${canonical_incident_id}"
a12_html="$(curl --fail --silent --show-error "${base_url}/incidents/${a12_incident_id}")"
if [[ "${a12_html}" != *"3 approved sources authorized"* || "${a12_html}" != *"fan_feedback_variance_a12/v1.0"* ]]; then
  printf 'The A12 incident is not exposing its three-source grounded investigation.\n' >&2
  exit 1
fi
curl --fail --silent --show-error --output /dev/null "${base_url}/api/incidents/${a12_incident_id}"
p09_html="$(curl --fail --silent --show-error "${base_url}/incidents/${p09_incident_id}")"
if [[ "${p09_html}" != *"3 approved sources authorized"* || "${p09_html}" != *"tracker_position_deviation_p09/v1.0"* || "${p09_html}" != *"Position deviation peak"* ]]; then
  printf 'The P09 tracker incident is not exposing its three-source grounded investigation.\n' >&2
  exit 1
fi
for google_document_id in \
  1KiG-L5ZFPfDf28mQOTbAs2ugnWQZqWST83ywMhPhs40 \
  1cqAPDIhou1H4xWBsF7AxQyYShl438OFJTO_DPR3KcFE \
  1_33jsvqOJwX_rSuM4iPXGF1PRwkBxjAERfb_uJvNZLU; do
  if [[ "${p09_html}" != *"${google_document_id}"* ]]; then
    printf 'The P09 incident is missing configured Google document %s.\n' "${google_document_id}" >&2
    exit 1
  fi
done
curl --fail --silent --show-error --output /dev/null "${base_url}/api/incidents/${p09_incident_id}"
curl --fail --silent --show-error --output /dev/null "${base_url}/incidents/${c04_incident_id}"
curl --fail --silent --show-error --output /dev/null "${base_url}/api/incidents/${c04_incident_id}"

incident_html="$(curl --fail --silent --show-error "${base_url}/incidents/${canonical_incident_id}")"
mapfile -t incident_assets < <(
  printf '%s' "${incident_html}" \
    | grep --only-matching --extended-regexp '/_next/static/[^" ]+' \
    | sort --unique
)
if [[ "${#incident_assets[@]}" -eq 0 ]]; then
  printf 'No Next.js assets were discovered in the canonical incident page.\n' >&2
  exit 1
fi
for incident_asset in "${incident_assets[@]}"; do
  curl --fail --silent --show-error --output /dev/null "${base_url}${incident_asset}"
done

mapfile -t correlation_assets < <(
  printf '%s' "${correlation_html}" \
    | grep --only-matching --extended-regexp '/_next/static/[^" ]+' \
    | sort --unique
)
if [[ "${#correlation_assets[@]}" -eq 0 ]]; then
  printf 'No Next.js assets were discovered in the fleet-correlation page.\n' >&2
  exit 1
fi
for correlation_asset in "${correlation_assets[@]}"; do
  curl --fail --silent --show-error --output /dev/null "${base_url}${correlation_asset}"
done

for evidence_path in \
  hps-2500x-operations-manual-v4.2.pdf \
  manatee-cooling-inspection-procedure-v2.1.pdf \
  fleet-b17-high-ambient-bulletin-v1.3.pdf \
  sd-8400-cooling-and-fault-manual-v3.9.pdf \
  babcock-fan-inspection-procedure-v1.6.pdf \
  inverter-return-to-service-checklist-v2.4.pdf; do
  curl --fail --silent --show-error --output /dev/null "${base_url}/evidence/${evidence_path}"
done

for evidence_path in \
  trc-8-tracker-controller-manual-v2.7.pdf \
  citrus-tracker-row-inspection-procedure-v1.4.pdf \
  tracker-return-to-automatic-checklist-v2.0.pdf; do
  curl --fail --silent --show-error --output /dev/null "${base_url}/evidence/${evidence_path}"
done

for unsupported_incident_id in "${c04_incident_id}"; do
  status_code="$(curl \
    --silent \
    --show-error \
    --output /dev/null \
    --write-out '%{http_code}' \
    --header 'Content-Type: application/json' \
    --data '{"question":"Analyze this incident."}' \
    "${base_url}/api/incidents/${unsupported_incident_id}/analysis")"
  if [[ "${status_code}" != "422" ]]; then
    printf 'Expected unsupported analysis to return 422 for %s; received %s.\n' \
      "${unsupported_incident_id}" \
      "${status_code}" >&2
    exit 1
  fi
done

printf 'Smoke test passed for fleet, fleet correlation, role-bound access, inventory, grounded B17/A12/P09 investigations, four incidents, browser assets, nine evidence snapshots, APIs, and the safe unsupported C04 path.\n'
