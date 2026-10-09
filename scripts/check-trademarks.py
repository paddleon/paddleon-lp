#!/usr/bin/env python3
"""public/ に他社のロゴ・商標の不適切な使い方がないか確かめる。

使い方:  python3 scripts/check-trademarks.py
見つかったら一覧を出して終了コード 1 で終わる。

- Apple のロゴ（りんごマーク）: SVG のパス、Apple ロゴの文字（U+F8FF）、ファイル名を検出する。
  Apple の商標ガイドラインでは、他社のサイトやボタンで Apple ロゴを使えない（使えるのは公式バッジのみ）。
- 「App Store」「Google Play」の文字: 公開前のアプリでストアの名前を出すと「ストアで入手できる」と誤解されるため、
  公式バッジを使って配信を始めるまでは使わない。説明には「iPhone版」「Android版」を使う。
画像（og.jpg など）の中身は機械では確かめられないので、目で確認する。
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"

# よく使われる Apple ロゴの SVG パスの書き出し（Material/Simple Icons/Font Awesome/手書き系）
APPLE_PATH_STARTS = ["M16 13c0-2.5", "M12.152 6.896", "M318.7 268.7", "M18.71 19.5", "M17.05 20.28", "M16.365 1.43"]
RULES = [
    ("Apple のロゴ（SVG）", re.compile("|".join(re.escape(p) for p in APPLE_PATH_STARTS))),
    ("Apple のロゴ（U+F8FF の文字）", re.compile("|&#xf8ff;|&#63743;", re.I)),
    ("Apple のロゴを示す名前", re.compile(r"(apple-logo|icon-apple|fa-apple\b|sp-apple|class=\"[^\"]*\bapple\b)", re.I)),
    ("ストア名（公式バッジ以外での使用）", re.compile(r"App\s?Store|Google\s?Play|Download on the|GET IT ON", re.I)),
]

errors: list[str] = []
for path in sorted(PUBLIC.rglob("*")):
    if path.suffix not in {".html", ".svg", ".css", ".js", ".txt", ".xml"}:
        continue
    for no, line in enumerate(path.read_text(encoding="utf-8", errors="ignore").splitlines(), 1):
        for label, pattern in RULES:
            m = pattern.search(line)
            if m:
                errors.append(f"{path.relative_to(ROOT)}:{no}: {label} → {m.group(0)}")
for path in sorted(PUBLIC.rglob("*")):
    if re.search(r"apple-logo|app-?store|google-?play|play-?badge", path.name, re.I):
        errors.append(f"{path.relative_to(ROOT)}: ストアやロゴの画像らしいファイル名です")

if errors:
    print("\n".join(errors))
    print("他社のロゴ・ストア名は使わない方針です（CLAUDE.md「商標とロゴ」）。")
    sys.exit(1)
print("他社のロゴ・ストア名: なし")
