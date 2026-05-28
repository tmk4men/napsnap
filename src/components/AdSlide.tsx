import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { colors, font, space } from '../theme';
import { fonts } from '../lib/fonts';
import { adUnitIds } from '../lib/ads';

// 縦スワイプに差し込む広告スライド（実機）。300x250 のミディアムレクタングルを1枚のカード風に。
export function AdSlide(_props: { width: number }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.kicker}>広告</Text>
      <BannerAd
        unitId={adUnitIds.banner}
        size={BannerAdSize.MEDIUM_RECTANGLE}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: space.sm },
  kicker: { color: colors.textFaint, fontSize: font.tiny, fontFamily: fonts.handle, letterSpacing: 2, textTransform: 'uppercase' },
});
