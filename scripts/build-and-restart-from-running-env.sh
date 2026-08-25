#!/usr/bin/env bash
set -euo pipefail

project_directory="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

npm --prefix "${project_directory}" run build
exec bash "${project_directory}/scripts/restart-demo-from-running-env.sh"
