// R2（Cloudflare）へのメディアアップロード。Supabase Edge Function r2-upload を
// 直接POSTで叩く（bodyにBlobを乗せたいので supabase.functions.invoke は使わず fetch を使う）。
// R2 secrets が未設定だと関数が 501 を返すので、ここでは null を返して呼び出し側で
// Supabase Storage にフォールバックする＝段階的移行が安全にできる。
import { SUPABASE_URL, hasSupabase } from '../config';
import { supabase } from './supabase';

export async function uploadToR2(uri: string, kind: 'photo' | 'audio'): Promise<string | null> {
  if (!hasSupabase || !supabase) return null;
  try {
    const res = await fetch(uri);
    const blob = await res.blob();
    const contentType = blob.type || (kind === 'photo' ? 'image/jpeg' : 'audio/mp4');
    const sess = await supabase.auth.getSession();
    const token = sess.data.session?.access_token;
    if (!token) return null;
    const url = `${SUPABASE_URL}/functions/v1/r2-upload?kind=${encodeURIComponent(kind)}`;
    const r = await fetch(url, {
      method: 'POST',
      body: blob,
      headers: { 'Content-Type': contentType, Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return null; // 501（未設定）も 502/500 もここで吸収
    const j = await r.json();
    return typeof j?.publicUrl === 'string' ? j.publicUrl : null;
  } catch {
    return null;
  }
}
