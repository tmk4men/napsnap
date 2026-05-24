// napsnap デザイントークン。
// アイデンティティ＝「温かいクリーム × 静かなライム」。ライムは“塗る”のではなく“点灯”させる差し色。
export const colors = {
  // 背景・面（紙のような階層を持たせる）
  bg: '#FFF8E8', // ベース背景 Warm Off White
  bgWarm: '#FFF3D8', // ほんのり濃いクリーム（ヘッダー裏やグラデの足し）
  surface: '#F1EBDD', // 基本サーフェス
  surfaceRaised: '#FFFCF2', // 浮いたカード（紙が手前に来た感じ）
  surfaceSunken: '#E8DFCF', // 押し込み・非アクティブ
  surfaceMedia: '#14130F', // 写真系の暗い面
  card: '#F1EBDD', // 後方互換エイリアス（= surface）

  // 文字
  text: '#171713', // メイン Soft Black
  textDim: '#6E6859', // 補助（生活感のある灰）
  textFaint: '#7C735F', // さらに薄い灰（cream上でも読めるコントラストに）

  // 線
  line: '#DED4C1', // 区切り線
  hairline: 'rgba(23,23,19,0.08)', // ごく細い境界

  // アクセント Trace Lime（面積を絞って“点灯”として使う）
  lime: '#D9F74A', // primary
  limeSoft: '#EFF8B7', // 淡い選択背景・ハイライト
  limeDust: '#B7CB52', // 小さなドット・サブアクセント
  limeInk: '#181A0D', // ライム上の文字

  // 警告
  warn: '#D9473F', // 人検知時のみ

  // 写真の上で使う固定色（テーマに依らず白＋暗いスクリム）
  onMedia: '#FFFDF7',
  onMediaDim: 'rgba(255,253,247,0.72)',
  scrimTop: 'rgba(0,0,0,0.35)',
  scrimBottom: 'rgba(0,0,0,0.55)',
  mediaChip: 'rgba(18,17,14,0.55)',
  mediaChipBorder: 'rgba(255,253,247,0.16)',

  // PCで端末枠の外側（プロダクトショット用の落ち着いた暗色）
  backdrop: '#1F1D18',
  backdrop2: '#34301F',
  deviceShell: '#0E0E0B',
} as const;

// 影は boxShadow 文字列（react-native-web / RN0.85 ともに対応）。光は上から、影は暖色寄りに。
export const shadow = {
  card: '0 10px 28px rgba(44,36,22,0.10)',
  cardPressed: '0 5px 14px rgba(44,36,22,0.08)',
  button: '0 10px 20px rgba(120,135,30,0.22)',
  chip: '0 4px 12px rgba(44,36,22,0.10)',
  avatar: '0 6px 16px rgba(44,36,22,0.16)',
  frame: '0 42px 140px rgba(0,0,0,0.52), 0 14px 30px rgba(0,0,0,0.32)',
} as const;

export const space = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 40,
  xxl: 64,
} as const;

export const radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  pill: 999,
} as const;

export const font = {
  display: 52,
  hero: 42,
  title: 28,
  lead: 18,
  body: 15,
  small: 13,
  tiny: 11,
} as const;
