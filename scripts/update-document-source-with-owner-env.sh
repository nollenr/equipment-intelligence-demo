#!/usr/bin/env bash
set -euo pipefail

if [[ "$#" -ne 3 || ! -r "$1" ]]; then
  printf 'Usage: %s READABLE_OWNER_ENV_FILE DOCUMENT_VERSION_ID BOOKMARKED_GOOGLE_DOC_URL\n' "$0" >&2
  exit 2
fi

owner_env_file="$1"
document_version_id="$2"
document_source_uri="$3"
project_directory="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# shellcheck disable=SC1090
source "${owner_env_file}"
if [[ -z "${STANDARD_CLUSTER_URI:-}" ]]; then
  printf 'The owner environment does not define STANDARD_CLUSTER_URI.\n' >&2
  exit 3
fi

export DATABASE_URL="${STANDARD_CLUSTER_URI}"
export DOCUMENT_VERSION_ID="${document_version_id}"
export DOCUMENT_SOURCE_URI="${document_source_uri}"
export CONFIRM_DOCUMENT_SOURCE_UPDATE='YES'

cd "${project_directory}"
npm run db:document-source

unset \
  DATABASE_URL \
  DOCUMENT_VERSION_ID \
  DOCUMENT_SOURCE_URI \
  CONFIRM_DOCUMENT_SOURCE_UPDATE \
  STANDARD_CLUSTER_URI \
  STANDARD_CLUSTER_RON_PASSWORD
