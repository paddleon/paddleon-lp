---
paths:
  - "supabase/**"
---

# supabase/ を編集するとき

- ここのファイルは push しても本番に反映されない。変更したら、反映の手順をユーザーに伝える（skill `supabase-change`）。
- 秘密の値を書かない。`send_thanks_trigger.sql` の合言葉は `ここにWEBHOOK_SECRET` のプレースホルダーのまま保つ。
- SQL は何度実行しても壊れない形にする（`if not exists` / `create or replace` / `drop ... if exists`）。すでに本番に表があるので、列の追加は `alter table ... add column if not exists` で別に書く。
- 権限の方針: `anon` は `waitlist` を読めない・書けない。`join_waitlist` の実行だけを許す。新しい関数やトリガー関数は `revoke execute ... from public, anon, authenticated` を忘れない。
- `join_waitlist` は新規でも登録済みでも同じ結果を返す（登録済みかを外から判定させない）。この性質を崩さない。
- `send-thanks` は `WEBHOOK_SECRET` のヘッダーで守り、JWT 検証はオフで動かしている。二重送信防止（`thanks_sent_at`）と1時間あたりの上限（`MAX_PER_HOUR`）を残す。
