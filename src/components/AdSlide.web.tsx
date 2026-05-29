import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, font, rule, space } from '../theme';
import { fonts } from '../lib/fonts';
import { tr } from '../i18n';
import { ADS_ENABLED } from '../config';

// 縦スワイプに差し込む広告スライド（Web プレースホルダ）。実機は AdSlide.native.tsx。
export function AdSlide({ width }: { width: number }) {
  if (!ADS_ENABLED) return null;
  const w = Math.min(width, 320);
  return (
    <View style={styles.wrap}>
      <Text style={styles.kicker}>{tr('広告', 'Ad')}</Text>
      <View style={[styles.box, { width: w, height: Math.round(w * 0.83) }]}>
        <Text style={styles.placeholder}>{tr('広告（実機で表示）', 'Ad (shows on device)')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: space.sm },
  kicker: { color: colors.textFaint, fontSize: font.tiny, fontFamily: fonts.handle, letterSpacing: 2, textTransform: 'uppercase' },
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSunken,
    borderWidth: rule.hair,
    borderColor: colors.hairline,
  },
  placeholder: { color: colors.textFaint, fontSize: font.small, fontFamily: fonts.handle },
});
