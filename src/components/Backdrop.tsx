import React, { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Svg, { Defs, FeColorMatrix, FeTurbulence, Filter, RadialGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../theme';

// 画面に“紙の空気感”を足す背景。あたたかな放射グラデ＋うっすらフィルムグレイン。
// react-native-svg は Web では本物の SVG を描くので feTurbulence のグレインも効く
// （ベタ塗りの平面さ＝安っぽさを消す）。ネイティブはグラデのみ。
export function Backdrop({ grain = true }: { grain?: boolean }) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {size.w > 0 && (
        <Svg width={size.w} height={size.h}>
          <Defs>
            <RadialGradient id="napWarm" cx="50%" cy="22%" rx="92%" ry="78%">
              <Stop offset="0" stopColor="#FFFEFA" />
              <Stop offset="0.5" stopColor={colors.bg} />
              <Stop offset="1" stopColor="#EBDCB6" />
            </RadialGradient>
            <Filter id="napGrain">
              <FeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} stitchTiles="stitch" />
              <FeColorMatrix type="saturate" values="0" />
            </Filter>
          </Defs>
          <Rect x={0} y={0} width={size.w} height={size.h} fill="url(#napWarm)" />
          {grain && Platform.OS === 'web' && (
            <Rect {...({ filter: 'url(#napGrain)' } as any)} x={0} y={0} width={size.w} height={size.h} opacity={0.07} />
          )}
        </Svg>
      )}
    </View>
  );
}
