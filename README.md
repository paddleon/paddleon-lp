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
└─ wrangler.jsonc          Cloudflare Workers の設定（public を公開）
```

## デプロイの流れ

| 対象 | 反映のしかた |
|---|---|
| `public/` | `main` に push → Cloudflare Workers Builds が `npx wrangler deploy` → paddleon.app に反映（1分ほど） |
| `main` 以外のブランチ | push するとプレビュー用URLができる（本番には出ない） |
| `supabase/*.sql` | ダッシュボードの SQL Editor で実行 |
| `supabase/functions/send-thanks` | ダッシュボードのエディタに貼って Deploy（JWT検証はオフ） |

デプロイの履歴・ログ・巻き戻しは Cloudflare の **Workers & Pages → paddleon-lp → デプロイ** で見られます。

## 使っているサービス

| サービス | 用途 |
|---|---|
| Cloudflare | ドメイン（paddleon.app）、Workers での公開、support@ のメール転送 |
| Supabase（Tokyo） | 登録者の保存（`waitlist` 表）、お礼メールの Edge Function |
| Resend | お礼メールの送信（`paddleon.app` ドメインで認証済み） |
| Google アナリティクス 4 | アクセス解析（`G-LB6QHHK4KE`） |

## ドキュメント

- [docs/setup.md](docs/setup.md) … 公開までの手順（ドメイン・Supabase・Cloudflare・お礼メール）と公開後の確認リスト
- [docs/operations.md](docs/operations.md) … 登録者の見方・集計、アクセス解析、運用の注意
- [docs/lp-spec.md](docs/lp-spec.md) … LPの動き・フォーム・文言の仕様

## ライセンス

ライセンスは付けていません（All rights reserved）。コードは公開していますが、著作権は作者に残り、無断での複製・改変・再配布はできません。写真は各撮影者のライセンス（Unsplash License 等）に、フォントは SIL Open Font License 1.1 に従います。
