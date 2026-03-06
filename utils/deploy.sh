#!/bin/bash
set -euo pipefail

MSG="${1:-deploy}"

echo "=== Committing and pushing ==="
git add -A
git commit -m "$MSG" || echo "Nothing to commit"
git push

echo "=== Deploying to server ==="
ssh fl-web << 'REMOTE'
cd /home/deploy/fairlinked
git pull
hugo --minify
REMOTE

echo "=== Done ==="
