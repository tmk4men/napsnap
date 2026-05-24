import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, shadow, space } from '../theme';
import { fonts } from '../lib/fonts';
import { Avatar } from './ui';
import { CloseIcon, TraceMark } from './icons';
import { User } from '../types';

type Tab = 'following' | 'followers';

// 自分タブの「フォロー中／フォロワー」をタップしたときに出る一覧。
export function ConnectionsOverlay({
  initial,
  following,
  followers,
  isFollowing,
  onToggle,
  onClose,
}: {
  initial: Tab;
  following: User[];
  followers: User[];
  isFollowing: (id: string) => boolean;
  onToggle: (id: string) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>(initial);
  const list = tab === 'following' ? following : followers;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
        <View style={styles.tabs}>
          <Pressable onPress={() => setTab('following')} style={[styles.tab, tab === 'following' && styles.tabActive]}>
            <Text style={[styles.tabText, tab === 'following' && styles.tabTextActive]}>フォロー中 {following.length}</Text>
          </Pressable>
          <Pressable onPress={() => setTab('followers')} style={[styles.tab, tab === 'followers' && styles.tabActive]}>
            <Text style={[styles.tabText, tab === 'followers' && styles.tabTextActive]}>フォロワー {followers.length}</Text>
          </Pressable>
        </View>
        <Pressable onPress={onClose} style={styles.close} hitSlop={12}>
          <CloseIcon size={18} color={colors.text} />
        </Pressable>
      </View>

      {list.length === 0 ? (
        <View style={styles.empty}>
          <TraceMark size={44} />
          <Text style={styles.emptyText}>{tab === 'following' ? 'まだ誰もフォローしてない' : 'まだフォロワーがいない'}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: insets.bottom + space.xl }} showsVerticalScrollIndicator={false}>
          {list.map((p) => {
            const on = isFollowing(p.id);
            return (
              <View key={p.id} style={styles.row}>
                <Avatar user={p} size={44} />
                <View style={{ flex: 1, marginLeft: space.md }}>
                  <Text style={styles.name}>{p.displayName}</Text>
                  <Text style={styles.handle}>@{p.handle}</Text>
                </View>
                <Pressable
                  onPress={() => onToggle(p.id)}
                  style={({ pressed }) => [styles.followBtn, on && styles.followBtnOn, pressed && { opacity: 0.8 }]}
                >
                  <Text style={[styles.followText, on && styles.followTextOn]}>{on ? 'フォロー中' : 'フォロー'}</Text>
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingBottom: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  tabs: { flexDirection: 'row', gap: 4, flex: 1, backgroundColor: colors.surfaceSunken, borderRadius: radius.pill, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: radius.pill, alignItems: 'center' },
  tabActive: { backgroundColor: colors.surfaceRaised, boxShadow: shadow.chip },
  tabText: { color: colors.textDim, fontSize: font.small, fontWeight: '800', fontFamily: fonts.ui },
  tabTextActive: { color: colors.text },
  close: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSunken },
  closeText: { color: colors.text, fontSize: 18, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.sm, padding: space.xl },
  emptyText: { color: colors.textDim, fontSize: font.body, fontWeight: '700', fontFamily: fonts.ui },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  name: { color: colors.text, fontSize: font.body, fontWeight: '800', fontFamily: fonts.ui },
  handle: { color: colors.textDim, fontSize: font.small, marginTop: 1, fontFamily: fonts.ui },
  followBtn: {
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.line,
  },
  followBtnOn: { backgroundColor: colors.lime, borderColor: colors.lime },
  followText: { color: colors.textDim, fontSize: font.small, fontWeight: '800' },
  followTextOn: { color: colors.limeInk },
});
