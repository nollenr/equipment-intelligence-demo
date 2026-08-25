#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${STANDARD_CLUSTER_URI:-}" ]]; then
  printf 'STANDARD_CLUSTER_URI must be present in the process environment.\n' >&2
  exit 2
fi

secret_directory="${NEXTERA_SECRET_DIR:-/home/ec2-user/.config/nextera-demo}"
worker_env_file="${secret_directory}/worker.env"
generated_password="${NEXTERA_WORKER_PASSWORD:-$(openssl rand -hex 24)}"

if [[ ! "${generated_password}" =~ ^[A-Za-z0-9._~-]{24,}$ ]]; then
  printf 'The embedding-worker password must be at least 24 URL-safe characters.\n' >&2
  exit 3
fi

sql_file=$(mktemp)
error_file=$(mktemp)
cleanup() {
  rm -f "${sql_file}" "${error_file}"
  unset generated_password
}
trap cleanup EXIT
chmod 600 "${sql_file}"

printf "CREATE USER IF NOT EXISTS nextera_embedder;\nALTER USER nextera_embedder WITH PASSWORD '%s';\nGRANT nextera_embedding_worker TO nextera_embedder;\n" \
  "${generated_password}" > "${sql_file}"

if ! cockroach sql --url "${STANDARD_CLUSTER_URI}" --file "${sql_file}" \
  >/dev/null 2>"${error_file}"; then
  printf 'Embedding-worker identity provisioning failed; CockroachDB details were suppressed.\n' >&2
  exit 4
fi

uri_scheme="${STANDARD_CLUSTER_URI%%://*}"
uri_after_scheme="${STANDARD_CLUSTER_URI#*://}"
uri_after_authority="${uri_after_scheme#*@}"
worker_uri="${uri_scheme}://nextera_embedder:${generated_password}@${uri_after_authority}"

install -d -m 700 "${secret_directory}"
umask 077
printf "export DATABASE_URL='%s'\n" "${worker_uri}" > "${worker_env_file}"
chmod 600 "${worker_env_file}"

printf 'Embedding-worker identity nextera_embedder is ready.\n'
printf 'Worker environment written to %s with mode 0600.\n' "${worker_env_file}"
