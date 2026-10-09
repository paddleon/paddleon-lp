#!/usr/bin/env bash
# 本番に出す前のチェックをまとめて実行する（GitHub Actions でも同じものを使う）。
# 使い方: npm run check   （fonttools と brotli が必要: pip install -r scripts/requirements.txt）
set -euo pipefail
cd "$(dirname "$0")/.."
PY="${PYTHON:-python3}"
bash scripts/check-secrets.sh
"$PY" scripts/check-assets.py
"$PY" scripts/check-glyphs.py
npx --no-install wrangler deploy --dry-run > /dev/null && echo "wrangler の設定: OK"
