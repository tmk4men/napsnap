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

// ---------- 外部アカウント連携（匿名→恒久アカウントへ昇格）----------
// 入口は匿名のまま。設定/メニューから任意で Apple / Google を「あとから紐付け」できる。
// Supabase の Manual Linking（linkIdentity）を使う。Apple/Google は組み込みプロバイダ。
// ※ Supabase ダッシュボードで該当プロバイダを有効化し、リダイレクトURLを登録しておく必要がある。
export type LinkProvider = 'apple' | 'google';

// いまのアカウントが匿名か、どのプロバイダに紐付いてるか。
export async function authStatus(): Promise<{ isAnonymous: boolean; providers: string[] }> {
  const { data } = await db().auth.getUser();
  const user = data.user as any;
  if (!user) return { isAnonymous: true, providers: [] };
  const providers: string[] = (user.identities ?? [])
    .map((i: any) => i.provider)
    .filter((p: string) => p && p !== 'anonymous');
  const isAnonymous = user.is_anonymous ?? providers.length === 0;
  return { isAnonymous, providers };
}

// リダイレクト先。ネイティブはアプリスキーム（app.json の scheme=napsnap）、
// Web は「いま開いてるページのURL」（origin+pathname）。
// Supabase の Redirect URLs 許可リストに登録した値と一致させる必要がある
// （Pages は /napsnap/ 配下なので origin だけだと一致せず弾かれる）。
function authRedirectUri(): string {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin + window.location.pathname;
  }
  return 'napsnap://auth-callback';
}

const isWebRuntime = typeof window !== 'undefined' && !!window.location;

// 匿名アカウントに provider を紐付ける。
// Web：そのままページ全体を OAuth にリダイレクト（ポップアップを使わない＝確実）。
//   戻り（?code=）は起動時に completeWebOAuth() が拾って session を確定する。
//   この関数は戻り値を返す前にページ遷移するので、呼び出し側の後続処理は基本走らない。
// ネイティブ：expo-web-browser の認証セッションで開いて、戻りの code/token から session を確定。
export async function linkProvider(provider: LinkProvider): Promise<boolean> {
  const s = db();
  const redirectTo = authRedirectUri();

  if (isWebRuntime) {
    const { error } = await s.auth.linkIdentity({ provider, options: { redirectTo } });
    if (error) {
      console.warn('[auth] linkIdentity (web redirect) failed', error);
      return false;
    }
    // ここに到達する前に window.location が OAuth へ遷移する。
    return true;
  }

  const { data, error } = await s.auth.linkIdentity({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data?.url) {
    console.warn('[auth] linkIdentity init failed', error);
    return false;
  }
  try {
    const WebBrowser = require('expo-web-browser');
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success' || !result.url) return false;
    return await finishCodeOrToken(result.url);
  } catch (e) {
    console.warn('[auth] openAuthSession failed', e);
    return false;
  }
}

// リダイレクトURLから PKCE(?code=) / implicit(#access_token=) を読んで session を確定。
async function finishCodeOrToken(url: string): Promise<boolean> {
  const s = db();
  const qIndex = url.indexOf('?');
  const hIndex = url.indexOf('#');
  const query = qIndex >= 0 ? url.substring(qIndex + 1).split('#')[0] : '';
  const frag = hIndex >= 0 ? url.substring(hIndex + 1) : '';
  const code = new URLSearchParams(query).get('code');
  if (code) {
    const { error } = await s.auth.exchangeCodeForSession(code);
    if (error) {
      console.warn('[auth] exchangeCodeForSession failed', error);
      return false;
    }
    return true;
  }
  const fp = new URLSearchParams(frag);
  const access_token = fp.get('access_token');
  const refresh_token = fp.get('refresh_token');
  if (access_token && refresh_token) {
    const { error } = await s.auth.setSession({ access_token, refresh_token });
    if (error) {
      console.warn('[auth] setSession failed', error);
      return false;
    }
    return true;
  }
  return true;
}

// Web 起動時：OAuth から `?code=` で戻ってきていたら session を確定し、URL を掃除する。
// 連携できたら true（呼び出し側でトースト等を出す用途）。
export async function completeWebOAuth(): Promise<boolean> {
  if (!isWebRuntime || !supabase) return false;
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (!code) return false;
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  // URL から code/state を消す（リロードや共有で誤動作しないように）。
  try {
    window.history.replaceState({}, '', window.location.pathname);
  } catch {}
  if (error) {
    console.warn('[auth] completeWebOAuth exchange failed', error);
    return false;
  }
  return true;
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
  const kind: 'photo' | 'issue' = r.kind === 'issue' ? 'issue' : 'photo';
  const issue =
    kind === 'issue' && r.issue
      ? {
          label: String(r.issue.label ?? ''),
          images: Array.isArray(r.issue.images) ? r.issue.images.map(String) : [],
          sourcePostIds: Array.isArray(r.issue.sourcePostIds) ? r.issue.sourcePostIds.map(String) : [],
        }
      : undefined;
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
    kind,
    issue,
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

// 検索は @ID の完全一致のみ（入力中の部分一致＝予測サジェストはしない）。
export async function searchProfiles(query: string): Promise<User[]> {
  const q = query.trim().replace(/^@/, '').toLowerCase();
  if (!q) return [];
  const { data, error } = await db().from('profiles').select('*').eq('handle', q).limit(5);
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

// 自分をフォローしている人（アクティビティ通知に「○○ がフォローした」を出すため）。
// follows_read RLS は `follower_id = auth.uid() or following_id = auth.uid()` で自分の関わりを読める。
// 通知に必要なのは「新しいフォロー」だけなので、created_at の降順で 50 件に絞る。
// フォロワー数が増えてもサーバから引く量を一定に保つ。
export async function listFollowers(): Promise<{ followerId: string; followedAt: number }[]> {
  const id = await myId();
  if (!id) return [];
  const { data, error } = await db()
    .from('follows')
    .select('follower_id, created_at')
    .eq('following_id', id)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map((r: any) => ({ followerId: r.follower_id, followedAt: toMs(r.created_at) }));
}

// 自分のフォロワー総数（プロフィール表示用）。list 側は 50 件に絞っているので
// 件数はインデックス COUNT で別途取る。head: true で実データは持って来ない＝軽い。
export async function countFollowers(): Promise<number> {
  const id = await myId();
  if (!id) return 0;
  const { count, error } = await db()
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', id);
  if (error) throw error;
  return count ?? 0;
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

// 「号外 第N号」を発行：1週間ぶんの自分の投稿を綴じた特殊投稿（kind='issue'）。
// 画像 URL は既存の R2/Storage のものをそのまま issue.images に入れる。
// 元投稿の image_url が後で 24h TTL で消えても、Storage オブジェクト自体はまだ生きてる前提
// （現状は server-side cleanup を持たない）。長期的には issue 発行時に再アップロードか
// オブジェクト lifetime 延長が要る。
export async function publishIssue(input: {
  label: string;
  coverImageUrl: string;
  images: string[];
  sourcePostIds: string[];
  expiresAt: number;
}): Promise<Post> {
  const id = await myId();
  if (!id) throw new Error('未サインイン');
  const { data, error } = await db()
    .from('posts')
    .insert({
      user_id: id,
      image_url: input.coverImageUrl,
      kind: 'issue',
      issue: {
        label: input.label,
        images: input.images,
        sourcePostIds: input.sourcePostIds,
      },
      expires_at: new Date(input.expiresAt).toISOString(),
      topic_visibility: 'public',
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
