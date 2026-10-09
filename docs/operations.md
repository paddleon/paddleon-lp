# 運用メモ

公開後に、登録者の確認・集計・解析・メンテナンスをするときに見るページです。

## 登録者の見方・使い方

- **一覧**：Table Editor → `waitlist`。右上から CSV でダウンロードできます。
- **集計**：SQL Editor で
  ```sql
  select device, count(*) from public.waitlist group by 1;
  select source, count(*) from public.waitlist group by 1 order by 2 desc;
  ```
- **どこから来たか**：LPのURLに `?utm_source=instagram` のように付けてSNSに載せると、`source` 列に記録されます。
- **TestFlightへの招待**：テスト版ができたら、`device = 'iphone'` の人に TestFlight の公開リンクをメールで送ります。送った人は `invited_at` に日時を入れておくと管理しやすいです。
- **配信停止の連絡**が来たら、`unsubscribed_at` に日時を入れ、以後は送らないようにします。

## アクセス解析（Google アナリティクス 4）
測定ID `G-LB6QHHK4KE` のタグを `index.html` の `<head>` に直接埋め込んでいます（GTMは不使用）。送っているイベントは次のとおりです。
- `sign_up`：事前登録の完了（`method: waitlist`）
- `cta_click`：「事前登録」ボタンのクリック。`cta_location` が `header`／`hero`／`closing` のどれか
- `form_start_signup`：登録フォームへの入力開始（1回の訪問で1回だけ）
GA4の管理画面 →「データの表示」→「イベント」で `sign_up` を「キーイベント」にすると、登録数と登録率がレポートで見やすくなります。プライバシーポリシーの「4. 外部サービスの利用」にGoogle アナリティクスの記載を追加済みです。

## 注意

- **日本語フォント**：`public/fonts/` の Zen Kaku Gothic New は、ページ内の文字だけに絞って軽くしています（1ファイル約50KB）。文章を書き換えて新しい漢字を使うと、その文字だけ別の書体で表示されます。大きく文章を変えたときは、フォントの作り直しを依頼してください。

- **Supabase の無料プラン**は、一定期間アクセスがないとプロジェクトが一時停止されることがあります。止まるとフォームが送れなくなるので、ときどきダッシュボードを開いて状態を確認してください。
- **写真**：背景写真は軽量な WebP 形式です。ヒーローがPC用 `img/hero-bg.webp`／スマホ用 `img/hero-bg-sp.webp`、使い方スライダーが `img/how-bg.webp`、ABOUTが `img/about-bg.webp`、最後のセクションが `img/closing-bg.webp`。ヒーローは人の位置に合わせてCSSで配置しているので、差し替える場合は位置の調整が必要です。
- **アクセス解析**を入れる場合は、`</head>` の前に Cloudflare Web Analytics（無料・Cookieなし）などのタグを追加します。Google Analytics を入れる場合は、プライバシーポリシーにその旨を追記してください。
- フォームにはスパム対策として、人には見えない入力欄（ハニーポット）を入れてあります。スパムが増えてきたら Cloudflare Turnstile の追加を検討してください。

## お礼メールの仕組み

LPで登録 → `join_waitlist` が `waitlist` に1行追加 → トリガー `send_thanks_after_insert`（pg_net）→ Edge Function `send-thanks` → Resend で送信。送ったら `thanks_sent_at` に日時が入ります。

- 同じ人に二重に送らない（`thanks_sent_at` で管理）。配信停止（`unsubscribed_at` 記入済み）の人には送らない。
- いたずらで大量登録されたときに備え、1時間あたり30通が上限（`index.ts` の `MAX_PER_HOUR`）。上限で送らなかった行は `thanks_sent_at` が空のまま残ります。
- 本文は `supabase/functions/send-thanks/index.ts` の `textBody()`／`htmlBody()`。見た目は同じフォルダの `preview.html` で確認できます。変えたらダッシュボードで Deploy し直します（JWT の検証はオフのまま）。
- 届かないときは `supabase/send_thanks_trigger.sql` の末尾の確認用SQLを実行します。

## 秘密の値の置き場所

リポジトリには入れません。

| 値 | 置き場所 |
|---|---|
| `RESEND_API_KEY`（`re_`…） | Supabase → Edge Functions → Secrets |
| `WEBHOOK_SECRET` | Supabase → Edge Functions → Secrets と、トリガー関数 `notify_send_thanks` の中（SQL Editor で実行したもの） |
| `CLOUDFLARE_API_TOKEN`／`CLOUDFLARE_ACCOUNT_ID` | GitHub → Settings → Secrets and variables → Actions（Repository secrets） |

トークンやキーを作り直したときは、上の置き場所をすべて更新します。`WEBHOOK_SECRET` を変えたら、`supabase/send_thanks_trigger.sql` を新しい値で実行し直します。
