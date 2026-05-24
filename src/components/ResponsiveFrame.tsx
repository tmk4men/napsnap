import React from 'react';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { colors, font, radius, shadow, space } from '../theme';
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
  // web のみ効く線形グラデ（未対応環境では backgroundColor にフォールバック）
  pageGradient: {
    experimental_backgroundImage: 'linear-gradient(150deg, #24221B 0%, #1F1D18 100%)',
  } as any,
  device: {
    backgroundColor: colors.deviceShell,
    borderRadius: radius.xl + 16,
    padding: BEZEL,
    boxShadow: shadow.frame,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  screen: {
    backgroundColor: colors.bg,
    borderRadius: radius.xl + 4,
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
  brand: { color: 'rgba(255,253,247,0.94)', fontSize: 24, fontWeight: '700', fontFamily: fonts.brand },
  tagline: { color: 'rgba(255,253,247,0.40)', fontSize: font.small, letterSpacing: 0.5 },
});
