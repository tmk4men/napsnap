// napsnap 期限切れ投稿の総合掃除（DB＋R2＋Supabase Storage）。
// pg_cron が15分おきにHTTPで叩く。public callableだが副作用は冪等で破壊なし。
//
// デプロイ:  supabase functions deploy prune-expired
// 起動:      pg_cron → net.http_post でこのURLを呼ぶ
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { AwsClient } from 'https://esm.sh/aws4fetch@1.0.20';

Deno.serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 期限切れ投稿を取得（最大500件/回で十分・次回でまた拾う）
    const { data: expired, error: selErr } = await supabase
      .from('posts')
      .select('id, image_url, audio_url')
      .lt('expires_at', new Date().toISOString())
      .limit(500);
    if (selErr) return json({ error: selErr.message }, 500);
    if (!expired || expired.length === 0) return json({ deleted: 0 });

    // R2 セットアップ
    const r2Account = Deno.env.get('R2_ACCOUNT_ID');
    const r2Key = Deno.env.get('R2_ACCESS_KEY_ID');
    const r2Secret = Deno.env.get('R2_SECRET_ACCESS_KEY');
    const r2Bucket = Deno.env.get('R2_BUCKET');
    const r2PubBase = (Deno.env.get('R2_PUBLIC_BASE') || '').replace(/\/+$/, '');
    const r2 =
      r2Account && r2Key && r2Secret && r2Bucket
        ? new AwsClient({
            accessKeyId: r2Key,
            secretAccessKey: r2Secret,
            service: 's3',
            region: 'auto',
          })
        : null;

    // メディア削除（並列）。失敗は黙って次回。
    const mediaTasks: Promise<unknown>[] = [];
    for (const p of expired as Array<{ id: string; image_url: string; audio_url: string | null }>) {
      for (const url of [p.image_url, p.audio_url].filter(Boolean) as string[]) {
        // R2 公開URL → R2 から DELETE
        if (r2 && r2PubBase && url.startsWith(r2PubBase)) {
          const key = url.slice(r2PubBase.length + 1); // 先頭の / を取り除く
          const endpoint = `https://${r2Account}.r2.cloudflarestorage.com/${r2Bucket}/${key
            .split('/')
            .map(encodeURIComponent)
            .join('/')}`;
          mediaTasks.push(r2.fetch(endpoint, { method: 'DELETE' }).catch(() => null));
          continue;
        }
        // Supabase Storage の公開URL（…/storage/v1/object/public/<bucket>/<path>）→ storage から DELETE
        const m = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
        if (m) {
          const [, bucket, path] = m;
          mediaTasks.push(
            supabase.storage
              .from(bucket)
              .remove([path])
              .catch(() => null)
          );
        }
      }
    }
    await Promise.all(mediaTasks);

    // posts 行を削除（views/reactions は on delete cascade で連動削除）
    const ids = (expired as Array<{ id: string }>).map((p) => p.id);
    const { error: delErr } = await supabase.from('posts').delete().in('id', ids);
    if (delErr) return json({ error: delErr.message, partial: ids.length }, 500);

    return json({ deleted: ids.length, media: mediaTasks.length });
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
