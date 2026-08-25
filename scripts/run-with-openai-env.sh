#!/usr/bin/env bash
set -euo pipefail

if [[ "$#" -eq 0 ]]; then
  printf 'Usage: %s COMMAND [ARG ...]\n' "$0" >&2
  exit 2
fi

if [[ ! -t 0 ]]; then
  printf 'An interactive terminal is required to enter the OpenAI API key.\n' >&2
  exit 2
fi

# Always request a fresh value. This prevents an older inherited key from being
# reused accidentally and keeps the new value out of shell history and files.
unset OPENAI_API_KEY
printf 'Paste the OpenAI API key, then press Enter (input will remain hidden): ' >&2
if ! IFS= read -r -s openai_api_key; then
  printf '\nNo key was read. Nothing was started.\n' >&2
  exit 2
fi
printf '\n' >&2

if [[ -z "${openai_api_key}" ]]; then
  printf 'The OpenAI API key cannot be empty. Nothing was started.\n' >&2
  exit 2
fi

export OPENAI_API_KEY="${openai_api_key}"
unset openai_api_key

cleanup() {
  unset OPENAI_API_KEY
}
trap cleanup EXIT HUP INT TERM

"$@"
