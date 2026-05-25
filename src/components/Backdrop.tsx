import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../theme';

// 号外の地＝生成りの新聞紙。放射グラデもフィルムグレインも使わない（あれ自体がもう手垢のついた手法）。
// 紙の“死んだ平面さ”だけ避けるため、上が紙一枚ぶん明るい極薄の縦グラデだけ敷く（印刷台の光）。
// grain prop は互換のため残すが無視する。
export function Backdrop({ grain }: { grain?: boolean }) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]}
      pointerEvents="none"
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {size.w > 0 && (
        <Svg width={size.w} height={size.h}>
          <Defs>
            <LinearGradient id="napPaper" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#F5F1E7" />
              <Stop offset="0.55" stopColor={colors.bg} />
              <Stop offset="1" stopColor="#E9E2D2" />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={size.w} height={size.h} fill="url(#napPaper)" />
        </Svg>
      )}
    </View>
  );
}
