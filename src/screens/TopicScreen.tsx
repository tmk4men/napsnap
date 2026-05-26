import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, rule, space } from '../theme';
import { fonts } from '../lib/fonts';
import { Avatar, Remaining, useTick } from '../components/ui';
import { Backdrop } from '../components/Backdrop';
import { ChekiCard } from '../components/ChekiCard';
import { OfficialCard } from '../components/OfficialCard';
import { TopicNote } from '../components/TopicNote';
import { ReactionBar } from '../components/ReactionBar';
import { PlusIcon } from '../components/icons';
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
  const markTopicSeen = useStore((st) => st.markTopicSeen);

  // お題タブを開いたら「今日のお題」通知を既読にする。
  useEffect(() => {
    markTopicSeen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const topic = todaysTopic();
  const posts = useMemo(() => topicPosts(s, topic.key), [s.posts, topic.key]);
  const official = s.users.find((u) => u.isOfficial);

  const [index, setIndex] = useState(0);
  const safeIndex = Math.min(index, Math.max(0, posts.length - 1));
  const current = posts[safeIndex];
  const mine = current ? myReaction(s, current.id) : undefined;

  // 現在の投稿の音を、表示時に1回だけ再生。タップで聞き直せる（オン/オフ切替は無し）。
  const audioSrc = useMemo(() => resolvePostAudioSource(current), [current?.id]);
  const hasSound = postHasSound(current);
  const player = useAudioPlayer(audioSrc ?? null);
  useEffect(() => {
    if (!audioSrc) return;
    try {
      player.loop = false;
      player.seekTo(0);
      player.play();
    } catch {}
    return () => {
      try {
        player.pause();
      } catch {}
    };
  }, [audioSrc]);

  const replaySound = () => {
    if (!hasSound) return;
    try {
      player.seekTo(0);
      player.play();
    } catch {}
  };

  // --- 上下スワイプ（何度でも見返せる）---
  const ty = useRef(new Animated.Value(0)).current;
  const sizeRef = useRef({ w: 0, h: 0 });
  const [stageW, setStageW] = useState(0);
  const [stageH, setStageH] = useState(0);
  const idxRef = useRef(safeIndex);
  idxRef.current = safeIndex;
  const lenRef = useRef(posts.length);
  lenRef.current = posts.length;

  const go = (dir: number) => {
    const len = lenRef.current;
    if (len <= 1) {
      Animated.spring(ty, { toValue: 0, useNativeDriver: NATIVE }).start();
      return;
    }
    const i = idxRef.current;
    const H = sizeRef.current.h || 560;
    const target = (i + dir + len) % len; // 端を越えたら反対端へループ（最後→先頭 / 先頭→最後）
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
  // 横幅と、縦に収まる高さの両方から決める。下にリアクションボタン用の余白を残す。
  const cardW = Math.max(0, Math.min(stageW - 72, Math.floor((stageH - 150) / 1.31), 300));

  return (
    <View style={[styles.container, { paddingTop: insets.top + space.sm }]}>
      <Backdrop />
      {/* 今日のお題（出すボタンは右下の＋に集約） */}
      <View style={styles.noteWrap}>
        <TopicNote prompt={topic.prompt} />
      </View>

      {/* スワイプ領域 */}
      <View
        style={styles.stage}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          sizeRef.current = { w: width, h: height };
          setStageW(width);
          setStageH(height);
        }}
      >
        {posts.length === 0 ? (
          <View style={styles.empty}>
            <OfficialCard official={official} message="最初の一枚を出してみよう" width={cardW} mosaic />
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
      </View>

      {/* リアクション（※残すには入らない）。バーは無し、ボタンだけ浮かせる。 */}
      {posts.length > 0 && current && (
        <View style={[styles.reactFloat, { bottom: insets.bottom + space.lg }]} pointerEvents="box-none">
          <ReactionBar key={current.id} selected={mine} onReact={(t) => reactToTopic(current.id, t)} />
        </View>
      )}

      {/* このお題に出す＝右下のプラス */}
      <Pressable
        onPress={() => nav.openCamera(topic.key)}
        style={({ pressed }) => [styles.fab, { bottom: insets.bottom + space.lg }, pressed && { transform: [{ scale: 0.94 }] }]}
        hitSlop={8}
      >
        <PlusIcon size={28} color={colors.limeInk} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  noteWrap: { paddingHorizontal: space.lg, paddingTop: space.xs, paddingBottom: space.sm },
  fab: {
    position: 'absolute',
    right: space.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: rule.hair,
    borderColor: colors.limeDust,
    boxShadow: '0 8px 20px rgba(0,0,0,0.20)',
  },
  stage: { flex: 1, overflow: 'hidden' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.sm, paddingBottom: 96 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaName: { color: colors.text, fontSize: font.body, fontWeight: '800', fontFamily: fonts.serif, letterSpacing: -0.5 },
  metaDot: { color: colors.textFaint, fontSize: font.small },
  metaAgo: { color: colors.textDim, fontSize: font.small, fontWeight: '500', fontFamily: fonts.handle },
  reactFloat: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, paddingHorizontal: space.lg },
});
