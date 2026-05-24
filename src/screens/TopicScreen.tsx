import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, space } from '../theme';
import { fonts } from '../lib/fonts';
import { copy } from '../copy';
import { Avatar, Remaining, useTick } from '../components/ui';
import { ChekiCard } from '../components/ChekiCard';
import { TopicNote } from '../components/TopicNote';
import { ReactionBar } from '../components/ReactionBar';
import { PencilIcon, SpeakerOffIcon, SpeakerOnIcon, TraceMark } from '../components/icons';
import { Nav } from '../navigation/nav';
import { useStore } from '../store';
import { myReaction, topicPosts, userById } from '../selectors';
import { todaysTopic } from '../topics';
import { timeAgo } from '../lib/time';
import { postHasSound, resolvePostAudioSource } from '../lib/audio';

const NATIVE = Platform.OS !== 'web';

export function TopicScreen({ nav }: { nav: Nav }) {
  const insets = useSafeAreaInsets();
  useTick(30000);
  const s = useStore();
  const reactToTopic = useStore((st) => st.reactToTopic);

  const topic = todaysTopic();
  const posts = useMemo(() => topicPosts(s, topic.key), [s.posts, topic.key]);

  const [index, setIndex] = useState(0);
  const safeIndex = Math.min(index, Math.max(0, posts.length - 1));
  const current = posts[safeIndex];
  const mine = current ? myReaction(s, current.id) : undefined;

  // 現在の投稿の音を、表示時に1回だけ再生（ミュート可）。
  const audioSrc = useMemo(() => resolvePostAudioSource(current), [current?.id]);
  const hasSound = postHasSound(current);
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

  // --- 上下スワイプ（何度でも見返せる）---
  const ty = useRef(new Animated.Value(0)).current;
  const sizeRef = useRef({ w: 0, h: 0 });
  const [stageW, setStageW] = useState(0);
  const idxRef = useRef(safeIndex);
  idxRef.current = safeIndex;
  const lenRef = useRef(posts.length);
  lenRef.current = posts.length;

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

  const author = current ? userById(s.users, current.userId) : undefined;
  const cardW = Math.min(Math.max(0, stageW - 72), 300);

  return (
    <View style={[styles.container, { paddingTop: insets.top + space.sm }]}>
      {/* 今日のお題（ノートの切れ端）。出すボタンは紙の中に。 */}
      <View style={styles.noteWrap}>
        <TopicNote prompt={topic.prompt} bg={colors.bg}>
          <Pressable
            onPress={() => nav.openCamera(topic.key)}
            style={({ pressed }) => [styles.joinBtn, pressed && { transform: [{ scale: 0.97 }] }]}
          >
            <PencilIcon size={15} color={colors.limeInk} />
            <Text style={styles.joinText}>{copy.topicJoin}</Text>
          </Pressable>
        </TopicNote>
      </View>

      {/* スワイプ領域 */}
      <View
        style={styles.stage}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          sizeRef.current = { w: width, h: height };
          setStageW(width);
        }}
      >
        {posts.length === 0 ? (
          <View style={styles.empty}>
            <TraceMark size={44} color={colors.line} />
            <Text style={styles.emptyTitle}>{copy.topicEmpty}</Text>
            <Text style={styles.emptySub}>{copy.topicEmptySub}</Text>
          </View>
        ) : (
          <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: ty }] }]} {...responder.panHandlers}>
            <Pressable style={styles.center} onPress={replaySound}>
              {cardW > 0 && current && (
                <ChekiCard uri={current.imageUrl} caption={current.caption} width={cardW} date={current.createdAt} tiltSeed={current.id} />
              )}
              {author && (
                <View style={styles.metaRow}>
                  <Avatar user={author} size={24} />
                  <Text style={styles.metaName}>{author.displayName}</Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.metaAgo}>{timeAgo(current.createdAt)}</Text>
                  <View style={{ marginLeft: 6 }}>
                    <Remaining expiresAt={current.expiresAt} color={colors.warn} size={12} />
                  </View>
                </View>
              )}
            </Pressable>
          </Animated.View>
        )}

        {/* 音だけ（何枚目かは出さない） */}
        {posts.length > 0 && (
          <View style={styles.hud} pointerEvents="box-none">
            <Pressable onPress={hasSound ? toggleSound : undefined} style={[styles.soundBtn, !hasSound && { opacity: 0.4 }]} hitSlop={8}>
              {hasSound && !muted ? <SpeakerOnIcon size={16} color={colors.text} /> : <SpeakerOffIcon size={16} color={colors.text} />}
            </Pressable>
          </View>
        )}
      </View>

      {/* リアクション（※残すには入らない）。バーは無し、ボタンだけ浮かせる。 */}
      {posts.length > 0 && current && (
        <View style={[styles.reactFloat, { bottom: insets.bottom + space.lg }]} pointerEvents="box-none">
          <ReactionBar key={current.id} selected={mine} onReact={(t) => reactToTopic(current.id, t)} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  noteWrap: { paddingHorizontal: space.lg, paddingTop: space.xs, paddingBottom: space.sm },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.lime,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(24,26,13,0.10)',
    boxShadow: '0 6px 14px rgba(96,109,31,0.18)',
  },
  joinText: { color: colors.limeInk, fontSize: font.small, fontWeight: '900', fontFamily: fonts.ui },
  stage: { flex: 1, overflow: 'hidden' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaName: { color: colors.text, fontSize: font.small, fontWeight: '800', fontFamily: fonts.ui },
  metaDot: { color: colors.textFaint, fontSize: font.small },
  metaAgo: { color: colors.textDim, fontSize: font.small, fontWeight: '600' },
  hud: {
    position: 'absolute',
    top: space.xs,
    left: space.lg,
    right: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  soundBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactFloat: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.xs, paddingHorizontal: space.lg },
  emptyTitle: { color: colors.text, fontSize: font.lead, fontWeight: '800', marginTop: space.sm, fontFamily: fonts.ui },
  emptySub: { color: colors.textDim, fontSize: font.body, textAlign: 'center', fontFamily: fonts.ui },
});
