import React, { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, shadow, space } from '../theme';
import { fonts } from '../lib/fonts';
import { copy } from '../copy';
import { Avatar, GhostButton, PrimaryButton, Remaining, ShootButton, useTick } from '../components/ui';
import { ChekiCard } from '../components/ChekiCard';
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
        .filter((p) => p.userId === s.currentUserId && !p.topicKey && isActive(p.expiresAt))
        .sort((a, b) => a.expiresAt - b.expiresAt),
    [s.posts, s.currentUserId]
  );
  const memory = useMemo(() => memoryHighlights(s)[0], [s.posts, s.currentUserId]);
  const activity = useMemo(() => activityItems(s), [s.posts, s.views, s.reactions, s.following, s.currentUserId]);
  const unread = activity.filter((i) => i.at > s.lastSeenActivityAt).length;

  const count = queue.length;
  const followedLatest = queue[0]; // 残りが短い順の先頭
  // ヒーロー：自分／フォロー中の中で「残りが短い」投稿を出す
  const heroPost = [myActive[0], followedLatest].filter((p): p is Post => !!p).sort((a, b) => a.expiresAt - b.expiresAt)[0];
  const heroIsMine = !!heroPost && heroPost.userId === s.currentUserId;

  const mediaMode = !open && !!followedLatest; // 未投稿：チェキをモザイク予告
  const openHero = open && !!heroPost; // 投稿済み：くっきり
  const showCard = mediaMode || openHero;

  const displayPost = mediaMode ? followedLatest : openHero ? heroPost : undefined;
  const displayAuthor = displayPost ? (displayPost.userId === s.currentUserId ? me : userById(s.users, displayPost.userId)) : undefined;
  const reactionsOf = (id: string) => s.reactions.filter((r) => r.postId === id).length;

  const [stageW, setStageW] = useState(0);
  const cardW = Math.min(Math.max(0, stageW - 96), 240);

  const [showActivity, setShowActivity] = useState(false);
  const [viewingMemory, setViewingMemory] = useState<Post[] | null>(null);
  const openActivity = () => {
    setShowActivity(true);
    markActivitySeen();
  };

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={[styles.header, { paddingTop: insets.top + space.md }]}>
        <Text style={styles.brand}>napsnap</Text>
        <View style={styles.headerRight}>
          <Pressable onPress={() => nav.openCamera()} style={styles.iconBtn} hitSlop={8}>
            <CameraIcon size={20} color={colors.text} />
          </Pressable>
          <Pressable onPress={openActivity} style={styles.iconBtn} hitSlop={8}>
            <BellIcon size={19} color={colors.text} />
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

      {/* 中央：チェキのヒーロー or メッセージ */}
      <View style={styles.stage} onLayout={(e) => setStageW(e.nativeEvent.layout.width)}>
        {showCard && displayPost ? (
          <View style={styles.heroWrap}>
            {mediaMode && (
              <View style={styles.lockChip}>
                <View style={styles.lockDot} />
                <Text style={styles.lockChipText}>{copy.revealChip}</Text>
              </View>
            )}
            {cardW > 0 && (
              <ChekiCard
                uri={displayPost.imageUrl}
                caption={openHero ? displayPost.caption : undefined}
                width={cardW}
                date={openHero ? displayPost.createdAt : undefined}
                tiltSeed={displayPost.id}
                blur={mediaMode}
                redactStrip={mediaMode}
              />
            )}
            <View style={styles.metaRow}>
              <Avatar user={displayAuthor} size={26} blur={mediaMode} />
              {openHero ? (
                <>
                  <Text style={styles.metaName}>{heroIsMine ? 'あなたの今' : `${displayAuthor?.displayName} たちの今`}</Text>
                  <View style={{ marginLeft: 6 }}>
                    <Remaining expiresAt={displayPost.expiresAt} color={colors.textDim} size={12} />
                  </View>
                </>
              ) : (
                <Text style={styles.metaName}>
                  {reactionsOf(displayPost.id) > 0 ? `${reactionsOf(displayPost.id)}人が反応` : 'だれかの今'}
                </Text>
              )}
            </View>
          </View>
        ) : open ? (
          <View style={styles.msg}>
            <Text style={styles.big}>{copy.allSeenTitle}</Text>
            <View style={{ height: space.md }} />
            <Remaining expiresAt={s.accessPass!.expiresAt} color={colors.text} size={15} />
          </View>
        ) : s.following.length === 0 ? (
          <View style={styles.msg}>
            <Text style={styles.big}>{copy.noFollowing}</Text>
            <Text style={styles.sub}>自分タブから、見たい人をフォロー。</Text>
          </View>
        ) : (
          <View style={styles.msg}>
            <Text style={styles.big}>{copy.lockedEmpty}</Text>
            <Text style={styles.sub}>誰かが出したら、通知に届く。</Text>
          </View>
        )}
      </View>

      {/* 下部CTA */}
      <View style={{ paddingHorizontal: space.lg, paddingBottom: insets.bottom + space.md }}>
        {open ? (
          count > 0 ? (
            <PrimaryButton label={copy.see} onPress={nav.openFeed} />
          ) : (
            <GhostButton label={copy.shoot} onPress={() => nav.openCamera()} />
          )
        ) : (
          <ShootButton block onPress={() => nav.openCamera()} />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.lg,
  },
  brand: { fontSize: 26, fontWeight: '700', fontFamily: fonts.brand, color: colors.text },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
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
  bellBadgeText: { color: colors.limeInk, fontSize: 10, fontWeight: '800' },
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
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg },
  heroWrap: { alignItems: 'center', gap: space.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaName: { color: colors.text, fontSize: font.body, fontWeight: '800', fontFamily: fonts.ui },
  msg: { alignItems: 'flex-start', alignSelf: 'stretch' },
  big: { fontSize: font.display, fontWeight: '800', lineHeight: 56, fontFamily: fonts.display, color: colors.text },
  sub: { fontSize: font.lead, marginTop: space.md, lineHeight: font.lead * 1.5, fontFamily: fonts.ui, color: colors.textDim },
  lockChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.limeSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.limeLine,
  },
  lockDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.limeDust },
  lockChipText: { color: colors.limeInkSoft, fontSize: font.small, fontWeight: '800', fontFamily: fonts.ui },
});
