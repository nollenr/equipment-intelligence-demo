#!/usr/bin/env bash
set -euo pipefail

project_directory="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

exec "${project_directory}/scripts/run-with-openai-env.sh" \
  "${project_directory}/scripts/activate-checkpoint3-with-key.sh"
