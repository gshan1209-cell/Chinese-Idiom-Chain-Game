#!/usr/bin/env bash
set -euo pipefail

if [[ ! -d node_modules ]]; then
  echo "尚未安裝前端依賴，正在執行 npm install…"
  npm install
fi

npm run build
