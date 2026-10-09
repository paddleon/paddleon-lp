# PADDLE ON 事前登録LP

MVP版LPを、事前登録フォーム付きの公開用ページにしたものです。
HTML・CSS・JavaScript だけで作ってあり、ビルドは不要です。

```
paddleon-lp/
├─ public/              ← このフォルダの中身をそのまま公開します
│  ├─ index.html        LP本体（フォームの送信先設定はこの中）
│  ├─ privacy.html      プライバシーポリシー（公開前に2か所を書き換え）
│  ├─ og.jpg            SNSでシェアされたときの画像（1200×630）
│  ├─ favicon.svg / apple-touch-icon.png
│  ├─ fonts/            日本語フォント（このページで使う文字だけに絞ったもの）
│  ├─ img/              背景写真・アプリ画面・動画のポスター画像
│  └─ video/            デモ動画（demo-screen.mp4 / .webm、画面のみ・27.5秒ループ）
└─ supabase/
   └─ waitlist.sql      登録を保存する表の作成SQL
```

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

### 4. Cloudflare Pages で公開する
1. Cloudflare ダッシュボード → **Workers & Pages → Create → Pages → Upload assets**。
2. プロジェクト名を `paddleon` などにして、**`public` フォルダ**をドラッグ＆ドロップ。
3. **Custom domains** で `paddleon.app` を追加します。

更新するときは、同じプロジェクトに `public` フォルダを再アップロードするだけです。
（GitHub で管理したくなったら、リポジトリをつないで「ビルドなし・出力フォルダ `public`」に切り替えられます。）

### 5. 公開後の確認
- 自分のメールアドレスで登録してみて、Supabase の **Table Editor → waitlist** に1行増えることを確認します。
- 同じアドレスでもう一度登録しても「ありがとうございます」が出ます（重複は保存されません）。
- SNSでの見え方は、X や Facebook のシェアプレビューで確認できます。

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

## 注意

- **日本語フォント**：`public/fonts/` の Zen Kaku Gothic New は、ページ内の文字だけに絞って軽くしています（1ファイル約50KB）。文章を書き換えて新しい漢字を使うと、その文字だけ別の書体で表示されます。大きく文章を変えたときは、フォントの作り直しを依頼してください。

- **Supabase の無料プラン**は、一定期間アクセスがないとプロジェクトが一時停止されることがあります。止まるとフォームが送れなくなるので、ときどきダッシュボードを開いて状態を確認してください。
- **写真**：背景写真は軽量な WebP 形式です。ヒーローがPC用 `img/hero-bg.webp`／スマホ用 `img/hero-bg-sp.webp`、使い方スライダーが `img/how-bg.webp`、ABOUTが `img/about-bg.webp`、最後のセクションが `img/closing-bg.webp`。ヒーローは人の位置に合わせてCSSで配置しているので、差し替える場合は位置の調整が必要です。
- **アクセス解析**を入れる場合は、`</head>` の前に Cloudflare Web Analytics（無料・Cookieなし）などのタグを追加します。Google Analytics を入れる場合は、プライバシーポリシーにその旨を追記してください。
- フォームにはスパム対策として、人には見えない入力欄（ハニーポット）を入れてあります。スパムが増えてきたら Cloudflare Turnstile の追加を検討してください。

## 動き・デモ動画・事前登録の文言

- **動き**：スクロールすると各セクションが下からふわっと表示（JavaScriptが無効な環境では最初から表示）、ヒーローのスマホ画面が自動で切り替わる、記録の数字のカウントアップ、カレンダーが埋まる演出を入れています。OSの「視差効果を減らす」設定がオンの人には、動きなしで表示されます。
- **デモ動画**：ファーストビューのスマホ画面に埋め込んでいます。`public/video/demo-screen.*` は、現在のプロトタイプ画面から作った「開発中のイメージ」です（画面下にも表記あり）。画面はスワイプで切り替わり、LPのスマホ枠にぴったり収まる比率（780:1688）です。画面に入ると音声なしで自動再生され、動画をタップすると一時停止／再生できます。実機の映像ができたら、同じ比率・同じファイル名で差し替えてください。SNS用の9:16版は別ファイル（paddleon-demo-sns.mp4）でお渡ししています。
- **使い方スライダー**：「記録する。振り返る。積み上げる。」はカード型のスライダーです（波チェック／記録／振り返り／課題の4枚）。カードは中央に表示され、左右に前後のカードが3分の1ほど見えます（端はグラデーションで隠しています）。画面に入ると5秒ごとに自動で送り、触れると自動送りは止まります。PCは矢印ボタン、スマホはスワイプ、キーボードは←→で操作できます。
- **ヘッダー**：下にスクロールするとヘッダー全体（事前登録ボタン含む）が隠れ、上にスクロールすると戻ります。
- **トップへ戻る**：1画面分スクロールすると右下に「↑」ボタンが出ます（スムーススクロール）。ファーストビューの左下には下へのスクロール誘導（PCのみ）があります。
- **マイクロコピー**：事前登録ボタンの下に「メールアドレスだけで、すぐに登録できます」を表示しています。
- **料金**：無料でできること4つと、「有料プラン（Plus）はリリース後に追加予定」の一文だけを載せています（価格・比較表は非掲載）。
- **開発着手の条件**：「事前登録者が100名に達した時点で本格的な開発に着手（募集期限：2027年夏）」の文言を、事前登録欄とよくある質問に入れています。数や期限を変えるときは `index.html` の「100名」「2027年夏」を検索して変えてください。
- **登録後の表示**：`index.html` の `id="done"` の部分です。プライバシーポリシーの利用目的にも「開発の進捗やリリース時期（リリースの見合わせを含む）」を追記済みです。
- **公式SNS**：文言に「（または公式SNS）」とあります。SNSアカウントを作ったら、フッターなどにリンクを追加するのがおすすめです。

## スマホでの「お使いのスマホ」
iPhone・Androidからのアクセスでは、ブラウザの情報（ユーザーエージェント）から機種を自動で判定し、「お使いのスマホ」の質問を表示しません（判定結果は device 列に保存）。PCからのアクセスでは質問を表示します。

## 「欲しい機能」の質問（任意）
登録フォームに、欲しい機能（Apple Watch／海の写真の整理／SNS用の記録カード／その他）の複数選択を追加しています。保存先は waitlist 表の `wants` 列です。「その他」を選ぶと自由入力欄（100文字まで）が出て、`wants_other` 列に保存されます。
**すでに表を作成済みの場合**は、`supabase/waitlist.sql` の末尾にある「すでに表を作成済みの場合」の行（alter table 2つと grant）を SQL Editor で実行してください。実行しないと、登録時にエラーになります。
集計は `select w as want, count(*) from public.waitlist, unnest(wants) as w group by 1 order by 2 desc;`

## アクセス解析（Google アナリティクス 4）
測定ID `G-LB6QHHK4KE` のタグを `index.html` の `<head>` に直接埋め込んでいます（GTMは不使用）。送っているイベントは次のとおりです。
- `sign_up`：事前登録の完了（`method: waitlist`）
- `cta_click`：「事前登録」ボタンのクリック。`cta_location` が `header`／`hero`／`closing` のどれか
- `form_start_signup`：登録フォームへの入力開始（1回の訪問で1回だけ）
GA4の管理画面 →「データの表示」→「イベント」で `sign_up` を「キーイベント」にすると、登録数と登録率がレポートで見やすくなります。プライバシーポリシーの「4. 外部サービスの利用」にGoogle アナリティクスの記載を追加済みです。

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
4. **関数を呼ぶトリガーを作る**：`supabase/send_thanks_trigger.sql` の `ここにWEBHOOK_SECRET` を2の値に書き換えて、SQL Editor で実行します（実際の公開ではこの方法で設定済み）。
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

## 重複登録の扱い（登録済みかどうかを外から確かめられないように）
登録は表へ直接書き込まず、Supabase の関数 `join_waitlist` を呼ぶ形にしています（`waitlist.sql` に定義）。
- 新規でも登録済みでも同じ「成功」が返り、画面も同じ「ご登録ありがとうございます」になります。APIを直接呼んでも区別できません。
- 登録済みのアドレスでは何も追加されないので、お礼メールも二重には届きません。
- ページのキーからは表へ直接書き込めません（関数経由だけ）。形式の誤り（メールの形・選択肢の値）は関数がエラーにします。
**すでに表を作成済みの場合**は、`waitlist.sql` の「revoke insert, select, update, delete …」から「grant execute on function public.join_waitlist …」までのブロックを SQL Editor で実行してください。実行前に新しいLPを公開すると、登録できなくなります（関数がまだないため）。

## GitHub に公開する前に
- このフォルダには `.gitignore` を入れてあります（`.env`・キーファイル・CSVなどの登録者データ・Supabase CLI のローカルファイルをコミットしない設定）。
- リポジトリの **Settings → Code security** で **Secret scanning** と **Push protection** をオンにしてください（キーを誤って push しかけたときに GitHub が止めます）。
- コミットに個人のメールアドレスを出したくない場合は、GitHub の **Settings → Emails** で「Keep my email addresses private」をオンにし、表示される `…@users.noreply.github.com` を `git config user.email` に設定します。
- ライセンスは付けていません（All rights reserved）。コードは公開していますが、著作権は作者に残り、無断での複製・改変・再配布はできません。写真は各撮影者のライセンス（Unsplash License 等）に、フォントは SIL Open Font License 1.1 に従います。

## 「つくっている人」と X
事前登録の手前に「つくっている人」（サーフィン歴・始めたきっかけ）と X（@nnakamura_tech）へのリンクを置いています。フッターにも X へのリンクがあります。文面は `index.html` の `class="maker"` の部分です。

## 同意の方式
同意のチェック欄はなく、送信ボタンの下に「登録すると、プライバシーポリシーに同意したものとみなします」と表示する方式です。

## 公開後の確認リスト
- Cloudflare の **SSL/TLS → Edge Certificates** で **Always Use HTTPS** をオン（http:// で来ても https:// に転送）。
- `https://paddleon.app/robots.txt` と `sitemap.xml` が開けること。Google Search Console にサイトを登録し、sitemap.xml を送信。
- X に LP の URL を貼ってプレビューを確認（OGP画像 `og.jpg` 1200×630 が出るか）。
- GA4 の「リアルタイム」に自分のアクセスと `sign_up` が出るか。
- 自分のメールアドレスで登録して、お礼メールが届くか（迷惑メールに入っていないか）。
- support@paddleon.app 宛のメールが転送されて届くか。
