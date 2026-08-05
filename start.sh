#!/usr/bin/env bash
set -euo pipefail

HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-5173}"

if [[ ! -d node_modules ]]; then
  echo "尚未安裝前端依賴，正在執行 npm install…"
  npm install
fi

npm run build:data
exec npm run dev -- --host "$HOST" --port "$PORT"
