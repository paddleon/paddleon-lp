# システム構成

PADDLE ON 事前登録LP（https://paddleon.app/）の構成図です。図は Mermaid で書いているので、GitHub 上でそのまま図として表示されます。構成を変えたら、この図も合わせて直します。

## 全体の構成

```mermaid
flowchart LR
  user(["訪問者のブラウザ"])

  subgraph CF["Cloudflare"]
    dns["paddleon.app<br/>DNS・HTTPS"]
    subgraph W["Worker: paddleon-lp"]
      assets["静的アセット<br/>public/ の HTML・画像・フォント<br/>llms.txt・index.md・robots.txt"]
      worker["src/worker.js<br/>/video/* の部分配信（206）"]
    end
    mailfwd["Email Routing<br/>support@paddleon.app を転送"]
  end

  subgraph G["Google"]
    gfonts["Google Fonts<br/>英字フォント"]
    ga4["Google アナリティクス 4<br/>アクセス解析・イベント"]
  end

  subgraph SB["Supabase（Tokyo）"]
    rpc["RPC join_waitlist<br/>publishable key で呼べる唯一の入口"]
    table[("waitlist 表<br/>ページからは読めない")]
    trigger["トリガー send_thanks_after_insert<br/>pg_net で関数を呼ぶ"]
    fn["Edge Function send-thanks<br/>合言葉で保護・二重送信防止"]
  end

  resend["Resend<br/>メール送信"]
  inbox(["登録者のメール"])
  owner(["運営者のメール"])

  user --> dns --> assets
  dns --> worker
  user -->|"英字フォント"| gfonts
  user -->|"閲覧・クリック・登録"| ga4
  user -->|"登録フォーム送信"| rpc
  rpc --> table
  table -->|"1行追加"| trigger
  trigger -->|"x-webhook-secret"| fn
  fn -->|"thanks_sent_at を記録"| table
  fn --> resend --> inbox
  inbox -.->|"返信・お問い合わせ"| mailfwd --> owner
```

| 部分 | 役割 | 場所 |
|---|---|---|
| 静的アセット | LP 本体。ビルドなしでそのまま配信 | `public/`、`wrangler.jsonc` |
| src/worker.js | 動画だけ部分配信（iPhone の Safari 用）。ほかのファイルは通らない | `src/worker.js` |
| join_waitlist | 登録の受け付け。新規でも登録済みでも同じ結果を返す | `supabase/waitlist.sql` |
| send_thanks_after_insert | 登録されたらお礼メールの関数を呼ぶ | `supabase/send_thanks_trigger.sql` |
| send-thanks | Resend でお礼メールを送る（1時間30通まで） | `supabase/functions/send-thanks/` |

## 登録からお礼メールまで

```mermaid
sequenceDiagram
  autonumber
  actor U as 訪問者
  participant LP as LP（ブラウザ）
  participant GA as GA4
  participant RPC as join_waitlist
  participant DB as waitlist 表
  participant TR as トリガー（pg_net）
  participant FN as send-thanks
  participant RS as Resend

  U->>LP: メールアドレスを入力
  LP->>GA: form_start_signup
  U->>LP: 「事前登録する」を押す
  LP->>RPC: POST /rest/v1/rpc/join_waitlist（publishable key）
  alt 形式が正しい・未登録
    RPC->>DB: 1行追加
    DB->>TR: AFTER INSERT
    TR-->>FN: POST（x-webhook-secret）※非同期
    FN->>DB: thanks_sent_at を記録（未送信の行だけ）
    FN->>RS: お礼メールを送信
    RS-->>U: 「事前登録ありがとうございます」
  else 登録済み
    RPC-->>RPC: 何もしない（メールも送らない）
  else 形式の誤り
    RPC-->>LP: 400 invalid input
  end
  RPC-->>LP: 成功（新規でも登録済みでも同じ応答）
  LP->>GA: sign_up
  LP-->>U: 「ご登録ありがとうございます」
```

## デプロイと監視

```mermaid
flowchart TD
  dev(["VSCode で編集"]) --> push{"どのブランチに push？"}

  push -->|"main 以外"| pv["Preview<br/>チェック → プレビューURLへアップロード"]
  push -->|"main（public/・src/・wrangler.jsonc などが変わったとき）"| check
  push -->|"main（docs/・supabase/ だけ）"| none["何もしない"]

  subgraph DEPLOY["Deploy（GitHub Actions）"]
    check["チェック npm run check<br/>秘密の値・参照ファイル・接続設定<br/>他社のロゴとストア名・フォントの文字・wrangler"]
    deploy["wrangler deploy<br/>Cloudflare Workers へ"]
    verify["本番の確認<br/>index.html が一致・主要ファイル 200<br/>動画が 206・非公開ファイルが 404"]
    release["タグ vYYYY.MM.DD と<br/>GitHub リリースを作成"]
    check -->|"合格"| deploy --> verify -->|"合格"| release
  end

  check -->|"不合格"| stop1["本番に出ない"]
  verify -->|"不合格"| stop2["リリースを作らない<br/>（Cloudflare で巻き戻し）"]

  cron(["毎日 9:17（日本時間）"]) --> keep["Keepalive<br/>join_waitlist を形式の誤りで呼ぶ"]
  keep -->|"400 invalid input"| ok["正常（Supabase の一時停止も防ぐ）"]
  keep -->|"それ以外"| alert["失敗 → GitHub からメール"]

  manual(["手動で反映"]) --> sbm["supabase/*.sql は SQL Editor<br/>send-thanks はダッシュボードで Deploy"]
```

## 秘密の値の置き場所

```mermaid
flowchart LR
  subgraph GH["GitHub（Repository secrets）"]
    t1["CLOUDFLARE_API_TOKEN"]
    t2["CLOUDFLARE_ACCOUNT_ID"]
  end
  subgraph SBS["Supabase（Edge Functions → Secrets）"]
    s1["RESEND_API_KEY"]
    s2["WEBHOOK_SECRET"]
  end
  subgraph DBF["Supabase（データベースの関数）"]
    s3["notify_send_thanks の中の合言葉<br/>＝ WEBHOOK_SECRET と同じ値"]
  end
  subgraph PUB["公開してよい値（index.html）"]
    p1["Supabase の Project URL"]
    p2["publishable key"]
    p3["GA4 の測定ID"]
  end
  t1 & t2 -->|"デプロイ"| CFW["Cloudflare Workers"]
  s1 -->|"送信"| RSD["Resend"]
  s2 -.-|"一致させる"| s3
```

リポジトリに入れてよいのは「公開してよい値」だけです。ほかの値はチャットやファイルに書かず、各サービスの画面に直接入力します。
