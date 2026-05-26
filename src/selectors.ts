// 派生データの算出。コンポーネントは生の配列を select し、useMemo でこれらを呼ぶ。
import { Post, Reaction, ReactionType, User, ViewRecord } from './types';
import type { Store } from './store';
import { HOUR, isActive } from './lib/time';
import { REACTION_TTL_HOURS } from './copy';
import { dayIndex } from './topics';
import { OFFICIAL_USER_ID } from './config';
import { OFFICIAL_ID } from './seed';

// 「napsnap 公式（ブランド本人）」判定。他のユーザーが is_official=true を持っていても
// （＝ただの認証マーク扱い）、ブランド扱い（N アバター・「napsnap」名前差し替え 等）は
// このユーザーだけに限定する。
export function isBrandUser(u?: User | null): boolean {
  if (!u) return false;
  return u.id === OFFICIAL_USER_ID || u.id === OFFICIAL_ID || u.handle === 'napsnap';
}

// 「今日のお題」の通知が未読か（今日ぶんをまだ見ていない）。
export function topicUnseen(s: Pick<Store, 'topicSeenDay'>): boolean {
  return s.topicSeenDay !== dayIndex();
}

type Snapshot = Pick<
  Store,
  'currentUserId' | 'following' | 'users' | 'posts' | 'views' | 'reactions' | 'feedStates' | 'accessPass'
>;

export function isPassOpen(s: Pick<Store, 'accessPass'>): boolean {
  return !!s.accessPass && isActive(s.accessPass.expiresAt);
}

export function userById(users: User[], id: string | null | undefined): User | undefined {
  if (!id) return undefined;
  return users.find((u) => u.id === id);
}

export function currentUser(s: Pick<Store, 'currentUserId' | 'users'>): User | undefined {
  return userById(s.users, s.currentUserId);
}

// フォロー中の人の、期限内の投稿（自分以外）を「残りが短い順」で。
// お題への投稿は別世界なのでホーム/フィードには出さない。
export function followedActivePosts(s: Snapshot): Post[] {
  const { currentUserId, following } = s;
  return s.posts
    .filter(
      (p) =>
        !p.topicKey &&
        p.userId !== currentUserId &&
        following.includes(p.userId) &&
        isActive(p.expiresAt)
    )
    .sort((a, b) => a.expiresAt - b.expiresAt);
}

// 「お題」：今日のお題への、期限内の投稿（自分・フォロー・知らない人含め全部）。
// 並びは「残り時間が短い順」。後方互換のため残す。
export function topicPosts(s: Snapshot, topicKey: string): Post[] {
  return s.posts
    .filter((p) => p.topicKey === topicKey && isActive(p.expiresAt))
    .sort((a, b) => a.expiresAt - b.expiresAt);
}

// お題タブ用：知ってる人（自分＋フォロー）／知らん人 を別ページで見せる分割版。
export function topicPostsKnown(s: Snapshot, topicKey: string): Post[] {
  const knownIds = new Set<string>([s.currentUserId ?? '', ...s.following]);
  return s.posts
    .filter((p) => p.topicKey === topicKey && isActive(p.expiresAt) && knownIds.has(p.userId))
    .sort((a, b) => a.expiresAt - b.expiresAt);
}

export function topicPostsStrangers(s: Snapshot, topicKey: string): Post[] {
  const knownIds = new Set<string>([s.currentUserId ?? '', ...s.following]);
  return s.posts
    .filter((p) => p.topicKey === topicKey && isActive(p.expiresAt) && !knownIds.has(p.userId))
    .sort((a, b) => a.expiresAt - b.expiresAt);
}

// ある投稿への、自分のリアクション種類（お題で「自分が押したやつ」を示す用）。
export function myReaction(s: Pick<Store, 'currentUserId' | 'reactions'>, postId: string): ReactionType | undefined {
  return s.reactions.find((r) => r.postId === postId && r.userId === s.currentUserId)?.type;
}

// 投稿のリアクション数。サーバが集計した post.reactionCount を最優先で使う（メタ通信削減のため
// 他人の投稿への他人の反応は手元に持たない）。手元の reactions 行から数えるのはフォールバック。
export function reactionCount(s: Pick<Store, 'reactions' | 'posts'>, postId: string): number {
  const post = s.posts.find((p) => p.id === postId);
  if (post && typeof post.reactionCount === 'number') return post.reactionCount;
  return s.reactions.filter((r) => r.postId === postId).length;
}

// 閲覧フィードのキュー：自分＋フォロー中の投稿（通常投稿）のうち、まだ流してない・反応してないもの。
// 「自分の投稿もホームに流す」UX のため、自分の投稿もここに混ぜる。並びは残り時間が短い順。
export function feedQueue(s: Snapshot): Post[] {
  const acted = new Set(s.feedStates.map((f) => f.postId));
  const meId = s.currentUserId;
  return s.posts
    .filter(
      (p) =>
        !p.topicKey &&
        (p.userId === meId || s.following.includes(p.userId)) &&
        isActive(p.expiresAt)
    )
    .sort((a, b) => a.expiresAt - b.expiresAt)
    .filter((p) => !acted.has(p.id));
}

// 「残した」：自分が反応した投稿のうち、反応が24時間以内のもの。
export function keptPosts(s: Snapshot): { post: Post; reaction: Reaction }[] {
  const { currentUserId } = s;
  if (!currentUserId) return [];
  const mine = s.reactions.filter(
    (r) => r.userId === currentUserId && r.createdAt + REACTION_TTL_HOURS * HOUR > Date.now()
  );
  const out: { post: Post; reaction: Reaction }[] = [];
  for (const r of mine) {
    const post = s.posts.find((p) => p.id === r.postId);
    // お題への反応は「残す」に入れない（お題は流れる別世界）。
    if (post && !post.topicKey) out.push({ post, reaction: r });
  }
  return out.sort((a, b) => b.reaction.createdAt - a.reaction.createdAt);
}

export interface MyPostSummary {
  post: Post;
  viewers: { user: User; reaction: Reaction | undefined }[];
  viewCount: number;
  reactionCount: number;
}

// 「自分」：自分の投稿＋足跡＋リアクション（誰がスルーしたかは出さない）。
export function myPosts(s: Snapshot): MyPostSummary[] {
  const { currentUserId } = s;
  if (!currentUserId) return [];
  return s.posts
    .filter((p) => p.userId === currentUserId && !p.topicKey && isActive(p.expiresAt))
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((post) => {
      const views = s.views.filter((v) => v.postId === post.id && v.viewerId !== currentUserId);
      const reactions = s.reactions.filter((r) => r.postId === post.id && r.userId !== currentUserId);
      const reactionByUser = new Map(reactions.map((r) => [r.userId, r] as const));
      const viewerIds = new Set<string>([
        ...views.map((v) => v.viewerId),
        ...reactions.map((r) => r.userId),
      ]);
      const viewers = [...viewerIds]
        .map((uidStr) => {
          const user = s.users.find((u) => u.id === uidStr);
          if (!user) return null;
          return { user, reaction: reactionByUser.get(uidStr) };
        })
        .filter((x): x is { user: User; reaction: Reaction | undefined } => x !== null)
        .sort((a, b) => (b.reaction ? 1 : 0) - (a.reaction ? 1 : 0));
      return { post, viewers, viewCount: viewerIds.size, reactionCount: reactions.length };
    });
}

export function followedActivePostCount(s: Snapshot): number {
  return followedActivePosts(s).length;
}

// 名前/ID変更：2週間に2回まで。
const TWO_WEEKS = 14 * 24 * HOUR;
export function profileEditsLeft(s: Pick<Store, 'profileEditAt'>): number {
  const recent = s.profileEditAt.filter((t) => t > Date.now() - TWO_WEEKS).length;
  return Math.max(0, 2 - recent);
}
export function nextProfileEditDays(s: Pick<Store, 'profileEditAt'>): number {
  const recent = s.profileEditAt.filter((t) => t > Date.now() - TWO_WEEKS).sort((a, b) => a - b);
  if (recent.length < 2) return 0;
  return Math.max(1, Math.ceil((recent[0] + TWO_WEEKS - Date.now()) / (24 * HOUR)));
}

// アクティビティ（通知）：自分の投稿への反応/足跡＋フォロー中の新着痕跡。
export interface ActivityItem {
  id: string;
  kind: 'react' | 'view' | 'post';
  user?: User;
  at: number;
  postImage?: string;
}

export function activityItems(s: Snapshot): ActivityItem[] {
  const me = s.currentUserId;
  if (!me) return [];
  const myPostIds = new Set(s.posts.filter((p) => p.userId === me).map((p) => p.id));
  const imageOf = (postId: string) => s.posts.find((p) => p.id === postId)?.imageUrl;
  const out: ActivityItem[] = [];
  const reactedPair = new Set<string>();

  for (const r of s.reactions) {
    if (r.userId !== me && myPostIds.has(r.postId)) {
      reactedPair.add(`${r.userId}_${r.postId}`);
      out.push({ id: 'r_' + r.id, kind: 'react', user: userById(s.users, r.userId), at: r.createdAt, postImage: imageOf(r.postId) });
    }
  }
  for (const v of s.views) {
    if (v.viewerId !== me && myPostIds.has(v.postId) && !reactedPair.has(`${v.viewerId}_${v.postId}`)) {
      out.push({ id: 'v_' + v.id, kind: 'view', user: userById(s.users, v.viewerId), at: v.viewedAt, postImage: imageOf(v.postId) });
    }
  }
  for (const p of followedActivePosts(s)) {
    out.push({ id: 'p_' + p.id, kind: 'post', user: userById(s.users, p.userId), at: p.createdAt, postImage: p.imageUrl });
  }
  return out.sort((a, b) => b.at - a.at).slice(0, 40);
}

export function unreadActivityCount(s: Snapshot & Pick<Store, 'lastSeenActivityAt'>): number {
  return activityItems(s).filter((i) => i.at > s.lastSeenActivityAt).length;
}

// 自分の全投稿（期限に関係なくローカルに残る「思い出」）。新しい順。
export function myArchive(s: Pick<Store, 'currentUserId' | 'posts'>): Post[] {
  const { currentUserId } = s;
  if (!currentUserId) return [];
  return s.posts
    .filter((p) => p.userId === currentUserId && !p.topicKey)
    .sort((a, b) => b.createdAt - a.createdAt);
}

function dayStart(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export interface Highlight {
  label: string;
  post: Post;
}

// 「1年前の今日」「1ヶ月前」「1週間前」に近い自分の投稿をハイライトとして返す。
export function memoryHighlights(s: Pick<Store, 'currentUserId' | 'posts'>): Highlight[] {
  const archive = myArchive(s);
  const today = dayStart(Date.now());
  const DAY = 24 * HOUR;
  const defs = [
    { label: '1年前の今日', days: 365, tol: 3 },
    { label: '1ヶ月前', days: 30, tol: 2 },
    { label: '1週間前', days: 7, tol: 1 },
  ];
  const out: Highlight[] = [];
  const used = new Set<string>();
  for (const def of defs) {
    const target = today - def.days * DAY;
    let best: Post | null = null;
    let bestDiff = Infinity;
    for (const p of archive) {
      if (used.has(p.id)) continue;
      const diff = Math.abs(dayStart(p.createdAt) - target);
      if (diff <= def.tol * DAY && diff < bestDiff) {
        best = p;
        bestDiff = diff;
      }
    }
    if (best) {
      out.push({ label: def.label, post: best });
      used.add(best.id);
    }
  }
  return out;
}

export type { ViewRecord };
