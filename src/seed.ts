// デモ用のモックデータ。バックエンドが無いので、グループ作成/参加時に
// モックの友達とその投稿を流し込んで「核ループ」が成立するようにする。

import { Post, User } from './types';
import { uid } from './lib/id';
import { lifeImage, TRACE_SEEDS } from './lib/images';
import { HOUR } from './lib/time';
import { POST_TTL_HOURS } from './copy';

export function makeMockFriends(): User[] {
  const base = [
    { displayName: 'みほ', avatarEmoji: '🌿', avatarColor: '#DFFF2F' },
    { displayName: 'たくや', avatarEmoji: '🛋️', avatarColor: '#7FB3FF' },
    { displayName: 'けん', avatarEmoji: '☕️', avatarColor: '#FFB37F' },
    { displayName: 'さき', avatarEmoji: '🌙', avatarColor: '#C79BFF' },
  ];
  const t = Date.now();
  return base.map((b, i) => ({
    id: uid('u_'),
    displayName: b.displayName,
    avatarEmoji: b.avatarEmoji,
    avatarColor: b.avatarColor,
    createdAt: t - (i + 1) * HOUR,
    isMock: true,
  }));
}

// モック友達の投稿を、直近数時間にばらけた作成時刻で生成する（全て24h以内＝閲覧可能）。
export function makeFriendPosts(friends: User[], groupId: string): Post[] {
  const t = Date.now();
  const posts: Post[] = [];
  // 各友達が1〜2枚出している状態
  const plan: { friendIndex: number; minutesAgo: number; seed: string }[] = [
    { friendIndex: 0, minutesAgo: 18, seed: TRACE_SEEDS[0] },
    { friendIndex: 1, minutesAgo: 52, seed: TRACE_SEEDS[2] },
    { friendIndex: 2, minutesAgo: 95, seed: TRACE_SEEDS[4] },
    { friendIndex: 3, minutesAgo: 140, seed: TRACE_SEEDS[3] },
    { friendIndex: 0, minutesAgo: 210, seed: TRACE_SEEDS[5] },
    { friendIndex: 2, minutesAgo: 280, seed: TRACE_SEEDS[7] },
    { friendIndex: 1, minutesAgo: 360, seed: TRACE_SEEDS[9] },
  ];
  for (const p of plan) {
    const friend = friends[p.friendIndex];
    if (!friend) continue;
    const createdAt = t - p.minutesAgo * 60 * 1000;
    posts.push({
      id: uid('p_'),
      userId: friend.id,
      groupId,
      imageUrl: lifeImage(`${friend.id}-${p.seed}`),
      createdAt,
      expiresAt: createdAt + POST_TTL_HOURS * HOUR,
    });
  }
  return posts;
}

export const DEFAULT_GROUP_NAME = 'なかま';
