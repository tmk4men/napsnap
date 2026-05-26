import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, rule, space } from '../theme';
import { fonts } from '../lib/fonts';
import { copy, reactionMeta } from '../copy';
import { Avatar, Remaining, useTick } from '../components/ui';
import { Backdrop } from '../components/Backdrop';
import { Nav } from '../navigation/nav';
import { ReactionIcon, SpeakerOffIcon, SpeakerOnIcon } from '../components/icons';
import { ChekiCard } from '../components/ChekiCard';
import { OfficialCard } from '../components/OfficialCard';
import { useStore } from '../store';
import { keptPosts, userById } from '../selectors';
import { timeAgo } from '../lib/time';
import { postHasSound, resolvePostAudioSource } from '../lib/audio';

const NATIVE = Platform.OS !== 'web';

export function KeptScreen({ nav }: { nav: Nav }) {
  const insets = useSafeAreaInsets();
  const { width: winW } = useWindowDimensions();
  useTick(30000);
  const s = useStore();
  const kept = useMemo(() => keptPosts(s), [s.reactions, s.posts, s.currentUserId]);

  const [index, setIndex] = useState(0);
  const safeIndex = Math.min(index, Math.max(0, kept.length - 1));
  const current = kept[safeIndex];

  const audioSrc = useMemo(() => resolvePostAudioSource(current?.post), [current?.post.id]);
  const hasSound = postHasSound(current?.post);
  const player = useAudioPlayer(audioSrc ?? null);
  const [muted, setMuted] = useState(false);
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
  const sizeRef = useRef({ w: 0, h: 0 });
  const [stageW, setStageW] = useState(0);
  const idxRef = useRef(safeIndex);
  idxRef.current = safeIndex;
  const lenRef = useRef(kept.length);
  lenRef.current = kept.length;

  const go = (dir: number) => {
    const len = lenRef.current;
    const i = idxRef.current;
    const H = sizeRef.current.h || 560;
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
    const official = s.users.find((u) => u.isOfficial);
    return (
      <View style={styles.empty}>
        <Backdrop />
        <OfficialCard official={official} message={copy.emptyKeptSub} width={Math.min(winW - 80, 300)} />
      </View>
    );
  }

  const author = userById(s.users, current.post.userId);
  const meta = reactionMeta(current.reaction.type);
  const cardW = Math.min(Math.max(0, stageW - 72), 300);

  return (
    <View style={[styles.container, { paddingTop: insets.top + space.sm }]}>
      <Backdrop />
      {/* 上部：何件中いくつ＋音＋あなたの反応 */}
      <View style={styles.top}>
        <View style={styles.topLeft}>
          <Text style={styles.count}>
            {safeIndex + 1} / {kept.length}
          </Text>
          <Pressable onPress={hasSound ? toggleSound : undefined} style={[styles.soundBtn, !hasSound && { opacity: 0.4 }]} hitSlop={8}>
            {hasSound && !muted ? <SpeakerOnIcon size={16} color={colors.text} /> : <SpeakerOffIcon size={16} color={colors.text} />}
          </Pressable>
        </View>
        <View style={styles.reactBadge}>
          <ReactionIcon type={current.reaction.type} size={15} color={colors.limeInkSoft} />
          <Text style={styles.reactLabel}>{meta.label}</Text>
        </View>
      </View>

      {/* チェキ（上下スワイプで見返す） */}
      <View
        style={styles.stage}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          sizeRef.current = { w: width, h: height };
          setStageW(width);
        }}
      >
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: ty }] }]} {...responder.panHandlers}>
          <Pressable style={styles.center} onPress={replaySound}>
            {cardW > 0 && (
              <ChekiCard uri={current.post.imageUrl} caption={current.post.caption} width={cardW} date={current.post.createdAt} tiltSeed={current.post.id} />
            )}
            <View style={styles.metaRow}>
              <Avatar user={author} size={26} />
              <Text style={styles.metaName}>{author?.displayName ?? '友達'}</Text>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaAgo}>{timeAgo(current.post.createdAt)}</Text>
              <View style={{ marginLeft: 6 }}>
                <Remaining expiresAt={current.post.expiresAt} color={colors.warn} size={12} />
              </View>
            </View>
          </Pressable>
        </Animated.View>
      </View>

      <Text style={styles.swipeHint}>↑↓ めくる</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
  },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  soundBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.xs,
    backgroundColor: colors.surfaceRaised,
    borderWidth: rule.hair,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: { color: colors.textDim, fontSize: font.small, fontWeight: '500', fontFamily: fonts.handle },
  reactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.limeSoft,
    borderRadius: radius.xs,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: rule.hair,
    borderColor: colors.limeLine,
  },
  reactLabel: { color: colors.limeInkSoft, fontSize: font.small, fontWeight: '700', fontFamily: fonts.ui },
  stage: { flex: 1, overflow: 'hidden' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaName: { color: colors.text, fontSize: font.body, fontWeight: '800', fontFamily: fonts.serif, letterSpacing: -0.5 },
  metaDot: { color: colors.textFaint, fontSize: font.small },
  metaAgo: { color: colors.textDim, fontSize: font.small, fontWeight: '500', fontFamily: fonts.handle },
  swipeHint: {
    alignSelf: 'center',
    color: colors.textFaint,
    fontSize: font.tiny,
    fontWeight: '700',
    paddingBottom: space.sm,
  },
  empty: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: space.lg, gap: space.xs },
});
