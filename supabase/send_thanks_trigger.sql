-- PADDLE ON — 登録時にお礼メールの関数 send-thanks を呼ぶトリガー
--
-- ダッシュボードの Database Webhooks が使えない（「Enable webhooks」が出ない、
-- schema "supabase_functions" does not exist になる）場合の代わりです。
-- 送る内容は Webhook と同じ形なので、send-thanks 側の変更は不要です。
--
-- 実行前に：
--   1. 'ここにWEBHOOK_SECRET' を、Edge Functions → Secrets の WEBHOOK_SECRET と同じ値に書き換える
--      （書き換えた後のこのファイルは GitHub に push しないこと）
--   2. 下の create extension で pg_net を有効にする（有効済みなら何も起きません）

create extension if not exists pg_net with schema extensions;

create or replace function public.notify_send_thanks()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform net.http_post(
    url     := 'https://ejteoudigxgxobzealfl.supabase.co/functions/v1/send-thanks',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', 'ここにWEBHOOK_SECRET'
    ),
    body    := jsonb_build_object(
      'type', 'INSERT',
      'table', 'waitlist',
      'record', jsonb_build_object('id', new.id, 'email', new.email)
    )
  );
  return new;
end;
$$;

revoke execute on function public.notify_send_thanks() from public, anon, authenticated;

drop trigger if exists send_thanks_after_insert on public.waitlist;
create trigger send_thanks_after_insert
after insert on public.waitlist
for each row execute function public.notify_send_thanks();

-- 届かないときの確認（関数の応答。直近5件）:
-- select id, status_code, content, error_msg, created from net._http_response order by created desc limit 5;
--   401 unauthorized → 合言葉が Secrets の WEBHOOK_SECRET と一致していない
--   502 send failed  → Resend 側のエラー（Edge Functions → send-thanks → Logs を確認）
