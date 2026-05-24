import React, { useMemo, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, shadow, space } from '../theme';
import { fonts } from '../lib/fonts';
import { copy } from '../copy';
import { Avatar, Card, GhostButton, Remaining, useTick } from '../components/ui';
import { SoundBadge, useClipPlayer } from '../components/audio';
import { PencilIcon, ReactionIcon, TraceMark } from '../components/icons';
import { MemoryCalendar } from '../components/MemoryCalendar';
import { MemoryViewer } from '../components/MemoryViewer';
import { ConnectionsOverlay } from '../components/ConnectionsOverlay';
import { CropModal } from '../components/CropModal';
import { Nav } from '../navigation/nav';
import { useStore } from '../store';
import { currentUser, memoryHighlights, myArchive, myPosts } from '../selectors';
import { timeAgo } from '../lib/time';
import { postHasSound, resolvePostAudioSource } from '../lib/audio';
import { pickRawImage } from '../lib/avatar';
import { Post } from '../types';

export function MeScreen({ nav }: { nav: Nav }) {
  const insets = useSafeAreaInsets();
  useTick(30000);
  const s = useStore();
  const resetDemo = useStore((st) => st.resetDemo);
  const toggleFollow = useStore((st) => st.toggleFollow);
  const updateProfileImage = useStore((st) => st.updateProfileImage);
  const { play, playingId } = useClipPlayer();
  const me = currentUser(s);
  const mine = useMemo(() => myPosts(s), [s.posts, s.views, s.reactions, s.currentUserId]);
  const archive = useMemo(() => myArchive(s), [s.posts, s.currentUserId]);
  const highlights = useMemo(() => memoryHighlights(s), [s.posts, s.currentUserId]);
  const people = s.users.filter((u) => u.isMock);
  const followingUsers = people.filter((p) => s.following.includes(p.id));
  const followers = people; // デモ：モックの人はみんな自分をフォローしている

  const [viewing, setViewing] = useState<Post[] | null>(null);
  const [conn, setConn] = useState<'following' | 'followers' | null>(null);
  const [cropUri, setCropUri] = useState<string | null>(null);

  async function changePhoto() {
    const uri = await pickRawImage();
    if (!uri) return;
    if (Platform.OS === 'web') setCropUri(uri);
    else updateProfileImage(uri);
  }

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
          <Pressable onPress={changePhoto} style={styles.avatarWrap}>
            <Avatar user={me} size={64} />
            <View style={styles.editBadge}>
              <PencilIcon size={12} color={colors.limeInkSoft} />
            </View>
          </Pressable>
          <View style={{ marginLeft: space.md, flex: 1 }}>
            <Text style={styles.name}>{me?.displayName}</Text>
            <Text style={styles.handle}>@{me?.handle}</Text>
            <View style={styles.stats}>
              <Pressable onPress={() => setConn('following')} style={styles.connStat} hitSlop={6}>
                <Text style={styles.connNum}>{followingUsers.length}</Text>
                <Text style={styles.connLabel}>フォロー中</Text>
              </Pressable>
              <Pressable onPress={() => setConn('followers')} style={styles.connStat} hitSlop={6}>
                <Text style={styles.connNum}>{followers.length}</Text>
                <Text style={styles.connLabel}>フォロワー</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* ハイライト（1年前/1ヶ月前/1週間前） */}
        {highlights.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>思い出</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: space.sm, paddingVertical: 2 }}
            >
              {highlights.map((h) => (
                <Pressable key={h.post.id} onPress={() => setViewing([h.post])} style={styles.hl}>
                  <Image source={{ uri: h.post.imageUrl }} style={styles.hlImg} resizeMode="cover" />
                  <View style={styles.hlScrim} />
                  <Text style={styles.hlLabel}>{h.label}</Text>
                  {!!h.post.caption?.text && (
                    <Text style={styles.hlCap} numberOfLines={1}>
                      {h.post.caption.text.replace(/\n/g, ' ')}
                    </Text>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        {/* カレンダー */}
        <Text style={styles.sectionLabel}>きろく・{archive.length}</Text>
        <MemoryCalendar posts={archive} onPressDay={(dayPosts) => setViewing(dayPosts)} />

        {/* いま出している投稿（24h以内） */}
        <Text style={styles.sectionLabel}>いま出してる</Text>
        {mine.length === 0 ? (
          <View style={styles.empty}>
            <TraceMark size={48} />
            <Text style={styles.emptyTitle}>{copy.emptyMine}</Text>
            <Text style={styles.emptySub}>{copy.emptyMineSub}</Text>
            <View style={{ height: space.md }} />
            <GhostButton label={copy.shoot} onPress={nav.openCamera} />
          </View>
        ) : (
          mine.map(({ post, viewers, viewCount, reactionCount }) => (
            <Card key={post.id} style={styles.card}>
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
                        <ReactionIcon type={reaction.type} size={18} color={colors.text} />
                      ) : (
                        <Text style={styles.viewerSaw}>{copy.saw}</Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </Card>
          ))
        )}

        <View style={{ height: space.xl }} />
        <GhostButton label="デモを最初からやり直す" onPress={resetDemo} />
      </ScrollView>

      {viewing && <MemoryViewer posts={viewing} onClose={() => setViewing(null)} />}
      {cropUri && (
        <CropModal
          uri={cropUri}
          onCancel={() => setCropUri(null)}
          onDone={(d) => {
            updateProfileImage(d);
            setCropUri(null);
          }}
        />
      )}
      {conn && (
        <ConnectionsOverlay
          initial={conn}
          following={followingUsers}
          followers={followers}
          isFollowing={(id) => s.following.includes(id)}
          onToggle={toggleFollow}
          onClose={() => setConn(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  profile: { flexDirection: 'row', alignItems: 'center', marginBottom: space.lg },
  avatarWrap: { position: 'relative' },
  editBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.limeSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: colors.bg,
  },
  name: { color: colors.text, fontSize: font.title, fontWeight: '800', fontFamily: fonts.display },
  handle: { color: colors.textDim, fontSize: font.body, marginTop: 2, fontWeight: '600' },
  stats: { flexDirection: 'row', gap: space.lg, marginTop: space.sm },
  connStat: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  connNum: { color: colors.text, fontSize: font.body, fontWeight: '800', fontFamily: fonts.ui },
  connLabel: { color: colors.textDim, fontSize: font.small, fontWeight: '700', fontFamily: fonts.ui },

  hl: {
    width: 132,
    height: 168,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSunken,
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderColor: colors.mediaChipBorder,
    boxShadow: shadow.chip,
  },
  hlImg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  hlScrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.28)' },
  hlLabel: { color: colors.onMedia, fontSize: font.small, fontWeight: '900', paddingHorizontal: 10, paddingTop: 8 },
  hlCap: { color: colors.onMediaDim, fontSize: font.tiny, fontWeight: '700', paddingHorizontal: 10, paddingBottom: 10, paddingTop: 2 },

  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: space.lg, gap: space.xs },
  emptyTitle: { color: colors.text, fontSize: font.lead, fontWeight: '800', marginTop: space.sm },
  emptySub: { color: colors.textDim, fontSize: font.body, textAlign: 'center' },
  card: { padding: space.md, marginBottom: space.md },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  thumb: { width: 84, height: 84, borderRadius: radius.md, backgroundColor: colors.surfaceSunken },
  stat: { color: colors.text, fontSize: font.body, marginBottom: 2 },
  statNum: { color: colors.text, fontWeight: '900', fontSize: font.lead },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 6 },
  viewers: {
    marginTop: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
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
    fontWeight: '700',
    letterSpacing: 0.2,
    fontFamily: fonts.ui,
    marginTop: space.lg,
    marginBottom: space.sm,
  },
});
