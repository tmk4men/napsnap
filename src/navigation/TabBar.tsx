import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, space } from '../theme';
import { TabKey } from './nav';
import { Avatar } from '../components/ui';
import { BookmarkIcon, HouseIcon } from '../components/icons';
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
      <Tab onPress={() => onChange('home')}>
        <HouseIcon size={25} color={active === 'home' ? colors.text : colors.textFaint} />
      </Tab>

      <Tab onPress={() => onChange('kept')}>
        <View>
          <BookmarkIcon size={24} color={active === 'kept' ? colors.text : colors.textFaint} filled={active === 'kept'} />
          {keptCount > 0 && (
            <View style={styles.dot}>
              <Text style={styles.dotText}>{keptCount}</Text>
            </View>
          )}
        </View>
      </Tab>

      <Tab onPress={() => onChange('me')}>
        <Avatar user={me} size={26} ring={active === 'me'} />
      </Tab>
    </View>
  );
}

function Tab({ children, onPress }: { children: React.ReactNode; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.item, pressed && { opacity: 0.6 }]}>
      <View style={styles.iconBox}>{children}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    paddingTop: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  iconBox: { height: 28, alignItems: 'center', justifyContent: 'center' },
  dot: {
    position: 'absolute',
    top: -5,
    right: -11,
    backgroundColor: colors.lime,
    borderRadius: radius.pill,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.bg,
  },
  dotText: { fontSize: 10, fontWeight: '900', color: colors.limeInk },
});
