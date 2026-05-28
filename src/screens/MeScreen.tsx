import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, rule, shadow, space } from '../theme';
import { fonts } from '../lib/fonts';
import { Avatar, FadeIn, Remaining, useTick } from '../components/ui';
import { Backdrop } from '../components/Backdrop';
import { SoundBadge, useClipPlayer } from '../components/audio';
import { ChekiCard } from '../components/ChekiCard';
import { IssueCard } from '../components/IssueCard';
import { FootprintIcon, MoreIcon, PencilIcon, ShareIcon, ThumbsUpIcon, TraceMark, VerifiedBadge } from '../components/icons';
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
import { isFriday, issueLabel, startOfWeek } from '../lib/time';
import { showRewardedAd } from '../lib/ads';
import { tr } from '../i18n';
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
  const deletePost = useStore((st) => st.deletePost);
  const publishWeeklyIssue = useStore((st) => st.publishWeeklyIssue);
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
  const [issueNote, setIssueNote] = useState<string | null>(null);
  const [menuPostId, setMenuPostId] = useState<string | null>(null);

  // 「今週」（日曜0時以降）の自分の通常投稿。号外の元素材。
  const weekStart = startOfWeek();
  const weekPostsCount = useMemo(
    () =>
      s.posts.filter(
        (p) =>
          p.userId === s.currentUserId &&
          !p.topicKey &&
          p.kind !== 'issue' &&
          p.createdAt >= weekStart
      ).length,
    [s.posts, s.currentUserId, weekStart]
  );
  const thisIssueLabel = issueLabel();
  // 号外は金曜日だけ綴じて出せる。
  const friday = isFriday();
  const canPublishIssue = weekPostsCount > 0 && friday;

  function onPublishIssue() {
    const id = publishWeeklyIssue();
    if (id) {
      setIssueNote(tr(`${thisIssueLabel} を綴じて投稿した`, `Published ${thisIssueLabel}`));
      setTimeout(() => setIssueNote(null), 2400);
    }
  }

  async function onShare() {
    const r = await shareInvite(me?.handle ?? '');
    if (r === 'copied') setShareNote(tr('共有リンクをコピーした', 'Copied the invite link'));
    else if (r === 'none') setShareNote(tr('共有できなかった', "Couldn't share"));
    else setShareNote(null);
    if (r !== 'shared') setTimeout(() => setShareNote(null), 2200);
  }

  const avatarLockMs = s.avatarChangedAt + 24 * 60 * 60 * 1000 - Date.now();
  const avatarLocked = s.avatarChangedAt > 0 && avatarLockMs > 0;
  const avatarLockHours = Math.ceil(avatarLockMs / (60 * 60 * 1000));

  const [adLoading, setAdLoading] = useState(false);
  async function changePhoto() {
    if (avatarLocked || adLoading) return;
    // アバター変更ゲート：Rewarded 広告を1回視聴したら変更可能（[[napsnap-avatar-ad-gate]]）。
    // Web デモは即時に通す（ads.web.ts が true を返す）。
    setAdLoading(true);
    const ok = await showRewardedAd();
    setAdLoading(false);
    if (!ok) return;
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
          <Pressable onPress={changePhoto} style={styles.avatarWrap} disabled={adLoading}>
            <Avatar user={me} size={64} />
            <View style={[styles.editBadge, (avatarLocked || adLoading) && styles.editBadgeLocked]}>
              <PencilIcon size={12} color={avatarLocked || adLoading ? colors.textFaint : colors.limeInkSoft} />
            </View>
          </Pressable>
          <View style={{ marginLeft: space.md, flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{me?.displayName}</Text>
              {me?.isOfficial && <VerifiedBadge size={15} />}
            </View>
            <View style={styles.handleRow}>
              <Text style={styles.handle}>@{me?.handle}</Text>
              <Pressable onPress={() => setEditProfile(true)} hitSlop={8} style={styles.editBtn}>
                <PencilIcon size={13} color={colors.textDim} />
              </Pressable>
            </View>
            <View style={styles.stats}>
              <Pressable onPress={() => setConn('following')} style={styles.connStat} hitSlop={6}>
                <Text style={styles.connNum}>{followingUsers.length}</Text>
                <Text style={styles.connLabel}>{tr('フォロー', 'Following')}</Text>
              </Pressable>
              <Pressable onPress={() => setConn('followers')} style={styles.connStat} hitSlop={6}>
                <Text style={styles.connNum}>{Math.max(s.followersTotal ?? 0, followers.length)}</Text>
                <Text style={styles.connLabel}>{tr('フォロワー', 'Followers')}</Text>
              </Pressable>
            </View>
          </View>
          <Pressable onPress={onShare} style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.85 }]} hitSlop={8}>
            <ShareIcon size={18} color={colors.limeInkSoft} />
          </Pressable>
        </View>

        {shareNote && <Text style={styles.shareNote}>{shareNote}</Text>}
        {avatarLocked && (
          <Text style={styles.avatarLockNote}>{tr(`プロフ画像はあと${avatarLockHours}時間は変えられない`, `You can change your photo again in ${avatarLockHours}h`)}</Text>
        )}

        {/* カレンダー（過去の自分の投稿を日別に。タップで MemoryViewer 起動） */}
        <MemoryCalendar posts={archive} onPressDay={(dayPosts) => setViewing(dayPosts)} />

        {/* 今週の号外：日曜0時以降の自分の投稿をまとめて1枚の号外として発行（24hで消える） */}
        <Text style={styles.sectionLabel}>{tr('今週の号外', 'This week\'s extra')}</Text>
        <View style={styles.issueRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.issueLabel}>{thisIssueLabel}</Text>
            <Text style={styles.issueSub}>
              {!friday
                ? tr('号外は金曜日だけ出せる', 'Extras can only be posted on Fridays')
                : weekPostsCount > 0
                ? tr(`全${weekPostsCount}枚を綴じる`, `Bind ${weekPostsCount} photos`)
                : tr('まだ今週の投稿がない', 'No posts this week yet')}
            </Text>
          </View>
          <Pressable
            onPress={onPublishIssue}
            disabled={!canPublishIssue}
            style={({ pressed }) => [
              styles.issueBtn,
              !canPublishIssue && styles.issueBtnDisabled,
              pressed && canPublishIssue && { opacity: 0.85 },
            ]}
          >
            <Text style={[styles.issueBtnText, !canPublishIssue && styles.issueBtnTextDisabled]}>{tr('綴じて投稿', 'Bind & post')}</Text>
          </Pressable>
        </View>
        {issueNote && <Text style={styles.issueNote}>{issueNote}</Text>}

        {/* 投稿（24h以内） */}
        <Text style={styles.sectionLabel}>{tr('投稿', 'Posts')}</Text>
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
                {post.kind === 'issue' && post.issue ? (
                  <Pressable
                    onPress={() => {
                      const built: Post[] = post.issue!.images.map((url, i) => {
                        const origId = post.issue!.sourcePostIds[i];
                        const orig = origId ? s.posts.find((x) => x.id === origId) : undefined;
                        return (
                          orig ?? {
                            id: `${post.id}__view_${i}`,
                            userId: post.userId,
                            imageUrl: url,
                            createdAt: post.createdAt,
                            expiresAt: post.expiresAt,
                          }
                        );
                      });
                      setViewing(built);
                    }}
                  >
                    <IssueCard label={post.issue.label} images={post.issue.images} createdAt={post.createdAt} width={ME_ITEM_W} tiltSeed={post.id} />
                  </Pressable>
                ) : (
                  <ChekiCard uri={post.imageUrl} caption={post.caption} width={ME_ITEM_W} date={post.createdAt} tiltSeed={post.id} />
                )}
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
                <View style={styles.meBottomRow}>
                  <SoundBadge
                    hasSound={postHasSound(post)}
                    playing={playingId === post.id}
                    onPress={() => {
                      const src = resolvePostAudioSource(post);
                      if (src) play(post.id, src);
                    }}
                  />
                  <Pressable
                    onPress={() => setMenuPostId(post.id)}
                    hitSlop={10}
                    style={({ pressed }) => [styles.moreBtn, pressed && { opacity: 0.6 }]}
                  >
                    <MoreIcon size={18} color={colors.textDim} />
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        <View style={{ height: space.xl }} />
      </ScrollView>

      {viewing && <MemoryViewer posts={viewing} onClose={() => setViewing(null)} />}
      {menuPostId && (
        <View style={styles.menuOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuPostId(null)} />
          <FadeIn style={[styles.menuSheet, { bottom: insets.bottom + space.md }]} dy={16} duration={180}>
            <Pressable
              onPress={() => {
                const id = menuPostId;
                setMenuPostId(null);
                deletePost(id);
              }}
              style={({ pressed }) => [styles.menuItem, pressed && { backgroundColor: colors.surface }]}
            >
              <Text style={[styles.menuItemText, { color: colors.warn }]}>{tr('この投稿を削除', 'Delete this post')}</Text>
            </Pressable>
            <Pressable
              onPress={() => setMenuPostId(null)}
              style={({ pressed }) => [styles.menuItem, styles.menuCancel, pressed && { backgroundColor: colors.surface }]}
            >
              <Text style={styles.menuItemText}>{tr('キャンセル', 'Cancel')}</Text>
            </Pressable>
          </FadeIn>
        </View>
      )}
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
  name: { color: colors.text, fontSize: 22, fontWeight: '700', fontFamily: fonts.name },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
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
  meBottomRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, paddingHorizontal: 2 },
  moreBtn: { marginLeft: 'auto', width: 32, height: 28, alignItems: 'flex-end', justifyContent: 'center' },

  // 3点メニュー（投稿削除）の下部シート
  menuOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.10)' },
  menuSheet: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.xs,
    borderWidth: rule.hair,
    borderColor: colors.line,
    boxShadow: shadow.card,
    overflow: 'hidden',
  },
  menuItem: { paddingVertical: 15, alignItems: 'center' },
  menuCancel: { borderTopWidth: rule.hair, borderTopColor: colors.hairline },
  menuItemText: { color: colors.text, fontSize: font.body, fontWeight: '700', fontFamily: fonts.serif, letterSpacing: 0.3 },

  // 今週の号外
  issueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderTopWidth: rule.thin,
    borderBottomWidth: rule.thin,
    borderColor: colors.text,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    gap: space.sm,
  },
  issueLabel: { color: colors.text, fontSize: font.lead, fontWeight: '900', fontFamily: fonts.serif, letterSpacing: 0 },
  issueSub: { color: colors.textDim, fontSize: font.small, fontFamily: fonts.handle, marginTop: 2 },
  issueBtn: {
    backgroundColor: colors.text,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.xs,
  },
  issueBtnDisabled: { backgroundColor: colors.surfaceSunken },
  issueBtnText: { color: colors.bg, fontSize: font.small, fontWeight: '800', fontFamily: fonts.ui, letterSpacing: 0.5 },
  issueBtnTextDisabled: { color: colors.textFaint },
  issueNote: { color: colors.text, fontSize: font.small, fontWeight: '700', fontFamily: fonts.ui, marginTop: space.xs },
});
