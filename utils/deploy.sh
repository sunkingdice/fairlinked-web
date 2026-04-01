#!/bin/bash
set -euo pipefail

MSG="${1:-deploy}"

echo "=== Committing and pushing ==="
git add -A
git commit -m "$MSG" || echo "Nothing to commit"
git push

echo "=== Deploying to server ==="
ssh -t fl-web 'set -euo pipefail; cd /home/deploy/fairlinked && git pull && if command -v go >/dev/null 2>&1; then echo "=== Building membership API ===" && (cd api && go build -o fairlinked-membership-api .); else echo "=== go not found; skip API build ==="; fi && echo "=== Hugo ===" && hugo --minify && if systemctl is-enabled fairlinked-api >/dev/null 2>&1; then echo "=== Restarting fairlinked-api ===" && sudo systemctl restart fairlinked-api; fi'

echo "=== Done ==="
