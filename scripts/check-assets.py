#!/usr/bin/env python3
"""public/ の HTML が参照しているファイルが実在するか、フォームの接続設定が正しいかを確かめる。

使い方:  python3 scripts/check-assets.py
問題があれば一覧を出して終了コード 1 で終わる。
"""
import re
import sys
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
errors: list[str] = []

for page in sorted(PUBLIC.glob("*.html")):
    src = page.read_text(encoding="utf-8")
    refs = re.findall(r'(?:src|href|poster)="([^"]+)"', src)
    refs += re.findall(r"url\(['\"]?([^'\")]+)['\"]?\)", src)
    for srcset in re.findall(r'srcset="([^"]+)"', src):
        refs += [part.strip().split(" ")[0] for part in srcset.split(",")]
    for ref in refs:
        parts = urlsplit(ref)
        if parts.scheme or ref.startswith(("#", "//", "data:", "mailto:", "tel:", "javascript:")) or "${" in ref:
            continue
        path = parts.path
        if not path:
            continue
        target = PUBLIC / path.lstrip("/") if path.startswith("/") else page.parent / path
        if target.is_dir() or path.endswith("/"):
            target = target / "index.html"
        # Cloudflare は /privacy で privacy.html を返すので、拡張子なしの参照も許す
        if not target.exists() and not target.with_suffix(".html").exists():
            errors.append(f"{page.name}: 参照先がありません → {ref}")

index = (PUBLIC / "index.html").read_text(encoding="utf-8")
url = re.search(r"const SUPABASE_URL = '([^']*)'", index)
key = re.search(r"const SUPABASE_KEY = '([^']*)'", index)
if not url or not re.fullmatch(r"https://[a-z0-9]+\.supabase\.co", url.group(1)):
    errors.append("index.html: SUPABASE_URL は https://<プロジェクトID>.supabase.co の形にしてください（末尾に /rest/v1 などを付けない）")
if not key or not key.group(1).startswith("sb_publishable_"):
    errors.append("index.html: SUPABASE_KEY は publishable key（sb_publishable_...）にしてください")

if errors:
    print("\n".join(errors))
    sys.exit(1)
print(f"参照ファイルとフォームの接続設定: OK（{len(list(PUBLIC.glob('*.html')))}ページ）")
