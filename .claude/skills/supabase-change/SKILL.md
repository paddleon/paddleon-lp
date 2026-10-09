---
name: supabase-change
description: supabase/ 配下（waitlist.sql、send_thanks_trigger.sql、Edge Function send-thanks）を変えたときに、本番の Supabase へ反映して確かめる手順。表の列追加、フォームの選択肢追加、お礼メールの文面変更、メールが届かないときの調査に使う。
---

# Supabase への反映

Supabase はリポジトリと自動では連携していない。変更は必ずユーザーにダッシュボードで反映してもらう。プロジェクトは `ejteoudigxgxobzealfl`。

## 反映の手順（ユーザーに案内する）

| 変えたもの | 反映のしかた |
|---|---|
| 表・関数（`waitlist.sql`） | SQL Editor（https://supabase.com/dashboard/project/ejteoudigxgxobzealfl/sql/new）で、**変えた部分だけ**を実行。表はすでにあるので `create table` を流し直さず、`alter table ... add column if not exists` などの差分を渡す |
| トリガー（`send_thanks_trigger.sql`） | `ここにWEBHOOK_SECRET` を Secrets と同じ値に書き換えてから実行。書き換えた内容はコミットしない |
| `functions/send-thanks/index.ts` | Edge Functions（https://supabase.com/dashboard/project/ejteoudigxgxobzealfl/functions）→ send-thanks → Code に貼って Deploy。JWT 検証はオフのまま |
| 秘密の値 | Edge Functions → Secrets（`RESEND_API_KEY` / `WEBHOOK_SECRET` / 任意で `MAIL_FROM`・`MAIL_REPLY_TO`）。値はチャットに貼らせない |

フォームの選択肢を増やすときは、`waitlist.sql` の check 制約と `join_waitlist`、`public/index.html` の両方を変える。**SQL を先に反映してから LP を push する**（逆だと登録がエラーになる）。

## 外から確かめられること（行を増やさずに）

```sh
# 登録関数が生きているか：形式が誤ったメールを送ると 400 "invalid input" が返れば正常（行は増えない）
curl -s -w ' HTTP %{http_code}\n' -X POST https://ejteoudigxgxobzealfl.supabase.co/rest/v1/rpc/join_waitlist \
  -H 'Content-Type: application/json' -H "apikey: $(grep -o "sb_publishable_[A-Za-z0-9_]*" public/index.html)" -d '{"p_email":"not-an-email"}'

# お礼メールの関数がデプロイされているか：401 {"error":"unauthorized"} なら正常（404 なら未デプロイ）
curl -s -w ' HTTP %{http_code}\n' -X POST https://ejteoudigxgxobzealfl.supabase.co/functions/v1/send-thanks -H 'Content-Type: application/json' -d '{}'
```

## メールが届かないとき（ユーザーに SQL Editor で実行してもらう）

```sql
select extname from pg_extension where extname = 'pg_net';                       -- 行がなければ pg_net が無効
select tgname from pg_trigger where tgname = 'send_thanks_after_insert';         -- 行がなければトリガー未作成
select id, status_code, content, error_msg, created from net._http_response order by created desc limit 5;
```

- `401 unauthorized` → トリガーの合言葉と Secrets の `WEBHOOK_SECRET` が違う
- `502 send failed` → Resend 側。Edge Functions → send-thanks → Logs と、Resend → Emails を見てもらう
- `200 skipped: already sent` → その行は送信済み（`thanks_sent_at` が入っている）
- pg_net が無効なのにトリガーがあると、登録そのものが失敗する。先に `create extension if not exists pg_net with schema extensions;`

Database Webhooks（Integrations）は使っていない。ダッシュボードで「Enable webhooks」が出ない・`supabase_functions` スキーマがないというエラーが出ても、Supabase 内部のセットアップ SQL を手で流させないこと。トリガーで足りている。
