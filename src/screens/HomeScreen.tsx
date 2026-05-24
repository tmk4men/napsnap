import React, { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, shadow, space } from '../theme';
import { fonts } from '../lib/fonts';
import { copy } from '../copy';
import { Avatar, GhostButton, PrimaryButton, Remaining, useTick } from '../components/ui';
import { CaptionView } from '../components/Caption';
import { ActivityOverlay } from '../components/ActivityOverlay';
import { BellIcon, CameraIcon } from '../components/icons';
import { Nav } from '../navigation/nav';
import { useStore } from '../store';
import { activityItems, currentUser, feedQueue, isPassOpen, userById } from '../selectors';
import { isActive } from '../lib/time';
import { Post } from '../types';

export function HomeScreen({ nav }: { nav: Nav }) {
  const insets = useSafeAreaInsets();
  useTick();

  const s = useStore();
  const markActivitySeen = useStore((st) => st.markActivitySeen);
  const open = isPassOpen(s);
  const me = currentUser(s);

  const [showActivity, setShowActivity] = useState(false);
  const activity = useMemo(
    () => activityItems(s),
    [s.posts, s.views, s.reactions, s.following, s.currentUserId]
  );
  const unread = activity.filter((i) => i.at > s.lastSeenActivityAt).length;
  const openActivity = () => {
    setShowActivity(true);
    markActivitySeen();
  };

  const queue = useMemo(
    () => feedQueue(s),
    [s.posts, s.feedStates, s.following, s.currentUserId]
  );
  const myActive = useMemo(
    () =>
      s.posts
        .filter((p) => p.userId === s.currentUserId && isActive(p.expiresAt))
        .sort((a, b) => b.createdAt - a.createdAt),
    [s.posts, s.currentUserId]
  );

  const count = queue.length;
  const followedLatest = queue[0];
  const heroPost = [myActive[0], followedLatest]
    .filter((p): p is Post => !!p)
    .sort((a, b) => b.createdAt - a.createdAt)[0];
  const heroIsMine = !!heroPost && heroPost.userId === s.currentUserId;
  const heroAuthor = heroIsMine ? me : userById(s.users, heroPost?.userId);

  const mediaMode = !open && !!followedLatest;
  const openHero = open && !!heroPost;
  const showImage = mediaMode || openHero;
  const heroImage = mediaMode ? followedLatest?.imageUrl : heroPost?.imageUrl;

  const onPhoto = showImage;
  const textColor = onPhoto ? colors.onMedia : colors.text;
  const dimColor = onPhoto ? colors.onMediaDim : colors.textDim;

  return (
    <View style={[styles.container, showImage && { backgroundColor: colors.surfaceMedia }]}>
      {showImage && (
        <>
          <Image source={{ uri: heroImage }} style={StyleSheet.absoluteFill} blurRadius={mediaMode ? 28 : 0} resizeMode="cover" />
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
          <Pressable
            onPress={nav.openCamera}
            style={[styles.camBtn, onPhoto ? styles.camBtnMedia : styles.camBtnLight]}
            hitSlop={8}
          >
            <CameraIcon size={20} color={textColor} />
          </Pressable>
          <Pressable
            onPress={openActivity}
            style={[styles.camBtn, onPhoto ? styles.camBtnMedia : styles.camBtnLight]}
            hitSlop={8}
          >
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

      {/* 中央（ヒーローのときは下のレールに出すので空） */}
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
        ) : (
          <Text style={[styles.big, { color: textColor }]}>{copy.lockedEmpty}</Text>
        )}
      </View>

      {/* ヒーローの投稿メタ（下部レール） */}
      {openHero && heroPost && heroAuthor && (
        <View style={[styles.heroRail, { bottom: insets.bottom + 88 }]} pointerEvents="none">
          <Avatar user={heroAuthor} size={32} />
          <View style={{ marginLeft: space.sm }}>
            <Text style={styles.heroWhoText}>{heroIsMine ? 'あなたの今' : `${heroAuthor.displayName} たちの今`}</Text>
            <View style={{ marginTop: 3 }}>
              <Remaining expiresAt={heroPost.expiresAt} color={colors.onMediaDim} size={12} />
            </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrimFull: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.34)' },
  scrimTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 170, backgroundColor: 'rgba(0,0,0,0.30)' },
  scrimBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 300, backgroundColor: 'rgba(0,0,0,0.48)' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.lg,
  },
  brand: { fontSize: 26, fontWeight: '700', fontFamily: fonts.brand },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  camBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  camBtnLight: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.hairline },
  camBtnMedia: { backgroundColor: colors.mediaChip, borderWidth: 1, borderColor: colors.mediaChipBorder },
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: space.lg },
  heroRail: { position: 'absolute', left: space.lg, right: space.lg, flexDirection: 'row', alignItems: 'center' },
  heroWhoText: { color: colors.onMedia, fontSize: font.body, fontWeight: '800', fontFamily: fonts.ui },
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
