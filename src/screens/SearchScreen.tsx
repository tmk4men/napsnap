import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, space } from '../theme';
import { fonts } from '../lib/fonts';
import { Avatar } from '../components/ui';
import { CloseIcon, SearchIcon, TraceMark } from '../components/icons';
import { useStore } from '../store';

// @ID でユーザーを探してフォローする専用タブ。
// ・検索は @ID のみ（名前は被るため）。
// ・すでにフォロー中の人は出さない。
// ・検索履歴は最大4件。各履歴は × で消せる。
export function SearchScreen() {
  const insets = useSafeAreaInsets();
  const s = useStore();
  const toggleFollow = useStore((st) => st.toggleFollow);
  const addSearchHistory = useStore((st) => st.addSearchHistory);
  const removeSearchHistory = useStore((st) => st.removeSearchHistory);
  const [q, setQ] = useState('');

  // フォロー中・自分・公式は出さない（探す＝まだ繋がってない人）。
  const candidates = s.users.filter((u) => u.isMock && !s.following.includes(u.id));
  const query = q.trim().replace(/^@/, '').toLowerCase();
  const list = query ? candidates.filter((u) => u.handle.toLowerCase().includes(query)) : candidates;

  const submit = () => {
    if (query) addSearchHistory(query);
  };
  const onPickHistory = (h: string) => setQ(h);
  const onFollow = (id: string, handle: string) => {
    addSearchHistory(handle);
    toggleFollow(id);
  };

  return (
    <View style={styles.container}>
      <View style={{ paddingTop: insets.top + space.md, paddingHorizontal: space.lg }}>
        <Text style={styles.title}>さがす</Text>
        <View style={styles.searchWrap}>
          <SearchIcon size={18} color={colors.textFaint} />
          <TextInput
            value={q}
            onChangeText={setQ}
            onSubmitEditing={submit}
            placeholder="@IDでさがす"
            placeholderTextColor="rgba(110,104,89,0.42)"
            autoCapitalize="none"
            returnKeyType="search"
            style={styles.searchInput}
          />
          {q.length > 0 && (
            <Pressable onPress={() => setQ('')} hitSlop={10}>
              <CloseIcon size={15} color={colors.textFaint} />
            </Pressable>
          )}
        </View>

        {/* 検索履歴（入力していないときだけ・最大4件・×で削除） */}
        {query === '' && s.searchHistory.length > 0 && (
          <View style={styles.histWrap}>
            <Text style={styles.histLabel}>さいきん</Text>
            <View style={styles.histRow}>
              {s.searchHistory.map((h) => (
                <View key={h} style={styles.chip}>
                  <Pressable onPress={() => onPickHistory(h)} hitSlop={6}>
                    <Text style={styles.chipText}>@{h}</Text>
                  </Pressable>
                  <Pressable onPress={() => removeSearchHistory(h)} hitSlop={8} style={styles.chipX}>
                    <CloseIcon size={12} color={colors.textDim} />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {list.length === 0 ? (
        <View style={styles.empty}>
          <TraceMark size={44} />
          <Text style={styles.emptyText}>{query ? '見つからない' : 'みんなフォロー済み'}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        >
          {list.map((p) => (
            <View key={p.id} style={styles.row}>
              <Avatar user={p} size={44} />
              <View style={{ flex: 1, marginLeft: space.md }}>
                <Text style={styles.name}>{p.displayName}</Text>
                <Text style={styles.handle}>@{p.handle}</Text>
              </View>
              <Pressable
                onPress={() => onFollow(p.id, p.handle)}
                style={({ pressed }) => [styles.followBtn, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.followText}>フォロー</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: font.title, fontWeight: '800', fontFamily: fonts.display, marginBottom: space.sm },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: font.body, fontWeight: '600', fontFamily: fonts.ui, paddingVertical: 12 },

  histWrap: { marginTop: space.md },
  histLabel: { color: colors.textFaint, fontSize: font.small, fontWeight: '700', fontFamily: fonts.ui, marginBottom: space.xs },
  histRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.pill,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  chipText: { color: colors.text, fontSize: font.small, fontWeight: '700', fontFamily: fonts.handle, letterSpacing: 0.2 },
  chipX: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSunken },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.sm, padding: space.xl },
  emptyText: { color: colors.textDim, fontSize: font.body, fontWeight: '700', fontFamily: fonts.ui },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  name: { color: colors.text, fontSize: font.body, fontWeight: '700', fontFamily: fonts.name },
  handle: { color: colors.textDim, fontSize: font.small, marginTop: 2, fontFamily: fonts.handle, letterSpacing: 0.2 },
  followBtn: {
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.lime,
    borderWidth: 1,
    borderColor: 'rgba(24,26,13,0.10)',
  },
  followText: { color: colors.limeInk, fontSize: font.small, fontWeight: '800', fontFamily: fonts.ui },
});
