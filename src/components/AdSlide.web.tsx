import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, font, rule, space } from '../theme';
import { fonts } from '../lib/fonts';

// 縦スワイプに差し込む広告スライド（Web プレースホルダ）。実機は AdSlide.native.tsx。
export function AdSlide({ width }: { width: number }) {
  const w = Math.min(width, 320);
  return (
    <View style={styles.wrap}>
      <Text style={styles.kicker}>広告</Text>
      <View style={[styles.box, { width: w, height: Math.round(w * 0.83) }]}>
        <Text style={styles.placeholder}>広告（実機で表示）</Text>
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
