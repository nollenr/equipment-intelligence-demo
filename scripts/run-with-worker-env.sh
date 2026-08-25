#!/usr/bin/env bash
set -euo pipefail

worker_env_file="${NEXTERA_WORKER_ENV_FILE:-/home/ec2-user/.config/nextera-demo/worker.env}"

if [[ ! -r "${worker_env_file}" ]]; then
  printf 'Embedding-worker database environment is unavailable at %s.\n' "${worker_env_file}" >&2
  exit 2
fi

# shellcheck disable=SC1090
source "${worker_env_file}"
export DATABASE_URL

exec "$@"
