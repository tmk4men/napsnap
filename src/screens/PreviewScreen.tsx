import React, { useState } from 'react';
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

const DEFAULT_CAPTION: PostCaption = { text: '', fontKey: 'hand', color: '#FFFDF7', pos: 'center' };

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

  function postIt() {
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

      {hasCaption && !editing && <CaptionView caption={caption} />}

      {/* 上部：見出し＋音 */}
      {!editing && (
        <View style={[styles.top, { paddingTop: insets.top + space.md }]}>
          <Text style={styles.heading}>{copy.previewTitle}</Text>
          <Pressable
            onPress={playClip}
            disabled={!audioUri}
            style={[styles.soundChip, status.playing && styles.soundChipOn]}
          >
            <SpeakerOnIcon size={15} color={status.playing ? colors.limeInk : colors.onMedia} />
            <Text style={[styles.soundText, status.playing && { color: colors.limeInk }]}>
              {!audioUri ? copy.noMic : status.playing ? copy.previewPlaying : copy.previewPlay}
            </Text>
          </Pressable>
        </View>
      )}

      {/* 文字入れ編集モード */}
      {editing && (
        <CaptionEditor value={caption} onChange={setCaption} onDone={() => setEditing(false)} />
      )}

      {/* 下部シート */}
      {!editing && (
        <View style={[styles.sheet, { paddingBottom: insets.bottom + space.md }]}>
          <Pressable onPress={() => setEditing(true)} style={({ pressed }) => [styles.textBtn, pressed && styles.textBtnPressed]}>
            <TextIcon size={16} color={colors.text} />
            <Text style={styles.textBtnLabel}>{hasCaption ? '文字を編集' : '文字を入れる'}</Text>
          </Pressable>
          <Text style={styles.note}>{copy.previewNote}</Text>
          <PrimaryButton label={copy.post} onPress={postIt} />
          {canRetake && <GhostButton label={copy.retake} onPress={nav.retake} style={{ marginTop: space.xs }} />}
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
  note: { color: colors.textDim, fontSize: font.body, textAlign: 'center', lineHeight: font.body * 1.6, paddingBottom: space.sm },
});
