// napsnap のビジュアルトーン（企画書 8章）
// 外側はシンプル、中身は少しゆるい。余白多め・丸み・黒/白/ライム。

export const colors = {
  black: '#050505',
  ink: '#0E0E0E', // カード等の少し明るい黒
  surface: '#161616',
  white: '#F7F7F2',
  lime: '#DFFF2F',
  gray: '#8A8A8A',
  grayDim: '#555555',
  warn: '#FF3B3B',
  cream: '#FFF8E8',
} as const;

export const space = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 36,
  xxl: 56,
} as const;

export const radius = {
  sm: 12,
  md: 20,
  lg: 28,
  pill: 999,
} as const;

export const font = {
  // システムフォントに任せる（顔出し圧を出さない、素っ気なさ重視）
  hero: 40,
  title: 26,
  lead: 18,
  body: 15,
  small: 13,
  tiny: 11,
} as const;
