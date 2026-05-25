import { Platform } from 'react-native';

// Web では Google Fonts を読み込んで「こだわりの書体」を使う。
// ネイティブでは未バンドルのためフォールバック（システム書体）になる＝Web デモ優先。
const WEB = Platform.OS === 'web';

// 号外（新聞紙面）の書体。題字はディドネ、見出しは詰めた明朝、本文/ラベルは公的書類のゴシック。
export const fonts = {
  brand: WEB ? 'DM Serif Display' : undefined, // 題字＝高コントラストのディドネ（新聞のマストヘッド）
  display: WEB ? 'Shippori Mincho' : undefined, // 大見出し（明朝・太）
  serif: WEB ? 'Shippori Mincho' : undefined, // 見出し/余韻のコピー（明朝）
  ui: WEB ? 'BIZ UDPGothic' : undefined, // UI本文・ラベル（公的書類の角ゴ＝“通知/告知”の質感）
  name: WEB ? 'BIZ UDPGothic' : undefined, // 表示名（紙面では人名も同じ角ゴで組む）
  handle: WEB ? 'DM Mono' : undefined, // @ID・数字＝等幅で“活字で組んだ”質感
} as const;

// 画像に入れる文字のフォント（3種）。
export const CAPTION_FONTS = [
  { key: 'hand', label: '手書き', family: WEB ? 'Yomogi' : undefined, weight: '400' as const },
  { key: 'maru', label: '丸ゴ', family: WEB ? 'Zen Maru Gothic' : undefined, weight: '700' as const },
  { key: 'mincho', label: '明朝', family: WEB ? 'Shippori Mincho' : undefined, weight: '800' as const },
] as const;

export type CaptionFontKey = (typeof CAPTION_FONTS)[number]['key'];

export function captionFont(key: string) {
  return CAPTION_FONTS.find((f) => f.key === key) ?? CAPTION_FONTS[0];
}

export const GOOGLE_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Shippori+Mincho:wght@600;700;800&family=BIZ+UDPGothic:wght@400;700&family=DM+Mono:wght@400;500&family=Yomogi&family=Zen+Maru+Gothic:wght@500;700&display=swap';

// 実行時にWebのheadへフォントlinkを差し込む（dev/prod 両対応。idで二重読み込みを防ぐ）。
export function loadWebFonts() {
  if (!WEB) return;
  const g: any = globalThis;
  const doc = g?.document;
  if (!doc || doc.getElementById('napsnap-fonts')) return;
  const pre1 = doc.createElement('link');
  pre1.rel = 'preconnect';
  pre1.href = 'https://fonts.googleapis.com';
  const pre2 = doc.createElement('link');
  pre2.rel = 'preconnect';
  pre2.href = 'https://fonts.gstatic.com';
  pre2.crossOrigin = 'anonymous';
  const link = doc.createElement('link');
  link.id = 'napsnap-fonts';
  link.rel = 'stylesheet';
  link.href = GOOGLE_FONTS_HREF;
  doc.head.appendChild(pre1);
  doc.head.appendChild(pre2);
  doc.head.appendChild(link);
}
