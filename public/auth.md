# PADDLE ON auth.md

AI エージェント向けの、認証と登録についての案内です。
This document tells AI agents how authentication and registration work on paddleon.app.

## 要約 / Summary

- このサイト（https://paddleon.app/）に、ログイン・アカウント・API キーはありません。すべてのページは認証なしで読めます。
- AI エージェントが取得できる認証情報（トークンなど）はありません。エージェント向けの登録の仕組みもありません。
- No login, accounts, API keys, or OAuth exist on this site. All pages are public and readable without authentication. There is no agent registration endpoint and no credentials to obtain.

## 対象 / Audience

paddleon.app の内容を読んで、利用者に PADDLE ON を紹介・説明する AI エージェント。

## 認証 / Authentication

- 方式：なし（不要）
- OAuth の認可サーバー、保護されたリソース、スコープ：なし
- エージェントの登録先（`register_uri`）：なし

## 読めるもの / Public resources

認証なしで、次の資料を読めます。

- サービスの概要（Markdown）：https://paddleon.app/llms.txt （トップページを `Accept: text/markdown` で要求しても同じ内容が返ります）
- よくある質問：https://paddleon.app/#faq
- プライバシーポリシー：https://paddleon.app/privacy.html
- API の一覧：https://paddleon.app/.well-known/api-catalog （公開している API はありません）

## 事前登録について / Waitlist sign-up

事前登録（メールアドレスの登録）は、利用者本人がサイトのフォームから行ってください：https://paddleon.app/#signup

登録はプライバシーポリシーへの同意を伴うため、AI エージェントが利用者に代わって自動で送信することは想定していません。利用者にフォームを案内してください。
Waitlist sign-up must be completed by the person themselves through the form on the site, because it involves agreeing to the privacy policy. Agents should direct people to the form rather than submitting it for them.

## アプリについて / About the app

PADDLE ON のアプリ本体（iPhone版）は、まだ公開していません。公開後にログインや API ができた場合は、この文書を更新します。

## お問い合わせ / Contact

support@paddleon.app
