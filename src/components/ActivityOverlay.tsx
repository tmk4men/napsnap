import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, space } from '../theme';
import { fonts } from '../lib/fonts';
import { Avatar, PrimaryButton } from './ui';
import { CloseIcon, TraceMark } from './icons';
import { timeAgo } from '../lib/time';
import { ActivityItem } from '../selectors';

function lineFor(item: ActivityItem): string {
  const name = item.user?.displayName ?? '友達';
  if (item.kind === 'react') return `${name} が反応した`;
  if (item.kind === 'view') return `${name} が見た`;
  return `${name} が痕跡を残した`;
}

// 通知（アクティビティ）一覧。自分の投稿への反応/足跡＋フォロー中の新着。
// バックエンドが無いデモなので、ストアのデータから組み立てた擬似通知。
export function ActivityOverlay({
  items,
  passOpen,
  onClose,
  onShoot,
}: {
  items: ActivityItem[];
  passOpen: boolean;
  onClose: () => void;
  onShoot: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
        <Text style={styles.title}>アクティビティ</Text>
        <Pressable onPress={onClose} style={styles.close} hitSlop={12}>
          <CloseIcon size={18} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: insets.bottom + space.xl }} showsVerticalScrollIndicator={false}>
        {!passOpen && (
          <View style={styles.turn}>
            <View style={{ flex: 1 }}>
              <Text style={styles.turnTitle}>あなたの番</Text>
              <Text style={styles.turnSub}>1枚出すと、みんなの今が見える。</Text>
            </View>
            <PrimaryButton label="撮る" onPress={onShoot} style={{ paddingVertical: 12, paddingHorizontal: 20 }} />
          </View>
        )}

        {items.length === 0 ? (
          <View style={styles.empty}>
            <TraceMark size={40} />
            <Text style={styles.emptyText}>まだ何もない</Text>
          </View>
        ) : (
          items.map((it) => (
            <View key={it.id} style={styles.row}>
              <Avatar user={it.user} size={40} />
              <View style={{ flex: 1, marginLeft: space.sm }}>
                <Text style={styles.line}>{lineFor(it)}</Text>
                <Text style={styles.time}>{timeAgo(it.at)}</Text>
              </View>
              {it.postImage && <Image source={{ uri: it.postImage }} style={styles.thumb} resizeMode="cover" />}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
    paddingBottom: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  title: { color: colors.text, fontSize: font.lead, fontWeight: '900', fontFamily: fonts.display },
  close: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSunken },
  turn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: space.md,
    marginBottom: space.md,
    boxShadow: '0 10px 28px rgba(44,36,22,0.10)',
  },
  turnTitle: { color: colors.text, fontSize: font.lead, fontWeight: '900', fontFamily: fonts.display },
  turnSub: { color: colors.textDim, fontSize: font.small, marginTop: 2, fontFamily: fonts.ui },
  empty: { alignItems: 'center', justifyContent: 'center', gap: space.sm, paddingVertical: space.xxl },
  emptyText: { color: colors.textDim, fontSize: font.body, fontWeight: '700', fontFamily: fonts.ui },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.hairline },
  line: { color: colors.text, fontSize: font.body, fontWeight: '700', fontFamily: fonts.ui },
  time: { color: colors.textFaint, fontSize: font.small, marginTop: 1, fontFamily: fonts.ui },
  thumb: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.surfaceSunken, marginLeft: space.sm },
});
