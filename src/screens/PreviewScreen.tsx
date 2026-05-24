import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, space } from '../theme';
import { copy } from '../copy';
import { GhostButton, PrimaryButton } from '../components/ui';
import { CaptionEditor, CaptionView } from '../components/Caption';
import { SpeakerOnIcon, TextIcon } from '../components/icons';
import { Nav } from '../navigation/nav';
import { useStore } from '../store';
import { PostCaption } from '../types';
import { countFaces } from '../lib/faceCheck';

const DEFAULT_CAPTION: PostCaption = { text: '', fontKey: 'hand', color: '#FFFDF7', x: 0.5, y: 0.5 };

export function PreviewScreen({
  uri,
  audioUri,
  canRetake,
  nav,
}: {
  uri: string;
  audioUri?: string;
  canRetake: boolean;
  nav: Nav;
}) {
  const insets = useSafeAreaInsets();
  const addPost = useStore((s) => s.addPost);
  const player = useAudioPlayer(audioUri ?? null);
  const status = useAudioPlayerStatus(player);

  const [caption, setCaption] = useState<PostCaption>(DEFAULT_CAPTION);
  const [editing, setEditing] = useState(false);
  const hasCaption = caption.text.trim().length > 0;

  // 投稿前の顔チェック（Web=MediaPipe / ネイティブは本番で端末側に差し替え）
  const [faces, setFaces] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    setFaces(null);
    countFaces(uri).then((n) => {
      if (alive) setFaces(n);
    });
    return () => {
      alive = false;
    };
  }, [uri]);
  const checking = faces === null;
  const hasFace = (faces ?? 0) > 0;
  const canPost = !checking && !hasFace;

  function postIt() {
    if (!canPost) return;
    try {
      player.pause();
    } catch {}
    addPost(uri, audioUri, hasCaption ? caption : undefined);
    nav.onPosted();
  }

  function playClip() {
    if (!audioUri) return;
    try {
      player.seekTo(0);
      player.play();
    } catch {}
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <View style={styles.scrimTop} pointerEvents="none" />

      {hasCaption && !editing && <CaptionView caption={caption} safeTop={84} safeBottom={200} />}

      {!editing && (
        <View style={[styles.top, { paddingTop: insets.top + space.md }]}>
          <Text style={styles.heading}>{copy.previewTitle}</Text>
          <Pressable onPress={playClip} disabled={!audioUri} style={[styles.soundChip, status.playing && styles.soundChipOn]}>
            <SpeakerOnIcon size={15} color={status.playing ? colors.limeInk : colors.onMedia} />
            <Text style={[styles.soundText, status.playing && { color: colors.limeInk }]}>
              {!audioUri ? copy.noMic : status.playing ? copy.previewPlaying : copy.previewPlay}
            </Text>
          </Pressable>
        </View>
      )}

      {editing && <CaptionEditor value={caption} onChange={setCaption} onDone={() => setEditing(false)} />}

      {!editing && (
        <View style={[styles.sheet, { paddingBottom: insets.bottom + space.md }]}>
          <View style={styles.grabber} />
          <Pressable onPress={() => setEditing(true)} style={({ pressed }) => [styles.textBtn, pressed && styles.textBtnPressed]}>
            <TextIcon size={16} color={colors.text} />
            <Text style={styles.textBtnLabel}>{hasCaption ? '文字を編集' : '文字を入れる'}</Text>
          </Pressable>

          {hasFace ? (
            <View style={styles.warn}>
              <View style={styles.warnDot} />
              <Text style={styles.warnText}>顔が写ってるかも。napsnapは顔なしで。</Text>
            </View>
          ) : checking ? (
            <Text style={styles.checking}>顔がないか確認中…</Text>
          ) : null}

          {hasFace ? (
            <PrimaryButton label="撮り直す" onPress={nav.retake} />
          ) : (
            <PrimaryButton label={checking ? '確認中…' : copy.post} onPress={postIt} disabled={!canPost} />
          )}
          {canRetake && !hasFace && <GhostButton label={copy.retake} onPress={nav.retake} style={{ marginTop: space.xs }} />}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceMedia },
  scrimTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 160, backgroundColor: 'rgba(0,0,0,0.32)' },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
  },
  heading: { color: colors.onMedia, fontSize: font.title, fontWeight: '900' },
  soundChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.mediaChip,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colors.mediaChipBorder,
  },
  soundChipOn: { backgroundColor: colors.lime, borderColor: 'rgba(24,26,13,0.10)' },
  soundText: { color: colors.onMedia, fontSize: font.small, fontWeight: '800' },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    gap: space.xs,
    boxShadow: '0 -10px 30px rgba(0,0,0,0.22)',
  },
  grabber: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.line, alignSelf: 'center', marginBottom: space.sm },
  textBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colors.hairline,
    marginBottom: space.xs,
  },
  textBtnPressed: { backgroundColor: colors.surfaceSunken },
  textBtnLabel: { color: colors.text, fontSize: font.body, fontWeight: '800' },
  warn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(217,71,63,0.12)',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(217,71,63,0.4)',
    marginBottom: space.xs,
  },
  warnDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.warn },
  warnText: { color: colors.warn, fontSize: font.small, fontWeight: '800' },
  checking: { color: colors.textDim, fontSize: font.small, fontWeight: '700', textAlign: 'center', marginBottom: space.xs },
});
