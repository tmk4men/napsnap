import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, rule, space } from '../theme';
import { fonts } from '../lib/fonts';
import { Avatar, Remaining, useTick } from '../components/ui';
import { Backdrop } from '../components/Backdrop';
import { SoundBadge, useClipPlayer } from '../components/audio';
import { ChekiCard } from '../components/ChekiCard';
import { FootprintIcon, PencilIcon, ShareIcon, ThumbsUpIcon, TraceMark } from '../components/icons';
import { shareInvite } from '../lib/share';
import { MemoryCalendar } from '../components/MemoryCalendar';
import { MemoryViewer } from '../components/MemoryViewer';
import { ConnectionsOverlay } from '../components/ConnectionsOverlay';
import { CropModal } from '../components/CropModal';
import { ProfileEditOverlay } from '../components/ProfileEditOverlay';
import { Nav } from '../navigation/nav';
import { useStore } from '../store';
import { currentUser, myArchive, myPosts, nextProfileEditDays, profileEditsLeft } from '../selectors';
import { postHasSound, resolvePostAudioSource } from '../lib/audio';
import { pickRawImage } from '../lib/avatar';
import { Post } from '../types';

const ME_ITEM_W = 210;

// 自分タブ：プロフィール + 自分の投稿カルーセル + カレンダー（カレンダーが入る分だけ縦スクロール可）。
// カメラボタンと「思い出ハイライト」は廃止済み。
export function MeScreen({ nav: _nav }: { nav: Nav }) {
  const insets = useSafeAreaInsets();
  useTick(30000);
  const s = useStore();
  const toggleFollow = useStore((st) => st.toggleFollow);
  const updateProfileImage = useStore((st) => st.updateProfileImage);
  const updateProfile = useStore((st) => st.updateProfile);
  const { play, playingId } = useClipPlayer();
  const me = currentUser(s);
  const mine = useMemo(() => myPosts(s), [s.posts, s.views, s.reactions, s.currentUserId]);
  const archive = useMemo(() => myArchive(s), [s.posts, s.currentUserId]);
  const mockPeople = s.users.filter((u) => u.isMock);
  const followingUsers = s.users.filter((u) => u.id !== me?.id && s.following.includes(u.id));
  // 自分をフォローしている人。ライブ：s.followers から profile を引く。モック：従来通り mock 全員。
  const followers = s.followers.length > 0
    ? s.followers
        .map((f) => s.users.find((u) => u.id === f.followerId))
        .filter((u): u is NonNullable<typeof u> => !!u)
    : mockPeople;

  const [viewing, setViewing] = useState<Post[] | null>(null);
  const [conn, setConn] = useState<'following' | 'followers' | null>(null);
  const [cropUri, setCropUri] = useState<string | null>(null);
  const [editProfile, setEditProfile] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);

  async function onShare() {
    const r = await shareInvite(me?.handle ?? '');
    if (r === 'copied') setShareNote('共有リンクをコピーした');
    else if (r === 'none') setShareNote('共有できなかった');
    else setShareNote(null);
    if (r !== 'shared') setTimeout(() => setShareNote(null), 2200);
  }

  const avatarLockMs = s.avatarChangedAt + 24 * 60 * 60 * 1000 - Date.now();
  const avatarLocked = s.avatarChangedAt > 0 && avatarLockMs > 0;
  const avatarLockHours = Math.ceil(avatarLockMs / (60 * 60 * 1000));

  async function changePhoto() {
    if (avatarLocked) return;
    const uri = await pickRawImage();
    if (!uri) return;
    if (Platform.OS === 'web') setCropUri(uri);
    else updateProfileImage(uri);
  }

  return (
    <View style={styles.container}>
      <Backdrop />
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
            <View style={[styles.editBadge, avatarLocked && styles.editBadgeLocked]}>
              <PencilIcon size={12} color={avatarLocked ? colors.textFaint : colors.limeInkSoft} />
            </View>
          </Pressable>
          <View style={{ marginLeft: space.md, flex: 1 }}>
            <Text style={styles.name}>{me?.displayName}</Text>
            <View style={styles.handleRow}>
              <Text style={styles.handle}>@{me?.handle}</Text>
              <Pressable onPress={() => setEditProfile(true)} hitSlop={8} style={styles.editBtn}>
                <PencilIcon size={13} color={colors.textDim} />
              </Pressable>
            </View>
            <View style={styles.stats}>
              <Pressable onPress={() => setConn('following')} style={styles.connStat} hitSlop={6}>
                <Text style={styles.connNum}>{followingUsers.length}</Text>
                <Text style={styles.connLabel}>フォロー</Text>
              </Pressable>
              <Pressable onPress={() => setConn('followers')} style={styles.connStat} hitSlop={6}>
                <Text style={styles.connNum}>{followers.length}</Text>
                <Text style={styles.connLabel}>フォロワー</Text>
              </Pressable>
            </View>
          </View>
          <Pressable onPress={onShare} style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.85 }]} hitSlop={8}>
            <ShareIcon size={18} color={colors.limeInkSoft} />
          </Pressable>
        </View>

        {shareNote && <Text style={styles.shareNote}>{shareNote}</Text>}
        {avatarLocked && (
          <Text style={styles.avatarLockNote}>プロフ画像はあと{avatarLockHours}時間は変えられない</Text>
        )}

        {/* 投稿（24h以内） */}
        <Text style={styles.sectionLabel}>投稿</Text>
        {mine.length === 0 ? (
          <View style={styles.empty}>
            <TraceMark size={48} />
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={ME_ITEM_W + space.md}
            decelerationRate="fast"
            contentContainerStyle={{ gap: space.md, paddingVertical: 4, paddingRight: space.lg }}
          >
            {mine.map(({ post, viewCount, reactionCount }) => (
              <View key={post.id} style={{ width: ME_ITEM_W }}>
                <ChekiCard uri={post.imageUrl} caption={post.caption} width={ME_ITEM_W} date={post.createdAt} tiltSeed={post.id} />
                <View style={styles.meStatRow}>
                  <View style={styles.meStat}>
                    <FootprintIcon size={14} color={colors.textDim} />
                    <Text style={styles.meStatText}>{viewCount}</Text>
                  </View>
                  <View style={styles.meStat}>
                    <ThumbsUpIcon size={13} color={colors.textDim} />
                    <Text style={styles.meStatText}>{reactionCount}</Text>
                  </View>
                  <View style={{ marginLeft: 'auto' }}>
                    <Remaining expiresAt={post.expiresAt} color={colors.warn} size={12} />
                  </View>
                </View>
                <View style={styles.meSound}>
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
            ))}
          </ScrollView>
        )}

        {/* カレンダー（過去の自分の投稿を日別に。タップで MemoryViewer 起動） */}
        <View style={{ height: space.lg }} />
        <MemoryCalendar posts={archive} onPressDay={(dayPosts) => setViewing(dayPosts)} />

        <View style={{ height: space.xl }} />
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
      {editProfile && (
        <ProfileEditOverlay
          currentName={me?.displayName ?? ''}
          currentHandle={me?.handle ?? ''}
          editsLeft={profileEditsLeft(s)}
          nextInDays={nextProfileEditDays(s)}
          onSave={(n, h) => {
            updateProfile(n, h);
            setEditProfile(false);
          }}
          onClose={() => setEditProfile(false)}
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
  editBadgeLocked: { backgroundColor: colors.surfaceSunken },
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.limeSoft,
    borderWidth: rule.hair,
    borderColor: colors.limeLine,
    alignSelf: 'flex-start',
  },
  shareNote: { color: colors.limeInkSoft, fontSize: font.small, fontWeight: '700', fontFamily: fonts.ui, marginTop: -space.sm, marginBottom: space.md },
  avatarLockNote: { color: colors.textFaint, fontSize: font.small, fontFamily: fonts.ui, marginTop: -space.sm, marginBottom: space.md },
  name: { color: colors.text, fontSize: font.title, fontWeight: '700', fontFamily: fonts.name },
  handleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 3 },
  handle: { color: colors.textDim, fontSize: font.body, fontWeight: '500', fontFamily: fonts.handle, letterSpacing: 0.2 },
  editBtn: {
    width: 26,
    height: 26,
    borderRadius: radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: rule.hair,
    borderColor: colors.hairline,
  },
  stats: { flexDirection: 'row', gap: space.lg, marginTop: space.sm },
  connStat: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  connNum: { color: colors.text, fontSize: font.body, fontWeight: '500', fontFamily: fonts.handle },
  connLabel: { color: colors.textDim, fontSize: font.small, fontWeight: '700', fontFamily: fonts.ui },

  sectionLabel: {
    color: colors.textDim,
    fontSize: font.small,
    fontWeight: '700',
    letterSpacing: 0.2,
    fontFamily: fonts.ui,
    marginTop: space.lg,
    marginBottom: space.sm,
  },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: space.lg, gap: space.xs },
  meStatRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: space.sm, paddingHorizontal: 2 },
  meStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meStatText: { color: colors.textDim, fontSize: font.small, fontWeight: '500', fontFamily: fonts.handle },
  meSound: { marginTop: 6, alignSelf: 'flex-start', paddingHorizontal: 2 },
});
