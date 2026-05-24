import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius } from '../theme';
import { REACTIONS } from '../copy';
import { ReactionType } from '../types';

// フィード用：6つのリアクションから1つ選ぶと、その投稿は「残した」に入り次へ進む。
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
            style={({ pressed }) => [
              styles.item,
              active && styles.itemActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.emoji}>{r.emoji}</Text>
            <Text style={[styles.label, active && styles.labelActive]}>{r.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,20,20,0.85)',
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 64,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  itemActive: { backgroundColor: colors.lime, borderColor: colors.lime },
  pressed: { opacity: 0.7 },
  emoji: { fontSize: 22 },
  label: { color: colors.white, fontSize: font.tiny, marginTop: 3, fontWeight: '700' },
  labelActive: { color: colors.black },
});
