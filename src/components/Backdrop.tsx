import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';

// 地＝白（Twitter/Instagram のようなクリーンな白黒）。グラデもグレインも使わずフラットな白。
// grain prop は互換のため残すが無視する。
export function Backdrop({ grain }: { grain?: boolean }) {
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]} pointerEvents="none" />;
}
