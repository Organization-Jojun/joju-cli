#!/usr/bin/env bash
# Legacy path. Prefer: curl -fsSL .../install.sh | bash  (repo root)
set -euo pipefail
if [ -n "${BASH_SOURCE[0]:-}" ] && [ -f "${BASH_SOURCE[0]}" ]; then
  ROOT="$(CDPATH= cd -- "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  if [ -f "$ROOT/install.sh" ]; then
    exec bash "$ROOT/install.sh" "$@"
  fi
fi
exec bash -c "$(curl -fsSL -H 'User-Agent: jojun-cli' https://raw.githubusercontent.com/Organization-Jojun/joju-cli/main/install.sh)"
