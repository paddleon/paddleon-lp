# 公開までの手順（初回セットアップ）

ドメイン・Supabase・Cloudflare・お礼メールを、ゼロから用意するときの手順です。本番（paddleon.app）はすでにこの手順で公開済みです。

## 公開までの手順

### 1. ドメインを取る
`paddleon.app` を取得します。Cloudflare Registrar で取ると、次の手順（Pages・メール転送）までまとめて Cloudflare で済みます。

※ `.app` は HTTPS 必須のドメインです。Cloudflare Pages なら自動で HTTPS になるので、特に設定は要りません。

### 2. Supabase に表を作る
1. Supabase でプロジェクトを作成します（リージョンは Tokyo がおすすめ）。
2. 左メニュー **SQL Editor** を開き、`supabase/waitlist.sql` の中身を貼り付けて **Run**。
3. **Project Settings → API Keys** から、次の2つを控えます。
   - Project URL（`https://xxxx.supabase.co`）
   - Publishable key（`sb_publishable_...`）または anon key（`eyJ...`）
4. `public/index.html` の末尾近く、次の2行を書き換えます。
   ```js
   const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
   const SUPABASE_KEY = 'YOUR-PUBLISHABLE-OR-ANON-KEY';
   ```

このキーはページに埋め込んで公開してよい種類のものです。表の設定で「ページからは登録（追加）だけできる。読む・消す・書き換えるはできない」ようにしてあるので、キーを見られても登録者の一覧は読まれません。
**service_role key（secret key）は絶対にページに入れないでください。**

### 3. プライバシーポリシーを仕上げる
運営者名（PADDLE ON 運営事務局）と制定日（2026年10月1日）は記入済みです。内容を一度読んで確認してください。

お問い合わせ先は `support@paddleon.app` にしてあります（LPのフッターも同じ）。
Cloudflare の **Email Routing**（無料）で、このアドレス宛のメールを普段のアドレスに転送できます。別のアドレスにする場合は、`index.html` と `privacy.html` の `support@paddleon.app` を置き換えてください。

※ 内容は一般的なひな形です。必要に応じて専門家に確認してください。

### 4. Cloudflare Workers で公開する（GitHub Actions）
リポジトリ直下の `wrangler.jsonc` で「`public` フォルダをそのまま公開する」設定にしてあります（ビルドなし）。デプロイは GitHub Actions（`.github/workflows/deploy.yml`）が行います。
1. Cloudflare で API トークンを作ります：**My Profile → API Tokens → Create Token → 「Edit Cloudflare Workers」テンプレート**。Account Resources は自分のアカウント、Zone Resources は `paddleon.app` に絞ります。
2. Cloudflare の **Account ID** を控えます（Workers & Pages の画面右側、またはアカウントのホーム）。
3. GitHub のリポジトリ **Settings → Secrets and variables → Actions → New repository secret** に登録します。
   - `CLOUDFLARE_API_TOKEN` … 1のトークン
   - `CLOUDFLARE_ACCOUNT_ID` … 2の ID
4. Cloudflare 側の Git 連携（Workers Builds）を使っている場合は外します：Worker の **設定 → ビルド → Git リポジトリ → 切断**。外さないと、push のたびに二重にデプロイされます。
5. 初回だけ、GitHub の **Actions → Deploy → Run workflow** で手動実行して、緑になることを確認します。
6. Worker の **設定 → ドメインとルート → カスタムドメイン** で `paddleon.app` を追加します（設定済みなら不要）。
7. **SSL/TLS → Edge Certificates → Always Use HTTPS** をオンにします。

以後は `main` に push するだけで、チェック → 本番 → 確認 → タグとリリースまで自動で進みます（流れは README の「デプロイの流れ」）。

### 5. 公開後の確認
- 自分のメールアドレスで登録してみて、Supabase の **Table Editor → waitlist** に1行増えることを確認します。
- 同じアドレスでもう一度登録しても「ありがとうございます」が出ます（重複は保存されません）。
- SNSでの見え方は、X や Facebook のシェアプレビューで確認できます。

## 登録時のお礼メール（自動送信）
事前登録されると、登録したメールアドレスにお礼メールが1通自動で届きます。
仕組み：waitlist に1行追加 → Supabase の Database Webhook → Edge Function `send-thanks` → Resend（メール送信サービス）。

### 1. Resend の準備（無料プラン：1日100通・月3,000通）
1. https://resend.com でアカウントを作成
2. **Domains → Add Domain** で `paddleon.app` を追加。表示されるDNSレコード（DKIM と、`send` サブドメインの MX・SPF）を Cloudflare の DNS に追加して **Verify**（Cloudflare の自動設定ボタンが出ればそれでもOK）。
   - Cloudflare の Email Routing（support@ の受信転送）とは別のレコードなので、共存できます。
3. **API Keys → Create API Key**（権限は Sending access）。`re_` で始まるキーを控える。**このキーはLPやGitHubに書かないでください。**

### 2. Supabase の準備
1. SQL Editor で `waitlist.sql` 末尾の `thanks_sent_at` を追加する1行を実行（新規作成の場合は不要）。
2. **Edge Functions → Secrets** に次を登録：
   - `RESEND_API_KEY` … Resend のキー
   - `WEBHOOK_SECRET` … 自分で決めた長いランダム文字列（例：パスワード生成ツールで40文字）
   - 差出人を変えたい場合だけ `MAIL_FROM`（例：`PADDLE ON <hello@paddleon.app>`）
3. **Edge Functions → Deploy a new function → Via Editor** で、関数名を `send-thanks` にして `supabase/functions/send-thanks/index.ts` の中身を貼り付けて Deploy。
   - 関数の設定で **Verify JWT（JWTの検証）をオフ**にしてください（代わりに WEBHOOK_SECRET で守っています）。
   - CLIを使う場合は `supabase functions deploy send-thanks --no-verify-jwt`。
4. **関数を呼ぶトリガーを作る**：[`supabase/send_thanks_trigger.sql`](../supabase/send_thanks_trigger.sql) の `ここにWEBHOOK_SECRET` を2の値に書き換えて、SQL Editor で実行します（実際の公開ではこの方法で設定済み）。
   - 書き換えた後のファイルは GitHub に push しないでください。
   - ダッシュボードの Database Webhooks（**Integrations → Database Webhooks**）が使える場合は、下の設定で作っても同じです。どちらか片方だけにしてください。

   **Database Webhooks で作る場合**
   - Table：`waitlist`、Events：**Insert** のみ
   - Type：**Supabase Edge Functions** → `send-thanks`、Method：POST
   - HTTP Headers に `x-webhook-secret` = 2で決めた WEBHOOK_SECRET を追加

### 3. 確認
LPから自分のメールアドレスで登録 → 数秒でメールが届けばOK。届かないときは Edge Functions → send-thanks → **Logs** を確認してください。
送信済みの行は `thanks_sent_at` に日時が入ります。

### 安全のための工夫
- 同じ人に二重に送らない（`thanks_sent_at` で管理）。配信停止（`unsubscribed_at` 記入済み）の人には送らない。
- いたずらで大量登録されたときに備え、1時間あたり30通を上限にしています（`index.ts` の `MAX_PER_HOUR`）。上限で送らなかった行は `thanks_sent_at` が空のまま残ります。
- 本文の文面は `index.ts` の `textBody()`／`htmlBody()` で変えられます。

## GitHub に公開する前に
- このフォルダには `.gitignore` を入れてあります（`.env`・キーファイル・CSVなどの登録者データ・Supabase CLI のローカルファイルをコミットしない設定）。
- リポジトリの **Settings → Code security** で **Secret scanning** と **Push protection** をオンにしてください（キーを誤って push しかけたときに GitHub が止めます）。
- コミットに個人のメールアドレスを出したくない場合は、GitHub の **Settings → Emails** で「Keep my email addresses private」をオンにし、表示される `…@users.noreply.github.com` を `git config user.email` に設定します。
- ライセンスは付けていません（All rights reserved）。コードは公開していますが、著作権は作者に残り、無断での複製・改変・再配布はできません。写真は各撮影者のライセンス（Unsplash License 等）に、フォントは SIL Open Font License 1.1 に従います。

## 公開後の確認リスト
- Cloudflare の **SSL/TLS → Edge Certificates** で **Always Use HTTPS** をオン（http:// で来ても https:// に転送）。
- `https://paddleon.app/robots.txt` と `sitemap.xml` が開けること。Google Search Console にサイトを登録し、sitemap.xml を送信。
- X に LP の URL を貼ってプレビューを確認（OGP画像 `og.jpg` 1200×630 が出るか）。
- GA4 の「リアルタイム」に自分のアクセスと `sign_up` が出るか。
- 自分のメールアドレスで登録して、お礼メールが届くか（迷惑メールに入っていないか）。
- support@paddleon.app 宛のメールが転送されて届くか。
