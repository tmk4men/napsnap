import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, rule, space } from '../theme';
import { fonts } from '../lib/fonts';
import { ChekiCard } from './ChekiCard';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, SaveDeviceIcon, SpeakerOnIcon } from './icons';
import { Post } from '../types';
import { postHasSound, resolvePostAudioSource } from '../lib/audio';
import { saveChekiToDevice } from '../lib/share';

function fmtDate(ts: number): string {
  const d = new Date(ts);
  const w = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}（${w}）`;
}

// 思い出（過去の自分の投稿）をチェキで見返す。写真タップで音を再生（自動再生はしない）。
export function MemoryViewer({ posts, onClose }: { posts: Post[]; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [i, setI] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const idx = Math.min(i, posts.length - 1);
  const post = posts[idx];

  const audioSrc = useMemo(() => resolvePostAudioSource(post), [post?.id]);
  const player = useAudioPlayer(audioSrc ?? null);
  const hasSound = postHasSound(post);
  const [stageW, setStageW] = useState(0);
  const cardW = Math.min(Math.max(0, stageW - 72), 300);

  const playSound = () => {
    if (!audioSrc) return;
    try {
      player.seekTo(0);
      player.play();
    } catch {}
  };

  const saveToDevice = async () => {
    if (saving || !post) return;
    setSaving(true);
    const ok = await saveChekiToDevice(post);
    setSaving(false);
    if (ok) {
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1400);
    }
  };

  if (!post) return null;

  return (
    <View style={styles.container}>
      <View style={[styles.top, { paddingTop: insets.top + space.sm }]}>
        <Pressable onPress={onClose} style={styles.iconBtn} hitSlop={12}>
          <CloseIcon size={18} color={colors.text} />
        </Pressable>
        {posts.length > 1 && (
          <Text style={styles.counter}>
            {idx + 1} / {posts.length}
          </Text>
        )}
        <View style={styles.topRight}>
          {hasSound && (
            <Pressable onPress={playSound} style={styles.iconBtn} hitSlop={8}>
              <SpeakerOnIcon size={18} color={colors.text} />
            </Pressable>
          )}
          <Pressable
            onPress={saveToDevice}
            disabled={saving}
            style={[styles.iconBtn, saving && { opacity: 0.5 }]}
            hitSlop={8}
            accessibilityLabel="端末に保存"
          >
            <SaveDeviceIcon size={18} color={colors.text} />
          </Pressable>
        </View>
      </View>
      {savedFlash && (
        <View pointerEvents="none" style={styles.toast}>
          <Text style={styles.toastText}>保存しました</Text>
        </View>
      )}

      <View style={styles.stage} onLayout={(e) => setStageW(e.nativeEvent.layout.width)}>
        <Pressable style={styles.center} onPress={playSound}>
          {cardW > 0 && <ChekiCard uri={post.imageUrl} caption={post.caption} width={cardW} date={post.createdAt} tiltSeed={post.id} />}
        </Pressable>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + space.lg }]}>
        <Text style={styles.date}>{fmtDate(post.createdAt)}</Text>
        {posts.length > 1 && (
          <View style={styles.nav}>
            <Pressable onPress={() => setI(Math.max(0, idx - 1))} disabled={idx === 0} style={[styles.navBtn, idx === 0 && styles.navOff]}>
              <ChevronLeftIcon size={18} color={colors.text} />
            </Pressable>
            <Pressable
              onPress={() => setI(Math.min(posts.length - 1, idx + 1))}
              disabled={idx === posts.length - 1}
              style={[styles.navBtn, idx === posts.length - 1 && styles.navOff]}
            >
              <ChevronRightIcon size={18} color={colors.text} />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.bg },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.xs,
    backgroundColor: colors.surfaceRaised,
    borderWidth: rule.hair,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: { color: colors.textDim, fontSize: font.small, fontWeight: '500', fontFamily: fonts.handle },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  toast: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xs,
    borderWidth: rule.hair,
    borderColor: colors.hairline,
    paddingHorizontal: space.md,
    paddingVertical: 10,
  },
  toastText: { color: colors.text, fontSize: font.small, fontWeight: '700', fontFamily: fonts.ui },
  stage: { flex: 1, paddingHorizontal: space.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bottom: { paddingHorizontal: space.lg, alignItems: 'center', gap: space.sm },
  date: { color: colors.text, fontSize: font.lead, fontWeight: '500', fontFamily: fonts.handle, letterSpacing: 0.5 },
  nav: { flexDirection: 'row', gap: space.md },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.xs,
    backgroundColor: colors.surfaceRaised,
    borderWidth: rule.hair,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navOff: { opacity: 0.35 },
});
