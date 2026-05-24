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
  lime: '#CFEA45', // primary（少し彩度を落として蛍光感を抑える）
  limeSoft: '#F4F7D8', // 淡い選択背景・ハイライト
  limeDust: '#96A83F', // 小さなドット・サブアクセント
  limeInk: '#181A0D', // ライム上の文字

  // 警告
  warn: '#D9473F', // 人検知時のみ

  // 写真未選択時の頭文字アバターのほのかな下地色（互換用に User.avatarColor へ入れる）
  avatarTint: '#C7E6A6',
  // 空アバター（画像も名前も無い）の下地とアイコン色
  avatarFallback: '#EDE6D8',
  avatarFallbackIcon: '#8A826F',
  // ライムの面/状態表示用の濃い文字色と細線
  limeInkSoft: '#3F4518',
  limeLine: 'rgba(113,126,36,0.28)',

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
  card: '0 8px 22px rgba(44,36,22,0.07)',
  cardPressed: '0 4px 10px rgba(44,36,22,0.06)',
  button: '0 8px 18px rgba(96,109,31,0.16)',
  chip: '0 2px 8px rgba(44,36,22,0.07)',
  avatar: '0 4px 10px rgba(44,36,22,0.12)',
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
  lg: 20,
  xl: 28,
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
