import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius } from '../theme';
import { REACTIONS } from '../copy';
import { ReactionType } from '../types';
import { ReactionIcon } from './icons';

// フィード用：3つのリアクションから1つ選ぶと、その投稿は「残した」に入り次へ進む。
// 写真の上に置くので、暗いスクリム調のセグメント＋選択時はライムを“点灯”させる。
export function ReactionBar({
  onReact,
  selected,
}: {
  onReact: (type: ReactionType) => void;
  selected?: ReactionType;
}) {
  return (
    <View style={styles.row}>
      {REACTIONS.map((r) => {
        const active = selected === r.type;
        return (
          <Pressable
            key={r.type}
            onPress={() => onReact(r.type)}
            style={({ pressed }) => [styles.item, active && styles.itemActive, pressed && styles.pressed]}
          >
            <ReactionIcon type={r.type} size={24} color={active ? colors.lime : colors.onMedia} />
            <Text style={[styles.label, active && styles.labelActive]}>{r.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  item: {
    flex: 1,
    maxWidth: 116,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(18,17,14,0.55)',
    borderRadius: radius.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.mediaChipBorder,
    gap: 5,
  },
  itemActive: {
    backgroundColor: 'rgba(217,247,74,0.16)',
    borderColor: 'rgba(217,247,74,0.55)',
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.96 }] },
  label: { color: colors.onMediaDim, fontSize: font.tiny, fontWeight: '800', letterSpacing: 0.3 },
  labelActive: { color: colors.lime },
});
