import React, { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, space } from '../theme';
import { CaptionView } from './Caption';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, SpeakerOnIcon } from './icons';
import { Post } from '../types';
import { postHasSound, resolvePostAudioSource } from '../lib/audio';

function fmtDate(ts: number): string {
  const d = new Date(ts);
  const w = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}（${w}）`;
}

// 思い出（過去の自分の投稿）を全画面で見返す。画像タップで音を再生（自動再生はしない）。
export function MemoryViewer({ posts, onClose }: { posts: Post[]; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [i, setI] = useState(0);
  const idx = Math.min(i, posts.length - 1);
  const post = posts[idx];

  const audioSrc = useMemo(() => resolvePostAudioSource(post), [post?.id]);
  const player = useAudioPlayer(audioSrc ?? null);
  const hasSound = postHasSound(post);

  const playSound = () => {
    if (!audioSrc) return;
    try {
      player.seekTo(0);
      player.play();
    } catch {}
  };

  if (!post) return null;

  return (
    <View style={styles.container}>
      <Pressable style={StyleSheet.absoluteFill} onPress={playSound}>
        <Image source={{ uri: post.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      </Pressable>
      <View style={styles.scrimTop} pointerEvents="none" />
      <View style={styles.scrimBottom} pointerEvents="none" />

      {post.caption && <CaptionView caption={post.caption} safeTop={84} safeBottom={130} />}

      <View style={[styles.top, { paddingTop: insets.top + space.sm }]}>
        <Pressable onPress={onClose} style={styles.iconBtn} hitSlop={12}>
          <CloseIcon size={18} color={colors.onMedia} />
        </Pressable>
        {posts.length > 1 && (
          <Text style={styles.counter}>
            {idx + 1} / {posts.length}
          </Text>
        )}
        {hasSound ? (
          <Pressable onPress={playSound} style={styles.iconBtn} hitSlop={8}>
            <SpeakerOnIcon size={18} color={colors.onMedia} />
          </Pressable>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + space.lg }]}>
        <Text style={styles.date}>{fmtDate(post.createdAt)}</Text>
        {posts.length > 1 && (
          <View style={styles.nav}>
            <Pressable onPress={() => setI(Math.max(0, idx - 1))} disabled={idx === 0} style={[styles.navBtn, idx === 0 && styles.navOff]}>
              <ChevronLeftIcon size={18} color={colors.onMedia} />
            </Pressable>
            <Pressable
              onPress={() => setI(Math.min(posts.length - 1, idx + 1))}
              disabled={idx === posts.length - 1}
              style={[styles.navBtn, idx === posts.length - 1 && styles.navOff]}
            >
              <ChevronRightIcon size={18} color={colors.onMedia} />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.surfaceMedia },
  scrimTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 120, backgroundColor: 'rgba(0,0,0,0.3)' },
  scrimBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 180, backgroundColor: 'rgba(0,0,0,0.4)' },
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
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.mediaChip,
    borderWidth: 1,
    borderColor: colors.mediaChipBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  close: { color: colors.onMedia, fontSize: 18, fontWeight: '700' },
  counter: { color: colors.onMedia, fontSize: font.small, fontWeight: '800' },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: space.lg, alignItems: 'center', gap: space.sm },
  date: { color: colors.onMedia, fontSize: font.lead, fontWeight: '800' },
  nav: { flexDirection: 'row', gap: space.md },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.mediaChip,
    borderWidth: 1,
    borderColor: colors.mediaChipBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navOff: { opacity: 0.35 },
});
