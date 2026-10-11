// PADDLE ON LP — 静的アセットだけでは足りない2つの配信を補う Worker。
// wrangler.jsonc の run_worker_first に書いたパスだけがここを通る。それ以外は静的アセットとしてそのまま配信される。
//
// 1. トップページ（/）: AI エージェントが `Accept: text/markdown` で要求したら、Markdown 版（index.md）を返す。
//    ブラウザなど、Markdown を求めないリクエストには、これまでどおり HTML を返す。
//    （Cloudflare の有料機能「Markdown for Agents」と同じ動きを、自前で行う）
// 2. 動画（/video/*）: Range リクエストに 206 で部分配信する。
//    静的アセットは 206 を返さず、iPhone の Safari は 206 が返らないと動画を再生しないため。

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname.startsWith('/video/')) return serveRange(request, env);
    if (pathname === '/' || pathname === '/index.html') return servePage(request, env);
    return env.ASSETS.fetch(request);
  },
};

// トップページの応答に付ける Link ヘッダー（RFC 8288）。AI エージェントに、機械向けの資料の場所を知らせる
const LINKS = [
  '</.well-known/api-catalog>; rel="api-catalog"',
  '</llms.txt>; rel="describedby"; type="text/plain"',
  '</index.md>; rel="alternate"; type="text/markdown"',
  '</auth.md>; rel="service-doc"; type="text/markdown"',
  '</sitemap.xml>; rel="sitemap"; type="application/xml"',
  '</privacy.html>; rel="privacy-policy"',
].join(', ');

// Accept に text/markdown が（q=0 以外で）含まれているか
function wantsMarkdown(request) {
  const accept = request.headers.get('Accept') || '';
  return accept.split(',').some((part) => {
    const [type, ...params] = part.trim().toLowerCase().split(';').map((s) => s.trim());
    if (type !== 'text/markdown') return false;
    const q = params.find((p) => p.startsWith('q='));
    return !q || Number(q.slice(2)) > 0;
  });
}

async function servePage(request, env) {
  const isRead = request.method === 'GET' || request.method === 'HEAD';
  if (isRead && wantsMarkdown(request)) {
    const res = await env.ASSETS.fetch(new Request(new URL('/index.md', request.url), { method: 'GET' }));
    if (res.status === 200) {
      const text = await res.text();
      const headers = new Headers(res.headers);
      headers.set('Content-Type', 'text/markdown; charset=utf-8');
      headers.set('Vary', 'Accept');
      headers.set('Link', LINKS);
      // トークン数の目安（日本語が中心なので、UTF-8 のバイト数 ÷ 4 で見積もる）
      headers.set('x-markdown-tokens', String(Math.ceil(new TextEncoder().encode(text).length / 4)));
      headers.delete('Content-Length');
      headers.delete('ETag');
      return new Response(request.method === 'HEAD' ? null : text, { status: 200, headers });
    }
    // index.md が取れなければ、下の HTML にフォールバックする
  }
  const res = await env.ASSETS.fetch(request);
  const headers = new Headers(res.headers);
  headers.append('Vary', 'Accept'); // HTML と Markdown を別々にキャッシュさせる
  if (res.status === 200) headers.set('Link', LINKS);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

async function serveRange(request, env) {
  const range = request.headers.get('Range');
  const reqHeaders = new Headers(request.headers);
  reqHeaders.delete('Range');
  const res = await env.ASSETS.fetch(new Request(request, { headers: reqHeaders }));

  if (res.status !== 200) return res; // 304（変更なし）や 404 はそのまま
  const out = new Headers(res.headers);
  out.set('Accept-Ranges', 'bytes');
  if (!range || request.method !== 'GET') return new Response(res.body, { status: 200, headers: out });

  const body = await res.arrayBuffer(); // 動画は 1MB 未満なので、まとめて読んで切り出す
  const size = body.byteLength;
  const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  let start, end;
  if (m && m[1] !== '') {
    start = Number(m[1]);
    end = m[2] !== '' ? Math.min(Number(m[2]), size - 1) : size - 1;
  } else if (m && m[2] !== '') {
    start = Math.max(size - Number(m[2]), 0); // bytes=-500（末尾の500バイト）
    end = size - 1;
  }
  if (start === undefined || start > end || start >= size) {
    out.set('Content-Range', `bytes */${size}`);
    out.delete('Content-Length');
    return new Response(null, { status: 416, headers: out });
  }
  out.set('Content-Range', `bytes ${start}-${end}/${size}`);
  out.set('Content-Length', String(end - start + 1));
  return new Response(body.slice(start, end + 1), { status: 206, headers: out });
}
