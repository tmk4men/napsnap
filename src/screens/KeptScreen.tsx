import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, PanResponder, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, space } from '../theme';
import { fonts } from '../lib/fonts';
import { copy, reactionMeta } from '../copy';
import { Avatar, GhostButton, Remaining, useTick } from '../components/ui';
import { Nav } from '../navigation/nav';
import { ReactionIcon, SpeakerOffIcon, SpeakerOnIcon, TraceMark } from '../components/icons';
import { CaptionView } from '../components/Caption';
import { MediaImage } from '../components/MediaImage';
import { useStore } from '../store';
import { keptPosts, userById } from '../selectors';
import { timeAgo } from '../lib/time';
import { postHasSound, resolvePostAudioSource } from '../lib/audio';

const NATIVE = Platform.OS !== 'web';

export function KeptScreen({ nav }: { nav: Nav }) {
  const insets = useSafeAreaInsets();
  useTick(30000);
  const s = useStore();
  const kept = useMemo(() => keptPosts(s), [s.reactions, s.posts, s.currentUserId]);

  const [index, setIndex] = useState(0);
  const safeIndex = Math.min(index, Math.max(0, kept.length - 1));
  const current = kept[safeIndex];

  // 現在の投稿の音を自動再生（ループ）。ミュートは手動で切り替えられる。
  const audioSrc = useMemo(() => resolvePostAudioSource(current?.post), [current?.post.id]);
  const hasSound = postHasSound(current?.post);
  const player = useAudioPlayer(audioSrc ?? null);
  const [muted, setMuted] = useState(false);
  // 表示時に1回だけ再生（自動ループしない）。もう一度は画像タップで。
  useEffect(() => {
    if (!audioSrc) return;
    try {
      player.loop = false;
      player.muted = muted;
      player.seekTo(0);
      player.play();
    } catch {}
    return () => {
      try {
        player.pause();
      } catch {}
    };
  }, [audioSrc]);

  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    try {
      player.muted = next;
      if (!next) {
        player.seekTo(0);
        player.play();
      }
    } catch {}
  };

  const replaySound = () => {
    if (!hasSound || muted) return;
    try {
      player.seekTo(0);
      player.play();
    } catch {}
  };

  const ty = useRef(new Animated.Value(0)).current;
  const hRef = useRef(0);
  const idxRef = useRef(safeIndex);
  idxRef.current = safeIndex;
  const lenRef = useRef(kept.length);
  lenRef.current = kept.length;

  const go = (dir: number) => {
    const len = lenRef.current;
    const i = idxRef.current;
    const H = hRef.current || 640;
    const target = i + dir;
    if (target < 0 || target >= len) {
      Animated.spring(ty, { toValue: 0, useNativeDriver: NATIVE }).start();
      return;
    }
    Animated.timing(ty, { toValue: dir > 0 ? -H : H, duration: 170, useNativeDriver: NATIVE }).start(() => {
      setIndex(target);
      idxRef.current = target;
      ty.setValue(dir > 0 ? H : -H);
      Animated.timing(ty, { toValue: 0, duration: 170, useNativeDriver: NATIVE }).start();
    });
  };

  const responder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 10 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => ty.setValue(g.dy * 0.5),
      onPanResponderRelease: (_, g) => {
        if (g.dy < -90) go(1);
        else if (g.dy > 90) go(-1);
        else Animated.spring(ty, { toValue: 0, useNativeDriver: NATIVE }).start();
      },
    })
  ).current;

  if (kept.length === 0) {
    return (
      <View style={styles.empty}>
        <TraceMark size={48} />
        <Text style={styles.emptySub}>{copy.emptyKeptSub}</Text>
        <View style={{ height: space.md }} />
        <GhostButton label={copy.shoot} onPress={nav.openCamera} />
      </View>
    );
  }

  const author = userById(s.users, current.post.userId);
  const meta = reactionMeta(current.reaction.type);

  return (
    <View style={styles.container} onLayout={(e) => (hRef.current = e.nativeEvent.layout.height)}>
      <Animated.View style={[styles.card, { transform: [{ translateY: ty }] }]} {...responder.panHandlers}>
        <MediaImage uri={current.post.imageUrl} />
        <Pressable style={StyleSheet.absoluteFill} onPress={replaySound} />
        <View style={styles.shadeTop} pointerEvents="none" />
        <View style={styles.shadeBottom} pointerEvents="none" />
        {current.post.caption && <CaptionView caption={current.post.caption} safeTop={84} safeBottom={130} />}

        {/* 上部：何件中いくつ＋あなたの反応 */}
        <View style={[styles.top, { paddingTop: insets.top + space.sm }]}>
          <View style={styles.topLeft}>
            <Text style={styles.count}>
              {safeIndex + 1} / {kept.length}
            </Text>
            <Pressable
              onPress={hasSound ? toggleSound : undefined}
              style={[styles.soundBtn, !hasSound && { opacity: 0.4 }]}
              hitSlop={8}
            >
              {hasSound && !muted ? (
                <SpeakerOnIcon size={16} color={colors.onMedia} />
              ) : (
                <SpeakerOffIcon size={16} color={colors.onMedia} />
              )}
            </Pressable>
          </View>
          <View style={styles.reactBadge}>
            <ReactionIcon type={current.reaction.type} size={16} color={colors.lime} />
            <Text style={styles.reactLabel}>{meta.label}</Text>
          </View>
        </View>

        {/* 下部：投稿者＋残り */}
        <View style={styles.author} pointerEvents="none">
          <Avatar user={author} size={40} />
          <View style={{ marginLeft: space.sm, flex: 1 }}>
            <Text style={styles.authorName}>{author?.displayName ?? '友達'}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{timeAgo(current.post.createdAt)}</Text>
              <Remaining expiresAt={current.post.expiresAt} color={colors.onMedia} size={12} />
            </View>
          </View>
        </View>

        <Text style={styles.swipeHint} pointerEvents="none">↑↓ めくる</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceMedia, overflow: 'hidden' },
  card: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.surfaceMedia },
  shadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    experimental_backgroundImage: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 100%)',
  } as any,
  shadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 220,
    experimental_backgroundImage: 'linear-gradient(0deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)',
  } as any,
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
  },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  soundBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.mediaChip,
    borderWidth: 1,
    borderColor: colors.mediaChipBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: { color: colors.onMedia, fontSize: font.small, fontWeight: '800' },
  reactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.mediaChip,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(207,234,69,0.4)',
  },
  reactLabel: { color: colors.lime, fontSize: font.small, fontWeight: '800', fontFamily: fonts.ui },
  author: { position: 'absolute', left: space.lg, right: space.lg, bottom: space.xl + space.md, flexDirection: 'row', alignItems: 'center' },
  authorName: { color: colors.onMedia, fontSize: font.lead, fontWeight: '800', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 3 },
  metaText: { color: colors.onMediaDim, fontSize: font.small, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  swipeHint: {
    position: 'absolute',
    bottom: space.md,
    alignSelf: 'center',
    color: colors.onMediaDim,
    fontSize: font.tiny,
    fontWeight: '700',
  },
  empty: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: space.lg, gap: space.xs },
  emptyTitle: { color: colors.text, fontSize: font.lead, fontWeight: '800', marginTop: space.sm },
  emptySub: { color: colors.textDim, fontSize: font.body, textAlign: 'center', marginTop: space.sm, lineHeight: font.body * 1.6 },
});
