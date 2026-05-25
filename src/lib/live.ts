// ライブ（Supabase）モードのオーケストレーション。
// store はここから「スナップショット」を受け取り、ローカル state にそのまま入れる
// （= 既存の selectors / 画面はそのまま動く）。鍵が無いときは何もしない。
import { hasSupabase, OFFICIAL_USER_ID } from '../config';
import * as be from './backend';
import { Post, Reaction, User, ViewRecord } from '../types';

export const LIVE = hasSupabase;

export interface LiveSnapshot {
  currentUserId: string;
  onboarded: boolean; // display_name が設定済み＝オンボ完了
  users: User[];
  following: string[];
  posts: Post[];
  reactions: Reaction[];
  views: ViewRecord[];
}

// 起動時：匿名セッション確保 → 全スライスを並列取得してスナップショット化。
export async function liveBootstrap(): Promise<LiveSnapshot | null> {
  if (!LIVE) return null;
  const id = await be.ensureSession();
  if (!id) return null;
  // 公式アカウントを必ずフォロー（最初から feed に出すため）。投稿取得より前に行う＝RLSで公式投稿が読める。
  let following = await be.listFollowing();
  if (OFFICIAL_USER_ID && id !== OFFICIAL_USER_ID && !following.includes(OFFICIAL_USER_ID)) {
    try {
      await be.follow(OFFICIAL_USER_ID);
      following = [...following, OFFICIAL_USER_ID];
    } catch (e) {
      console.warn('follow official failed', e);
    }
  }
  const [users, active, mine, reactions, views] = await Promise.all([
    be.listProfiles(),
    be.listActivePosts(),
    be.listMyPosts(),
    be.listReactions(),
    be.listViews(),
  ]);
  // active(自分＋フォローの期限内) と mine(自分の全投稿＝思い出) を id でマージ。
  const map = new Map<string, Post>();
  for (const p of [...active, ...mine]) map.set(p.id, p);
  const me = users.find((u) => u.id === id);
  return {
    currentUserId: id,
    onboarded: !!me && me.displayName.trim().length > 0,
    users,
    following,
    posts: [...map.values()],
    reactions,
    views,
  };
}

// オンボーディング完了：アバター上げ → プロフィール upsert → 選んだ人をフォロー → 再取得。
export async function liveCompleteSetup(input: {
  displayName: string;
  handle: string;
  avatarImageUri?: string;
  followingIds: string[];
}): Promise<LiveSnapshot | null> {
  if (!LIVE) return null;
  await be.ensureSession();
  let avatarUrl: string | undefined;
  if (input.avatarImageUri) {
    try {
      avatarUrl = await be.uploadMedia(input.avatarImageUri, 'photo');
    } catch (e) {
      console.warn('avatar upload failed', e);
    }
  }
  await be.upsertMyProfile({ handle: input.handle, displayName: input.displayName, avatarUrl });
  for (const fid of input.followingIds) {
    try {
      await be.follow(fid);
    } catch (e) {
      console.warn('follow failed', fid, e);
    }
  }
  return liveBootstrap();
}
