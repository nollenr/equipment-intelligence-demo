#!/usr/bin/env bash
set -euo pipefail

state_directory="${XDG_STATE_HOME:-${HOME}/.local/state}/nextera-demo"
pid_file="${state_directory}/server.pid"

if [[ ! -f "${pid_file}" ]]; then
  printf 'No Equipment Intelligence PID file was found.\n'
  exit 0
fi

server_pid="$(<"${pid_file}")"
if [[ ! "${server_pid}" =~ ^[0-9]+$ ]]; then
  printf 'Refusing to act on an invalid PID file.\n' >&2
  exit 1
fi

if kill -0 "${server_pid}" 2>/dev/null; then
  kill "${server_pid}"
fi
rm -f "${pid_file}"
printf 'Equipment Intelligence stopped.\n'
