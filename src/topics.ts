// 「お題」＝人物以外の、毎日かわる共通のお題。身内ノリで盛り上がる軽いネタを用意する。
// 同じ日なら全員に同じお題が出る（＝共通の話題）。日付で決まるので“毎日ランダムに変わる”ように見える。

import { HOUR } from './lib/time';

export interface Topic {
  key: string;
  prompt: string; // ノートに手書きで出る文
  seed: string; // デモ画像のバリエーション種
}

// 人を主役にしない・生活の痕跡で答えられる・身内でつい出したくなるお題。
// 見出しの「今日のお題」と被るので、各お題の文からは「今日の」を入れない。
export const TOPICS: Topic[] = [
  { key: 'gohan', prompt: 'ごはん', seed: 'meal' },
  { key: 'sora', prompt: '空', seed: 'sky' },
  { key: 'nomimono', prompt: '飲みもの', seed: 'drink' },
  { key: 'desk', prompt: '机の上', seed: 'desk' },
  { key: 'ashimoto', prompt: '足もと', seed: 'feet' },
  { key: 'oyatsu', prompt: 'おやつ', seed: 'snack' },
  { key: 'mado', prompt: '窓の外', seed: 'window' },
  { key: 'yashoku', prompt: '深夜のおとも', seed: 'midnight' },
];

// お題に出した投稿に添える、短い手書きの一言（チェキ下余白用）。デモのシード用。
export const TOPIC_CAPTIONS = ['うまい', 'しあわせ', '今日のやつ', 'えへへ', 'たまらん', 'ふつう', 'なんとなく', '優勝'];

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
