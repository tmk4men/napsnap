import { Platform } from 'react-native';

// Web では Google Fonts を読み込んで「こだわりの書体」を使う。
// ネイティブでは未バンドルのためフォールバック（システム書体）になる＝Web デモ優先。
const WEB = Platform.OS === 'web';

// ブランド（手書き風）と見出し（端正なゴシック）。
export const fonts = {
  brand: WEB ? 'Caveat' : undefined, // napsnap のロゴ＝手書き風
  display: WEB ? 'Zen Kaku Gothic New' : undefined, // 大見出し
  ui: WEB ? 'Zen Kaku Gothic New' : undefined, // UI本文・ラベル（全体の統一感）
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
  'https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Zen+Kaku+Gothic+New:wght@400;500;700;800;900&family=Yomogi&family=Zen+Maru+Gothic:wght@500;700&family=Shippori+Mincho:wght@600;800&display=swap';

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
