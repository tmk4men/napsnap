import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, font, space } from '../theme';
import { fonts } from '../lib/fonts';
import { Avatar } from './ui';
import { VerifiedBadge } from './icons';
import { ChekiCard } from './ChekiCard';
import { lifeImage } from '../lib/images';
import { User } from '../types';

// napsnap公式の「お手本／案内」投稿。空状態でも、他のユーザーの投稿と同じ見た目
// （チェキ写真＋投稿者の行）で「投稿とはこういうもの」を見せる導線にする。
// message は写真の下に出す一言。mosaic=true は解除されない常時モザイク（お題タブ用）。
export function OfficialCard({
  official,
  message,
  width,
  seed,
  mosaic = false,
}: {
  official?: User;
  message: string;
  width: number;
  seed: string;
  mosaic?: boolean;
}) {
  if (width <= 0) return null;
  return (
    <View style={styles.wrap}>
      <ChekiCard uri={lifeImage(seed)} width={width} blur={mosaic} tiltSeed={seed} />
      <View style={styles.meta}>
        <Avatar user={official} size={26} />
        <Text style={styles.name}>napsnap</Text>
        <VerifiedBadge size={15} />
      </View>
      <Text style={styles.msg}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: space.sm },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  name: { color: colors.text, fontSize: font.lead, fontWeight: '700', fontFamily: fonts.serif, letterSpacing: 0 },
  msg: {
    color: colors.text,
    fontSize: 21,
    lineHeight: 30,
    fontFamily: fonts.serif,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
});
