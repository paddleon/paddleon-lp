// PADDLE ON LP — 動画の部分配信（Range リクエスト）を足すための Worker。
//
// Cloudflare Workers の静的アセットは Range リクエストに 206 を返さない。
// iPhone の Safari は動画を必ず Range で取りに来て、206 が返らないと再生しないので、
// /video/* だけこの Worker を通して、要求された範囲を切り出して返す（wrangler.jsonc の run_worker_first）。
// それ以外のファイルは、これまでどおり静的アセットとしてそのまま配信される。

export default {
  async fetch(request, env) {
    const range = request.headers.get('Range');
    const headers = new Headers(request.headers);
    headers.delete('Range');
    const res = await env.ASSETS.fetch(new Request(request, { headers }));

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
  },
};
