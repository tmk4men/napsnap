// napsnap 段階2：プッシュ通知の送信（Supabase Edge Function / Deno）。
// posts / reactions の INSERT を Database Webhook で受け、関係するユーザーへ Expo Push を送る。
//
// デプロイ:  supabase functions deploy send-push
// 起動方法:  Database Webhook（posts INSERT / reactions INSERT）→ このURLへPOST
//   Webhook の標準ペイロード { type, table, record, old_record } をそのまま読む。
// 認証情報:  SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY は Edge Function に自動注入される。
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const table: string = payload?.table;
    const rec = payload?.record;
    if (!rec) return ok('no record');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let recipientIds: string[] = [];
    let body = '';

    if (table === 'posts') {
      if (rec.topic_key) return ok('skip topic'); // お題は通知しない（ノイズ回避）
      const { data: followers } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', rec.user_id);
      recipientIds = (followers ?? []).map((f: { follower_id: string }) => f.follower_id);
      body = `${await displayName(supabase, rec.user_id)} が日常を出した`;
    } else if (table === 'reactions') {
      const { data: post } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', rec.post_id)
        .single();
      if (!post || post.user_id === rec.user_id) return ok('self/none'); // 自分の反応は通知しない
      recipientIds = [post.user_id];
      body = `${await displayName(supabase, rec.user_id)} があなたの投稿に反応した`;
    } else {
      return ok('ignored table');
    }

    if (recipientIds.length === 0) return ok('no recipients');

    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token')
      .in('user_id', recipientIds);
    const messages = (tokens ?? []).map((t: { token: string }) => ({
      to: t.token,
      title: 'napsnap',
      body,
      sound: null,
    }));
    if (messages.length === 0) return ok('no tokens');

    // Expo Push API は1リクエスト最大100件。100件ずつに分割して送る。
    for (let i = 0; i < messages.length; i += 100) {
      await fetch(EXPO_PUSH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messages.slice(i, i + 100)),
      });
    }
    return ok(`sent ${messages.length}`);
  } catch (e) {
    // Webhook の再送ストームを避けるため、エラーでも 200 を返す。
    return ok('error: ' + (e instanceof Error ? e.message : String(e)));
  }
});

async function displayName(supabase: ReturnType<typeof createClient>, userId: string): Promise<string> {
  const { data } = await supabase.from('profiles').select('display_name').eq('id', userId).single();
  const name = (data as { display_name?: string } | null)?.display_name?.trim();
  return name || '誰か';
}

function ok(message: string): Response {
  return new Response(JSON.stringify({ message }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
