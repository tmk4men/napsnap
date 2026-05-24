import React, { useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, space } from '../theme';
import { copy, reactionMeta } from '../copy';
import { Avatar, GhostButton, Remaining, useTick } from '../components/ui';
import { SoundBadge, useClipPlayer } from '../components/audio';
import { ReactionIcon } from '../components/icons';
import { Nav } from '../navigation/nav';
import { useStore } from '../store';
import { currentUser, myPosts } from '../selectors';
import { timeAgo } from '../lib/time';
import { postHasSound, resolvePostAudioSource } from '../lib/audio';

export function MeScreen({ nav }: { nav: Nav }) {
  const insets = useSafeAreaInsets();
  useTick(30000);
  const s = useStore();
  const resetDemo = useStore((st) => st.resetDemo);
  const toggleFollow = useStore((st) => st.toggleFollow);
  const { play, playingId } = useClipPlayer();
  const me = currentUser(s);
  const mine = useMemo(() => myPosts(s), [s.posts, s.views, s.reactions, s.currentUserId]);
  const people = s.users.filter((u) => u.isMock);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + space.md,
          paddingHorizontal: space.lg,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* プロフィール */}
        <View style={styles.profile}>
          <Avatar user={me} size={60} />
          <View style={{ marginLeft: space.md }}>
            <Text style={styles.name}>{me?.displayName}</Text>
            <Text style={styles.handle}>@{me?.handle}</Text>
          </View>
        </View>

        {/* 自分の投稿 */}
        {mine.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyMark} />
            <Text style={styles.emptyTitle}>{copy.emptyMine}</Text>
            <Text style={styles.emptySub}>{copy.emptyMineSub}</Text>
            <View style={{ height: space.lg }} />
            <GhostButton label={copy.shoot} onPress={nav.openCamera} />
          </View>
        ) : (
          mine.map(({ post, viewers, viewCount, reactionCount }) => (
            <View key={post.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Image source={{ uri: post.imageUrl }} style={styles.thumb} resizeMode="cover" />
                <View style={{ flex: 1, marginLeft: space.md }}>
                  <Text style={styles.stat}>
                    <Text style={styles.statNum}>{viewCount}</Text> 人が{copy.saw}
                  </Text>
                  <Text style={styles.stat}>
                    <Text style={styles.statNum}>{reactionCount}</Text> 人が{copy.reacted}
                  </Text>
                  <View style={styles.cardMeta}>
                    <Remaining expiresAt={post.expiresAt} color={colors.textDim} size={12} />
                    <SoundBadge
                      hasSound={postHasSound(post)}
                      playing={playingId === post.id}
                      onPress={() => {
                        const src = resolvePostAudioSource(post);
                        if (src) play(post.id, src);
                      }}
                    />
                  </View>
                </View>
              </View>

              {viewers.length > 0 && (
                <View style={styles.viewers}>
                  {viewers.map(({ user, reaction }) => (
                    <View key={user.id} style={styles.viewerRow}>
                      <Avatar user={user} size={26} />
                      <Text style={styles.viewerName}>{user.displayName}</Text>
                      {reaction ? (
                        <View style={styles.viewerReact}>
                          <ReactionIcon type={reaction.type} size={14} color={colors.text} />
                          <Text style={styles.viewerReactLabel}>{reactionMeta(reaction.type).label}</Text>
                        </View>
                      ) : (
                        <Text style={styles.viewerSaw}>{copy.saw}</Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))
        )}

        {/* フォロー中 */}
        <Text style={styles.sectionLabel}>
          {copy.following}・{s.following.length}
        </Text>
        {people.map((p) => {
          const on = s.following.includes(p.id);
          return (
            <View key={p.id} style={styles.person}>
              <Avatar user={p} size={36} />
              <View style={{ flex: 1, marginLeft: space.sm }}>
                <Text style={styles.personName}>{p.displayName}</Text>
                <Text style={styles.personHandle}>@{p.handle}</Text>
              </View>
              <Pressable
                onPress={() => toggleFollow(p.id)}
                style={[styles.followBtn, on && styles.followBtnOn]}
              >
                <Text style={[styles.followText, on && styles.followTextOn]}>
                  {on ? 'フォロー中' : 'フォロー'}
                </Text>
              </Pressable>
            </View>
          );
        })}

        <View style={{ height: space.lg }} />
        <GhostButton label="デモを最初からやり直す" onPress={resetDemo} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  profile: { flexDirection: 'row', alignItems: 'center', marginBottom: space.lg },
  name: { color: colors.text, fontSize: font.title, fontWeight: '900' },
  handle: { color: colors.textDim, fontSize: font.body, marginTop: 2, fontWeight: '600' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: space.xl },
  emptyMark: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.card, marginBottom: space.md },
  emptyTitle: { color: colors.text, fontSize: font.lead, fontWeight: '800' },
  emptySub: { color: colors.textDim, fontSize: font.body, textAlign: 'center', marginTop: space.sm },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.md,
    marginBottom: space.md,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  thumb: { width: 84, height: 84, borderRadius: radius.md, backgroundColor: colors.line },
  stat: { color: colors.text, fontSize: font.body, marginBottom: 2 },
  statNum: { color: colors.text, fontWeight: '900', fontSize: font.lead },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 6 },
  viewers: {
    marginTop: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: space.sm,
    gap: space.xs,
  },
  viewerRow: { flexDirection: 'row', alignItems: 'center' },
  viewerName: { color: colors.text, fontSize: font.body, marginLeft: space.sm, flex: 1 },
  viewerReact: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewerReactLabel: { color: colors.text, fontSize: font.small, fontWeight: '700' },
  viewerSaw: { color: colors.textDim, fontSize: font.small, fontWeight: '600' },
  sectionLabel: {
    color: colors.textDim,
    fontSize: font.small,
    fontWeight: '900',
    marginTop: space.lg,
    marginBottom: space.sm,
  },
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: space.sm,
    marginBottom: space.sm,
  },
  personName: { color: colors.text, fontSize: font.body, fontWeight: '800' },
  personHandle: { color: colors.textDim, fontSize: font.small, marginTop: 1 },
  followBtn: {
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.text,
  },
  followBtnOn: { backgroundColor: colors.lime, borderColor: colors.lime },
  followText: { color: colors.text, fontSize: font.small, fontWeight: '800' },
  followTextOn: { color: colors.limeInk },
});
