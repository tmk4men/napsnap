// napsnap 最終カラーパレット（ライト基調・生活感のあるクリーム）。
export const colors = {
  bg: '#FFF8E8', // ベース背景 Warm Off White
  text: '#1E1E1E', // メイン文字 Soft Black
  textDim: '#8C8676', // 補助文字（生活感のある灰）
  textFaint: '#B4AD9C', // さらに薄い灰
  lime: '#DFFF2F', // アクセント Trace Lime（解除・反応・撮影OK・通知ドット）
  limeInk: '#1E1E1E', // ライム上の文字
  card: '#EDE8DC', // サブ背景 Dust Gray（カード・区切り・非アクティブ）
  line: '#E3DDCD', // 区切り線
  warn: '#FF4B4B', // 警告 Human Red（人検知時のみ）

  // 写真の上で使う固定色（テーマに依らず白＋暗いスクリム）
  onMedia: '#FFFFFF',
  onMediaDim: 'rgba(255,255,255,0.75)',
  scrimTop: 'rgba(0,0,0,0.35)',
  scrimBottom: 'rgba(0,0,0,0.55)',
  mediaChip: 'rgba(0,0,0,0.5)',

  // PCで端末枠の外側
  backdrop: '#26241F',
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
  hero: 40,
  title: 26,
  lead: 18,
  body: 15,
  small: 13,
  tiny: 11,
} as const;
