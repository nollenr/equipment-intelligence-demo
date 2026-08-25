#!/usr/bin/env bash
set -euo pipefail

project_directory="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
state_directory="${XDG_STATE_HOME:-${HOME}/.local/state}/nextera-demo"
pid_file="${state_directory}/server.pid"

if [[ ! -f "${pid_file}" ]]; then
  printf 'No running Equipment Intelligence PID file was found.\n' >&2
  exit 1
fi

source_pid="$(<"${pid_file}")"
if [[ ! "${source_pid}" =~ ^[0-9]+$ ]] || ! kill -0 "${source_pid}" 2>/dev/null; then
  printf 'The recorded Equipment Intelligence process is not running.\n' >&2
  exit 1
fi

process_environment="/proc/${source_pid}/environ"
if [[ ! -r "${process_environment}" ]]; then
  printf 'The running server environment is not readable by this operating-system user.\n' >&2
  exit 1
fi

openai_api_key=''
while IFS= read -r -d '' environment_entry; do
  case "${environment_entry}" in
    OPENAI_API_KEY=*)
      openai_api_key="${environment_entry#OPENAI_API_KEY=}"
      break
      ;;
  esac
done < "${process_environment}"

if [[ -z "${openai_api_key}" ]]; then
  printf 'The running server does not contain OPENAI_API_KEY; use start-demo-with-openai.sh instead.\n' >&2
  exit 1
fi

export OPENAI_API_KEY="${openai_api_key}"
unset openai_api_key environment_entry

exec "${project_directory}/scripts/start-demo.sh"
