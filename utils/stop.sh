#!/usr/bin/env bash
# Stop processes started by utils/start.sh
set -euo pipefail

UTILS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$UTILS_DIR/.." && pwd)"
PIDFILE="${ROOT}/.local-dev/pids"

if [[ ! -f "$PIDFILE" ]]; then
  echo "No pid file at $PIDFILE (nothing to stop)."
  exit 0
fi

while read -r role pid; do
  [[ -z "${pid:-}" ]] && continue
  if kill -0 "$pid" 2>/dev/null; then
    echo "Stopping ${role} (pid ${pid})"
    kill "$pid" 2>/dev/null || true
    sleep 0.2
    kill -0 "$pid" 2>/dev/null && kill -9 "$pid" 2>/dev/null || true
  else
    echo "${role} pid ${pid} not running"
  fi
done <"$PIDFILE"

rm -f "$PIDFILE"
echo "Done."
