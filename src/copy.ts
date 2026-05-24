// napsnap のUI文言（企画書 8章のトーンに合わせる）。
// 「素敵な瞬間を共有しよう」系は使わない。素っ気なく、交換感を出す。

import { ReactionType } from './types';

export const PASS_HOURS = 6;
export const POST_TTL_HOURS = 24;
export const REACTION_TTL_HOURS = 24;
export const MAX_MEMBERS = 8;

export const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'saw', emoji: '👀', label: '見た' },
  { type: 'lol', emoji: '😂', label: '笑う' },
  { type: 'feel', emoji: '🫠', label: 'わかる' },
  { type: 'whoa', emoji: '🌀', label: 'やば' },
  { type: 'love', emoji: '🫶', label: 'すき' },
  { type: 'nap', emoji: '🟡', label: 'nap' },
];

export function reactionMeta(type: ReactionType) {
  return REACTIONS.find((r) => r.type === type) ?? REACTIONS[0];
}

export const copy = {
  onboarding: [
    {
      title: '人が映ると\n撮れない、日常SNS。',
      sub: '顔も、人も主役じゃない。\n机・飯・足元・寝床。生活の痕跡だけ。',
    },
    {
      title: '1枚撮ると、\n6時間だけひらく。',
      sub: '友達の痕跡はロックされてる。\n君の1枚で、6時間だけ見える。',
    },
    {
      title: '反応した投稿だけ、\n24時間残る。',
      sub: '1枚ずつ、一方通行で見る。\n流したら戻れない。反応したものだけ残る。',
    },
  ],
  lockTitle: '閉じてる',
  lockSub: '1枚撮ると、6時間だけ友達の痕跡が見える。',
  openTitle: 'ひらいてる',
  shoot: '今を撮る',
  shootAgain: 'もう1枚撮る',
  cameraGuide: '人間なしで、今を1枚',
  faceBlocked: '顔は禁止',
  maybeHuman: '人が映ってるかも',
  post: 'これを出す',
  retake: '撮り直す',
  feedDone: '全部見た',
  emptyKept: 'まだ何も残してない',
  emptyKeptSub: 'フィードで反応した痕跡が、ここに24時間だけ残る。',
  emptyMine: 'まだ1枚も出してない',
  emptyMineSub: '君が1枚出すと、友達の6時間がひらく。',
} as const;

export const tabs = {
  home: 'ホーム',
  kept: '残した',
  me: '自分',
} as const;
