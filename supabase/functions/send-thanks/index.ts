// PADDLE ON — 事前登録のお礼メール（Supabase Edge Function）
//
// waitlist 表に1行追加されると、Database Webhook がこの関数を呼び、Resend でお礼メールを1通送ります。
// 設定方法は docs/setup.md の「登録時のお礼メール」を見てください。送られるメールの見た目は同じフォルダの preview.html で確認できます。
//
// 必要なシークレット（Edge Functions → Secrets）:
//   RESEND_API_KEY   Resend の API キー（re_ で始まる）
//   WEBHOOK_SECRET   Webhook のヘッダーに付ける合言葉（自分で決めた長いランダム文字列）
//   MAIL_FROM        任意。差出人（既定: PADDLE ON <hello@paddleon.app>）
//   MAIL_REPLY_TO    任意。返信先（既定: support@paddleon.app）
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY は Supabase が自動で用意します。

import { createClient } from 'npm:@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET') ?? '';
const MAIL_FROM = Deno.env.get('MAIL_FROM') ?? 'PADDLE ON <hello@paddleon.app>';
const MAIL_REPLY_TO = Deno.env.get('MAIL_REPLY_TO') ?? 'support@paddleon.app';
const SITE_URL = 'https://paddleon.app';

// いたずらで大量登録されたときに送りすぎないための上限（1時間あたり）。
// Resend の無料枠は 1日100通・月3,000通なので、それより十分小さくしています。
const MAX_PER_HOUR = 30;

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function textBody(): string {
  return [
    'PADDLE ON の事前登録、ありがとうございます。',
    '',
    'PADDLE ON は、海から上がったら30秒で記録して、タップで振り返る、サーフィンの記録アプリです。',
    '「上手くなってる」が、ちゃんとわかるアプリを目指してつくっています。',
    '',
    '■ これからのお知らせ',
    '・登録状況と進捗',
    '・β（ベータ）版のご招待',
    '・アプリ公開のお知らせ',
    '',
    '■ これからについて',
    '事前登録者が100名に達した時点で本格的なアプリ開発に着手し、リリースを目指します（募集期限：2027年夏）。',
    '期限までに100名に達しなかった場合は、本格開発を見合わせることがあります。その際もこのメールアドレスにお知らせします。',
    '',
    'まわりのサーファーにも PADDLE ON を教えてもらえると、とても励みになります。',
    SITE_URL,
    '',
    'それまで、よい波を。',
    '',
    '――',
    'PADDLE ON',
    `お問い合わせ：${MAIL_REPLY_TO}（このメールへの返信でも届きます）`,
    'お知らせが不要になった場合は、このメールに「配信停止」と返信してください。',
    'このメールは、paddleon.app で事前登録された方にお送りしています。お心当たりのない場合は、お手数ですが破棄してください。',
  ].join('\n');
}

function htmlBody(): string {
  const p = 'margin:0 0 16px;font-size:15px;line-height:1.8;color:#1C2533';
  const h = 'margin:24px 0 8px;font-size:14px;font-weight:700;color:#0A0F1A';
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#F2F5F8">
<div style="max-width:560px;margin:0 auto;padding:32px 20px;font-family:'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP',Meiryo,sans-serif">
  <div style="background:#070E1A;border-radius:16px 16px 0 0;padding:20px 24px">
    <span style="font-family:Montserrat,Arial,sans-serif;font-weight:700;letter-spacing:.18em;font-size:16px;color:#EEF3F8">PADDLE <span style="color:#5ED3E6">ON</span></span>
  </div>
  <div style="background:#FFFFFF;border-radius:0 0 16px 16px;padding:28px 24px">
    <p style="margin:0 0 20px;font-size:20px;font-weight:700;color:#0A0F1A">事前登録、ありがとうございます。</p>
    <p style="${p}">PADDLE ON は、海から上がったら30秒で記録して、タップで振り返る、サーフィンの記録アプリです。「上手くなってる」が、ちゃんとわかるアプリを目指してつくっています。</p>
    <p style="${h}">これからのお知らせ</p>
    <p style="${p}">・登録状況と進捗<br>・β（ベータ）版のご招待<br>・アプリ公開のお知らせ</p>
    <p style="${h}">これからについて</p>
    <p style="${p}">事前登録者が100名に達した時点で本格的なアプリ開発に着手し、リリースを目指します（募集期限：2027年夏）。期限までに100名に達しなかった場合は、本格開発を見合わせることがあります。その際もこのメールアドレスにお知らせします。</p>
    <p style="${p}">まわりのサーファーにも PADDLE ON を教えてもらえると、とても励みになります。</p>
    <p style="margin:0 0 24px"><a href="${SITE_URL}/?utm_source=thanks_mail&amp;utm_medium=email" style="display:inline-block;background:#FFD23F;color:#0A0F1A;font-weight:700;font-size:15px;text-decoration:none;padding:12px 22px;border-radius:12px">paddleon.app を見る</a></p>
    <p style="${p}">それまで、よい波を。</p>
  </div>
  <p style="margin:20px 4px 0;font-size:12px;line-height:1.7;color:#5B6B82">
    PADDLE ON／お問い合わせ：<a href="mailto:${MAIL_REPLY_TO}" style="color:#2E8FA3">${MAIL_REPLY_TO}</a>（このメールへの返信でも届きます）<br>
    お知らせが不要になった場合は、このメールに「配信停止」と返信してください。<br>
    このメールは、paddleon.app で事前登録された方にお送りしています。お心当たりのない場合は、お手数ですが破棄してください。
  </p>
</div></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'method not allowed' });
  if (!WEBHOOK_SECRET || req.headers.get('x-webhook-secret') !== WEBHOOK_SECRET) return json(401, { error: 'unauthorized' });
  if (!RESEND_API_KEY) return json(500, { error: 'RESEND_API_KEY is not set' });

  let payload: { type?: string; table?: string; record?: { id?: number; email?: string } };
  try { payload = await req.json(); } catch { return json(400, { error: 'invalid json' }); }
  if (payload.type !== 'INSERT' || payload.table !== 'waitlist' || !payload.record?.id || !payload.record.email) {
    return json(200, { skipped: 'not a waitlist insert' });
  }
  const { id, email } = payload.record;

  // 送りすぎ防止：直近1時間の送信数が上限に達していたら送らない（行はそのまま残るので、後で手動で送れます）
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countErr } = await sb.from('waitlist').select('id', { count: 'exact', head: true }).gte('thanks_sent_at', since);
  if (countErr) return json(500, { error: countErr.message });
  if ((count ?? 0) >= MAX_PER_HOUR) {
    console.warn(`hourly limit reached (${count}); skipped id=${id}`);
    return json(200, { skipped: 'hourly limit' });
  }

  // 二重送信防止：まだ送っていない行だけを「送信済み」にしてから送る
  const now = new Date().toISOString();
  const { data: claimed, error: claimErr } = await sb.from('waitlist').update({ thanks_sent_at: now })
    .eq('id', id).is('thanks_sent_at', null).is('unsubscribed_at', null).select('id');
  if (claimErr) return json(500, { error: claimErr.message });
  if (!claimed || claimed.length === 0) return json(200, { skipped: 'already sent or unsubscribed' });

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `paddleon-thanks-${id}`,
    },
    body: JSON.stringify({
      from: MAIL_FROM,
      to: [email],
      reply_to: MAIL_REPLY_TO,
      subject: '【PADDLE ON】事前登録ありがとうございます',
      text: textBody(),
      html: htmlBody(),
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    // 失敗したら「送信済み」を取り消して、Webhook の再試行や手動再送ができるようにする
    await sb.from('waitlist').update({ thanks_sent_at: null }).eq('id', id);
    console.error(`resend error ${res.status}: ${detail}`);
    return json(502, { error: 'send failed', status: res.status });
  }
  return json(200, { sent: true, id });
});
