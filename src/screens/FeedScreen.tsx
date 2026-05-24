import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Image,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, space } from '../theme';
import { copy } from '../copy';
import { Avatar, GhostButton, Pill, PrimaryButton, useTick } from '../components/ui';
import { ReactionBar } from '../components/ReactionBar';
import { Nav } from '../navigation/nav';
import { useStore } from '../store';
import { feedQueue, isPassOpen, userById } from '../selectors';
import { formatRemaining, timeAgo } from '../lib/time';
import { ReactionType } from '../types';

const NATIVE = Platform.OS !== 'web';

export function FeedScreen({ nav }: { nav: Nav }) {
  const insets = useSafeAreaInsets();
  useTick();

  const s = useStore();
  const markViewed = useStore((st) => st.markViewed);
  const reactToPost = useStore((st) => st.reactToPost);
  const skipPost = useStore((st) => st.skipPost);

  const queue = useMemo(
    () => feedQueue(s),
    [s.posts, s.feedStates, s.group, s.currentUserId]
  );
  const post = queue[0];
  const author = userById(s.users, post?.userId);

  // 表示した瞬間に足跡を残す
  useEffect(() => {
    if (post) markViewed(post.id);
  }, [post?.id]);

  const ty = useRef(new Animated.Value(0)).current;
  const postRef = useRef(post);
  postRef.current = post;

  // 投稿が切り替わったら位置をリセット
  useEffect(() => {
    ty.setValue(0);
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
          Animated.timing(ty, {
            toValue: g.dy < 0 ? -800 : 800,
            duration: 160,
            useNativeDriver: NATIVE,
          }).start(() => doSkip());
        } else {
          Animated.spring(ty, { toValue: 0, useNativeDriver: NATIVE }).start();
        }
      },
    })
  ).current;

  if (!post) {
    return (
      <View style={[styles.container, styles.center, { padding: space.lg }]}>
        <Text style={styles.doneEmoji}>🟡</Text>
        <Text style={styles.doneTitle}>{copy.feedDone}</Text>
        <Text style={styles.doneSub}>
          友達の痕跡は全部見た。{'\n'}
          {isPassOpen(s)
            ? `パスは残り ${formatRemaining(s.accessPass!.expiresAt)}。`
            : 'また1枚出すと、6時間ひらく。'}
        </Text>
        <View style={{ height: space.lg }} />
        <PrimaryButton label="もう1枚撮る" onPress={nav.openCamera} />
        <GhostButton label="とじる" onPress={nav.closeOverlay} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.card, { transform: [{ translateY: ty }] }]}
        {...responder.panHandlers}
      >
        <Image source={{ uri: post.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <View style={styles.shade} />

        {/* 上部：閉じる＋残り＋残数 */}
        <View style={[styles.top, { paddingTop: insets.top + space.sm }]}>
          <Pressable onPress={nav.closeOverlay} style={styles.close} hitSlop={12}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
          <Pill tone="dark">残り {queue.length}</Pill>
        </View>

        {/* 投稿者 */}
        <View style={[styles.author, { bottom: insets.bottom + 220 }]}>
          <Avatar user={author} size={44} />
          <View style={{ marginLeft: space.sm }}>
            <Text style={styles.authorName}>{author?.displayName ?? '友達'}</Text>
            <Text style={styles.time}>{timeAgo(post.createdAt)}・流したら戻れない</Text>
          </View>
        </View>
      </Animated.View>

      {/* 下部：リアクション＋流す */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + space.md }]}>
        <ReactionBar onReact={doReact} />
        <Pressable onPress={doSkip} style={styles.skip} hitSlop={8}>
          <Text style={styles.skipText}>↓ 反応せず流す</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  center: { alignItems: 'center', justifyContent: 'center' },
  card: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.surface },
  shade: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.18)' },
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
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: colors.white, fontSize: 18, fontWeight: '700' },
  author: { position: 'absolute', left: space.lg, flexDirection: 'row', alignItems: 'center' },
  authorName: { color: colors.white, fontSize: font.lead, fontWeight: '800' },
  time: { color: 'rgba(255,255,255,0.75)', fontSize: font.small, marginTop: 2 },
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: space.md,
    gap: space.sm,
  },
  skip: { alignItems: 'center', paddingVertical: space.sm },
  skipText: { color: 'rgba(255,255,255,0.7)', fontSize: font.body, fontWeight: '700' },
  doneEmoji: { fontSize: 56, marginBottom: space.md },
  doneTitle: { color: colors.white, fontSize: font.title, fontWeight: '900' },
  doneSub: {
    color: colors.gray,
    fontSize: font.body,
    textAlign: 'center',
    marginTop: space.sm,
    lineHeight: font.body * 1.6,
  },
});
