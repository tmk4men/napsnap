// napsnap アカウント完全削除。呼び出した本人（JWT）のデータと auth ユーザーを消す。
// クライアントは自分の access_token を Authorization に乗せて POST する。
// service_role で下流から順に削除（依存関係で 500 になるのを避ける既知の順序）：
//   reactions → views → follows → push_tokens → posts → profiles → auth.users
//
// デプロイ: supabase functions deploy delete-account
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // 呼び出し本人を JWT から特定（なりすまし防止：消せるのは自分自身だけ）。
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) return json({ error: 'no token' }, 401);

    const asUser = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await asUser.auth.getUser();
    const uid = userData?.user?.id;
    if (userErr || !uid) return json({ error: 'invalid session' }, 401);

    const admin = createClient(url, serviceKey);

    // 下流から順に削除。失敗は記録しつつ続行（できるだけ消す）。
    const steps: Array<[string, Promise<{ error: unknown }>]> = [
      ['reactions', admin.from('reactions').delete().eq('user_id', uid) as any],
      ['views', admin.from('views').delete().eq('viewer_id', uid) as any],
      ['follows_follower', admin.from('follows').delete().eq('follower_id', uid) as any],
      ['follows_following', admin.from('follows').delete().eq('following_id', uid) as any],
      ['push_tokens', admin.from('push_tokens').delete().eq('user_id', uid) as any],
      ['posts', admin.from('posts').delete().eq('user_id', uid) as any],
      ['profiles', admin.from('profiles').delete().eq('id', uid) as any],
    ];
    const failed: string[] = [];
    for (const [name, p] of steps) {
      const { error } = await p;
      if (error) {
        console.warn(`[delete-account] ${name} failed`, error);
        failed.push(name);
      }
    }

    // 最後に auth ユーザーを hard delete。
    const { error: delErr } = await admin.auth.admin.deleteUser(uid, false);
    if (delErr) {
      console.warn('[delete-account] auth delete failed', delErr);
      return json({ error: 'auth delete failed', failed }, 500);
    }

    return json({ ok: true, failed });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
