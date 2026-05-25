// napsnap デザイントークン。
// 設計言語＝「号外（新聞紙面）」の構成・書体はそのまま、配色だけ Twitter/Instagram のような“白黒”に。
// 白地に黒。差し色は廃し、強調はすべて黒（lime キー＝黒に読み替え）。
// 例外は warn（顔検知・禁止ワード・破壊的操作）の赤だけ＝主要SNSと同じ運用。
// 角丸カード・光沢・やわ影は使わない。骨格は「罫線＋詰めた明朝」でつくる。
export const colors = {
  // 面（白地＋ごく薄いグレーの階層）
  bg: '#FFFFFF', // ベース＝白
  bgWarm: '#FAFAFA', // 帯の地に少し沈める
  surface: '#F4F4F5', // 基本サーフェス（薄グレー）
  surfaceRaised: '#FFFFFF', // 浮いた面＝白（境界は罫線で出す）
  surfaceSunken: '#E9E9EB', // 押し込み・非アクティブ
  surfaceMedia: '#0A0A0A', // 写真系の暗い面
  card: '#F4F4F5', // 後方互換エイリアス（= surface）

  // 文字（黒〜グレー）
  text: '#0F0F0F',
  textDim: '#5B5B5B',
  textFaint: '#9C9C9C',

  // 罫線
  line: '#E4E4E7', // 区切り罫
  hairline: 'rgba(0,0,0,0.12)', // 細罫

  // 強調＝黒（旧 lime キーを黒に読み替え。ベタは黒、上の文字は白＝X の Post ボタン的）
  lime: '#111111', // primary（黒のベタ）
  limeSoft: '#F0F0F0', // 選択背景・ハイライト（薄グレー）
  limeDust: '#000000', // 黒ボタンの縁・小さな点
  limeInk: '#FFFFFF', // 黒の上の文字＝白
  limeInkSoft: '#111111', // 白地で使う“強調文字”＝黒
  limeLine: 'rgba(0,0,0,0.16)', // 強調の細罫

  // 警告（人検知・禁止ワード・削除）＝唯一の色。主要SNSと同じく赤。
  warn: '#E0245E',

  // アバター下地（中立グレー）
  avatarTint: '#E6E6E8',
  avatarFallback: '#EFEFF1',
  avatarFallbackIcon: '#9C9C9C',

  // 写真の上で使う固定色
  onMedia: '#FFFFFF',
  onMediaDim: 'rgba(255,255,255,0.72)',
  scrimTop: 'rgba(0,0,0,0.35)',
  scrimBottom: 'rgba(0,0,0,0.55)',
  mediaChip: 'rgba(0,0,0,0.55)',
  mediaChipBorder: 'rgba(255,255,255,0.18)',

  // PCで端末枠の外側（白黒のプロダクトショット用に近黒）
  backdrop: '#0E0E0E',
  backdrop2: '#1A1A1A',
  deviceShell: '#000000',
} as const;

// 影は基本「使わない」。重さは罫線が担う。残すのは端末枠の落ち影だけ。
export const shadow = {
  card: '0 1px 2px rgba(0,0,0,0.05)',
  cardPressed: 'none',
  button: 'none',
  chip: 'none',
  avatar: '0 1px 2px rgba(0,0,0,0.10)',
  frame: '0 42px 140px rgba(0,0,0,0.55), 0 14px 30px rgba(0,0,0,0.35)',
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

// 角丸はほぼ無し（新聞は直角）。写真の角だけ気持ち落とす程度。
export const radius = {
  xs: 2,
  sm: 2,
  md: 3,
  lg: 4,
  xl: 4,
  pill: 999, // 互換のため残すが、原則使わない
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

// 罫線の太さ（紙面の階層）。masthead は二重罫、節は太罫、項目は細罫。
export const rule = {
  hair: 1,
  thin: 1.5,
  thick: 3,
  heavy: 5,
} as const;
