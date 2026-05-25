// napsnap デザイントークン。
// 設計言語＝「号外（新聞紙面）」の構成・書体はそのまま、配色は Twitter/Instagram のような“白黒”。
// ライト＝白地に黒 / ダーク＝黒地に白。差し色は廃し強調はすべて黒（ダークは白）。例外は warn の赤のみ。
//
// テーマは「起動時に1回」決める：Web は手動切替(localStorage)→OS設定、ネイティブは OS 設定に追従。
// こうすると全画面が `import { colors }` のまま自動で配色される（各画面の改修ゼロ）。
// 手動切替（ハンバーガーメニュー）は localStorage に保存し、即リロードで反映（Webデモ最優先）。
import { Appearance, Platform } from 'react-native';

type Palette = {
  bg: string; bgWarm: string; surface: string; surfaceRaised: string; surfaceSunken: string;
  surfaceMedia: string; card: string;
  text: string; textDim: string; textFaint: string;
  line: string; hairline: string;
  lime: string; limeSoft: string; limeDust: string; limeInk: string; limeInkSoft: string; limeLine: string;
  warn: string;
  avatarTint: string; avatarFallback: string; avatarFallbackIcon: string;
  onMedia: string; onMediaDim: string; scrimTop: string; scrimBottom: string; mediaChip: string; mediaChipBorder: string;
  backdrop: string; backdrop2: string; deviceShell: string;
};

// ライト＝白地に黒（X/IG のクリーンな白黒）
const lightColors: Palette = {
  bg: '#FFFFFF',
  bgWarm: '#FAFAFA',
  surface: '#F4F4F5',
  surfaceRaised: '#FFFFFF',
  surfaceSunken: '#E9E9EB',
  surfaceMedia: '#0A0A0A',
  card: '#F4F4F5',

  text: '#0F0F0F',
  textDim: '#5B5B5B',
  textFaint: '#9C9C9C',

  line: '#E4E4E7',
  hairline: 'rgba(0,0,0,0.12)',

  lime: '#111111', // 強調＝黒ベタ
  limeSoft: '#F0F0F0',
  limeDust: '#000000',
  limeInk: '#FFFFFF', // 黒の上の文字＝白
  limeInkSoft: '#111111',
  limeLine: 'rgba(0,0,0,0.16)',

  warn: '#E0245E',

  avatarTint: '#E6E6E8',
  avatarFallback: '#EFEFF1',
  avatarFallbackIcon: '#9C9C9C',

  onMedia: '#FFFFFF',
  onMediaDim: 'rgba(255,255,255,0.72)',
  scrimTop: 'rgba(0,0,0,0.35)',
  scrimBottom: 'rgba(0,0,0,0.55)',
  mediaChip: 'rgba(0,0,0,0.55)',
  mediaChipBorder: 'rgba(255,255,255,0.18)',

  backdrop: '#1A1A1A', // PC端末枠の外（白い端末を浮かせる暗色）
  backdrop2: '#0E0E0E',
  deviceShell: '#000000',
};

// ダーク＝黒地に白（X のダークモード的：強調は白ベタ＋黒文字）
const darkColors: Palette = {
  bg: '#000000',
  bgWarm: '#0A0A0A',
  surface: '#161618',
  surfaceRaised: '#121214',
  surfaceSunken: '#242427',
  surfaceMedia: '#0A0A0A',
  card: '#161618',

  text: '#F4F4F5',
  textDim: '#A8A8A8',
  textFaint: '#6E6E6E',

  line: '#2A2A2C',
  hairline: 'rgba(255,255,255,0.16)',

  lime: '#F5F5F5', // 強調＝白ベタ
  limeSoft: '#1C1C1E',
  limeDust: '#FFFFFF',
  limeInk: '#0A0A0A', // 白の上の文字＝黒
  limeInkSoft: '#F4F4F5',
  limeLine: 'rgba(255,255,255,0.22)',

  warn: '#FF5A7A', // 黒地で読みやすい明るめの赤

  avatarTint: '#242427',
  avatarFallback: '#1A1A1C',
  avatarFallbackIcon: '#6E6E6E',

  onMedia: '#FFFFFF',
  onMediaDim: 'rgba(255,255,255,0.72)',
  scrimTop: 'rgba(0,0,0,0.35)',
  scrimBottom: 'rgba(0,0,0,0.55)',
  mediaChip: 'rgba(0,0,0,0.55)',
  mediaChipBorder: 'rgba(255,255,255,0.18)',

  backdrop: '#26262A', // PC端末枠の外（黒い端末を浮かせる中暗色）
  backdrop2: '#161618',
  deviceShell: '#000000',
};

const THEME_KEY = 'napsnap-theme';
type Mode = 'light' | 'dark';

function resolveMode(): Mode {
  if (Platform.OS === 'web') {
    try {
      const g: any = globalThis;
      const saved = g?.localStorage?.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
      if (g?.matchMedia?.('(prefers-color-scheme: dark)')?.matches) return 'dark';
    } catch {}
    return 'light';
  }
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
}

// 起動時に確定するテーマ。これ以降は固定（切替はリロードで反映）。
export const themeMode: Mode = resolveMode();
export const colors: Palette = themeMode === 'dark' ? darkColors : lightColors;

// 手動切替（ハンバーガーメニューから）。Web は保存して即リロード、ネイティブは OS 設定に追従。
export function setThemeMode(mode: Mode | 'system') {
  if (Platform.OS !== 'web') return;
  try {
    const g: any = globalThis;
    if (mode === 'system') g?.localStorage?.removeItem(THEME_KEY);
    else g?.localStorage?.setItem(THEME_KEY, mode);
    g?.location?.reload?.();
  } catch {}
}

export function toggleThemeMode() {
  setThemeMode(themeMode === 'dark' ? 'light' : 'dark');
}

// 影は基本「使わない」。重さは罫線が担う。残すのは端末枠の落ち影だけ。
type ShadowSet = { card: string; cardPressed: string; button: string; chip: string; avatar: string; frame: string };
const lightShadow: ShadowSet = {
  card: '0 1px 2px rgba(0,0,0,0.05)',
  cardPressed: 'none',
  button: 'none',
  chip: 'none',
  avatar: '0 1px 2px rgba(0,0,0,0.10)',
  frame: '0 42px 140px rgba(0,0,0,0.55), 0 14px 30px rgba(0,0,0,0.35)',
};
const darkShadow: ShadowSet = {
  card: 'none', // 黒地では影は出ない。区切りは罫線で。
  cardPressed: 'none',
  button: 'none',
  chip: 'none',
  avatar: 'none',
  frame: '0 42px 140px rgba(0,0,0,0.7), 0 14px 30px rgba(0,0,0,0.5)',
};
export const shadow: ShadowSet = themeMode === 'dark' ? darkShadow : lightShadow;

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
