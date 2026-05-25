import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '../theme';

// 録音中に出すシンプルな波形アニメ（「録音中」みたいな説明文の代わり）。
export function Waveform({ color = colors.lime, bars = 7 }: { color?: string; bars?: number }) {
  const vals = useRef(Array.from({ length: bars }, () => new Animated.Value(0.3))).current;

  useEffect(() => {
    const anims = vals.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 90),
          Animated.timing(v, { toValue: 1, duration: 320, useNativeDriver: false }),
          Animated.timing(v, { toValue: 0.25, duration: 320, useNativeDriver: false }),
        ])
      )
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, []);

  return (
    <View style={styles.row}>
      {vals.map((v, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              backgroundColor: color,
              transform: [{ scaleY: v }],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', height: 56, gap: 6 },
  bar: { width: 6, height: 56, borderRadius: 0 },
});
