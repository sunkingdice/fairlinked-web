#!/usr/bin/env bash
# Local Fairlinked + membership API for debugging (not for production deploy).
set -euo pipefail

UTILS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$UTILS_DIR/.." && pwd)"
PIDFILE="${ROOT}/.local-dev/pids"
mkdir -p "${ROOT}/.local-dev"

HUGO_PORT="${FAIRLINKED_HUGO_PORT:-1314}"
API_PORT="${FAIRLINKED_API_PORT:-8081}"
API_BIN="${ROOT}/api/fairlinked-membership-api"

alive() {
  local p="$1"
  kill -0 "$p" 2>/dev/null
}

# PIDs listening on TCP port (macOS / Linux lsof).
listeners_on_port() {
  local port=$1
  if ! command -v lsof >/dev/null 2>&1; then
    echo "error: lsof is required to free ports ${HUGO_PORT} and ${API_PORT}" >&2
    exit 1
  fi
  lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null || true
}

stop_port() {
  local port=$1
  local name=$2
  local list
  list="$(listeners_on_port "$port")"
  if [[ -z "${list//[$'\t\r\n ']/}" ]]; then
    return 0
  fi
  echo "Stopping ${name} on port ${port} (pid(s): ${list//$'\n'/ })"
  while read -r pid; do
    [[ -n "$pid" ]] && kill "$pid" 2>/dev/null || true
  done <<<"$list"
  sleep 0.4
  list="$(listeners_on_port "$port")"
  if [[ -n "${list//[$'\t\r\n ']/}" ]]; then
    echo "Force killing remaining listener(s) on ${port}"
    while read -r pid; do
      [[ -n "$pid" ]] && kill -9 "$pid" 2>/dev/null || true
    done <<<"$list"
    sleep 0.2
  fi
  list="$(listeners_on_port "$port")"
  if [[ -n "${list//[$'\t\r\n ']/}" ]]; then
    echo "error: could not free port ${port}" >&2
    exit 1
  fi
}

if [[ -f "$PIDFILE" ]]; then
  while read -r role pid; do
    [[ -z "${pid:-}" ]] && continue
    if alive "$pid"; then
      echo "Stopping previous ${role} (pid ${pid})"
      kill "$pid" 2>/dev/null || true
    fi
  done <"$PIDFILE"
  sleep 0.4
  rm -f "$PIDFILE"
fi

echo "=== Ensuring ports ${API_PORT} (API) and ${HUGO_PORT} (Hugo) are free ==="
stop_port "$API_PORT" "API"
stop_port "$HUGO_PORT" "Hugo"

if ! command -v hugo >/dev/null 2>&1; then
  echo "hugo not found in PATH"
  exit 1
fi
if ! command -v go >/dev/null 2>&1; then
  echo "go not found in PATH (needed to build the membership API)"
  exit 1
fi

echo "=== Building membership API ==="
( cd "$ROOT/api" && go build -o fairlinked-membership-api . )

ORIGIN_HOST="http://127.0.0.1:${HUGO_PORT}"
ORIGIN_LOCAL="http://localhost:${HUGO_PORT}"
export FAIRLINKED_MEMBERSHIP_API="http://127.0.0.1:${API_PORT}"

ENV_FILE="${ROOT}/.env"
if [[ -f "$ENV_FILE" ]]; then
  echo "=== Loading env from ${ENV_FILE} ==="
  set -a; source "$ENV_FILE"; set +a
fi

echo "=== Starting API on ${FAIRLINKED_MEMBERSHIP_API} ==="
LISTEN_ADDR="127.0.0.1:${API_PORT}" \
SQLITE_PATH="${ROOT}/.local-dev/membership.db" \
CORS_ORIGINS="${ORIGIN_HOST},${ORIGIN_LOCAL}" \
STRIPE_DONATE_SUCCESS_URL="${ORIGIN_LOCAL}/donate/?payment=success" \
STRIPE_DONATE_CANCEL_URL="${ORIGIN_LOCAL}/donate/?payment=cancelled" \
  "$API_BIN" &
API_PID=$!

sleep 0.4
if ! alive "$API_PID"; then
  echo "API exited immediately; check logs above."
  exit 1
fi

echo "=== Starting Hugo (dev) on ${ORIGIN_LOCAL} ==="
cd "$ROOT"
export FAIRLINKED_MEMBERSHIP_API
hugo server -e dev --bind 127.0.0.1 --port "$HUGO_PORT" &
HUGO_PID=$!

sleep 0.6
if ! alive "$HUGO_PID"; then
  echo "Hugo exited immediately; see errors above."
  kill "$API_PID" 2>/dev/null || true
  exit 1
fi

{
  echo "api $API_PID"
  echo "hugo $HUGO_PID"
} >"$PIDFILE"

echo ""
echo "Fairlinked local dev is up."
echo "  Site:     ${ORIGIN_LOCAL}/"
echo "  Apply:    ${ORIGIN_LOCAL}/membership-apply/"
echo "  Donate:   ${ORIGIN_LOCAL}/donate/"
echo "  API:      ${FAIRLINKED_MEMBERSHIP_API}/health"
echo "Stop with:  ${UTILS_DIR}/stop.sh"
echo "Ports:      HUGO=${HUGO_PORT} API=${API_PORT} (override with FAIRLINKED_HUGO_PORT / FAIRLINKED_API_PORT)"
