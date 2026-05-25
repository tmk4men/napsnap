import React from 'react';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { colors, font, shadow, space } from '../theme';
import { fonts } from '../lib/fonts';

// napsnap はスマホ前提のSNS。GitHub Pages のデモはPCブラウザでも開かれるため、
// 広い画面では「本物の端末」風モックに収めてプロダクトショットに見せる。狭い画面では全幅。
const WIDE_BREAKPOINT = 640;
const SCREEN_WIDTH = 412;
const BEZEL = 12;

export function ResponsiveFrame({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();
  const isWideWeb = Platform.OS === 'web' && width >= WIDE_BREAKPOINT;

  if (!isWideWeb) {
    // スマホ実機・狭いブラウザ：そのまま全幅
    return <View style={styles.fill}>{children}</View>;
  }

  const screenHeight = Math.min(Math.max(height - 96, 560), 900);

  return (
    <View style={[styles.page, styles.pageGradient as object]}>
      <View style={styles.device}>
        <View style={[styles.screen, { width: SCREEN_WIDTH, height: screenHeight }]}>
          {children}
          <View style={styles.island} pointerEvents="none" />
        </View>
      </View>

      <View style={styles.brandRow}>
        <Text style={styles.brand}>napsnap</Text>
        <Text style={styles.tagline}>顔のない、今日の痕跡。</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  page: {
    flex: 1,
    backgroundColor: colors.backdrop,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // web のみ効く線形グラデ（未対応環境では backgroundColor にフォールバック）。テーマ連動。
  pageGradient: {
    experimental_backgroundImage: `linear-gradient(150deg, ${colors.backdrop} 0%, ${colors.backdrop2} 100%)`,
  } as any,
  // 端末枠の角丸は“スマホらしさ”のため radius トークン（紙面用に直角化）とは独立に固定する。
  device: {
    backgroundColor: colors.deviceShell,
    borderRadius: 46,
    padding: BEZEL,
    boxShadow: shadow.frame,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  screen: {
    backgroundColor: colors.bg,
    borderRadius: 34,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    position: 'relative',
  },
  island: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    width: 96,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#08080a',
  },
  brandRow: { marginTop: space.lg, alignItems: 'center', gap: 4 },
  brand: { color: 'rgba(255,255,255,0.95)', fontSize: 26, letterSpacing: -0.5, fontFamily: fonts.brand },
  tagline: { color: 'rgba(255,255,255,0.45)', fontSize: font.small, letterSpacing: 0.5, fontFamily: fonts.ui },
});
