---
paths:
  - "public/**"
---

# public/（公開されるLP）を編集するとき

- ここは `main` に push した瞬間に本番（paddleon.app）に出る。壊れた状態で push しない。
- `index.html` は CSS・JS インラインの1ファイル構成を保つ。外部ライブラリや CDN を足さない（GA4 の gtag だけは例外）。整形ツールをかけない。
- `SUPABASE_URL` は末尾に `/rest/v1` を付けない（コード側で `/rest/v1/rpc/join_waitlist` を足している）。`SUPABASE_KEY` は publishable key のみ。
- フォームの値は `join_waitlist` の引数と、`waitlist` 表の check 制約（`supabase/waitlist.sql`）に合わせる。選択肢を増やすときは SQL 側も変える必要がある。
- GA4 のイベント名（`sign_up` / `cta_click` + `cta_location` / `form_start_signup`）は解析で使っているので変えない。新しい CTA には `cta_location` を付ける。
- 文言を変えたら `python3 scripts/check-glyphs.py` を実行する。足りない文字が出たら skill `font-subset`。
- 画像は WebP（写真）/ JPEG（アプリ画面）で軽くする。差し替えるときはファイル名と縦横比を保つ（ヒーローは人の位置に合わせて CSS で配置している）。
- 動きは `prefers-reduced-motion` を尊重し、JS が無効でも内容が読めるようにしておく（既存の作りに合わせる）。
- 他社のロゴ（Apple のりんごマークなど）と、配信前のストア名（App Store / Google Play）を使わない。対応機種は「iPhone版」と文字で書く（CLAUDE.md「商標とロゴ」）。画像を差し替えたら、ロゴが入っていないか目で確認する。
- 外部から受け取ったLP一式（zip やフォルダ）は、そのまま上書きしない。`diff` で今回の変更点だけを取り込む（古い状態から作られていて、直した箇所が戻ることがある）。
- 仕様の詳細は `docs/lp-spec.md`。仕様を変えたらそちらも更新する。
