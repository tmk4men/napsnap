// napsnap のUI文言。短く・素っ気なく・押し付けない。
// 「ひらいてる/閉じてる」みたいな説明調はやめ、状態は見た目（モザイク/音）で伝える。

import { ReactionType } from './types';

export const PASS_HOURS = 6;
export const POST_TTL_HOURS = 24;
export const REACTION_TTL_HOURS = 24;

// リアクションは3種に絞る。表示はSVGアイコン（emojiはテキスト箇所のフォールバック用）。
export const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'love', emoji: '🫶', label: 'すき' },
  { type: 'lol', emoji: '😂', label: 'わら' },
  { type: 'whoa', emoji: '👀', label: 'やば' },
];

export function reactionMeta(type: ReactionType) {
  return REACTIONS.find((r) => r.type === type) ?? REACTIONS[0];
}

export const copy = {
  // アカウント設定
  setupNamePlaceholder: 'name',
  setupNext: 'つぎへ',
  setupFollowTitle: 'だれの今を見る？',
  setupStart: 'はじめる',
  setupBack: 'もどる',

  // ホーム：ロック中（相手の画像はモザイク・音は鳴らない）
  lockedHeadline: 'ロック中',
  lockedSub: '出した人だけ、見える',
  lockedEmpty: 'まだ誰も出してない',
  shoot: '撮る',
  revealChip: '撮ってひらく',

  // ホーム：オープン
  see: '見る',
  allSeenTitle: '今日はここまで',

  // カメラ
  cameraGuide: '人間なしで、今を1枚',
  faceBlocked: '顔は禁止',
  recording: '録音中',
  recordingHint: 'いまの音を残してる',
  noMic: '音なし',

  // プレビュー
  previewTitle: 'これでいく？',
  previewPlay: '音を聞く',
  previewPlaying: '再生中',
  post: '出す',
  retake: '撮り直す',

  // フィード
  feedDoneTitle: 'ぜんぶ見た',
  feedDoneSub: 'また誰かが出したら、ここに増える。',
  close: 'とじる',

  // 残した
  keptSub: '反応したものが、24時間だけ残る。',
  emptyKept: 'まだ、何もない',
  emptyKeptSub: 'フィードで反応した痕跡が、ここに残る。',

  // 自分
  emptyMine: 'まだ出してない',
  emptyMineSub: '出すと、ここに残る。',
  following: 'フォロー中',
  noFollowing: '誰もフォローしてない',
  saw: '見た',
  reacted: '反応した',
  expiresIn: 'で消える',
} as const;

export const tabs = {
  home: 'ホーム',
  kept: '残した',
  me: '自分',
} as const;
