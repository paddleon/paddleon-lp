#!/usr/bin/env bash
# リポジトリ内に秘密の値（Resend の API キー、Supabase の secret key、JWT 形式のキー）が入っていないか確かめる。
# 使い方: bash scripts/check-secrets.sh
set -euo pipefail
cd "$(dirname "$0")/.."
pattern='re_[A-Za-z0-9]{8,}_[A-Za-z0-9]{8,}|sb_secret_[A-Za-z0-9_]+|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}'
if git grep -nIE "$pattern" -- . ':!package-lock.json'; then
  echo "秘密の値らしき文字列があります。コミットから外してください。" >&2
  exit 1
fi
# トリガーの合言葉はプレースホルダーのままであること
if ! grep -q "'ここにWEBHOOK_SECRET'" supabase/send_thanks_trigger.sql; then
  echo "supabase/send_thanks_trigger.sql の合言葉がプレースホルダー（ここにWEBHOOK_SECRET）ではありません。" >&2
  exit 1
fi
echo "秘密の値: なし"
