import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, font, rule, space } from '../theme';
import { fonts } from '../lib/fonts';
import { tr } from '../i18n';

// Web デモ向けプレースホルダ。実機（ネイティブ）では AdBanner.native.tsx が選ばれる。
export function AdBanner() {
  return (
    <View style={[styles.wrap, styles.webPlaceholder]} accessibilityLabel={tr('広告枠', 'Ad slot')}>
      <Text style={styles.webPlaceholderText}>{tr('広告（実機で表示）', 'Ad (shows on device)')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: space.xs },
  webPlaceholder: {
    height: 60,
    backgroundColor: colors.surfaceSunken,
    borderTopWidth: rule.hair,
    borderBottomWidth: rule.hair,
    borderColor: colors.hairline,
  },
  webPlaceholderText: {
    color: colors.textFaint,
    fontSize: font.tiny,
    fontFamily: fonts.handle,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
