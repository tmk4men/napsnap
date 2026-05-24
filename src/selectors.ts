// 派生データの算出。コンポーネントは生の配列を select し、useMemo でこれらを呼ぶ。
import { Post, Reaction, User, ViewRecord } from './types';
import type { Store } from './store';
import { HOUR, isActive } from './lib/time';
import { REACTION_TTL_HOURS } from './copy';

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

// フォロー中の人の、期限内の投稿（自分以外）を新しい順で。
export function followedActivePosts(s: Snapshot): Post[] {
  const { currentUserId, following } = s;
  return s.posts
    .filter(
      (p) => p.userId !== currentUserId && following.includes(p.userId) && isActive(p.expiresAt)
    )
    .sort((a, b) => b.createdAt - a.createdAt);
}

// 閲覧フィードのキュー：フォロー中の投稿のうち、まだ流してもいない・反応もしていないもの。
export function feedQueue(s: Snapshot): Post[] {
  const acted = new Set(s.feedStates.map((f) => f.postId));
  return followedActivePosts(s).filter((p) => !acted.has(p.id));
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
    if (post) out.push({ post, reaction: r });
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
    .filter((p) => p.userId === currentUserId && isActive(p.expiresAt))
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

// 自分の全投稿（期限に関係なくローカルに残る「思い出」）。新しい順。
export function myArchive(s: Pick<Store, 'currentUserId' | 'posts'>): Post[] {
  const { currentUserId } = s;
  if (!currentUserId) return [];
  return s.posts
    .filter((p) => p.userId === currentUserId)
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
