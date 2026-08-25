#!/usr/bin/env bash
set -euo pipefail

project_directory="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "${project_directory}"
exec ./scripts/run-with-openai-env.sh ./scripts/run-with-worker-env.sh npm run db:retrieval-golden
