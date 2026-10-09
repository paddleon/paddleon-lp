---
name: font-subset
description: LP の日本語フォント（Zen Kaku Gothic New のサブセット public/fonts/zkgn-500/700/900.woff2）に欠けた文字がないか確かめ、足りなければ作り直す手順。文言を変えた後、または「一部の文字だけ書体が違う」と言われたときに使う。
---

# 日本語フォントのサブセット

`public/fonts/zkgn-{500,700,900}.woff2` は、ページで使う文字（＋ASCII 全部）だけに絞った Zen Kaku Gothic New（SIL OFL 1.1）。新しい漢字を使うと、その文字だけ別の書体で表示される。

## 1. 確かめる

```sh
python3 -m venv /tmp/fontenv && /tmp/fontenv/bin/pip install -q fonttools brotli   # 初回だけ（スクラッチ領域があればそちらに作る）
/tmp/fontenv/bin/python scripts/check-glyphs.py
```

全部 OK なら作業は終わり。足りない文字が出たら 2 へ。

## 2. 作り直す

元のフォント（Google Fonts の google/fonts リポジトリ `ofl/zenkakugothicnew/` にある `ZenKakuGothicNew-Medium.ttf` / `-Bold.ttf` / `-Black.ttf`）が必要。ダウンロードする前に、ファイル名と取得元をユーザーに伝えて了承をもらい、リポジトリの外（スクラッチ領域）に置く。

収録する文字は「今の3ファイルに入っている文字 ＋ 足りない文字」にする（今あるものを減らさないため）:

```sh
/tmp/fontenv/bin/python - <<'PY' > /tmp/fontenv/chars.txt
from fontTools.ttLib import TTFont
import subprocess
have = set(TTFont('public/fonts/zkgn-700.woff2').getBestCmap())
out = subprocess.run(['/tmp/fontenv/bin/python', 'scripts/check-glyphs.py'], capture_output=True, text=True).stdout
extra = {ord(c) for line in out.splitlines() if '→' in line for c in line.split('→')[1].strip()}
print(''.join(chr(u) for u in sorted(have | extra | set(range(0x20, 0x7f)))))
PY
for pair in "500:Medium" "700:Bold" "900:Black"; do w=${pair%%:*}; n=${pair##*:}
  /tmp/fontenv/bin/pyftsubset "<元フォントの場所>/ZenKakuGothicNew-$n.ttf" \
    --text-file=/tmp/fontenv/chars.txt --layout-features='*' --name-IDs='*' --flavor=woff2 \
    --output-file=public/fonts/zkgn-$w.woff2
done
/tmp/fontenv/bin/python scripts/check-glyphs.py   # 全部 OK になること
ls -l public/fonts/                               # 1ファイル 50〜80KB 程度が目安。大きく増えていないか
```

`--name-IDs='*'` は外さない（著作権とライセンスの記載をフォント内に残すのが OFL の条件。ライセンス文は `public/fonts/OFL.txt` にも置いてある）。

ファイル名は変えない（`index.html` と `privacy.html` の `@font-face` が参照している）。終わったら skill `deploy-lp` で公開する。
