#!/usr/bin/env bash
set -euo pipefail

project_directory="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
state_directory="${XDG_STATE_HOME:-${HOME}/.local/state}/nextera-demo"
pid_file="${state_directory}/server.pid"
log_file="${state_directory}/server.log"

mkdir -p "${state_directory}"

if [[ -f "${pid_file}" ]]; then
  previous_pid="$(<"${pid_file}")"
  if [[ "${previous_pid}" =~ ^[0-9]+$ ]] && kill -0 "${previous_pid}" 2>/dev/null; then
    kill "${previous_pid}"
    for _ in {1..20}; do
      if ! kill -0 "${previous_pid}" 2>/dev/null; then
        break
      fi
      sleep 0.25
    done
  fi
  rm -f "${pid_file}"
fi

cd "${project_directory}"
nohup ./scripts/run-with-runtime-env.sh ./node_modules/.bin/next start -H 0.0.0.0 -p 3000 \
  >"${log_file}" 2>&1 &
server_pid=$!
printf '%s\n' "${server_pid}" > "${pid_file}"

for _ in {1..40}; do
  if curl --fail --silent --output /dev/null http://127.0.0.1:3000/api/fleet; then
    printf 'Equipment Intelligence is listening on 0.0.0.0:3000 (PID %s).\n' "${server_pid}"
    exit 0
  fi
  if ! kill -0 "${server_pid}" 2>/dev/null; then
    printf 'The demo server exited during startup. Review %s.\n' "${log_file}" >&2
    exit 1
  fi
  sleep 0.5
done

printf 'The demo server did not become healthy in time. Review %s.\n' "${log_file}" >&2
exit 1
