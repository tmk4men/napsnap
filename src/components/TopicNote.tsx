import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, font, radius, space } from '../theme';
import { captionFont, fonts } from '../lib/fonts';

// 「今日のお題」を上質な一枚のカードで見せる。
// クリーム紙 × 金の二重キーライン × 明朝体の大文字で、手帳の高級な扉ページのような佇まい。
const GOLD = '#A8843E';
const GOLD_SOFT = 'rgba(168,132,62,0.34)';
const GOLD_HAIR = 'rgba(168,132,62,0.20)';

export function TopicNote({
  prompt,
  kicker = '今日のお題',
  style,
  children,
}: {
  prompt: string;
  kicker?: string;
  bg?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode; // 紙の中に置くもの（例：このお題に出すボタン）
}) {
  const serif = captionFont('mincho'); // 明朝で品よく

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.card}>
        {/* 上からの淡い光（紙の艶） */}
        <View style={styles.sheen} pointerEvents="none" />
        {/* 金の二重キーライン（内側の細い罫） */}
        <View style={styles.keyline} pointerEvents="none" />

        <View style={styles.kickerRow}>
          <View style={styles.kickerRule} />
          <Text style={styles.kicker}>{kicker}</Text>
          <View style={styles.kickerRule} />
        </View>

        <Text style={[styles.prompt, { fontFamily: serif.family, fontWeight: serif.weight }]}>{prompt}</Text>

        {children ? <View style={styles.footer}>{children}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  card: {
    width: '100%',
    backgroundColor: '#FFFDF6',
    borderRadius: radius.lg,
    paddingVertical: space.lg,
    paddingHorizontal: space.lg,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    boxShadow: '0 18px 40px rgba(60,46,18,0.16), 0 3px 10px rgba(60,46,18,0.08)',
    overflow: 'hidden',
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '52%',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  keyline: {
    position: 'absolute',
    top: 7,
    left: 7,
    right: 7,
    bottom: 7,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: GOLD_HAIR,
  },
  kickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  kickerRule: { width: 22, height: 1, backgroundColor: GOLD_SOFT },
  kicker: {
    color: GOLD,
    fontSize: font.tiny,
    fontWeight: '800',
    letterSpacing: 4,
    fontFamily: fonts.ui,
  },
  prompt: {
    color: colors.text,
    fontSize: 32,
    lineHeight: 42,
    textAlign: 'center',
    marginTop: space.sm,
  },
  footer: { marginTop: space.md, alignItems: 'center' },
});
