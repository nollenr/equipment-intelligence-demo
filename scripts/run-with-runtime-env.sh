#!/usr/bin/env bash
set -euo pipefail

runtime_env_file="${NEXTERA_RUNTIME_ENV_FILE:-/home/ec2-user/.config/nextera-demo/db.env}"

if [[ ! -r "${runtime_env_file}" ]]; then
  printf 'Runtime database environment is unavailable at %s.\n' "${runtime_env_file}" >&2
  exit 2
fi

# shellcheck disable=SC1090
source "${runtime_env_file}"
export DATABASE_URL

exec "$@"
