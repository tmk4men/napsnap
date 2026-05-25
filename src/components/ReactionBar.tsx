import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, rule } from '../theme';
import { REACTIONS } from '../copy';
import { ReactionType } from '../types';
import { ReactionIcon } from './icons';

// フィード用：1つ選ぶと「残した」に入り次へ進む。アイコンのみ。
// 押すと：ボタンがポップ＋同じアイコンがふわっと上に飛んで消える → 少し遅らせて次へ。
export function ReactionBar({
  onReact,
  selected,
}: {
  onReact: (type: ReactionType) => void;
  selected?: ReactionType;
}) {
  const firedRef = useRef(false);
  const handle = (type: ReactionType) => {
    if (firedRef.current) return;
    firedRef.current = true;
    // アニメを見せてから次へ
    setTimeout(() => onReact(type), 260);
  };
  return (
    <View style={styles.row}>
      {REACTIONS.map((r) => (
        <ReactionButton key={r.type} type={r.type} active={selected === r.type} onPress={() => handle(r.type)} />
      ))}
    </View>
  );
}

function ReactionButton({ type, active, onPress }: { type: ReactionType; active: boolean; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const burstY = useRef(new Animated.Value(0)).current;
  const burstScale = useRef(new Animated.Value(0.7)).current;
  const burstOpacity = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  const fire = () => {
    // ボタンのポップ
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.82, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 3.5, tension: 160, useNativeDriver: true }),
    ]).start();
    // 選択リングのパルス
    glow.setValue(0);
    Animated.timing(glow, { toValue: 1, duration: 420, useNativeDriver: true }).start();
    // 飛んでいくアイコン
    burstY.setValue(-2);
    burstScale.setValue(0.7);
    burstOpacity.setValue(0.95);
    Animated.parallel([
      Animated.timing(burstY, { toValue: -70, duration: 700, useNativeDriver: true }),
      Animated.timing(burstScale, { toValue: 1.8, duration: 700, useNativeDriver: true }),
      Animated.timing(burstOpacity, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Pressable onPress={fire} style={styles.slot}>
      {/* 飛ぶアイコン */}
      <Animated.View
        pointerEvents="none"
        style={[styles.burst, { opacity: burstOpacity, transform: [{ translateY: burstY }, { scale: burstScale }] }]}
      >
        <ReactionIcon type={type} size={30} color={colors.onMedia} />
      </Animated.View>

      <Animated.View style={[styles.item, active && styles.itemActive, { transform: [{ scale }] }]}>
        {/* パルスリング */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ring,
            {
              opacity: glow.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.5, 0] }),
              transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.5] }) }],
            },
          ]}
        />
        <ReactionIcon type={type} size={28} color={active ? colors.text : colors.onMedia} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  slot: { alignItems: 'center', justifyContent: 'center' },
  burst: { position: 'absolute', top: 0, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  item: {
    width: 56,
    height: 56,
    borderRadius: radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.mediaChip,
    borderWidth: rule.hair,
    borderColor: colors.mediaChipBorder,
  },
  itemActive: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: '#FFFFFF',
  },
  ring: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: radius.xs,
    borderWidth: rule.thin,
    borderColor: colors.onMedia,
  },
});
