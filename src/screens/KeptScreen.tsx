import React, { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, space } from '../theme';
import { copy, reactionMeta } from '../copy';
import { Avatar, useTick } from '../components/ui';
import { useStore } from '../store';
import { keptPosts, userById } from '../selectors';
import { formatRemaining, timeAgo } from '../lib/time';

export function KeptScreen() {
  const insets = useSafeAreaInsets();
  useTick(30000);
  const s = useStore();
  const kept = useMemo(() => keptPosts(s), [s.reactions, s.posts, s.currentUserId]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + space.md }]}>
        <Text style={styles.title}>残した</Text>
        <Text style={styles.subtitle}>反応した痕跡だけ、24時間ここに残る。</Text>
      </View>

      {kept.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🫙</Text>
          <Text style={styles.emptyTitle}>{copy.emptyKept}</Text>
          <Text style={styles.emptySub}>{copy.emptyKeptSub}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: space.lg,
            paddingBottom: insets.bottom + 100,
            gap: space.md,
          }}
          showsVerticalScrollIndicator={false}
        >
          {kept.map(({ post, reaction }) => {
            const author = userById(s.users, post.userId);
            const meta = reactionMeta(reaction.type);
            return (
              <View key={post.id} style={styles.card}>
                <Image source={{ uri: post.imageUrl }} style={styles.image} resizeMode="cover" />
                <View style={styles.reactBadge}>
                  <Text style={{ fontSize: 18 }}>{meta.emoji}</Text>
                </View>
                <View style={styles.cardFoot}>
                  <Avatar user={author} size={30} />
                  <View style={{ marginLeft: space.sm, flex: 1 }}>
                    <Text style={styles.name}>{author?.displayName ?? '友達'}</Text>
                    <Text style={styles.meta}>
                      {timeAgo(post.createdAt)}・{formatRemaining(post.expiresAt)}で消える
                    </Text>
                  </View>
                  <Text style={styles.reactLabel}>{meta.label}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  header: { paddingHorizontal: space.lg, paddingBottom: space.md },
  title: { color: colors.white, fontSize: font.title, fontWeight: '900' },
  subtitle: { color: colors.gray, fontSize: font.small, marginTop: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.lg },
  emptyEmoji: { fontSize: 52, marginBottom: space.md },
  emptyTitle: { color: colors.white, fontSize: font.lead, fontWeight: '800' },
  emptySub: {
    color: colors.gray,
    fontSize: font.body,
    textAlign: 'center',
    marginTop: space.sm,
    lineHeight: font.body * 1.6,
  },
  card: {
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  image: { width: '100%', aspectRatio: 1 },
  reactBadge: {
    position: 'absolute',
    top: space.sm,
    right: space.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  cardFoot: { flexDirection: 'row', alignItems: 'center', padding: space.md },
  name: { color: colors.white, fontSize: font.body, fontWeight: '800' },
  meta: { color: colors.gray, fontSize: font.tiny, marginTop: 2 },
  reactLabel: { color: colors.lime, fontSize: font.small, fontWeight: '800' },
});
