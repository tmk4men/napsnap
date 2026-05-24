import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, space } from '../theme';
import { fonts } from '../lib/fonts';
import { copy } from '../copy';
import { Avatar, PrimaryButton, Pill, Remaining, useTick } from '../components/ui';
import { ReactionBar } from '../components/ReactionBar';
import { ChevronDownIcon, CloseIcon, SpeakerOffIcon, SpeakerOnIcon, TraceMark } from '../components/icons';
import { ChekiCard } from '../components/ChekiCard';
import { Nav } from '../navigation/nav';
import { useStore } from '../store';
import { feedQueue, isPassOpen, userById } from '../selectors';
import { timeAgo } from '../lib/time';
import { postHasSound, resolvePostAudioSource } from '../lib/audio';
import { ReactionType } from '../types';

const NATIVE = Platform.OS !== 'web';

export function FeedScreen({ nav }: { nav: Nav }) {
  const insets = useSafeAreaInsets();
  useTick();

  const s = useStore();
  const markViewed = useStore((st) => st.markViewed);
  const reactToPost = useStore((st) => st.reactToPost);
  const skipPost = useStore((st) => st.skipPost);

  const open = isPassOpen(s);
  const queue = useMemo(() => feedQueue(s), [s.posts, s.feedStates, s.following, s.currentUserId]);
  const post = queue[0];
  const author = userById(s.users, post?.userId);

  useEffect(() => {
    if (post && open) markViewed(post.id);
  }, [post?.id, open]);

  // この投稿の2.5秒の音を表示時に1回再生（ロック中は鳴らさない）
  const audioSrc = useMemo(() => resolvePostAudioSource(post), [post?.id]);
  const hasSound = postHasSound(post) && open;
  const player = useAudioPlayer(audioSrc ?? null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (!audioSrc || !open) return;
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
  }, [audioSrc, open]);

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

  // 下スワイプ記号のふわっとバウンス（説明文の代わり）
  const bounce = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: 1, duration: 750, useNativeDriver: NATIVE }),
        Animated.timing(bounce, { toValue: 0, duration: 750, useNativeDriver: NATIVE }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);
  const bounceY = bounce.interpolate({ inputRange: [0, 1], outputRange: [0, 5] });
  const bounceOpacity = bounce.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.85] });

  const ty = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const sizeRef = useRef({ w: 0, h: 0 });
  const [stageW, setStageW] = useState(0);
  const postRef = useRef(post);
  postRef.current = post;
  useEffect(() => {
    ty.setValue(0);
    cardOpacity.setValue(0);
    Animated.timing(cardOpacity, { toValue: 1, duration: 300, useNativeDriver: NATIVE }).start();
  }, [post?.id]);

  const doSkip = () => {
    const p = postRef.current;
    if (p) skipPost(p.id);
  };
  const doReact = (type: ReactionType) => {
    const p = postRef.current;
    if (p) reactToPost(p.id, type);
  };

  const responder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 10 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => ty.setValue(g.dy),
      onPanResponderRelease: (_, g) => {
        if (Math.abs(g.dy) > 90) {
          Animated.timing(ty, { toValue: g.dy < 0 ? -800 : 800, duration: 160, useNativeDriver: NATIVE }).start(() => doSkip());
        } else {
          Animated.spring(ty, { toValue: 0, useNativeDriver: NATIVE }).start();
        }
      },
    })
  ).current;

  if (!post) {
    return (
      <View style={[styles.done, { paddingTop: insets.top, paddingBottom: insets.bottom + space.lg }]}>
        <View style={styles.doneCenter}>
          <TraceMark size={52} />
          <Text style={styles.doneTitle}>{copy.feedDoneTitle}</Text>
          <Text style={styles.doneSub}>{copy.feedDoneSub}</Text>
        </View>
        <View style={{ gap: space.xs }}>
          <PrimaryButton label={copy.close} onPress={nav.closeOverlay} />
        </View>
      </View>
    );
  }

  const cardW = Math.min(Math.max(0, stageW - 72), 320);

  return (
    <View style={styles.container}>
      {/* 上部 */}
      <View style={[styles.top, { paddingTop: insets.top + space.sm }]}>
        <Pressable onPress={nav.closeOverlay} style={styles.iconBtn} hitSlop={12}>
          <CloseIcon size={18} color={colors.text} />
        </Pressable>
        <View style={styles.topRight}>
          <Pressable onPress={hasSound ? toggleSound : undefined} style={[styles.iconBtn, !hasSound && { opacity: 0.4 }]} hitSlop={8}>
            {hasSound && !muted ? <SpeakerOnIcon size={18} color={colors.text} /> : <SpeakerOffIcon size={18} color={colors.text} />}
          </Pressable>
          <Pill>のこり {queue.length}</Pill>
        </View>
      </View>

      {/* チェキ */}
      <View
        style={styles.stage}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          sizeRef.current = { w: width, h: height };
          setStageW(width);
        }}
      >
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: cardOpacity, transform: [{ translateY: ty }] }]} {...responder.panHandlers}>
          <Pressable style={styles.center} onPress={replaySound}>
            {cardW > 0 && (
              <ChekiCard
                uri={post.imageUrl}
                caption={open ? post.caption : undefined}
                width={cardW}
                date={open ? post.createdAt : undefined}
                tiltSeed={post.id}
                blur={!open}
                redactStrip={!open}
              />
            )}
            <View style={styles.metaRow}>
              <Avatar user={author} size={28} blur={!open} />
              {open ? (
                <>
                  <Text style={styles.metaName}>{author?.displayName ?? '友達'}</Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.metaAgo}>{timeAgo(post.createdAt)}</Text>
                  <View style={{ marginLeft: 6 }}>
                    <Remaining expiresAt={post.expiresAt} color={colors.warn} size={12} />
                  </View>
                </>
              ) : (
                <View style={styles.redactBar} />
              )}
            </View>
          </Pressable>
        </Animated.View>
      </View>

      {/* 下部 */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + space.md }]}>
        {open ? (
          <>
            <ReactionBar onReact={doReact} />
            <Pressable onPress={doSkip} style={styles.skip} hitSlop={10}>
              <Animated.View style={{ alignItems: 'center', transform: [{ translateY: bounceY }], opacity: bounceOpacity }}>
                <ChevronDownIcon size={24} color={colors.textDim} />
                <View style={{ marginTop: -14 }}>
                  <ChevronDownIcon size={24} color={colors.textDim} />
                </View>
              </Animated.View>
            </Pressable>
          </>
        ) : (
          <View style={styles.relock}>
            <Text style={styles.relockText}>6時間が終わった。もう1枚でひらく。</Text>
            <PrimaryButton label={copy.shoot} onPress={() => nav.openCamera()} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  stage: { flex: 1, overflow: 'hidden' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaName: { color: colors.text, fontSize: font.body, fontWeight: '800', fontFamily: fonts.ui },
  metaDot: { color: colors.textFaint, fontSize: font.small },
  metaAgo: { color: colors.textDim, fontSize: font.small, fontWeight: '600' },
  redactBar: { width: 96, height: 13, borderRadius: 7, backgroundColor: colors.surfaceSunken },
  bottom: { paddingHorizontal: space.md, gap: space.sm, alignItems: 'center' },
  skip: { alignItems: 'center', justifyContent: 'center', paddingVertical: space.xs },
  relock: { gap: space.sm, alignSelf: 'stretch' },
  relockText: { color: colors.textDim, fontSize: font.small, fontWeight: '700', textAlign: 'center' },

  // done
  done: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.lg },
  doneCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.xs },
  doneTitle: { color: colors.text, fontSize: font.title, fontWeight: '900', marginTop: space.sm },
  doneSub: { color: colors.textDim, fontSize: font.body, textAlign: 'center' },
});
