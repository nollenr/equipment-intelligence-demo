#!/usr/bin/env bash
set -euo pipefail

if [[ "$#" -ne 1 || ! -r "$1" ]]; then
  printf 'Usage: %s READABLE_OWNER_ENV_FILE\n' "$0" >&2
  exit 2
fi

owner_env_file="$1"
project_directory="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# shellcheck disable=SC1090
source "${owner_env_file}"
if [[ -z "${STANDARD_CLUSTER_URI:-}" ]]; then
  printf 'The owner environment does not define STANDARD_CLUSTER_URI.\n' >&2
  exit 3
fi

export DATABASE_URL="${STANDARD_CLUSTER_URI}"
cd "${project_directory}"
npm run db:seed

unset DATABASE_URL STANDARD_CLUSTER_URI STANDARD_CLUSTER_RON_PASSWORD
