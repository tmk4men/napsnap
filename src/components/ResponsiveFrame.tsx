import React from 'react';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { colors, font, radius } from '../theme';

// napsnap はスマホ前提のSNS。GitHub Pages のデモはPCブラウザでも開かれるため、
// 広い画面ではスマホ幅の「端末枠」に収めて中央寄せ、狭い画面では全幅で表示する。
const WIDE_BREAKPOINT = 640;
const FRAME_WIDTH = 412;

export function ResponsiveFrame({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();
  const isWideWeb = Platform.OS === 'web' && width >= WIDE_BREAKPOINT;

  if (!isWideWeb) {
    // スマホ実機・狭いブラウザ：そのまま全幅
    return <View style={styles.fill}>{children}</View>;
  }

  const frameHeight = Math.min(Math.max(height - 64, 560), 896);

  return (
    <View style={styles.page}>
      <View style={[styles.frame, { width: FRAME_WIDTH, height: frameHeight }]}>{children}</View>
      <Text style={styles.caption}>napsnap・ブラウザ用デモ版（モックデータ／顔検知はPhase2）</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.black },
  page: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    backgroundColor: colors.black,
    borderRadius: radius.lg + 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
  },
  caption: { color: colors.grayDim, fontSize: font.small, marginTop: 16 },
});
