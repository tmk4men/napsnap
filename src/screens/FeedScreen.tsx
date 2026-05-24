import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, PanResponder, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, space } from '../theme';
import { copy } from '../copy';
import { Avatar, GhostButton, Pill, Remaining, useTick } from '../components/ui';
import { ReactionBar } from '../components/ReactionBar';
import { ChevronDownIcon, SpeakerOffIcon, SpeakerOnIcon, TraceMark } from '../components/icons';
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
    if (post) markViewed(post.id);
  }, [post?.id]);

  // この投稿の2.5秒の音をループ再生（ロック中は鳴らさない）
  const audioSrc = useMemo(() => resolvePostAudioSource(post), [post?.id]);
  const hasSound = postHasSound(post) && open;
  const player = useAudioPlayer(audioSrc ?? null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (!audioSrc || !open) return;
    try {
      player.loop = true;
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
      if (!next) player.play();
    } catch {}
  };

  const ty = useRef(new Animated.Value(0)).current;
  const postRef = useRef(post);
  postRef.current = post;
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
      <View style={[styles.done, { paddingTop: insets.top, paddingBottom: insets.bottom + space.lg }]}>
        <View style={styles.doneCenter}>
          <TraceMark size={52} />
          <Text style={styles.doneTitle}>{copy.feedDoneTitle}</Text>
          <Text style={styles.doneSub}>{copy.feedDoneSub}</Text>
        </View>
        <GhostButton label={copy.close} onPress={nav.closeOverlay} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.card, { transform: [{ translateY: ty }] }]} {...responder.panHandlers}>
        <Image
          source={{ uri: post.imageUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          blurRadius={open ? 0 : 40}
        />
        <View style={styles.shadeTop} />
        <View style={styles.shadeBottom} />

        {/* 上部 */}
        <View style={[styles.top, { paddingTop: insets.top + space.sm }]}>
          <Pressable onPress={nav.closeOverlay} style={styles.close} hitSlop={12}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
          <View style={styles.topRight}>
            <Pressable
              onPress={hasSound ? toggleSound : undefined}
              style={[styles.iconBtn, !hasSound && { opacity: 0.4 }]}
              hitSlop={8}
            >
              {hasSound && !muted ? (
                <SpeakerOnIcon size={18} color={colors.onMedia} />
              ) : (
                <SpeakerOffIcon size={18} color={colors.onMedia} />
              )}
            </Pressable>
            <Pill tone="media">のこり {queue.length}</Pill>
          </View>
        </View>

        {/* 投稿者＋残り時間（時計） */}
        <View style={[styles.author, { bottom: insets.bottom + 224 }]}>
          <Avatar user={author} size={44} />
          <View style={{ marginLeft: space.sm, flex: 1 }}>
            <Text style={styles.authorName}>{author?.displayName ?? '友達'}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{timeAgo(post.createdAt)}</Text>
              <Remaining expiresAt={post.expiresAt} color={colors.onMedia} size={12} />
            </View>
          </View>
        </View>
      </Animated.View>

      {/* 下部：リアクション＋流す */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + space.md }]}>
        <ReactionBar onReact={doReact} />
        <Pressable onPress={doSkip} style={styles.skip} hitSlop={8}>
          <ChevronDownIcon size={16} color={colors.onMediaDim} />
          <Text style={styles.skipText}>{copy.swipeAway}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceMedia },
  card: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.surfaceMedia },
  shadeTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 120, backgroundColor: 'rgba(0,0,0,0.25)' },
  shadeBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 320, backgroundColor: 'rgba(0,0,0,0.35)' },
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
    backgroundColor: colors.mediaChip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: colors.onMedia, fontSize: 18, fontWeight: '700' },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.mediaChip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  author: { position: 'absolute', left: space.lg, right: space.lg, flexDirection: 'row', alignItems: 'center' },
  authorName: { color: colors.onMedia, fontSize: font.lead, fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 4 },
  metaText: { color: colors.onMediaDim, fontSize: font.small, fontWeight: '600' },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: space.md, gap: space.sm },
  skip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: space.sm },
  skipText: { color: colors.onMediaDim, fontSize: font.body, fontWeight: '700' },

  // done
  done: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.lg },
  doneCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.xs },
  doneTitle: { color: colors.text, fontSize: font.title, fontWeight: '900', marginTop: space.sm },
  doneSub: { color: colors.textDim, fontSize: font.body, textAlign: 'center' },
});
