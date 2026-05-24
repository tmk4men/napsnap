import React, { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, shadow, space } from '../theme';
import { fonts } from '../lib/fonts';
import { copy } from '../copy';
import { Avatar, GhostButton, PrimaryButton, Remaining, useTick } from '../components/ui';
import { CaptionView } from '../components/Caption';
import { MediaImage } from '../components/MediaImage';
import { ActivityOverlay } from '../components/ActivityOverlay';
import { MemoryViewer } from '../components/MemoryViewer';
import { BellIcon, CameraIcon, ChevronRightIcon } from '../components/icons';
import { Nav } from '../navigation/nav';
import { useStore } from '../store';
import { activityItems, currentUser, feedQueue, isPassOpen, memoryHighlights, userById } from '../selectors';
import { isActive, timeAgo } from '../lib/time';
import { Post } from '../types';

export function HomeScreen({ nav }: { nav: Nav }) {
  const insets = useSafeAreaInsets();
  useTick();

  const s = useStore();
  const markActivitySeen = useStore((st) => st.markActivitySeen);
  const open = isPassOpen(s);
  const me = currentUser(s);

  const queue = useMemo(() => feedQueue(s), [s.posts, s.feedStates, s.following, s.currentUserId]);
  const myActive = useMemo(
    () =>
      s.posts
        .filter((p) => p.userId === s.currentUserId && isActive(p.expiresAt))
        .sort((a, b) => b.createdAt - a.createdAt),
    [s.posts, s.currentUserId]
  );
  const memory = useMemo(() => memoryHighlights(s)[0], [s.posts, s.currentUserId]);
  const activity = useMemo(() => activityItems(s), [s.posts, s.views, s.reactions, s.following, s.currentUserId]);
  const unread = activity.filter((i) => i.at > s.lastSeenActivityAt).length;

  const count = queue.length;
  const followedLatest = queue[0];
  const heroPost = [myActive[0], followedLatest].filter((p): p is Post => !!p).sort((a, b) => b.createdAt - a.createdAt)[0];
  const heroIsMine = !!heroPost && heroPost.userId === s.currentUserId;

  const mediaMode = !open && !!followedLatest; // 未投稿：モザイク予告
  const openHero = open && !!heroPost; // 投稿済み：くっきり
  const showImage = mediaMode || openHero;

  const displayPost = mediaMode ? followedLatest : openHero ? heroPost : undefined;
  const displayAuthor = displayPost ? (displayPost.userId === s.currentUserId ? me : userById(s.users, displayPost.userId)) : undefined;
  const reactionsOf = (id: string) => s.reactions.filter((r) => r.postId === id).length;

  const onPhoto = showImage;
  const textColor = onPhoto ? colors.onMedia : colors.text;
  const dimColor = onPhoto ? colors.onMediaDim : colors.textDim;

  const [showActivity, setShowActivity] = useState(false);
  const [viewingMemory, setViewingMemory] = useState<Post[] | null>(null);
  const openActivity = () => {
    setShowActivity(true);
    markActivitySeen();
  };

  return (
    <View style={[styles.container, showImage && { backgroundColor: colors.surfaceMedia }]}>
      {showImage && (
        <>
          <MediaImage uri={displayPost?.imageUrl} blurRadius={mediaMode ? 32 : 0} />
          {mediaMode ? (
            <View style={styles.scrimFull} />
          ) : (
            <>
              <View style={styles.scrimTop} />
              <View style={styles.scrimBottom} />
            </>
          )}
          {openHero && heroPost?.caption && <CaptionView caption={heroPost.caption} safeTop={92} safeBottom={150} />}
        </>
      )}

      {/* ヘッダー */}
      <View style={[styles.header, { paddingTop: insets.top + space.md }]}>
        <Text style={[styles.brand, { color: textColor }]}>napsnap</Text>
        <View style={styles.headerRight}>
          <Pressable onPress={nav.openCamera} style={[styles.iconBtn, onPhoto ? styles.iconMedia : styles.iconLight]} hitSlop={8}>
            <CameraIcon size={20} color={textColor} />
          </Pressable>
          <Pressable onPress={openActivity} style={[styles.iconBtn, onPhoto ? styles.iconMedia : styles.iconLight]} hitSlop={8}>
            <BellIcon size={19} color={textColor} />
            {unread > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unread}</Text>
              </View>
            )}
          </Pressable>
          <Avatar user={me} size={36} />
        </View>
      </View>

      {/* 思い出の入口（1年前の今日 など） */}
      {memory && (
        <Pressable
          onPress={() => setViewingMemory([memory.post])}
          style={({ pressed }) => [styles.memoryCard, pressed && { backgroundColor: colors.surfaceSunken }]}
        >
          <Image source={{ uri: memory.post.imageUrl }} style={styles.memoryThumb} resizeMode="cover" />
          <View style={{ flex: 1, marginLeft: space.sm }}>
            <Text style={styles.memoryLabel}>{memory.label}</Text>
            <Text style={styles.memorySub} numberOfLines={1}>
              {memory.post.caption?.text ? memory.post.caption.text.replace(/\n/g, ' ') : 'あの日の痕跡'}
            </Text>
          </View>
          <ChevronRightIcon size={18} color={colors.textFaint} />
        </Pressable>
      )}

      {/* 中央 */}
      <View style={styles.center}>
        {open ? (
          heroPost ? null : (
            <>
              <Text style={[styles.big, { color: textColor }]}>{copy.allSeenTitle}</Text>
              <View style={{ height: space.md }} />
              <Remaining expiresAt={s.accessPass!.expiresAt} color={colors.text} size={15} />
            </>
          )
        ) : followedLatest ? (
          <>
            <View style={styles.lockChip}>
              <View style={styles.lockDot} />
              <Text style={styles.lockChipText}>{copy.revealChip}</Text>
            </View>
            <Text style={[styles.big, { color: textColor }]}>{copy.lockedHeadline}</Text>
            <Text style={[styles.sub, { color: dimColor }]}>{copy.lockedSub}</Text>
          </>
        ) : s.following.length === 0 ? (
          <>
            <Text style={[styles.big, { color: textColor }]}>{copy.noFollowing}</Text>
            <Text style={[styles.sub, { color: dimColor }]}>自分タブから、見たい人をフォロー。</Text>
          </>
        ) : (
          <>
            <Text style={[styles.big, { color: textColor }]}>{copy.lockedEmpty}</Text>
            <Text style={[styles.sub, { color: dimColor }]}>誰かが出したら、通知に届く。</Text>
          </>
        )}
      </View>

      {/* 投稿メタ（下部レール）：投稿者＋（投稿済み=残り時間 / 未投稿=リアクション数） */}
      {showImage && displayPost && displayAuthor && (
        <View style={[styles.heroRail, { bottom: insets.bottom + 88 }]} pointerEvents="none">
          <Avatar user={displayAuthor} size={32} blur={!openHero} />
          <View style={{ marginLeft: space.sm }}>
            {openHero ? (
              <>
                <Text style={styles.heroWhoText}>{heroIsMine ? 'あなたの今' : `${displayAuthor.displayName} たちの今`}</Text>
                <View style={{ marginTop: 3 }}>
                  <Remaining expiresAt={displayPost.expiresAt} color={colors.onMediaDim} size={12} />
                </View>
              </>
            ) : (
              <>
                <View style={styles.redactBar} />
                <Text style={styles.heroMeta}>
                  {reactionsOf(displayPost.id) > 0 ? `${reactionsOf(displayPost.id)}人が反応` : 'だれかの今'}
                </Text>
              </>
            )}
          </View>
        </View>
      )}

      {/* 下部CTA */}
      <View style={{ paddingHorizontal: space.lg, paddingBottom: insets.bottom + space.md }}>
        {open ? (
          count > 0 ? (
            <PrimaryButton label={copy.see} onPress={nav.openFeed} />
          ) : (
            <GhostButton label={copy.shoot} onPress={nav.openCamera} />
          )
        ) : (
          <PrimaryButton label={copy.shoot} onPress={nav.openCamera} />
        )}
      </View>

      {showActivity && (
        <ActivityOverlay
          items={activity}
          passOpen={open}
          onClose={() => setShowActivity(false)}
          onShoot={() => {
            setShowActivity(false);
            nav.openCamera();
          }}
        />
      )}
      {viewingMemory && <MemoryViewer posts={viewingMemory} onClose={() => setViewingMemory(null)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrimFull: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.38)' },
  scrimTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    experimental_backgroundImage: 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 100%)',
  } as any,
  scrimBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 260,
    experimental_backgroundImage: 'linear-gradient(0deg, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0) 100%)',
  } as any,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.lg,
  },
  brand: { fontSize: 26, fontWeight: '700', fontFamily: fonts.brand },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  iconLight: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.hairline },
  iconMedia: { backgroundColor: colors.mediaChip, borderWidth: 1, borderColor: colors.mediaChipBorder },
  bellBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 17,
    height: 17,
    borderRadius: radius.pill,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.bg,
  },
  bellBadgeText: { color: colors.limeInk, fontSize: 10, fontWeight: '900' },
  memoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: space.lg,
    marginTop: space.sm,
    padding: space.xs,
    paddingRight: space.sm,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    boxShadow: shadow.card,
  },
  memoryThumb: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.surfaceSunken },
  memoryLabel: { color: colors.text, fontSize: font.small, fontWeight: '900', fontFamily: fonts.ui },
  memorySub: { color: colors.textDim, fontSize: font.small, marginTop: 1, fontFamily: fonts.ui },
  center: { flex: 1, justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: space.lg },
  heroRail: { position: 'absolute', left: space.lg, right: space.lg, flexDirection: 'row', alignItems: 'center' },
  heroWhoText: { color: colors.onMedia, fontSize: font.body, fontWeight: '800', fontFamily: fonts.ui, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  heroMeta: { color: colors.onMediaDim, fontSize: font.small, fontWeight: '700', marginTop: 3, fontFamily: fonts.ui, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  redactBar: { width: 88, height: 13, borderRadius: 7, backgroundColor: 'rgba(255,253,247,0.5)' },
  big: { fontSize: font.display, fontWeight: '900', lineHeight: 58, fontFamily: fonts.display },
  sub: { fontSize: font.lead, marginTop: space.md, lineHeight: font.lead * 1.5, fontFamily: fonts.ui },
  lockChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.lime,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: space.lg,
    boxShadow: shadow.button,
  },
  lockDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.limeInk },
  lockChipText: { color: colors.limeInk, fontSize: font.small, fontWeight: '900', letterSpacing: 0.3 },
});
