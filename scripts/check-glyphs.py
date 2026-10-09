#!/usr/bin/env python3
"""public/ の HTML で使っている文字が、絞り込んだ日本語フォント（public/fonts/zkgn-*.woff2）に入っているか確かめる。

使い方:  python3 scripts/check-glyphs.py
必要:    pip install fonttools brotli
足りない文字があれば一覧を出して終了コード 1 で終わる（フォントの作り直しが必要）。
"""
import html
import re
import sys
from pathlib import Path

from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"


def page_chars(path: Path) -> set[str]:
    src = path.read_text(encoding="utf-8")
    # style / script の中身とタグを除き、本文と属性値（alt・aria-label・placeholder など）の文字を集める
    body = re.sub(r"<(style|script)\b[^>]*>.*?</\1>", " ", src, flags=re.S | re.I)
    attrs = " ".join(re.findall(r'(?:alt|title|aria-label|placeholder|content|value)="([^"]*)"', body))
    text = re.sub(r"<[^>]+>", " ", body) + " " + attrs
    # JS で画面に出す日本語（エラーメッセージやボタン文言）も対象にする
    js_strings = " ".join(re.findall(r"""['"`]([^'"`\n]*[　-ヿ一-鿿＀-￯][^'"`\n]*)['"`]""", src))
    return set(html.unescape(text + " " + js_strings))


def main() -> int:
    chars: set[str] = set()
    for page in sorted(PUBLIC.glob("*.html")):
        chars |= page_chars(page)
    # フォントに頼らない文字（空白・制御文字）は除く。対象は日本語（かな・漢字・全角記号）
    targets = {c for c in chars if re.match(r"[　-ヿ一-鿿＀-￯]", c)}

    missing_any = False
    for font_path in sorted((PUBLIC / "fonts").glob("zkgn-*.woff2")):
        cmap = TTFont(font_path).getBestCmap()
        missing = sorted(c for c in targets if ord(c) not in cmap)
        if missing:
            missing_any = True
            print(f"{font_path.name}: {len(missing)}文字が足りません → {''.join(missing)}")
        else:
            print(f"{font_path.name}: OK（日本語 {len(targets)}文字すべて収録）")
    return 1 if missing_any else 0


if __name__ == "__main__":
    sys.exit(main())
