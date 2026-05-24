import React, { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, space } from '../theme';
import { copy, reactionMeta } from '../copy';
import { Avatar, GhostButton, useTick } from '../components/ui';
import { SoundBadge, useClipPlayer } from '../components/audio';
import { Nav } from '../navigation/nav';
import { useStore } from '../store';
import { currentUser, myPosts } from '../selectors';
import { formatRemaining, timeAgo } from '../lib/time';
import { postHasSound, resolvePostAudioSource } from '../lib/audio';

export function MeScreen({ nav }: { nav: Nav }) {
  const insets = useSafeAreaInsets();
  useTick(30000);
  const s = useStore();
  const resetDemo = useStore((st) => st.resetDemo);
  const leaveGroup = useStore((st) => st.leaveGroup);
  const { play, playingId } = useClipPlayer();
  const me = currentUser(s);
  const mine = useMemo(() => myPosts(s), [s.posts, s.views, s.reactions, s.currentUserId]);
  const memberCount = s.group?.memberIds.length ?? 0;

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
        <View style={styles.profile}>
          <Avatar user={me} size={56} />
          <View style={{ marginLeft: space.md }}>
            <Text style={styles.name}>{me?.displayName}</Text>
            <Text style={styles.sub}>{s.group?.name} ・ {memberCount}人</Text>
          </View>
        </View>

        {mine.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📷</Text>
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
                    <Text style={styles.statNum}>{viewCount}</Text> 人が見た
                  </Text>
                  <Text style={styles.stat}>
                    <Text style={styles.statNum}>{reactionCount}</Text> 人が反応した
                  </Text>
                  <Text style={styles.metaTime}>
                    {timeAgo(post.createdAt)}・{formatRemaining(post.expiresAt)}で消える
                  </Text>
                  <View style={{ marginTop: space.xs }}>
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
                      <Text style={styles.viewerReact}>
                        {reaction ? `${reactionMeta(reaction.type).emoji} ${reactionMeta(reaction.type).label}` : '👣 見た'}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))
        )}

        {/* デモ操作（評価者向け）。本番ではここは設定画面に分離する想定。 */}
        <View style={styles.demoBox}>
          <Text style={styles.demoLabel}>このグループ</Text>
          <View style={styles.codeRow}>
            <Text style={styles.codeText}>招待コード</Text>
            <Text style={styles.code}>{s.group?.inviteCode}</Text>
          </View>
          <GhostButton label="グループを出る" tone="danger" onPress={leaveGroup} />
          <GhostButton label="デモを最初からやり直す" onPress={resetDemo} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  profile: { flexDirection: 'row', alignItems: 'center', marginBottom: space.lg },
  name: { color: colors.white, fontSize: font.title, fontWeight: '900' },
  sub: { color: colors.gray, fontSize: font.small, marginTop: 2 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: space.xxl },
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
    padding: space.md,
    marginBottom: space.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  thumb: { width: 84, height: 84, borderRadius: radius.md, backgroundColor: colors.surface },
  stat: { color: colors.white, fontSize: font.body, marginBottom: 2 },
  statNum: { color: colors.lime, fontWeight: '900', fontSize: font.lead },
  metaTime: { color: colors.gray, fontSize: font.tiny, marginTop: 4 },
  viewers: {
    marginTop: space.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: space.sm,
    gap: space.xs,
  },
  viewerRow: { flexDirection: 'row', alignItems: 'center' },
  viewerName: { color: colors.white, fontSize: font.body, marginLeft: space.sm, flex: 1 },
  viewerReact: { color: colors.gray, fontSize: font.small, fontWeight: '700' },
  demoBox: {
    marginTop: space.lg,
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  demoLabel: { color: colors.gray, fontSize: font.small, fontWeight: '800', marginBottom: space.xs },
  codeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.sm },
  codeText: { color: colors.white, fontSize: font.body },
  code: { color: colors.lime, fontSize: font.lead, fontWeight: '900', letterSpacing: 3 },
});
