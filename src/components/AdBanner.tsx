import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { space } from '../theme';
import { adUnitIds } from '../lib/ads';

// 実機（iOS/Android）用のバナー広告。Web は AdBanner.web.tsx が選ばれる。
export function AdBanner() {
  return (
    <View style={styles.wrap}>
      <BannerAd
        unitId={adUnitIds.banner}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: space.xs },
});
