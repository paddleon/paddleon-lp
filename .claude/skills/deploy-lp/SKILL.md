---
name: deploy-lp
description: LP（public/）の変更を本番 paddleon.app に出す手順。手元のチェック、ユーザーへの確認、push、GitHub Actions のデプロイとリリースの見届けまで。「公開して」「デプロイして」「push して」「本番に反映」と言われたとき、または public/ を変えた作業の締めくくりに使う。
---

# LPを本番に出す

`main` への push で GitHub Actions の **Deploy**（`.github/workflows/deploy.yml`）が動き、チェック → `wrangler deploy` → 本番の確認 → タグ `vYYYY.MM.DD[.N]` と GitHub リリース、まで自動で進む。チェックに落ちれば本番には出ない。タグは手で打たない。

## 1. 手元でチェック

```sh
git status --short && git diff --stat
npm ci                                            # 初回や package-lock.json が変わったとき
pip install -r scripts/requirements.txt           # 初回だけ（venv を使うなら PYTHON=<venv>/bin/python npm run check）
npm run check                                     # 秘密の値・参照ファイル・フォームの接続設定・他社のロゴとストア名・フォントの文字・wrangler の設定
```

- `index.html` の差分が数千行になっていたら、整形ツールが走っている。`git checkout -- public/index.html` で戻して、必要な変更だけをやり直す。
- フォントの文字が足りないと言われたら skill `font-subset`。
- 画像（`og.jpg`、`img/`、アイコン）を変えたときは、Read で開いて他社のロゴや「App Store」などの文字が入っていないか目で確認する（チェックは画像の中身を見られない）。
- 大きな変更（構成・フォーム・JS）は、ブランチを切って push する。**Preview** ワークフローがプレビューURLにアップロードするので（URL は Actions のジョブ概要）、ユーザーに見てもらってから `main` に入れる。

## 2. ユーザーに確認してから push

何が本番でどう変わるかを短く伝え、「push してよいか」を確認する。了承を得たら:

```sh
git push origin main
```

## 3. デプロイとリリースを見届ける

```sh
gh run list --workflow deploy.yml --limit 1
gh run watch "$(gh run list --workflow deploy.yml --limit 1 --json databaseId -q '.[0].databaseId')" --exit-status
gh release list --limit 1                         # 新しいタグとリリースができているか
```

- 失敗したら `gh run view <id> --log-failed` で原因を見る。check で落ちたなら本番は前の版のまま。deploy の「本番の確認」で落ちたなら本番に出た可能性があるので、`curl -s https://paddleon.app/ | shasum -a 256` と `shasum -a 256 public/index.html` を比べて状況を伝える。
- release ジョブだけが `HTTP 403: Resource not accessible by integration` で落ちたときは、実行中に `.github/workflows/` を変えたコミットが main に入ったのが原因（Actions のトークンは、main と違うワークフローを含むコミットにタグを付けられない）。本番は出ているので、`gh release create <タグ> --target <コミット>` で同じ形式のリリースを手で作る。ワークフローの変更は、デプロイが終わってから push する。
- `public/` などが変わっていない push（docs や supabase だけ）では Deploy は動かない。それは正常。
- フォームの送信テストは、本物の行が増えてお礼メールが送られるので、こちらでは行わない。必要ならユーザーに自分のアドレス（Gmail の `+test` など）で試してもらう。
