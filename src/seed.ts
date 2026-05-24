// デモ用のモックデータ。バックエンドが無いので、アカウント作成時に
// フォロー候補のモックの人とその投稿を流し込んで「核ループ」を成立させる。

import { Post, User } from './types';
import { uid } from './lib/id';
import { lifeImage, TRACE_SEEDS } from './lib/images';
import { HOUR } from './lib/time';
import { POST_TTL_HOURS } from './copy';

export function makeMockPeople(): User[] {
  const base = [
    { handle: 'miho', displayName: 'みほ', avatarEmoji: '🌿', avatarColor: '#DFFF2F' },
    { handle: 'taku', displayName: 'たくや', avatarEmoji: '🛋️', avatarColor: '#7FB3FF' },
    { handle: 'ken', displayName: 'けん', avatarEmoji: '☕️', avatarColor: '#FFB37F' },
    { handle: 'saki', displayName: 'さき', avatarEmoji: '🌙', avatarColor: '#C79BFF' },
  ];
  const t = Date.now();
  return base.map((b, i) => ({
    id: uid('u_'),
    handle: b.handle,
    displayName: b.displayName,
    avatarEmoji: b.avatarEmoji,
    avatarColor: b.avatarColor,
    createdAt: t - (i + 1) * HOUR,
    isMock: true,
  }));
}

// フォローしている人の投稿を、直近数時間にばらけた作成時刻で生成する（全て24h以内＝閲覧可能）。
export function makeFollowPosts(people: User[]): Post[] {
  const t = Date.now();
  const posts: Post[] = [];
  const plan: { personIndex: number; minutesAgo: number; seed: string }[] = [
    { personIndex: 0, minutesAgo: 18, seed: TRACE_SEEDS[0] },
    { personIndex: 1, minutesAgo: 52, seed: TRACE_SEEDS[2] },
    { personIndex: 2, minutesAgo: 95, seed: TRACE_SEEDS[4] },
    { personIndex: 3, minutesAgo: 140, seed: TRACE_SEEDS[3] },
    { personIndex: 0, minutesAgo: 210, seed: TRACE_SEEDS[5] },
    { personIndex: 2, minutesAgo: 280, seed: TRACE_SEEDS[7] },
    { personIndex: 1, minutesAgo: 360, seed: TRACE_SEEDS[9] },
  ];
  for (const p of plan) {
    const person = people[p.personIndex];
    if (!person) continue;
    const createdAt = t - p.minutesAgo * 60 * 1000;
    posts.push({
      id: uid('p_'),
      userId: person.id,
      imageUrl: lifeImage(`${person.id}-${p.seed}`),
      audioSeed: `${person.id}-${p.seed}`,
      createdAt,
      expiresAt: createdAt + POST_TTL_HOURS * HOUR,
    });
  }
  return posts;
}
