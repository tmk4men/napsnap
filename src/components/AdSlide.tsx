import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import {
  NativeAd,
  NativeAdView,
  NativeAsset,
  NativeAssetType,
  NativeMediaView,
} from 'react-native-google-mobile-ads';
import { colors, font, radius, rule, space } from '../theme';
import { fonts } from '../lib/fonts';
import { tr } from '../i18n';
import { adUnitIds } from '../lib/ads';
import { ADS_ENABLED } from '../config';

// 縦スワイプに差し込むネイティブ アドバンス広告（実機）。投稿カード風に組んでフィードに馴染ませる。
// AdMob ポリシー：広告であることの明示（「広告」バッジ）が必須。AdChoices は SDK が右上に重ねるので右上は空ける。
export function AdSlide({ width }: { width: number }) {
  const [ad, setAd] = useState<NativeAd | null>(null);

  useEffect(() => {
    if (!ADS_ENABLED) return;
    let alive = true;
    let loaded: NativeAd | null = null;
    NativeAd.createForAdRequest(adUnitIds.native, { requestNonPersonalizedAdsOnly: false })
      .then((nativeAd) => {
        loaded = nativeAd;
        if (alive) setAd(nativeAd);
        else nativeAd.destroy(); // アンマウント後に解決したら破棄
      })
      .catch(() => {});
    return () => {
      alive = false;
      loaded?.destroy();
    };
  }, []);

  if (!ADS_ENABLED || !ad) return null;

  const w = Math.min(width, 360);

  return (
    <View style={[styles.wrap, { width: w }]}>
      <NativeAdView nativeAd={ad} style={styles.card}>
        {/* ヘッダ：アイコン＋見出し＋「広告」バッジ（右上は AdChoices 用に余白を確保） */}
        <View style={styles.header}>
          {ad.icon?.url ? (
            <NativeAsset assetType={NativeAssetType.ICON}>
              <Image source={{ uri: ad.icon.url }} style={styles.icon} />
            </NativeAsset>
          ) : null}
          <View style={styles.headText}>
            <NativeAsset assetType={NativeAssetType.HEADLINE}>
              <Text style={styles.headline} numberOfLines={2}>
                {ad.headline}
              </Text>
            </NativeAsset>
            {ad.advertiser ? (
              <NativeAsset assetType={NativeAssetType.ADVERTISER}>
                <Text style={styles.advertiser} numberOfLines={1}>
                  {ad.advertiser}
                </Text>
              </NativeAsset>
            ) : null}
          </View>
          <Text style={styles.badge}>{tr('広告', 'Ad')}</Text>
        </View>

        {/* メイン画像/動画 */}
        <NativeMediaView style={styles.media} resizeMode="cover" />

        {/* 本文（あれば） */}
        {ad.body ? (
          <NativeAsset assetType={NativeAssetType.BODY}>
            <Text style={styles.body} numberOfLines={2}>
              {ad.body}
            </Text>
          </NativeAsset>
        ) : null}

        {/* CTA（ポリシー上 Touchable で包まず、Text を直接アセットに置く） */}
        {ad.callToAction ? (
          <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
            <Text style={styles.cta}>{ad.callToAction}</Text>
          </NativeAsset>
        ) : null}
      </NativeAdView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'stretch' },
  card: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: rule.hair,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    padding: space.sm,
    gap: space.sm,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: space.xs },
  icon: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.surfaceSunken },
  headText: { flex: 1, gap: 2 },
  headline: { color: colors.text, fontSize: font.body, fontFamily: fonts.handle, fontWeight: '700' },
  advertiser: { color: colors.textDim, fontSize: font.small, fontFamily: fonts.handle },
  // 「広告」バッジ。AdChoices と重ならないよう本文側の左に置く小ラベル。
  badge: {
    color: colors.textFaint,
    fontSize: font.tiny,
    fontFamily: fonts.handle,
    letterSpacing: 1,
    borderWidth: rule.hair,
    borderColor: colors.hairline,
    borderRadius: radius.xs,
    paddingHorizontal: 5,
    paddingVertical: 1,
    overflow: 'hidden',
    marginRight: space.md, // 右上の AdChoices 用に余白
  },
  media: { width: '100%', aspectRatio: 1.2, backgroundColor: colors.surfaceSunken, borderRadius: radius.sm },
  body: { color: colors.textDim, fontSize: font.small, fontFamily: fonts.handle, lineHeight: 18 },
  cta: {
    alignSelf: 'flex-start',
    color: colors.limeInk,
    backgroundColor: colors.lime,
    fontSize: font.small,
    fontFamily: fonts.handle,
    fontWeight: '700',
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
});
