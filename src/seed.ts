// デモ用のモックデータ。バックエンドが無いので、アカウント作成時に
// フォロー候補のモックの人とその投稿を流し込んで「核ループ」を成立させる。

import { Post, User } from './types';
import { uid } from './lib/id';
import { avatarImage, lifeImage, TRACE_SEEDS } from './lib/images';
import { HOUR } from './lib/time';
import { POST_TTL_HOURS } from './copy';

export function makeMockPeople(): User[] {
  const base = [
    { handle: 'miho', displayName: 'みほ', avatarEmoji: '🌿', avatarColor: '#C7E6A6', avatarSeed: 'miho-plant' },
    { handle: 'taku', displayName: 'たくや', avatarEmoji: '🛋️', avatarColor: '#AFD0E2', avatarSeed: 'taku-sofa' },
    { handle: 'ken', displayName: 'けん', avatarEmoji: '☕️', avatarColor: '#E6C7A6', avatarSeed: 'ken-coffee' },
    { handle: 'saki', displayName: 'さき', avatarEmoji: '🌙', avatarColor: '#CFBCE6', avatarSeed: 'saki-night' },
  ];
  const t = Date.now();
  return base.map((b, i) => ({
    id: uid('u_'),
    handle: b.handle,
    displayName: b.displayName,
    avatarEmoji: b.avatarEmoji,
    avatarColor: b.avatarColor,
    avatarImageUri: avatarImage(b.avatarSeed),
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

// 自分の「思い出」（過去の投稿）。カレンダー＆ハイライト用に、1年前/1ヶ月前/1週間前など
// 過去の日付で自分の投稿を仕込む。すべて期限切れ＝フィード/ホームには出ず、アーカイブにだけ残る。
export function makeMyMemories(meId: string): Post[] {
  const DAY = 24 * HOUR;
  const t = Date.now();
  const plan: { daysAgo: number; seed: string; cap?: { text: string; fontKey: string; color: string; pos: 'top' | 'center' | 'bottom' } }[] = [
    { daysAgo: 365, seed: 'me-y1', cap: { text: '一年前の\nわたしの机', fontKey: 'hand', color: '#FFFDF7', pos: 'bottom' } },
    { daysAgo: 30, seed: 'me-m1', cap: { text: 'しずかな朝', fontKey: 'mincho', color: '#FFFDF7', pos: 'top' } },
    { daysAgo: 7, seed: 'me-w1', cap: { text: 'おつかれ', fontKey: 'maru', color: '#E4FF54', pos: 'center' } },
    { daysAgo: 2, seed: 'me-d2' },
    { daysAgo: 3, seed: 'me-d3', cap: { text: '夜ふかし', fontKey: 'hand', color: '#FFFDF7', pos: 'bottom' } },
    { daysAgo: 12, seed: 'me-d12' },
    { daysAgo: 40, seed: 'me-d40' },
    { daysAgo: 95, seed: 'me-d95', cap: { text: 'あの日の窓', fontKey: 'mincho', color: '#1A1A14', pos: 'top' } },
    { daysAgo: 200, seed: 'me-d200' },
  ];
  return plan.map((p) => {
    const createdAt = t - p.daysAgo * DAY + 9 * HOUR; // だいたい午前中に投稿した体
    return {
      id: uid('p_'),
      userId: meId,
      imageUrl: lifeImage(p.seed),
      caption: p.cap,
      audioSeed: p.seed,
      createdAt,
      expiresAt: createdAt + POST_TTL_HOURS * HOUR,
    };
  });
}
