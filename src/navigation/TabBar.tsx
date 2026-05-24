import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, space } from '../theme';
import { tabs } from '../copy';
import { TabKey } from './nav';
import { Avatar } from '../components/ui';
import { BookmarkIcon, WindowIcon } from '../components/icons';
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
    <View style={[styles.bar, { paddingBottom: insets.bottom + space.xs }]}>
      <Tab label={tabs.home} active={active === 'home'} onPress={() => onChange('home')}>
        <WindowIcon size={23} color={active === 'home' ? colors.text : colors.textFaint} />
      </Tab>

      <Tab label={tabs.kept} active={active === 'kept'} onPress={() => onChange('kept')}>
        <View>
          <BookmarkIcon size={23} color={active === 'kept' ? colors.text : colors.textFaint} filled={active === 'kept'} />
          {keptCount > 0 && (
            <View style={styles.dot}>
              <Text style={styles.dotText}>{keptCount}</Text>
            </View>
          )}
        </View>
      </Tab>

      <Tab label={tabs.me} active={active === 'me'} onPress={() => onChange('me')}>
        <Avatar user={me} size={24} ring={active === 'me'} />
      </Tab>
    </View>
  );
}

function Tab({
  children,
  label,
  active,
  onPress,
}: {
  children: React.ReactNode;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.item, pressed && { opacity: 0.6 }]}>
      <View style={styles.iconBox}>{children}</View>
      <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
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
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  iconBox: { height: 24, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: font.tiny, color: colors.textFaint, fontWeight: '700', letterSpacing: 0.3 },
  activeLabel: { color: colors.text },
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
