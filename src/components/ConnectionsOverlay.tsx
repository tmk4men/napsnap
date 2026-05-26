import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, rule, space } from '../theme';
import { fonts } from '../lib/fonts';
import { Avatar, FadeIn } from './ui';
import { CloseIcon, SearchIcon, TraceMark, VerifiedBadge } from './icons';
import { User } from '../types';

type Tab = 'following' | 'followers';

// 自分タブの「フォロー中／フォロワー」をタップしたときに出る一覧。@IDや名前で検索できる。
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
  const [q, setQ] = useState('');

  const base = tab === 'following' ? following : followers;
  const query = q.trim().replace(/^@/, '').toLowerCase();
  const list = query
    ? base.filter((u) => u.handle.toLowerCase().includes(query) || u.displayName.toLowerCase().includes(query))
    : base;

  return (
    <FadeIn style={styles.container} dy={16} duration={220}>
      <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
        <View style={styles.tabs}>
          <Pressable onPress={() => setTab('following')} style={[styles.tab, tab === 'following' && styles.tabActive]}>
            <Text style={[styles.tabText, tab === 'following' && styles.tabTextActive]}>フォロー {following.length}</Text>
          </Pressable>
          <Pressable onPress={() => setTab('followers')} style={[styles.tab, tab === 'followers' && styles.tabActive]}>
            <Text style={[styles.tabText, tab === 'followers' && styles.tabTextActive]}>フォロワー {followers.length}</Text>
          </Pressable>
        </View>
        <Pressable onPress={onClose} style={styles.close} hitSlop={12}>
          <CloseIcon size={18} color={colors.text} />
        </Pressable>
      </View>

      {/* @IDや名前で検索 */}
      <View style={styles.searchWrap}>
        <SearchIcon size={17} color={colors.textFaint} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="@IDや名前でさがす"
          placeholderTextColor={colors.textFaint}
          autoCapitalize="none"
          style={styles.searchInput}
        />
        {q.length > 0 && (
          <Pressable onPress={() => setQ('')} hitSlop={10}>
            <CloseIcon size={15} color={colors.textFaint} />
          </Pressable>
        )}
      </View>

      {list.length === 0 ? (
        <View style={styles.empty}>
          <TraceMark size={44} />
          <Text style={styles.emptyText}>
            {query ? '見つからない' : tab === 'following' ? 'まだ誰もフォローしてない' : 'まだフォロワーがいない'}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: insets.bottom + space.xl }} showsVerticalScrollIndicator={false}>
          {list.map((p) => {
            const on = isFollowing(p.id);
            return (
              <View key={p.id} style={styles.row}>
                <Avatar user={p} size={44} />
                <View style={{ flex: 1, marginLeft: space.md }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{p.displayName}</Text>
                    {p.isOfficial && <VerifiedBadge size={14} />}
                  </View>
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
    </FadeIn>
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
  },
  tabs: { flexDirection: 'row', gap: 4, flex: 1, backgroundColor: colors.surfaceSunken, borderRadius: radius.xs, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: radius.xs, alignItems: 'center', borderWidth: rule.hair, borderColor: 'transparent' },
  tabActive: { backgroundColor: colors.surfaceRaised, borderColor: colors.hairline },
  tabText: { color: colors.textDim, fontSize: font.small, fontWeight: '700', fontFamily: fonts.ui },
  tabTextActive: { color: colors.text },
  close: { width: 36, height: 36, borderRadius: radius.xs, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSunken },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: space.md,
    marginBottom: space.sm,
    paddingHorizontal: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xs,
    borderWidth: rule.hair,
    borderColor: colors.hairline,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: font.body, fontWeight: '600', fontFamily: fonts.ui, paddingVertical: 11 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.sm, padding: space.xl },
  emptyText: { color: colors.textDim, fontSize: font.body, fontWeight: '700', fontFamily: fonts.ui },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: rule.hair,
    borderBottomColor: colors.hairline,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name: { color: colors.text, fontSize: font.body, fontWeight: '700', fontFamily: fonts.name },
  handle: { color: colors.textDim, fontSize: font.small, marginTop: 2, fontFamily: fonts.handle, letterSpacing: 0.2 },
  // フォロー＝黒ベタ（CTA）／フォロー中＝枠線（X・IG の作法）
  followBtn: {
    borderRadius: radius.xs,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.lime,
    borderWidth: rule.hair,
    borderColor: colors.limeDust,
  },
  followBtnOn: { backgroundColor: 'transparent', borderColor: colors.text },
  followText: { color: colors.limeInk, fontSize: font.small, fontWeight: '700', fontFamily: fonts.ui },
  followTextOn: { color: colors.text },
});
