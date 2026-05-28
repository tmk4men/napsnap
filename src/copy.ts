// napsnap のUI文言。短く・素っ気なく・押し付けない。
// 端末言語に追従（src/i18n.ts）。ja/en の対で持ち、現在言語の塊を export する。

import { ReactionType } from './types';
import { lang, pick } from './i18n';

export const PASS_HOURS = 6;
export const POST_TTL_HOURS = 24;
export const REACTION_TTL_HOURS = 24;

// リアクションは2種。表示はSVGアイコン（emojiはフォールバック）。label は言語対応。
const REACTION_LABELS: { ja: Record<'love' | 'whoa', string>; en: Record<'love' | 'whoa', string> } = {
  ja: { love: 'いいね', whoa: 'やば' },
  en: { love: 'Nice', whoa: 'Whoa' },
};

export const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'love', emoji: '👍', label: pick(REACTION_LABELS).love },
  { type: 'whoa', emoji: '👀', label: pick(REACTION_LABELS).whoa },
];

export function reactionMeta(type: ReactionType) {
  return REACTIONS.find((r) => r.type === type) ?? REACTIONS[0];
}

const copyByLang = {
  ja: {
    setupNamePlaceholder: 'name',
    setupNext: 'つぎへ',
    setupFollowTitle: 'だれの今を見る？',
    setupFollowSub: 'あなたが1枚出すと、この人たちの“今”がひらく。',
    setupStart: 'はじめる',
    setupBack: 'もどる',

    lockedHeadline: 'ロック中',
    lockedSub: '出した人だけ、見える',
    lockedEmpty: 'まだ誰も出してない',
    shoot: '撮る',
    revealChip: '撮ってひらく',

    see: '見る',
    allSeenTitle: '今日はここまで',

    cameraGuide: '人間なしで、今を1枚',
    faceBlocked: '顔は禁止',
    recording: '録音中',
    recordingHint: 'いまの音を残してる',
    noMic: '音なし',

    previewTitle: 'これでいく？',
    previewPlay: '音を聞く',
    previewPlaying: '再生中',
    post: '出す',
    retake: '撮り直す',

    close: 'とじる',

    keptSub: '反応したものが、24時間だけ残る。',
    emptyKept: 'まだ、何もない',
    emptyKeptSub: 'フィードでリアクションしたものが見返せる。',

    topicKicker: '今日のお題',
    topicJoin: 'このお題に出す',
    topicEmpty: 'まだ誰も出してない',
    topicEmptySub: '最初の1枚を、出してみる。',

    emptyMine: 'まだ出してない',
    emptyMineSub: '',
    following: 'フォロー',
    noFollowing: '誰もフォローしてない',
    saw: '見た',
    reacted: '反応した',
    expiresIn: 'で消える',
  },
  en: {
    setupNamePlaceholder: 'name',
    setupNext: 'Next',
    setupFollowTitle: 'Whose now do you want to see?',
    setupFollowSub: 'Post one photo, and their “now” opens up.',
    setupStart: 'Start',
    setupBack: 'Back',

    lockedHeadline: 'Locked',
    lockedSub: 'Only those who posted can see',
    lockedEmpty: 'No one has posted yet',
    shoot: 'Shoot',
    revealChip: 'Shoot to unlock',

    see: 'See',
    allSeenTitle: "That's all for today",

    cameraGuide: 'One shot of now — no people',
    faceBlocked: 'No faces',
    recording: 'Recording',
    recordingHint: 'Capturing the sound of this moment',
    noMic: 'No sound',

    previewTitle: 'Go with this?',
    previewPlay: 'Play sound',
    previewPlaying: 'Playing',
    post: 'Post',
    retake: 'Retake',

    close: 'Close',

    keptSub: 'What you react to stays for 24 hours.',
    emptyKept: 'Nothing yet',
    emptyKeptSub: 'Things you react to in the feed show up here.',

    topicKicker: "Today's prompt",
    topicJoin: 'Post to this prompt',
    topicEmpty: 'No one has posted yet',
    topicEmptySub: 'Be the first to post.',

    emptyMine: "You haven't posted yet",
    emptyMineSub: '',
    following: 'Following',
    noFollowing: 'Not following anyone',
    saw: 'saw',
    reacted: 'reacted',
    expiresIn: 'left',
  },
} as const;

export const copy = copyByLang[lang];

const tabsByLang = {
  ja: { home: 'ホーム', topic: 'お題', kept: '残した', me: '自分' },
  en: { home: 'Home', topic: 'Prompt', kept: 'Kept', me: 'You' },
} as const;

export const tabs = tabsByLang[lang];
