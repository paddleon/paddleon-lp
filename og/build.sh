#!/usr/bin/env bash
# OGP 画像を作り直す：og/og.html を Chrome（ヘッドレス）で 1200×630 で撮影し、public/og.jpg に書き出す。
# 使い方: bash og/build.sh          （Chrome と Python の Pillow が必要: pip install pillow）
# Square Peg を Google Fonts から読み込むので、ネットワークにつながっている必要がある。
set -euo pipefail
cd "$(dirname "$0")/.."
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
PY="${PYTHON:-python3}"
tmp=$(mktemp -d)
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --window-size=1200,630 --virtual-time-budget=8000 --user-data-dir="$tmp/profile" \
  --screenshot="$tmp/og.png" "file://$PWD/og/og.html" >/dev/null 2>&1
"$PY" - "$tmp/og.png" <<'PY'
import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert("RGB")
assert im.size == (1200, 630), im.size
im.save("public/og.jpg", quality=88, progressive=True, optimize=True)
print("public/og.jpg を書き出しました", im.size)
PY
rm -rf "$tmp"
