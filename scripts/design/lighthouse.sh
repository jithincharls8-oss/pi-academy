#!/usr/bin/env bash
# Lighthouse scores for the built web app (PWA build).
# Usage: scripts/design/lighthouse.sh <outDir>   (needs `npx vite preview --port 4173` running)
set -euo pipefail
OUT=${1:?outDir}
mkdir -p "$OUT"
export CHROME_PATH=${CHROME_PATH:-$(ls -d /opt/pw-browsers/chromium-*/chrome-linux/chrome 2>/dev/null | head -1)}
for route in "" "learn" "styleguide"; do
  name=${route:-home}
  npx -y lighthouse@12.8.2 "http://localhost:4173/#/$route" --quiet \
    --chrome-flags="--headless=new --no-sandbox" --preset=desktop \
    --only-categories=performance,accessibility,best-practices \
    --output=json --output=html --output-path="$OUT/$name" >/dev/null
  node -e "const r=require('$OUT/$name.report.json');console.log('$name',Object.values(r.categories).map(c=>c.id+'='+Math.round(c.score*100)).join(' '))"
done
