// napsnap 「金曜の号外リマインド」。週次の再訪リズムを作る。
// 金曜の夕方(JST)に pg_cron が叩く。今週(日曜0時JST〜)に通常投稿があるユーザーへ
// 「今週の号外、出せるよ（金曜だけ）」を Expo Push で送る。
//
// デプロイ:  supabase functions deploy issue-reminder
// スケジュール例(pg_cron): 金曜 9:00 UTC(=18:00 JST)
//   select cron.schedule('issue-reminder-fri', '0 9 * * 5',
//     $$ select net.http_post(
//          url:='https://<project>.supabase.co/functions/v1/issue-reminder',
//          headers:='{"Authorization":"Bearer <anon-or-service>"}'::jsonb) $$);
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// JST の「今週の日曜0時」を UTC ミリ秒で返す（号外の集計起点＝アプリの startOfWeek と合わせる）。
function startOfWeekJST(): number {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const dow = jst.getUTCDay(); // JSTに+9した値のUTC曜日＝JSTの曜日
  const jstMidnight = Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), jst.getUTCDate());
  const sundayJstMidnight = jstMidnight - dow * 24 * 60 * 60 * 1000;
  return sundayJstMidnight - 9 * 60 * 60 * 1000; // JST midnight → UTC ms
}

Deno.serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const weekStartIso = new Date(startOfWeekJST()).toISOString();
    // 今週の通常投稿（お題・号外は除外）を出したユーザーを集める。
    const { data: posts } = await supabase
      .from('posts')
      .select('user_id')
      .is('topic_key', null)
      .neq('kind', 'issue')
      .gte('created_at', weekStartIso);

    const userIds = [...new Set((posts ?? []).map((p: { user_id: string }) => p.user_id))];
    if (userIds.length === 0) return json({ sent: 0, reason: 'no weekly posts' });

    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token')
      .in('user_id', userIds);

    const messages = (tokens ?? []).map((t: { token: string }) => ({
      to: t.token,
      title: 'napsnap',
      body: '今週の号外、出せるよ（金曜だけ）',
      sound: null,
    }));
    if (messages.length === 0) return json({ sent: 0, reason: 'no tokens' });

    for (let i = 0; i < messages.length; i += 100) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messages.slice(i, i + 100)),
      });
    }
    return json({ sent: messages.length, users: userIds.length });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
