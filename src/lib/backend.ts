// napsnap データアクセス層（Supabase）。
// store.ts の各操作に1:1で対応する関数を用意し、鍵が来たら store から呼び替えるだけにする。
// supabase が null（鍵未設定）のときは使わない＝アプリは従来どおりローカルのモックで動く。
import { supabase } from './supabase';
import { MEDIA_BUCKET } from '../config';
import { Post, PostCaption, Reaction, ReactionType, TopicVisibility, User, ViewRecord } from '../types';
import { uid } from './id';
import { uploadToR2 } from './r2';

function db() {
  if (!supabase) throw new Error('Supabase未設定（EXPO_PUBLIC_SUPABASE_URL / ANON_KEY）');
  return supabase;
}

export const backendEnabled = !!supabase;

// ---------- 認証（匿名サインイン）----------
// 端末ごとに1つの匿名ユーザー。初回に作成し、以降は永続セッションを再利用。
export async function ensureSession(): Promise<string | null> {
  const s = db();
  const { data } = await s.auth.getSession();
  if (data.session?.user) return data.session.user.id;
  const { data: anon, error } = await s.auth.signInAnonymously();
  if (error) throw error;
  return anon.user?.id ?? null;
}

export async function myId(): Promise<string | null> {
  const { data } = await db().auth.getUser();
  return data.user?.id ?? null;
}

export async function signOut() {
  if (supabase) await supabase.auth.signOut();
}

// ---------- 行 → アプリ型 ----------
const toMs = (t: string) => new Date(t).getTime();

// 永続的に公式扱いする handle のホワイトリスト（開発者/運営）。
// DB の is_official が立っていなくてもクライアント側で verified バッジを出すための保険。
const FORCED_OFFICIAL_HANDLES = new Set(['ktomo_dev', 'sugar_dev']);

function rowToUser(r: any): User {
  const forcedOfficial = typeof r.handle === 'string' && FORCED_OFFICIAL_HANDLES.has(r.handle);
  return {
    id: r.id,
    handle: r.handle,
    displayName: r.display_name ?? '',
    avatarEmoji: '',
    avatarColor: '',
    avatarImageUri: r.avatar_url ?? undefined,
    createdAt: toMs(r.created_at),
    isOfficial: !!r.is_official || forcedOfficial,
  };
}

function rowToPost(r: any): Post {
  return {
    id: r.id,
    userId: r.user_id,
    topicKey: r.topic_key ?? undefined,
    imageUrl: r.image_url,
    caption: (r.caption ?? undefined) as PostCaption | undefined,
    audioUrl: r.audio_url ?? undefined,
    createdAt: toMs(r.created_at),
    expiresAt: toMs(r.expires_at),
    reactionCount: typeof r.reaction_count === 'number' ? r.reaction_count : 0,
    viewCount: typeof r.view_count === 'number' ? r.view_count : 0,
    topicVisibility: r.topic_visibility === 'followers' ? 'followers' : 'public',
  };
}

const rowToReaction = (r: any): Reaction => ({
  id: r.id,
  postId: r.post_id,
  userId: r.user_id,
  type: r.type as ReactionType,
  createdAt: toMs(r.created_at),
});

const rowToView = (r: any): ViewRecord => ({
  id: r.id,
  postId: r.post_id,
  viewerId: r.viewer_id,
  viewedAt: toMs(r.viewed_at),
});

// ---------- プロフィール ----------
export async function upsertMyProfile(p: { handle: string; displayName: string; avatarUrl?: string }) {
  const id = await myId();
  if (!id) throw new Error('未サインイン');
  const { error } = await db()
    .from('profiles')
    .upsert({ id, handle: p.handle, display_name: p.displayName, avatar_url: p.avatarUrl ?? null });
  if (error) throw error;
}

export async function updateMyProfile(fields: { handle?: string; displayName?: string; avatarUrl?: string }) {
  const id = await myId();
  if (!id) throw new Error('未サインイン');
  const patch: Record<string, unknown> = {};
  if (fields.handle !== undefined) patch.handle = fields.handle;
  if (fields.displayName !== undefined) patch.display_name = fields.displayName;
  if (fields.avatarUrl !== undefined) patch.avatar_url = fields.avatarUrl;
  const { error } = await db().from('profiles').update(patch).eq('id', id);
  if (error) throw error;
}

// 必要な人のプロフィールだけ取得する（全件 select * を避ける＝ポーリングの主コスト対策）。
// 自分・フォロー・公式・投稿/反応/足あとに出てくる人だけを id 指定で引く。
export async function listProfilesByIds(ids: string[]): Promise<User[]> {
  const uniq = [...new Set(ids)].filter(Boolean);
  if (uniq.length === 0) return [];
  const { data, error } = await db().from('profiles').select('*').in('id', uniq);
  if (error) throw error;
  return (data ?? []).map(rowToUser);
}

// 発見用（オンボのフォロー候補など）に、最近の非公式ユーザーを少数だけ。総数に依存させない。
export async function suggestProfiles(limit = 30): Promise<User[]> {
  const { data, error } = await db()
    .from('profiles')
    .select('*')
    .eq('is_official', false)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(rowToUser);
}

// オンボードでの handle 重複チェック。RLS は profiles_read=true なので誰でも読める。
export async function isHandleTaken(handle: string): Promise<boolean> {
  const h = handle.trim().replace(/^@/, '');
  if (!h) return false;
  const { data, error } = await db().from('profiles').select('id').eq('handle', h).limit(1);
  if (error) return false; // 失敗時は通す（保存時にDBの UNIQUE で最終的に弾かれる）
  return (data?.length ?? 0) > 0;
}

export async function searchProfiles(query: string): Promise<User[]> {
  const q = query.trim().replace(/^@/, '');
  if (!q) return [];
  const { data, error } = await db().from('profiles').select('*').ilike('handle', `%${q}%`).limit(20);
  if (error) throw error;
  return (data ?? []).map(rowToUser);
}

// ---------- フォロー ----------
export async function listFollowing(): Promise<string[]> {
  const id = await myId();
  if (!id) return [];
  const { data, error } = await db().from('follows').select('following_id').eq('follower_id', id);
  if (error) throw error;
  return (data ?? []).map((r: any) => r.following_id);
}

export async function follow(targetId: string) {
  const id = await myId();
  if (!id) throw new Error('未サインイン');
  const { error } = await db().from('follows').upsert({ follower_id: id, following_id: targetId });
  if (error) throw error;
}

export async function unfollow(targetId: string) {
  const id = await myId();
  if (!id) throw new Error('未サインイン');
  const { error } = await db().from('follows').delete().eq('follower_id', id).eq('following_id', targetId);
  if (error) throw error;
}

// ---------- メディアのアップロード（画像/音声）----------
// 優先：R2（egress無料）→ ダメなら Supabase Storage にフォールバック。
// R2 secrets が未設定の間は r2-upload Function が 501 を返し、ここから先で吸収される。
export async function uploadMedia(uri: string, kind: 'photo' | 'audio'): Promise<string> {
  const r2 = await uploadToR2(uri, kind);
  if (r2) return r2;

  // 従来通り Supabase Storage（フォールバック）。
  const id = await myId();
  if (!id) throw new Error('未サインイン');
  const res = await fetch(uri);
  const blob = await res.blob();
  const contentType = blob.type || (kind === 'photo' ? 'image/jpeg' : 'audio/mp4');
  const ext = contentType.split('/')[1]?.split(';')[0] || (kind === 'photo' ? 'jpg' : 'm4a');
  const path = `${id}/${kind}/${uid('')}.${ext}`;
  const { error } = await db().storage.from(MEDIA_BUCKET).upload(path, blob, { contentType, upsert: true });
  if (error) throw error;
  return db().storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

// ---------- 投稿 ----------
export async function addPost(input: {
  imageUri: string;
  audioUri?: string;
  caption?: PostCaption;
  topicKey?: string;
  topicVisibility?: TopicVisibility;
  expiresAt: number; // store 側で算出（通常24h / お題=その日の終わり）
}): Promise<Post> {
  const id = await myId();
  if (!id) throw new Error('未サインイン');
  const imageUrl = await uploadMedia(input.imageUri, 'photo');
  const audioUrl = input.audioUri ? await uploadMedia(input.audioUri, 'audio') : null;
  const { data, error } = await db()
    .from('posts')
    .insert({
      user_id: id,
      topic_key: input.topicKey ?? null,
      image_url: imageUrl,
      caption: input.caption ?? null,
      audio_url: audioUrl,
      expires_at: new Date(input.expiresAt).toISOString(),
      // posts.topic_visibility は NOT NULL なので、通常投稿でも 'public' を入れる
      // （通常投稿では未使用だが、制約違反を避ける）。お題投稿のみ実体的に意味を持つ。
      topic_visibility: input.topicKey ? input.topicVisibility ?? 'public' : 'public',
    })
    .select('*')
    .single();
  if (error) throw error;
  return rowToPost(data);
}

// 自分＋フォロー中の、まだ消えていない投稿（RLSで可視範囲が絞られる）。
export async function listActivePosts(): Promise<Post[]> {
  const { data, error } = await db()
    .from('posts')
    .select('*')
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToPost);
}

// 自分の通常投稿（=思い出。期限を問わず全部）。
export async function listMyPosts(): Promise<Post[]> {
  const id = await myId();
  if (!id) return [];
  const { data, error } = await db().from('posts').select('*').eq('user_id', id).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToPost);
}

// ---------- 反応 / 足跡 ----------
// 反応の取得は「自分が押したもの ∪ 自分の投稿に来たもの」だけに絞る。
// 「N人が反応」のカウント表示は posts.reaction_count（DBトリガで維持）から取るので、
// 他人の投稿に対する他人の反応の行は引かなくて済む（メタ通信を大幅に削減）。
export async function listReactions(): Promise<Reaction[]> {
  const id = await myId();
  if (!id) return [];
  const myReactions = await db().from('reactions').select('*').eq('user_id', id);
  if (myReactions.error) throw myReactions.error;

  const myPosts = await db().from('posts').select('id').eq('user_id', id);
  if (myPosts.error) throw myPosts.error;
  const myPostIds = (myPosts.data ?? []).map((p: any) => p.id);

  let onMyPosts: { data: any[] | null; error: any } = { data: [], error: null };
  if (myPostIds.length) {
    onMyPosts = await db().from('reactions').select('*').in('post_id', myPostIds);
    if (onMyPosts.error) throw onMyPosts.error;
  }

  // id で重複排除（自分の投稿に自分が反応＝両方に出る、を1つに）。
  const merged = new Map<string, Reaction>();
  for (const r of (myReactions.data ?? []).map(rowToReaction)) merged.set(r.id, r);
  for (const r of (onMyPosts.data ?? []).map(rowToReaction)) merged.set(r.id, r);
  return [...merged.values()];
}

export async function react(postId: string, type: ReactionType) {
  const id = await myId();
  if (!id) throw new Error('未サインイン');
  const { error } = await db()
    .from('reactions')
    .upsert({ post_id: postId, user_id: id, type }, { onConflict: 'post_id,user_id' });
  if (error) throw error;
}

// 足あと（views）の取得は「自分の投稿に来たもの」だけ＝アクティビティ通知用。
// 「N人が見た」のカウント表示は posts.view_count（DBトリガで維持）から取る。
// 自分の閲覧履歴は client 側の楽観的記録だけで足りる（サーバ側 markViewed は ignoreDuplicates）。
export async function listViews(): Promise<ViewRecord[]> {
  const id = await myId();
  if (!id) return [];
  const myPosts = await db().from('posts').select('id').eq('user_id', id);
  if (myPosts.error) throw myPosts.error;
  const myPostIds = (myPosts.data ?? []).map((p: any) => p.id);
  if (myPostIds.length === 0) return [];
  const { data, error } = await db().from('views').select('*').in('post_id', myPostIds);
  if (error) throw error;
  return (data ?? []).map(rowToView);
}

export async function markViewed(postId: string) {
  const id = await myId();
  if (!id) throw new Error('未サインイン');
  const { error } = await db()
    .from('views')
    .upsert({ post_id: postId, viewer_id: id }, { onConflict: 'post_id,viewer_id', ignoreDuplicates: true });
  if (error) throw error;
}

// ---------- プッシュ通知トークン ----------
// 端末の Expo push トークンを保存（段階2）。送信側は Edge Function が service role で読む。
export async function upsertPushToken(token: string, platform: string) {
  const id = await myId();
  if (!id) return;
  const { error } = await db()
    .from('push_tokens')
    .upsert({ user_id: id, token, platform }, { onConflict: 'user_id,token' });
  if (error) throw error;
}
