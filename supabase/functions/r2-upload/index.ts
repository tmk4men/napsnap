// napsnap R2 アップロード用 Edge Function。
// クライアント（投稿フロー）が画像/音声を直接POSTし、ここで R2 に保存して公開URLを返す。
//
// 必須 Secrets（Edge Functions → send-push と同じ画面で設定）:
//   R2_ACCOUNT_ID       … Cloudflare の Account ID
//   R2_ACCESS_KEY_ID    … R2 のAPIトークン（S3互換）
//   R2_SECRET_ACCESS_KEY
//   R2_BUCKET           … バケット名（例: napsnap-media）
//   R2_PUBLIC_BASE      … 公開URLのベース（例: https://pub-xxxx.r2.dev/napsnap-media or 独自ドメイン）
//
// Secrets未設定なら 501 を返す＝呼び出し側は Supabase Storage に静かにフォールバック。
import { AwsClient } from 'https://esm.sh/aws4fetch@1.0.20';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  try {
    const acct = Deno.env.get('R2_ACCOUNT_ID');
    const key = Deno.env.get('R2_ACCESS_KEY_ID');
    const sec = Deno.env.get('R2_SECRET_ACCESS_KEY');
    const bkt = Deno.env.get('R2_BUCKET');
    const pub = Deno.env.get('R2_PUBLIC_BASE');
    if (!acct || !key || !sec || !bkt || !pub) {
      return json({ error: 'R2 not configured' }, 501);
    }

    // 呼び出し元のユーザー認証（uuid をパスに使う）
    const supa = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization') || '' } } }
    );
    const { data: { user } } = await supa.auth.getUser();
    if (!user) return json({ error: 'unauthorized' }, 401);

    const url = new URL(req.url);
    const kind = url.searchParams.get('kind') === 'audio' ? 'audio' : 'photo';
    const contentType =
      req.headers.get('content-type') || (kind === 'photo' ? 'image/jpeg' : 'audio/mp4');
    const ext =
      (contentType.split('/')[1] || '').split(';')[0] || (kind === 'photo' ? 'jpg' : 'm4a');
    const path = `${user.id}/${kind}/${crypto.randomUUID()}.${ext}`;

    const buf = await req.arrayBuffer();
    if (!buf.byteLength) return json({ error: 'empty body' }, 400);

    const aws = new AwsClient({
      accessKeyId: key,
      secretAccessKey: sec,
      service: 's3',
      region: 'auto',
    });
    const endpoint = `https://${acct}.r2.cloudflarestorage.com/${bkt}/${path}`;
    const put = await aws.fetch(endpoint, {
      method: 'PUT',
      body: buf,
      headers: { 'Content-Type': contentType },
    });
    if (!put.ok) {
      const body = await put.text().catch(() => '');
      return json({ error: `r2 put ${put.status}`, detail: body.slice(0, 200) }, 502);
    }

    const publicUrl = `${pub.replace(/\/+$/, '')}/${path}`;
    return json({ publicUrl });
  } catch (e) {
    return json({ error: 'error: ' + (e instanceof Error ? e.message : String(e)) }, 500);
  }
});
