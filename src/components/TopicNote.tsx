import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, font, radius, rule, shadow, space } from '../theme';
import { captionFont, fonts } from '../lib/fonts';
import { tr } from '../i18n';

// 「今日のお題」を号外の“囲み記事”として見せる。
// 生成り紙 × 朱の見出し罫 × 詰めた明朝で、紙面に組んだ告知のような佇まい。

export function TopicNote({
  prompt,
  kicker = tr('今日のお題', "Today's prompt"),
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
        {/* 内側の細い二重罫（号外の囲み） */}
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
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xs,
    paddingVertical: space.lg,
    paddingHorizontal: space.lg,
    borderWidth: rule.thin,
    borderColor: colors.text,
    boxShadow: shadow.card,
    overflow: 'hidden',
  },
  keyline: {
    position: 'absolute',
    top: 5,
    left: 5,
    right: 5,
    bottom: 5,
    borderRadius: 0,
    borderWidth: rule.hair,
    borderColor: colors.hairline,
  },
  kickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  kickerRule: { width: 22, height: rule.hair, backgroundColor: colors.lime },
  kicker: {
    color: colors.limeInkSoft,
    fontSize: font.tiny,
    fontWeight: '800',
    letterSpacing: 4,
    fontFamily: fonts.ui,
  },
  prompt: {
    color: colors.text,
    fontSize: 32,
    lineHeight: 42,
    letterSpacing: -1,
    textAlign: 'center',
    marginTop: space.sm,
  },
  footer: { marginTop: space.md, alignItems: 'center' },
});
