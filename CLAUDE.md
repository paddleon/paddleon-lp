# PADDLE ON 事前登録LP

サーフィンの記録アプリ「PADDLE ON」（初心者〜中級者向け、30秒で記録・タップで振り返る）の事前登録LP。本番は https://paddleon.app/ 。アプリ本体（Expo + Supabase）はまだ未着手で、このLPで需要を検証している段階（事前登録100名で本格開発に着手、募集期限 2027年夏）。

## 構成とデプロイ

- `public/` が公開物のすべて。ビルドなしの素のHTML/CSS/JS。`index.html` は CSS・JS をインラインで持つ1ファイル構成。
- デプロイは GitHub Actions（Cloudflare 側の Git 連携は使わない）。`main` に push すると `.github/workflows/deploy.yml` が、チェック（`npm run check`）→ `wrangler deploy`（`wrangler.jsonc` → `assets.directory: ./public`、wrangler は package.json で固定）→ 本番の確認 → タグ `vYYYY.MM.DD[.N]` と GitHub リリース、の順に実行する。**`public/` などが変わった push = 本番公開**。`docs/`・`supabase/` だけの push では動かない。
- 静的アセットは Range リクエストに対応していないため、`/video/*` だけ `src/worker.js` を通して 206 で部分配信している（iPhone の Safari は 206 が返らないと動画を再生しない）。動画の置き場所や名前を変えるときは `wrangler.jsonc` の `run_worker_first` も合わせる。
- `main` 以外のブランチの push は `preview.yml` でプレビューURLへ。必要な GitHub Secrets は `CLOUDFLARE_API_TOKEN` と `CLOUDFLARE_ACCOUNT_ID`。
- `keepalive.yml` が毎日 Supabase の `join_waitlist` を形式が誤ったメールで呼ぶ（無料プランの7日間の一時停止を防ぐ死活監視。400 "invalid input" が正常）。`join_waitlist` の入力チェックや戻り値を変えるときは、このワークフローも合わせる。
- タグとリリースは自動で作られるので、手で `git tag` を打たない。
- `supabase/` は push しても反映されない。SQL は SQL Editor、Edge Function はダッシュボードで手動反映（手順は skill `supabase-change`）。
- 登録の流れ: フォーム → RPC `join_waitlist`（publishable key、anon は関数の実行のみ）→ `waitlist` 表 → トリガー `send_thanks_after_insert`（pg_net）→ Edge Function `send-thanks` → Resend でお礼メール。Database Webhooks は使っていない（トリガーで代替。両方作ると二重に呼ばれる）。
- 人向けの資料は `docs/`（operations：運用・仕組み・秘密の値の置き場所／lp-spec：LPの仕様）。README はその入口。リポジトリは公開しているが、他の人が clone して立ち上げる前提はないので、ゼロからのセットアップ手順は置かない。
- 公開リポジトリなので、個人名・個人のメールアドレス・利用者の属性をリポジトリ内（資料・コード・コミットメッセージ）に書かない。コミットは noreply のアドレスで行う（このリポジトリの git config に設定済み）。

## 守ること

- **秘密情報をリポジトリに入れない。** Resend の API キー、`WEBHOOK_SECRET`、Supabase の service_role / secret key は Supabase の Secrets かダッシュボードにだけ置く。`index.html` に入れてよいのは Supabase の Project URL と publishable key だけ。ユーザーに値をチャットへ貼らせず、ダッシュボードに直接入力してもらう。
- **`main` への push は本番公開なので、push する前にユーザーに確認する**（skill `deploy-lp`）。
- `index.html` を整形ツールで整形しない（`.vscode/settings.json` で保存時整形をオフにしている）。差分は最小限に。
- 日本語フォントはページ内の文字だけに絞ったサブセット。文言を変えたら `python3 scripts/check-glyphs.py` で欠けた文字がないか確認する（skill `font-subset`）。
- ライセンスは付けない方針（All rights reserved）。LICENSE ファイルを追加しない。

## ブランドとコピーの決まり

- 名前は「PADDLE ON」（ロゴタイプは PADDLE が白系、ON がシアン）。キーカラーはシアン `#5ED3E6`、背景は紺 `#070E1A`、CTA は黄 `#FFD23F`。
- 有料プランの呼び名は「Plus」（「Pro」は使わない）。LP では価格を出さず「リリース後に追加予定」とだけ書く。
- 成果の言葉は「できた」を基準にする（「乗れた」は中級者に合わないので使わない）。
- 未完成のアプリ画面やデータには「イメージ」「開発中」と明記する（景品表示法への配慮）。見せかけの登録者数カウンターは置かない。
- 対象は初心者〜中級者のサーファー全般。エンジニア向けの用語（コミット、Issue など）は画面に出さない。

## 商標とロゴ

- **他社のロゴを使わない。** Apple のりんごマーク、Google Play の三角マーク、SNS 以外の他社ロゴを、ボタン・バッジ・OGP画像・アイコンに入れない。Apple の商標ガイドラインでは、他社のサイトで Apple ロゴを使えるのは公式バッジだけ。
- **ストア名を出さない。** アプリを配信するまでは「App Store」「Google Play」の文字や、ストア風の自作バッジを使わない（配信中と誤解されるため）。対応機種は「iPhone版」「Android版」と文字で書く。配信を始めたら、各社の公式バッジを規定どおり（改変せず、余白とサイズを守って）使う。
- 例外は X のリンクに使っている X のロゴ（自分のアカウントへのリンクで、X のブランドガイドラインの範囲内）。
- `npm run check` の `scripts/check-trademarks.py` が HTML・SVG・CSS の違反を検出する。**画像（og.jpg、img/、apple-touch-icon など）の中身は機械では分からない**ので、画像を差し替えたら目で確認する。外部（別のチャットやデザインツール）から受け取った画像・HTML を取り込むときも同じ。
- 他社の商品名・サービス名（Apple Watch、Instagram など）は、説明として名前を書くのはよいが、公式に連携・提携しているように見せない。

## ユーザーとのやり取り

- 回答は日本語で。
- ダッシュボード操作（Supabase / Cloudflare / Resend / GA4）は画面の場所が変わりやすい。直接開けるURLを添え、見つからないと言われたらスクリーンショットをもらう。
- Supabase のプロジェクトは `ejteoudigxgxobzealfl`（URL は `https://ejteoudigxgxobzealfl.supabase.co`）。
