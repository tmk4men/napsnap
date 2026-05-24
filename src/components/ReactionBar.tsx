import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius } from '../theme';
import { REACTIONS } from '../copy';
import { ReactionType } from '../types';
import { ReactionIcon } from './icons';

// フィード用：3つのリアクションから1つ選ぶと、その投稿は「残した」に入り次へ進む。
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
            <ReactionIcon type={r.type} size={26} color={active ? colors.limeInk : colors.onMedia} />
            <Text style={[styles.label, active && styles.labelActive]}>{r.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,20,20,0.85)',
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 18,
    minWidth: 82,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 5,
  },
  itemActive: { backgroundColor: colors.lime, borderColor: colors.lime },
  pressed: { opacity: 0.7, transform: [{ scale: 0.96 }] },
  label: { color: colors.onMedia, fontSize: font.tiny, fontWeight: '800' },
  labelActive: { color: colors.limeInk },
});
