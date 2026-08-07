#!/usr/bin/env bash
set -euo pipefail

if [[ ! -d node_modules ]]; then
  echo "缺少 node_modules；請先執行 npm install。" >&2
  exit 2
fi

npm run build:data
npm run validate:drive-assets
npm run validate:theme-badges
npm run test
npm run typecheck
npm run lint
npm run build
