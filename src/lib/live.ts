// ライブ（Supabase）モードのオーケストレーション。
// store はここから「スナップショット」を受け取り、ローカル state にそのまま入れる
// （= 既存の selectors / 画面はそのまま動く）。鍵が無いときは何もしない。
import { hasSupabase, OFFICIAL_USER_ID } from '../config';
import * as be from './backend';
import { Post, Reaction, User, ViewRecord } from '../types';
import { makeOfficialUser } from '../seed';

export const LIVE = hasSupabase;

export interface LiveSnapshot {
  currentUserId: string;
  onboarded: boolean; // display_name が設定済み＝オンボ完了
  users: User[];
  following: string[];
  followers: { followerId: string; followedAt: number }[]; // 自分をフォローしている人＋時刻
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
  const [active, mine, reactions, views, suggestions, followers] = await Promise.all([
    be.listActivePosts(),
    be.listMyPosts(),
    be.listReactions(),
    be.listViews(),
    be.suggestProfiles(30), // 発見用の候補（総数に依存しない少数）
    be.listFollowers(),     // 自分をフォローしている人（アクティビティ通知用）
  ]);
  // active(自分＋フォローの期限内) と mine(自分の全投稿＝思い出) を id でマージ。
  const map = new Map<string, Post>();
  for (const p of [...active, ...mine]) map.set(p.id, p);
  const posts = [...map.values()];

  // 全プロフィール取得はやめ、「実際に登場する人」だけ id 指定で引く。
  const ids = new Set<string>([id]);
  following.forEach((f) => ids.add(f));
  if (OFFICIAL_USER_ID) ids.add(OFFICIAL_USER_ID);
  posts.forEach((p) => ids.add(p.userId));
  reactions.forEach((r) => ids.add(r.userId));
  views.forEach((v) => ids.add(v.viewerId));
  followers.forEach((f) => ids.add(f.followerId));
  const needed = await be.listProfilesByIds([...ids]);

  // 必要な人＋発見用候補をマージ（id で重複排除）。
  const byId = new Map<string, User>();
  for (const u of [...needed, ...suggestions]) byId.set(u.id, u);
  // 公式アカウントはクライアントに必ず存在させる（DBに無くても N バッジが出るように）。
  if (OFFICIAL_USER_ID && !byId.has(OFFICIAL_USER_ID)) {
    byId.set(OFFICIAL_USER_ID, makeOfficialUser(OFFICIAL_USER_ID));
  }
  const users = [...byId.values()];

  const me = users.find((u) => u.id === id);
  return {
    currentUserId: id,
    onboarded: !!me && me.displayName.trim().length > 0,
    users,
    following,
    followers,
    posts,
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
