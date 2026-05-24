import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, space } from '../theme';
import { copy } from '../copy';
import { Avatar, GhostButton, Pill, PrimaryButton, useTick } from '../components/ui';
import { Nav } from '../navigation/nav';
import { useStore } from '../store';
import { currentUser, feedQueue, friendActivePostCount, isPassOpen } from '../selectors';
import { formatRemaining } from '../lib/time';

export function HomeScreen({ nav }: { nav: Nav }) {
  const insets = useSafeAreaInsets();
  useTick();

  const s = useStore();
  const open = isPassOpen(s);
  const queueCount = useMemo(() => feedQueue(s).length, [s.posts, s.feedStates, s.group, s.currentUserId]);
  const friendCount = useMemo(() => friendActivePostCount(s), [s.posts, s.group, s.currentUserId]);
  const me = currentUser(s);

  return (
    <View style={[styles.container, { paddingTop: insets.top + space.md }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>napsnap</Text>
          <Text style={styles.group}>{s.group?.name ?? ''}</Text>
        </View>
        <Avatar user={me} size={40} />
      </View>

      <View style={styles.center}>
        <View
          style={[
            styles.badge,
            { backgroundColor: open ? colors.lime : colors.surface },
          ]}
        >
          <Text style={[styles.badgeText, { color: open ? colors.black : colors.gray }]}>
            {open ? 'OPEN' : 'LOCKED'}
          </Text>
        </View>

        {open ? (
          <>
            <Text style={styles.title}>{copy.openTitle}</Text>
            <Text style={styles.sub}>
              友達の痕跡が見える。{'\n'}残り {formatRemaining(s.accessPass!.expiresAt)}。
            </Text>
            <View style={{ height: space.md }} />
            {queueCount > 0 ? (
              <Pill tone="lime">{queueCount}件の痕跡が待ってる</Pill>
            ) : (
              <Pill>{copy.feedDone}</Pill>
            )}
          </>
        ) : (
          <>
            <Text style={styles.title}>{copy.lockTitle}</Text>
            <Text style={styles.sub}>{copy.lockSub}</Text>
            <View style={{ height: space.md }} />
            {friendCount > 0 ? (
              <Pill tone="lime">{friendCount}人の痕跡が待ってる</Pill>
            ) : (
              <Pill>まだ誰も出してない</Pill>
            )}
          </>
        )}
      </View>

      <View style={{ paddingBottom: insets.bottom + space.md, gap: space.xs }}>
        {open && queueCount > 0 && (
          <PrimaryButton label={`痕跡を見る（${queueCount}）`} onPress={nav.openFeed} />
        )}
        {open && queueCount > 0 ? (
          <GhostButton label={copy.shootAgain} onPress={nav.openCamera} />
        ) : (
          <PrimaryButton label={copy.shoot} onPress={nav.openCamera} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black, paddingHorizontal: space.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { color: colors.lime, fontSize: font.body, fontWeight: '900', letterSpacing: 1 },
  group: { color: colors.gray, fontSize: font.small, marginTop: 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'flex-start' },
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: space.lg,
  },
  badgeText: { fontSize: font.tiny, fontWeight: '900', letterSpacing: 2 },
  title: { color: colors.white, fontSize: 52, fontWeight: '900', lineHeight: 56 },
  sub: { color: colors.gray, fontSize: font.lead, marginTop: space.md, lineHeight: font.lead * 1.5 },
});
