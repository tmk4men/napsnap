import React, { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { colors, font, space } from '../theme';
import { TraceMark } from './icons';

// 全画面の写真表示用。読込中はインジケータ、失敗時は「読み込めない」を出す
// （Webデモは picsum/data URI/ブラウザ差で失敗しうるため、黒や空白で終わらせない）。
export function MediaImage({ uri, blurRadius }: { uri?: string; blurRadius?: number }) {
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');
  return (
    <>
      {uri && (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          blurRadius={blurRadius}
          onLoad={() => setState('ok')}
          onError={() => setState('error')}
        />
      )}
      {state !== 'ok' && (
        <View style={[StyleSheet.absoluteFill, styles.fill]} pointerEvents="none">
          {state === 'error' || !uri ? (
            <>
              <TraceMark size={40} color="rgba(255,255,255,0.38)" dot="rgba(255,255,255,0.5)" />
              <Text style={styles.text}>読み込めない</Text>
            </>
          ) : (
            <ActivityIndicator color={colors.onMediaDim} />
          )}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  fill: { backgroundColor: colors.surfaceMedia, alignItems: 'center', justifyContent: 'center', gap: space.xs },
  text: { color: colors.onMediaDim, fontSize: font.small, fontWeight: '700' },
});
