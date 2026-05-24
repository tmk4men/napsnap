import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, space } from '../theme';
import { fonts } from '../lib/fonts';
import { Avatar } from '../components/ui';
import { SearchIcon, TraceMark } from '../components/icons';
import { useStore } from '../store';

// @ID や名前でユーザーを探してフォローする専用タブ。
export function SearchScreen() {
  const insets = useSafeAreaInsets();
  const s = useStore();
  const toggleFollow = useStore((st) => st.toggleFollow);
  const [q, setQ] = useState('');

  const people = s.users.filter((u) => u.isMock);
  const query = q.trim().replace(/^@/, '').toLowerCase();
  const list = query
    ? people.filter((u) => u.handle.toLowerCase().includes(query) || u.displayName.toLowerCase().includes(query))
    : people;

  return (
    <View style={styles.container}>
      <View style={{ paddingTop: insets.top + space.md, paddingHorizontal: space.lg }}>
        <Text style={styles.title}>さがす</Text>
        <View style={styles.searchWrap}>
          <SearchIcon size={18} color={colors.textFaint} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="@IDや名前でさがす"
            placeholderTextColor="rgba(110,104,89,0.42)"
            autoCapitalize="none"
            style={styles.searchInput}
          />
        </View>
      </View>

      {list.length === 0 ? (
        <View style={styles.empty}>
          <TraceMark size={44} />
          <Text style={styles.emptyText}>見つからない</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        >
          {list.map((p) => {
            const on = s.following.includes(p.id);
            return (
              <View key={p.id} style={styles.row}>
                <Avatar user={p} size={44} />
                <View style={{ flex: 1, marginLeft: space.md }}>
                  <Text style={styles.name}>{p.displayName}</Text>
                  <Text style={styles.handle}>@{p.handle}</Text>
                </View>
                <Pressable
                  onPress={() => toggleFollow(p.id)}
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
    marginBottom: space.sm,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: font.body, fontWeight: '600', fontFamily: fonts.ui, paddingVertical: 12 },
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
  followBtnOn: { backgroundColor: colors.limeSoft, borderColor: colors.limeLine },
  followText: { color: colors.textDim, fontSize: font.small, fontWeight: '700', fontFamily: fonts.ui },
  followTextOn: { color: colors.limeInkSoft },
});
