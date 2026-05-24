import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../theme';
import { REACTIONS } from '../copy';
import { ReactionType } from '../types';
import { ReactionIcon } from './icons';

// フィード用：3つのリアクションから1つ選ぶと、その投稿は「残した」に入り次へ進む。
// アイコンのみ（ラベルなし）。選択時はライムを点灯させる。
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
            <ReactionIcon type={r.type} size={28} color={active ? colors.lime : colors.onMedia} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  item: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(18,17,14,0.55)',
    borderWidth: 1,
    borderColor: colors.mediaChipBorder,
  },
  itemActive: {
    backgroundColor: 'rgba(217,247,74,0.18)',
    borderColor: 'rgba(217,247,74,0.6)',
    boxShadow: '0 8px 20px rgba(217,247,74,0.18)',
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.92 }] },
});
