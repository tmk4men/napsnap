// napsnap データアクセス層（Supabase）。
// store.ts の各操作に1:1で対応する関数を用意し、鍵が来たら store から呼び替えるだけにする。
// supabase が null（鍵未設定）のときは使わない＝アプリは従来どおりローカルのモックで動く。
import { supabase } from './supabase';
import { MEDIA_BUCKET } from '../config';
import { Post, PostCaption, Reaction, ReactionType, User, ViewRecord } from '../types';
import { uid } from './id';

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

function rowToUser(r: any): User {
  return {
    id: r.id,
    handle: r.handle,
    displayName: r.display_name ?? '',
    avatarEmoji: '',
    avatarColor: '',
    avatarImageUri: r.avatar_url ?? undefined,
    createdAt: toMs(r.created_at),
    isOfficial: !!r.is_official,
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

export async function listProfiles(): Promise<User[]> {
  const { data, error } = await db().from('profiles').select('*');
  if (error) throw error;
  return (data ?? []).map(rowToUser);
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
// uri は web=blob:/data:、native=file:。fetch で ArrayBuffer 化して上げる（両対応）。
export async function uploadMedia(uri: string, kind: 'photo' | 'audio'): Promise<string> {
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
export async function listReactions(): Promise<Reaction[]> {
  const { data, error } = await db().from('reactions').select('*');
  if (error) throw error;
  return (data ?? []).map(rowToReaction);
}

export async function react(postId: string, type: ReactionType) {
  const id = await myId();
  if (!id) throw new Error('未サインイン');
  const { error } = await db()
    .from('reactions')
    .upsert({ post_id: postId, user_id: id, type }, { onConflict: 'post_id,user_id' });
  if (error) throw error;
}

export async function listViews(): Promise<ViewRecord[]> {
  const { data, error } = await db().from('views').select('*');
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
