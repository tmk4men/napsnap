import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, PanResponder, Platform, StyleSheet, Text, View } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, space } from '../theme';
import { copy, reactionMeta } from '../copy';
import { Avatar, Remaining, useTick } from '../components/ui';
import { ReactionIcon } from '../components/icons';
import { useStore } from '../store';
import { keptPosts, userById } from '../selectors';
import { timeAgo } from '../lib/time';
import { resolvePostAudioSource } from '../lib/audio';

const NATIVE = Platform.OS !== 'web';

export function KeptScreen() {
  const insets = useSafeAreaInsets();
  useTick(30000);
  const s = useStore();
  const kept = useMemo(() => keptPosts(s), [s.reactions, s.posts, s.currentUserId]);

  const [index, setIndex] = useState(0);
  const safeIndex = Math.min(index, Math.max(0, kept.length - 1));
  const current = kept[safeIndex];

  // 現在の投稿の音を自動再生（ループ）
  const audioSrc = useMemo(() => resolvePostAudioSource(current?.post), [current?.post.id]);
  const player = useAudioPlayer(audioSrc ?? null);
  useEffect(() => {
    if (!audioSrc) return;
    try {
      player.loop = true;
      player.seekTo(0);
      player.play();
    } catch {}
    return () => {
      try {
        player.pause();
      } catch {}
    };
  }, [audioSrc]);

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
        <View style={styles.emptyMark} />
        <Text style={styles.emptyTitle}>{copy.emptyKept}</Text>
        <Text style={styles.emptySub}>{copy.emptyKeptSub}</Text>
      </View>
    );
  }

  const author = userById(s.users, current.post.userId);
  const meta = reactionMeta(current.reaction.type);

  return (
    <View style={styles.container} onLayout={(e) => (hRef.current = e.nativeEvent.layout.height)}>
      <Animated.View style={[styles.card, { transform: [{ translateY: ty }] }]} {...responder.panHandlers}>
        <Image source={{ uri: current.post.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <View style={styles.shadeTop} />
        <View style={styles.shadeBottom} />

        {/* 上部：何件中いくつ＋あなたの反応 */}
        <View style={[styles.top, { paddingTop: insets.top + space.sm }]}>
          <Text style={styles.count}>
            {safeIndex + 1} / {kept.length}
          </Text>
          <View style={styles.reactBadge}>
            <ReactionIcon type={current.reaction.type} size={16} color={colors.limeInk} />
            <Text style={styles.reactLabel}>{meta.label}</Text>
          </View>
        </View>

        {/* 下部：投稿者＋残り */}
        <View style={styles.author}>
          <Avatar user={author} size={40} />
          <View style={{ marginLeft: space.sm, flex: 1 }}>
            <Text style={styles.authorName}>{author?.displayName ?? '友達'}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{timeAgo(current.post.createdAt)}</Text>
              <Remaining expiresAt={current.post.expiresAt} color={colors.onMedia} size={12} />
            </View>
          </View>
        </View>

        <Text style={styles.swipeHint}>↑↓ めくる</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', overflow: 'hidden' },
  card: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#111' },
  shadeTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 110, backgroundColor: 'rgba(0,0,0,0.3)' },
  shadeBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 200, backgroundColor: 'rgba(0,0,0,0.4)' },
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
  count: { color: colors.onMedia, fontSize: font.small, fontWeight: '800' },
  reactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.lime,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  reactLabel: { color: colors.limeInk, fontSize: font.small, fontWeight: '900' },
  author: { position: 'absolute', left: space.lg, right: space.lg, bottom: space.xl + space.md, flexDirection: 'row', alignItems: 'center' },
  authorName: { color: colors.onMedia, fontSize: font.lead, fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 3 },
  metaText: { color: colors.onMediaDim, fontSize: font.small, fontWeight: '600' },
  swipeHint: {
    position: 'absolute',
    bottom: space.md,
    alignSelf: 'center',
    color: colors.onMediaDim,
    fontSize: font.tiny,
    fontWeight: '700',
  },
  empty: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: space.lg },
  emptyMark: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.card, marginBottom: space.md },
  emptyTitle: { color: colors.text, fontSize: font.lead, fontWeight: '800' },
  emptySub: { color: colors.textDim, fontSize: font.body, textAlign: 'center', marginTop: space.sm, lineHeight: font.body * 1.6 },
});
