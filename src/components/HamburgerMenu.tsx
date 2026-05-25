import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, rule, shadow, space } from '../theme';
import { fonts } from '../lib/fonts';
import { FadeIn } from './ui';

export interface MenuItem {
  label: string;
  onPress: () => void;
  danger?: boolean;
}

// ホーム右上のハンバーガーから出る、右上アンカーのドロップダウン。
export function HamburgerMenu({ items, onClose }: { items: MenuItem[]; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <FadeIn style={[styles.panel, { top: insets.top + 60 }]} dy={-6} duration={150}>
        {items.map((it, i) => (
          <Pressable
            key={i}
            onPress={() => {
              onClose();
              it.onPress();
            }}
            style={({ pressed }) => [styles.item, pressed && { backgroundColor: colors.surfaceSunken }, i > 0 && styles.itemBorder]}
          >
            <Text style={[styles.itemText, it.danger && { color: colors.warn }]}>{it.label}</Text>
          </Pressable>
        ))}
      </FadeIn>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.10)' },
  panel: {
    position: 'absolute',
    right: space.lg,
    minWidth: 196,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xs,
    borderWidth: rule.hair,
    borderColor: colors.hairline,
    boxShadow: shadow.card,
    paddingVertical: space.xxs,
    overflow: 'hidden',
  },
  item: { paddingHorizontal: space.md, paddingVertical: 14 },
  itemBorder: { borderTopWidth: rule.hair, borderTopColor: colors.hairline },
  itemText: { color: colors.text, fontSize: font.body, fontWeight: '700', fontFamily: fonts.ui },
});
