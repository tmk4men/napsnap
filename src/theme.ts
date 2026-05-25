// napsnap デザイントークン。
// 設計言語＝「号外（新聞紙面）」。生成りの紙にインクの黒、差し色は速報の朱赤“1色”だけ。
// 角丸カード・光沢・やわ影・グラデ＋グレインは使わない。骨格は「罫線＋詰めた明朝」でつくる。
// 色キーは旧来のまま（lime=朱赤に読み替え）。全画面が自動で紙面化する。
export const colors = {
  // 紙（生成り。クリームより彩度を落とした“新聞紙”の灰寄り）
  bg: '#F1ECE0', // ベース＝新聞紙
  bgWarm: '#E9E2D2', // 題字裏・欄の地に少し沈める
  surface: '#E9E3D5', // 基本サーフェス
  surfaceRaised: '#FAF7EE', // 貼り込んだ写真の白フチ（紙より明るい）
  surfaceSunken: '#DCD5C2', // 押し込み・非アクティブ
  surfaceMedia: '#14130F', // 写真系の暗い面
  card: '#E9E3D5', // 後方互換エイリアス（= surface）

  // インク（紙に染みた黒。真っ黒よりわずかに暖）
  text: '#17150F',
  textDim: '#56503F',
  textFaint: '#8A8268',

  // 罫線
  line: '#C8C0AB', // 区切り罫
  hairline: 'rgba(23,21,15,0.18)', // 細罫（“印刷された線”として読めるよう少し濃く）

  // 差し色 速報赤（号外の朱。面で塗らず、罫・印・見出しの一点に）
  lime: '#C22E1C', // primary（=press red）
  limeSoft: '#F1E2DB', // 淡い朱の刷り（選択背景）
  limeDust: '#9A2A1A', // 小さな点・サブアクセント
  limeInk: '#FBF6EC', // 朱の上の文字＝紙色
  limeInkSoft: '#6B1C11', // 朱の濃い文字（紙の上で使う見出し朱）
  limeLine: 'rgba(194,46,28,0.32)', // 朱の細罫

  // 警告（人検知）＝同じ朱でよい。新聞の“緊急”は赤。
  warn: '#C22E1C',

  // アバター下地（中立の紙グレー）
  avatarTint: '#D7CFBB',
  avatarFallback: '#E3DCCB',
  avatarFallbackIcon: '#8A8268',

  // 写真の上で使う固定色
  onMedia: '#FBF7EE',
  onMediaDim: 'rgba(251,247,238,0.72)',
  scrimTop: 'rgba(0,0,0,0.35)',
  scrimBottom: 'rgba(0,0,0,0.55)',
  mediaChip: 'rgba(18,17,14,0.58)',
  mediaChipBorder: 'rgba(251,247,238,0.18)',

  // PCで端末枠の外側（印刷工場の暗色）
  backdrop: '#1C1A15',
  backdrop2: '#2C281C',
  deviceShell: '#0E0E0B',
} as const;

// 影は基本「使わない」。重さは罫線が担う。残すのは端末枠の落ち影だけ。
// card は“紙に貼った切り抜き”の硬い小オフセットだけ薄く残す（やわらかい浮遊カードにしない）。
export const shadow = {
  card: '1px 2px 0 rgba(23,21,15,0.06)',
  cardPressed: 'none',
  button: 'none',
  chip: 'none',
  avatar: '0 1px 2px rgba(23,21,15,0.10)',
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
