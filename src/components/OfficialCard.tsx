import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, font, space } from '../theme';
import { fonts } from '../lib/fonts';
import { Avatar } from './ui';
import { VerifiedBadge } from './icons';
import { ChekiCard } from './ChekiCard';
import { officialPhotoUri } from '../lib/images';
import { User } from '../types';

// napsnap公式の「お手本／案内」投稿。空状態でも、他のユーザーの投稿と同じ見た目
// （チェキ写真＋投稿者の行）で「投稿とはこういうもの」を見せる導線にする。
// 写真は固定プールから1枚ランダム（OFFICIAL_PHOTO_SEEDS）。マウント中は固定でチラつかない。
// message は写真の下に出す一言。mosaic=true は解除されない常時モザイク（お題タブ用）。
export function OfficialCard({
  official,
  message,
  width,
  mosaic = false,
}: {
  official?: User;
  message: string;
  width: number;
  mosaic?: boolean;
}) {
  // 同梱画像から1枚をランダム。URIに解決済みなのでネット越しの取得は発生しない＝オフラインでも常に出る。
  const uri = useMemo(officialPhotoUri, []);
  if (width <= 0) return null;
  return (
    <View style={styles.wrap}>
      {/* 一言は写真の下余白（チェキの白いキャプション欄）に。モザイク時も写真だけ伏せ、文字は読める。 */}
      <ChekiCard
        uri={uri}
        caption={{ text: message, fontKey: 'mincho', color: colors.text, x: 0.5, y: 0.85 }}
        captionLines={2}
        width={width}
        blur={mosaic}
        tiltSeed={uri}
      />
      <View style={styles.meta}>
        <Avatar user={official} size={26} />
        <Text style={styles.name}>napsnap</Text>
        <VerifiedBadge size={15} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: space.sm },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  name: { color: colors.text, fontSize: font.lead, fontWeight: '700', fontFamily: fonts.serif, letterSpacing: 0 },
});
