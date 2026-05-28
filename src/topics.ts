// 「お題」＝人物以外の、毎日かわる共通のお題。身内ノリで盛り上がる軽いネタを用意する。
// 同じ日なら全員に同じお題が出る（＝共通の話題）。日付で決まるので“毎日ランダムに変わる”ように見える。

import { HOUR } from './lib/time';
import { pick } from './i18n';

export interface Topic {
  key: string;
  prompt: string; // ノートに手書きで出る文（起動時の言語で確定）
  seed: string; // デモ画像のバリエーション種
}

// 人を主役にしない・生活の痕跡で答えられる・身内でつい出したくなるお題。
// prompt は起動時に端末言語で確定する（pick）。key/seed は言語非依存で固定。
const topic = (key: string, ja: string, en: string, seed: string): Topic => ({ key, prompt: pick({ ja, en }), seed });

export const TOPICS: Topic[] = [
  topic('gohan', 'ごはん', 'Food', 'meal'),
  topic('sora', '空', 'The sky', 'sky'),
  topic('nomimono', '飲みもの', 'A drink', 'drink'),
  topic('desk', '机の上', 'Your desk', 'desk'),
  topic('ashimoto', '足もと', 'At your feet', 'feet'),
  topic('oyatsu', 'おやつ', 'A snack', 'snack'),
];

// お題に出した投稿に添える、短い手書きの一言（チェキ下余白用）。デモのシード用。
export const TOPIC_CAPTIONS = pick({
  ja: ['うまい', 'しあわせ', '今日のやつ', 'えへへ', 'たまらん', 'ふつう', 'なんとなく', '優勝'],
  en: ['Yum', 'Bliss', "Today's", 'hehe', 'So good', 'Meh', 'Just because', 'A win'],
});

const DAY = 24 * HOUR;

// ローカルの日付で決まる日インデックス。毎日かわる＝同じ日なら全員同じお題。
export function dayIndex(ts: number = Date.now()): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return Math.floor(d.getTime() / DAY);
}

export function todaysTopic(ts: number = Date.now()): Topic {
  const i = ((dayIndex(ts) % TOPICS.length) + TOPICS.length) % TOPICS.length;
  return TOPICS[i];
}

export function topicByKey(key?: string): Topic | undefined {
  if (!key) return undefined;
  return TOPICS.find((t) => t.key === key);
}
