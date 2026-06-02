// napsnap 「今日の見出し」を全端末に8時(JST)に push 通知。
// pg_cron が 23:00 UTC（= 8:00 JST）に HTTP で叩く。
//
// デプロイ:  supabase functions deploy topic-broadcast
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// src/topics.ts の完全ミラー（同じ並び・同じ件数・同じ prompt）。
// ⚠ アプリ側 TOPICS と必ず一致させること。件数が違うと mod 計算がずれて
//   「プッシュのお題」と「アプリ表示のお題」が食い違う（過去にこのバグがあった）。
const TOPICS = [
  { key: 'gohan', prompt: 'ごはん' },
  { key: 'sora', prompt: '空' },
  { key: 'nomimono', prompt: '飲みもの' },
  { key: 'desk', prompt: '机の上' },
  { key: 'ashimoto', prompt: '足もと' },
  { key: 'oyatsu', prompt: 'おやつ' },
];

function todaysTopicJST(): { key: string; prompt: string } {
  // UTC に +9h を足して JST の「今日」を導出（topics.ts と同じインデックス計算）。
  const jstMs = Date.now() + 9 * 60 * 60 * 1000;
  const dayIdx = Math.floor(jstMs / (24 * 60 * 60 * 1000));
  const i = ((dayIdx % TOPICS.length) + TOPICS.length) % TOPICS.length;
  return TOPICS[i];
}

Deno.serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { data: tokens } = await supabase.from('push_tokens').select('token');
    if (!tokens || tokens.length === 0) {
      return json({ sent: 0, reason: 'no tokens' });
    }

    const t = todaysTopicJST();
    const messages = (tokens as Array<{ token: string }>).map((row) => ({
      to: row.token,
      title: 'napsnap',
      body: `今日のお題は「${t.prompt}」`,
      sound: null,
    }));

    // Expo Push API は 1リクエスト最大100件。
    for (let i = 0; i < messages.length; i += 100) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messages.slice(i, i + 100)),
      });
    }
    return json({ sent: messages.length, topic: t.key });
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
