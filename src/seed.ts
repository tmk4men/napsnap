// デモ用のモックデータ。バックエンドが無いので、アカウント作成時に
// フォロー候補のモックの人とその投稿を流し込んで「核ループ」を成立させる。

import { Post, Reaction, ReactionType, User } from './types';
import { uid } from './lib/id';
import { avatarImage, lifeImage, TRACE_SEEDS } from './lib/images';
import { HOUR, nextMidnight } from './lib/time';
import { POST_TTL_HOURS } from './copy';
import { Topic, TOPIC_CAPTIONS } from './topics';

// napsnap 公式アカウント。最初からフォローされ、初期フィードを供給する（本番でも空にしない）。
// id は固定にして「公式は1つだけ」を保証する。
export const OFFICIAL_ID = 'u_napsnap_official';

// 公式アカウントは「クライアント側で必ず存在する」キャラクター扱い。
// DB が空でもこのスタブを使うので、アイコン（N バッジ）が消えない。
// avatarImageUri は持たない（Avatar コンポーネントが isOfficial を見て N を描画する）。
export function makeOfficialUser(id: string = OFFICIAL_ID): User {
  return {
    id,
    handle: 'napsnap',
    displayName: 'napsnap',
    avatarEmoji: '🌙',
    avatarColor: '#CFEA45',
    createdAt: Date.now() - 365 * 24 * HOUR,
    isOfficial: true,
  };
}

// 公式アカウントの投稿（＝はじめてでも見るものがある初期フィード）。
// ※文面は仮。あとで本決めする。やわらかい世界観のあいさつ。
export function makeOfficialPosts(officialId: string): Post[] {
  const t = Date.now();
  const plan: { minutesAgo: number; seed: string; cap?: Post['caption'] }[] = [
    { minutesAgo: 40, seed: 'official-welcome', cap: { text: 'ようこそ', fontKey: 'mincho', color: '#1A1A14', x: 0.5, y: 0.85 } },
    { minutesAgo: 230, seed: 'official-trace', cap: { text: '素のままで', fontKey: 'hand', color: '#1A1A14', x: 0.5, y: 0.85 } },
    { minutesAgo: 520, seed: 'official-night', cap: { text: 'おやすみ', fontKey: 'mincho', color: '#1A1A14', x: 0.5, y: 0.85 } },
  ];
  return plan.map((p) => {
    const createdAt = t - p.minutesAgo * 60 * 1000;
    return {
      id: uid('p_'),
      userId: officialId,
      imageUrl: lifeImage(p.seed),
      caption: p.cap,
      audioSeed: p.seed,
      createdAt,
      expiresAt: createdAt + POST_TTL_HOURS * HOUR,
    };
  });
}

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
  const plan: { personIndex: number; minutesAgo: number; seed: string; cap?: Post['caption'] }[] = [
    { personIndex: 0, minutesAgo: 18, seed: TRACE_SEEDS[0], cap: { text: '休憩なう', fontKey: 'maru', color: '#FFFDF7', x: 0.5, y: 0.82 } },
    { personIndex: 1, minutesAgo: 52, seed: TRACE_SEEDS[2] },
    { personIndex: 2, minutesAgo: 95, seed: TRACE_SEEDS[4], cap: { text: 'コーヒー', fontKey: 'hand', color: '#E4FF54', x: 0.32, y: 0.22 } },
    { personIndex: 3, minutesAgo: 140, seed: TRACE_SEEDS[3] },
    { personIndex: 0, minutesAgo: 210, seed: TRACE_SEEDS[5] },
    { personIndex: 2, minutesAgo: 280, seed: TRACE_SEEDS[7] },
    { personIndex: 1, minutesAgo: 360, seed: TRACE_SEEDS[9], cap: { text: 'おやすみ', fontKey: 'mincho', color: '#FFFDF7', x: 0.5, y: 0.5 } },
  ];
  for (const p of plan) {
    const person = people[p.personIndex];
    if (!person) continue;
    const createdAt = t - p.minutesAgo * 60 * 1000;
    posts.push({
      id: uid('p_'),
      userId: person.id,
      imageUrl: lifeImage(`${person.id}-${p.seed}`),
      caption: p.cap,
      audioSeed: `${person.id}-${p.seed}`,
      createdAt,
      expiresAt: createdAt + POST_TTL_HOURS * HOUR,
    });
  }
  return posts;
}

// 「お題」への投稿（フォロー中のモック仲間が今日のお題に出した体）。
// お題は日付がかわる0時に総入れ替え＝期限は「今日の終わり（翌0時）」で揃える。
// 作成時刻は散らして「○時間前」に変化を出す。
export function makeTopicPosts(topic: Topic, people: User[]): Post[] {
  const t = Date.now();
  const endOfToday = nextMidnight(t);
  const posts: Post[] = [];
  // 何時間前に出したか（バラけさせる）。人が一巡したら使い回す。
  const minutesAgoPlan = [35, 110, 200, 320, 470, 610];
  minutesAgoPlan.forEach((minutesAgo, i) => {
    const person = people[i % Math.max(1, people.length)];
    if (!person) return;
    const createdAt = t - minutesAgo * 60 * 1000;
    const withCap = i % 2 === 0; // 半分くらいに手書きの一言
    posts.push({
      id: uid('p_'),
      userId: person.id,
      topicKey: topic.key,
      imageUrl: lifeImage(`${topic.seed}-${person.id}-${i}`),
      caption: withCap
        ? { text: TOPIC_CAPTIONS[i % TOPIC_CAPTIONS.length], fontKey: 'hand', color: '#1A1A14', x: 0.5, y: 0.85 }
        : undefined,
      audioSeed: `${topic.seed}-${person.id}-${i}`,
      createdAt,
      expiresAt: endOfToday,
    });
  });
  return posts;
}

// フォロー中の投稿に、他のモック仲間からのリアクションを少し付ける（未投稿時の予告で
// 「N人が反応」を見せるため）。自分の投稿には付けない。
export function makeSeedReactions(posts: Post[], people: User[], meId: string): Reaction[] {
  const types: ReactionType[] = ['love', 'lol', 'whoa'];
  const out: Reaction[] = [];
  for (const post of posts) {
    if (post.userId === meId) continue;
    const others = people.filter((p) => p.id !== post.userId);
    const n = 1 + Math.floor(Math.random() * Math.min(4, others.length));
    const picks = [...others].sort(() => Math.random() - 0.5).slice(0, n);
    for (const u of picks) {
      out.push({
        id: uid('r_'),
        postId: post.id,
        userId: u.id,
        type: types[Math.floor(Math.random() * types.length)],
        createdAt: post.createdAt + 5 * 60 * 1000,
      });
    }
  }
  return out;
}

// 自分の「思い出」（過去の投稿）。カレンダー＆ハイライト用に、1年前/1ヶ月前/1週間前など
// 過去の日付で自分の投稿を仕込む。すべて期限切れ＝フィード/ホームには出ず、アーカイブにだけ残る。
export function makeMyMemories(meId: string): Post[] {
  const DAY = 24 * HOUR;
  const t = Date.now();
  const plan: { daysAgo: number; seed: string; cap?: Post['caption'] }[] = [
    { daysAgo: 365, seed: 'me-y1', cap: { text: '一年前の\nわたしの机', fontKey: 'hand', color: '#FFFDF7', x: 0.5, y: 0.82 } },
    { daysAgo: 30, seed: 'me-m1', cap: { text: 'しずかな朝', fontKey: 'mincho', color: '#FFFDF7', x: 0.5, y: 0.2 } },
    { daysAgo: 7, seed: 'me-w1', cap: { text: 'おつかれ', fontKey: 'maru', color: '#E4FF54', x: 0.5, y: 0.5 } },
    { daysAgo: 2, seed: 'me-d2' },
    { daysAgo: 3, seed: 'me-d3', cap: { text: '夜ふかし', fontKey: 'hand', color: '#FFFDF7', x: 0.5, y: 0.82 } },
    { daysAgo: 12, seed: 'me-d12' },
    { daysAgo: 40, seed: 'me-d40' },
    { daysAgo: 95, seed: 'me-d95', cap: { text: 'あの日の窓', fontKey: 'mincho', color: '#1A1A14', x: 0.5, y: 0.2 } },
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
