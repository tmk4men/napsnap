// 文字の禁止ワード（スターター。運用で増やす）。
// 画像にそえる一言・なまえ などのユーザー入力をチェックするのに使う。
// 大文字小文字・全角半角・空白を吸収してから部分一致で判定する。

export const BANNED_WORDS = [
  // 攻撃・ハラスメント系（日本語）
  '死ね',
  'しね',
  '殺す',
  'ころす',
  'きもい',
  'うざい',
  'ばか',
  'あほ',
  'ブス',
  'クズ',
  'カス',
  'ちんこ',
  'チンコ',
  // 英語
  'fuck',
  'shit',
  'bitch',
  'asshole',
];

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFKC').replace(/\s+/g, '');
}

// 含まれていれば最初に当たった禁止ワードを返す（無ければ undefined）。
export function findBanned(text?: string): string | undefined {
  if (!text) return undefined;
  const n = normalize(text);
  if (!n) return undefined;
  return BANNED_WORDS.find((w) => n.includes(normalize(w)));
}

export function hasBanned(text?: string): boolean {
  return !!findBanned(text);
}
