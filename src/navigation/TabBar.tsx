import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, space } from '../theme';
import { tabs } from '../copy';
import { TabKey } from './nav';

const ITEMS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'home', label: tabs.home, icon: '◐' },
  { key: 'kept', label: tabs.kept, icon: '✦' },
  { key: 'me', label: tabs.me, icon: '●' },
];

export function TabBar({
  active,
  onChange,
  keptCount,
}: {
  active: TabKey;
  onChange: (t: TabKey) => void;
  keptCount: number;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + space.xs }]}>
      {ITEMS.map((it) => {
        const isActive = active === it.key;
        return (
          <Pressable key={it.key} onPress={() => onChange(it.key)} style={styles.item}>
            <View>
              <Text style={[styles.icon, isActive && styles.activeIcon]}>{it.icon}</Text>
              {it.key === 'kept' && keptCount > 0 && (
                <View style={styles.dot}>
                  <Text style={styles.dotText}>{keptCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.label, isActive && styles.activeLabel]}>{it.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.ink,
    paddingTop: space.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  icon: { fontSize: 20, color: colors.grayDim },
  activeIcon: { color: colors.lime },
  label: { fontSize: font.tiny, color: colors.grayDim, fontWeight: '700' },
  activeLabel: { color: colors.white },
  dot: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: colors.lime,
    borderRadius: radius.pill,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  dotText: { fontSize: 10, fontWeight: '900', color: colors.black },
});
