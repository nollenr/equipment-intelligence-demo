#!/usr/bin/env bash
set -euo pipefail

project_directory="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
state_directory="${XDG_STATE_HOME:-${HOME}/.local/state}/nextera-demo"
retrieval_report="${state_directory}/checkpoint3-retrieval.log"

if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  printf 'OPENAI_API_KEY was not provided by the silent launcher.\n' >&2
  exit 2
fi

mkdir -p "${state_directory}"
chmod 700 "${state_directory}"
umask 077

cd "${project_directory}"
./scripts/run-with-worker-env.sh npm run db:embed
./scripts/run-with-worker-env.sh npm run db:retrieval-golden | tee "${retrieval_report}"
./scripts/start-demo.sh
./scripts/smoke-test.sh

printf 'Checkpoint 3 activation completed. Retrieval report: %s\n' "${retrieval_report}"
