// 派生データの算出。コンポーネントは生の配列を select し、useMemo でこれらを呼ぶ。
import { Post, Reaction, User, ViewRecord } from './types';
import type { Store } from './store';
import { HOUR, isActive } from './lib/time';
import { REACTION_TTL_HOURS } from './copy';

type Snapshot = Pick<
  Store,
  'currentUserId' | 'group' | 'users' | 'posts' | 'views' | 'reactions' | 'feedStates' | 'accessPass'
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

// 閲覧フィードのキュー：友達の投稿のうち、まだ流してもいない・反応もしていない・期限内のもの。
export function feedQueue(s: Snapshot): Post[] {
  const { currentUserId, group } = s;
  if (!group) return [];
  const acted = new Set(s.feedStates.map((f) => f.postId)); // skipped か reacted
  return s.posts
    .filter(
      (p) =>
        p.groupId === group.id &&
        p.userId !== currentUserId &&
        isActive(p.expiresAt) &&
        !acted.has(p.id)
    )
    .sort((a, b) => b.createdAt - a.createdAt);
}

// 「残した」：自分が反応した投稿のうち、反応が24時間以内のもの。自由に上下スクロール可。
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
  viewers: { user: User; reaction?: Reaction }[];
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
      const reactions = s.reactions.filter(
        (r) => r.postId === post.id && r.userId !== currentUserId
      );
      const reactionByUser = new Map(reactions.map((r) => [r.userId, r] as const));
      // 足跡（見た人）一覧。反応した人は反応つきで。
      const viewerIds = new Set<string>([...views.map((v) => v.viewerId), ...reactions.map((r) => r.userId)]);
      const viewers = [...viewerIds]
        .map((uidStr) => {
          const user = s.users.find((u) => u.id === uidStr);
          if (!user) return null;
          return { user, reaction: reactionByUser.get(uidStr) };
        })
        .filter((x): x is { user: User; reaction: Reaction | undefined } => x !== null)
        // 反応した人を上に
        .sort((a, b) => (b.reaction ? 1 : 0) - (a.reaction ? 1 : 0));
      return {
        post,
        viewers,
        viewCount: viewerIds.size,
        reactionCount: reactions.length,
      };
    });
}

export function friendActivePostCount(s: Snapshot): number {
  const { currentUserId, group } = s;
  if (!group) return 0;
  return s.posts.filter(
    (p) => p.groupId === group.id && p.userId !== currentUserId && isActive(p.expiresAt)
  ).length;
}

export type { ViewRecord };
