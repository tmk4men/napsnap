import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, rule, space } from '../theme';
import { TabKey } from './nav';
import { Avatar } from '../components/ui';
import { BookmarkIcon, HouseIcon, NoteIcon, SearchIcon } from '../components/icons';
import { User } from '../types';

export function TabBar({
  active,
  onChange,
  keptCount,
  me,
}: {
  active: TabKey;
  onChange: (t: TabKey) => void;
  keptCount: number;
  me?: User;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + space.sm }]}>
      <Tab active={active === 'home'} onPress={() => onChange('home')}>
        <HouseIcon size={24} color={active === 'home' ? colors.text : colors.textFaint} />
      </Tab>

      <Tab active={active === 'topic'} onPress={() => onChange('topic')}>
        <NoteIcon size={24} color={active === 'topic' ? colors.text : colors.textFaint} filled={active === 'topic'} />
      </Tab>

      <Tab active={active === 'kept'} onPress={() => onChange('kept')}>
        <View>
          <BookmarkIcon size={23} color={active === 'kept' ? colors.text : colors.textFaint} filled={active === 'kept'} />
          {keptCount > 0 && (
            <View style={styles.dot}>
              <Text style={styles.dotText}>{keptCount}</Text>
            </View>
          )}
        </View>
      </Tab>

      <Tab active={active === 'search'} onPress={() => onChange('search')}>
        <SearchIcon size={23} color={active === 'search' ? colors.text : colors.textFaint} />
      </Tab>

      <Tab active={active === 'me'} onPress={() => onChange('me')}>
        <Avatar user={me} size={28} ring={active === 'me'} />
      </Tab>
    </View>
  );
}

function Tab({ children, active, onPress }: { children: React.ReactNode; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.item, pressed && { opacity: 0.6 }]}>
      <View style={[styles.marker, active && styles.markerActive]} />
      <View style={styles.iconBox}>{children}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderTopWidth: rule.thick,
    borderTopColor: colors.text, // 紙面の下端＝太罫
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'flex-start' },
  // アクティブは“節見出し”の朱の太罫で示す（角丸の塗りカードにしない）
  marker: { width: 26, height: rule.thick, backgroundColor: 'transparent', marginBottom: 8 },
  markerActive: { backgroundColor: colors.lime },
  iconBox: { width: 54, height: 32, alignItems: 'center', justifyContent: 'center' },
  dot: {
    position: 'absolute',
    top: -6,
    right: -11,
    backgroundColor: colors.lime,
    minWidth: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: rule.hair,
    borderColor: colors.bg,
  },
  dotText: { fontSize: 9, fontWeight: '700', color: colors.limeInk },
});
