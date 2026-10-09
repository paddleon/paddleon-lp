# PADDLE ON 事前登録LP

サーフィンの記録アプリ「PADDLE ON」の事前登録LPです。公開先は https://paddleon.app/ 。
HTML・CSS・JavaScript だけで作ってあり、ビルドは不要です。

```
paddleon-lp/
├─ public/                 ← このフォルダの中身がそのまま公開されます
│  ├─ index.html           LP本体（CSS・JS・フォームの送信先設定もこの中）
│  ├─ privacy.html         プライバシーポリシー
│  ├─ og.jpg               SNSでシェアされたときの画像（1200×630）
│  ├─ favicon.svg / apple-touch-icon.png / robots.txt / sitemap.xml
│  ├─ fonts/               日本語フォント（このページで使う文字だけに絞ったもの）
│  ├─ img/                 背景写真・アプリ画面・動画のポスター画像
│  └─ video/               デモ動画（画面のみ・27.5秒ループ）
├─ supabase/               ← push しても反映されません（手動で反映）
│  ├─ waitlist.sql         登録を保存する表と、登録用の関数 join_waitlist
│  ├─ send_thanks_trigger.sql  登録時にお礼メールの関数を呼ぶトリガー
│  └─ functions/send-thanks/   お礼メールを送る Edge Function（preview.html でメールの見た目を確認）
├─ docs/                   手順書・仕様書
├─ scripts/                本番に出す前のチェック（npm run check）
├─ .github/workflows/      チェック・プレビュー・本番デプロイ・リリース・Supabase の死活監視（GitHub Actions）
├─ src/worker.js           動画（/video/*）の部分配信だけを担う Worker（iPhone の Safari 用）
├─ wrangler.jsonc          Cloudflare Workers の設定（public を公開、/video/* は worker を通す）
└─ package.json            wrangler のバージョン固定と npm スクリプト
```

## デプロイの流れ

```
main に push（public/ などが変わったとき）
  → チェック（秘密の値・参照ファイル・フォームの接続設定・他社のロゴとストア名・フォントの文字・wrangler の設定）
  → 合格したら wrangler deploy で本番へ
  → 本番の確認（今回のファイルと同じ内容が配信されているか、主要ファイルが開けるか）
  → タグ（v2026.10.09 の形、同じ日の2回目以降は .2, .3 …）と GitHub リリースを作成
```

| 対象 | 反映のしかた |
|---|---|
| `public/` | `main` に push → 上の流れ（GitHub Actions の **Deploy**）。チェックに落ちたら本番には出ない |
| `main` 以外のブランチ | push するとプレビュー用URLにアップロード（GitHub Actions の **Preview**、URL はジョブの概要に表示） |
| `src/`・`wrangler.jsonc` | `public/` と同じく本番に出る |
| `docs/`・`supabase/` だけの変更 | 本番には出さず、タグも打たない |
| `supabase/*.sql` | ダッシュボードの SQL Editor で実行（自動では反映されない） |
| `supabase/functions/send-thanks` | ダッシュボードのエディタに貼って Deploy（JWT検証はオフ） |

- 手元でのチェック：`npm ci && pip install -r scripts/requirements.txt && npm run check`
- 同じ版をもう一度出したいときは、GitHub の **Actions → Deploy → Run workflow**。
- 巻き戻しは Cloudflare の **Workers & Pages → paddleon-lp → デプロイ** から以前の版を選ぶか、`git revert` して push。
- 公開した版の一覧と変更内容は GitHub の **Releases**。
- 毎日 9:17（日本時間）に **Keepalive** が Supabase の登録の関数を呼び、無料プランの一時停止を防ぎつつ、登録の仕組みが動いているかを確かめます。

## 使っているサービス

| サービス | 用途 |
|---|---|
| Cloudflare | ドメイン（paddleon.app）、Workers での公開、support@ のメール転送 |
| Supabase（Tokyo） | 登録者の保存（`waitlist` 表）、お礼メールの Edge Function |
| Resend | お礼メールの送信（`paddleon.app` ドメインで認証済み） |
| Google アナリティクス 4 | アクセス解析（`G-LB6QHHK4KE`） |

## ドキュメント

- [docs/operations.md](docs/operations.md) … 登録者の見方・集計、アクセス解析、お礼メールの仕組み、秘密の値の置き場所、運用の注意
- [docs/lp-spec.md](docs/lp-spec.md) … LPの動き・フォーム・文言の仕様

## ライセンス

ライセンスは付けていません（All rights reserved）。コードは公開していますが、著作権は作者に残り、無断での複製・改変・再配布はできません。

例外として、次の素材はそれぞれのライセンスに従います。

- 写真（`public/img/` の背景写真）：Unsplash License 等、各撮影者のライセンス
- 日本語フォント（`public/fonts/`）：Zen Kaku Gothic New、SIL Open Font License 1.1（[OFL.txt](public/fonts/OFL.txt)）
