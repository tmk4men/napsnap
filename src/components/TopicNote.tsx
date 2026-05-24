import React, { useState } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, font, space } from '../theme';
import { captionFont, fonts } from '../lib/fonts';

// 「ノートの切れ端に手書き」で今日のお題が書かれている感じのカード。
// 下端をギザギザに切り取り、赤い罫線・うっすら横罫・washi テープを足して紙っぽく。

function tornPath(w: number, teeth: number, depth: number, h: number): string {
  const step = w / teeth;
  let d = `M 0 ${depth} `;
  for (let i = 0; i < teeth; i++) {
    const mid = step * (i + 0.5);
    const end = step * (i + 1);
    d += `L ${mid.toFixed(1)} 0 L ${end.toFixed(1)} ${depth} `;
  }
  d += `L ${w} ${h} L 0 ${h} Z`;
  return d;
}

export function TopicNote({
  prompt,
  kicker = '今日のお題',
  bg = colors.bg,
  style,
}: {
  prompt: string;
  kicker?: string;
  bg?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const [w, setW] = useState(0);
  const hand = captionFont('hand');
  const tornH = 16;
  const depth = 9;

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.paper} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        {/* washi テープ */}
        <View style={styles.tape} />
        {/* 赤い縦の余白線 */}
        <View style={styles.margin} />

        <Text style={styles.kicker}>{kicker}</Text>
        <Text style={[styles.prompt, { fontFamily: hand.family, fontWeight: hand.weight }]}>{prompt}</Text>
        <View style={styles.rule} />

        {/* 下端の切り取り（ギザギザ） */}
        {w > 0 && (
          <Svg width={w} height={tornH} style={styles.torn}>
            <Path d={tornPath(w, Math.max(10, Math.round(w / 16)), depth, tornH)} fill={bg} />
          </Svg>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', transform: [{ rotate: '-1.4deg' }] },
  paper: {
    width: '100%',
    backgroundColor: '#FFFDF4',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    paddingTop: space.md,
    paddingBottom: space.lg + 6,
    paddingLeft: space.lg + 8,
    paddingRight: space.lg,
    boxShadow: '0 10px 22px rgba(44,36,22,0.16)',
    overflow: 'hidden',
  },
  tape: {
    position: 'absolute',
    top: -7,
    alignSelf: 'center',
    width: 78,
    height: 20,
    backgroundColor: 'rgba(207,234,69,0.30)',
    borderWidth: 1,
    borderColor: 'rgba(150,168,63,0.25)',
    transform: [{ rotate: '-2.5deg' }],
  },
  margin: {
    position: 'absolute',
    left: 16,
    top: 0,
    bottom: 0,
    width: 1.5,
    backgroundColor: 'rgba(217,71,63,0.35)',
  },
  kicker: { color: colors.textDim, fontSize: font.small, fontWeight: '800', fontFamily: fonts.ui, marginBottom: 2 },
  prompt: { color: colors.text, fontSize: 30, lineHeight: 38 },
  rule: { height: 1, backgroundColor: 'rgba(23,23,19,0.10)', marginTop: 8 },
  torn: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
