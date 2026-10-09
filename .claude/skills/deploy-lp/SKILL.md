---
name: deploy-lp
description: LP（public/）の変更を本番 paddleon.app に出す手順。push 前のチェック、ユーザーへの確認、push、本番での動作確認まで。「公開して」「デプロイして」「push して」「本番に反映」と言われたとき、または public/ を変えた作業の締めくくりに使う。
---

# LPを本番に出す

`main` への push がそのまま本番公開になる（Cloudflare Workers Builds → `npx wrangler deploy`）。巻き戻しは Cloudflare の **Workers & Pages → paddleon-lp → デプロイ** からできるが、出す前に止めるのが基本。

## 1. push 前のチェック

```sh
git status --short && git diff --stat
python3 scripts/check-glyphs.py          # 日本語フォントに欠けた文字がないか（fonttools と brotli が必要）
git diff origin/main -- . | grep -E '^\+' | grep -nE "re_[A-Za-z0-9_]{16,}|sb_secret_|eyJ[A-Za-z0-9_-]{30,}" || echo "秘密情報なし"   # Resend キー・secret key・JWT 形式のキー
grep -n "const SUPABASE_URL\|const SUPABASE_KEY" public/index.html   # URL の末尾に /rest/v1 がない・key は sb_publishable_
```

- `index.html` の差分が数千行になっていたら、整形ツールが走っている。`git checkout -- public/index.html` で戻して、必要な変更だけをやり直す。
- 大きな変更（構成・フォーム・JS）は、`main` ではなくブランチを切って push し、プレビューURLで確認してもらってから `main` に入れる。

## 2. ユーザーに確認してから push

変更の要点（何が本番でどう変わるか）を短く伝え、「push してよいか」を確認する。了承を得たら:

```sh
git push origin main
```

## 3. 本番の確認（反映まで1分ほど）

```sh
for p in / /privacy /robots.txt /sitemap.xml /og.jpg /favicon.svg /video/demo-screen.mp4 /fonts/zkgn-700.woff2 /README.md /wrangler.jsonc; do
  printf "%-26s " "$p"; curl -s -o /dev/null -w "%{http_code}\n" "https://paddleon.app$p"; done
curl -s https://paddleon.app/ | grep -c "G-LB6QHHK4KE"     # GA4 タグが残っているか
```

- `/README.md` と `/wrangler.jsonc` は 404 が正しい（public/ の外は公開されない）。それ以外は 200（`/privacy.html` は `/privacy` へ 307）。
- 変えた文言や画像が本番の HTML に入っているかを `curl -s https://paddleon.app/ | grep` で確かめる。古いままなら Cloudflare のデプロイ履歴でビルドの成否を見てもらう。
- フォームの送信テストは、本物の行が増えてお礼メールが送られるので、こちらでは行わない。必要ならユーザーに自分のアドレス（Gmail の `+test` など）で試してもらう。
