-- PADDLE ON 事前登録テーブル
-- Supabase ダッシュボード → SQL Editor に貼り付けて実行してください。

create table if not exists public.waitlist (
  id          bigint generated always as identity primary key,
  email       text not null
              check (char_length(email) <= 254 and email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  device      text check (device in ('iphone', 'android', 'other')),
  surf_years  text check (surf_years in ('lt1', '1to2', '3to5', 'gt5')),
  frequency   text check (frequency in ('lt1m', '1to2m', '3to4m', '2pw')),
  wants       text[] check (wants <@ array['apple_watch', 'photo', 'sns_card', 'other']::text[]),  -- 欲しい機能（任意・複数）
  wants_other text check (char_length(wants_other) <= 100),  -- 「その他」の自由入力
  source      text check (char_length(source) <= 80),
  created_at  timestamptz not null default now(),
  thanks_sent_at timestamptz,       -- お礼メールを送った日時（Edge Function が自動で記入）
  invited_at  timestamptz,          -- TestFlight に招待した日時（手動で記入）
  unsubscribed_at timestamptz       -- 配信停止の依頼があった日時（手動で記入）
);

-- 同じメールアドレスは1件だけ（重複は join_waitlist 関数の中で無視し、新規と同じ結果を返します）
create unique index if not exists waitlist_email_key on public.waitlist (email);

-- 行レベルセキュリティ：ページからは「追加」だけできる。読み取り・更新・削除はできない。
alter table public.waitlist enable row level security;

drop policy if exists "waitlist: anyone can insert" on public.waitlist;  -- 直接の書き込みは使わないので、ポリシーは置かない

-- ページ（anon）からは表へ直接書き込めないようにし、下の join_waitlist 関数経由だけで登録させる。
revoke insert, select, update, delete on public.waitlist from anon;

-- 登録用の関数：新規でも登録済みでも同じ結果（成功）を返すので、外から「登録済みかどうか」を確かめられない。
-- 重複時は何もしない（お礼メールも新規の行が追加されたときだけ送られる）。
create or replace function public.join_waitlist(
  p_email       text,
  p_device      text   default null,
  p_surf_years  text   default null,
  p_frequency   text   default null,
  p_wants       text[] default null,
  p_wants_other text   default null,
  p_source      text   default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.waitlist (email, device, surf_years, frequency, wants, wants_other, source)
  values (
    lower(trim(p_email)),
    nullif(p_device, ''),
    nullif(p_surf_years, ''),
    nullif(p_frequency, ''),
    case when p_wants is null or cardinality(p_wants) = 0 then null else p_wants end,
    nullif(left(trim(coalesce(p_wants_other, '')), 100), ''),
    nullif(left(coalesce(p_source, ''), 80), '')
  )
  on conflict (email) do nothing;
exception
  when check_violation or not_null_violation then
    raise exception 'invalid input' using errcode = '22023';
end;
$$;

revoke all on function public.join_waitlist(text, text, text, text, text[], text, text) from public;
grant execute on function public.join_waitlist(text, text, text, text, text[], text, text) to anon;

-- 確認用（ダッシュボードの SQL Editor から実行。ページからは読めません）
-- select created_at, email, device, surf_years, frequency, source from public.waitlist order by created_at desc;
-- select device, count(*) from public.waitlist group by 1;
-- 欲しい機能の集計:
-- select w as want, count(*) from public.waitlist, unnest(wants) as w group by 1 order by 2 desc;
-- 「その他」の中身: select created_at, wants_other from public.waitlist where wants_other is not null order by 1 desc;

-- ===== すでに表を作成済みの場合は、以下の列追加に加えて、上の「revoke insert, select, update, delete …」から
-- 「grant execute on function public.join_waitlist …」までのブロックも実行してください =====
-- alter table public.waitlist add column if not exists wants text[]
--   check (wants <@ array['apple_watch', 'photo', 'sns_card', 'other']::text[]);
-- alter table public.waitlist add column if not exists wants_other text
--   check (char_length(wants_other) <= 100);
-- grant insert (wants, wants_other) on public.waitlist to anon;
-- alter table public.waitlist add column if not exists thanks_sent_at timestamptz;   -- お礼メール用
