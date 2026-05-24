import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, space } from '../theme';
import { copy, PASS_HOURS } from '../copy';
import { GhostButton, PrimaryButton } from '../components/ui';
import { Nav } from '../navigation/nav';
import { useStore } from '../store';

export function PreviewScreen({
  uri,
  audioUri,
  nav,
}: {
  uri: string;
  audioUri?: string;
  nav: Nav;
}) {
  const insets = useSafeAreaInsets();
  const addPost = useStore((s) => s.addPost);
  const player = useAudioPlayer(audioUri ?? null);
  const status = useAudioPlayerStatus(player);

  function post() {
    try {
      player.pause();
    } catch {}
    addPost(uri, audioUri);
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
    <View style={[styles.container, { paddingTop: insets.top + space.md }]}>
      <Text style={styles.heading}>この1枚を出す？</Text>
      <View style={styles.imageWrap}>
        <Image source={{ uri }} style={styles.image} resizeMode="cover" />
        {/* 音の確認チップ（写真の上に重ねる） */}
        <Pressable
          onPress={playClip}
          disabled={!audioUri}
          style={[styles.soundChip, status.playing && styles.soundChipOn, !audioUri && styles.soundChipOff]}
        >
          <Text style={[styles.soundText, status.playing && { color: colors.black }]}>
            {!audioUri ? `🔇 ${copy.noMic}` : status.playing ? `◼ ${copy.previewPlaying}` : `▶ ${copy.previewPlay}`}
          </Text>
        </Pressable>
      </View>
      <Text style={styles.note}>
        シャッターの瞬間＋直後2.5秒の音が一緒に残る。{'\n'}
        出すと{PASS_HOURS}時間だけ友達の痕跡がひらく（投稿は24時間で消える）。
      </Text>
      <View style={{ paddingBottom: insets.bottom + space.md, gap: space.xs }}>
        <PrimaryButton label={copy.post} onPress={post} />
        <GhostButton label={copy.retake} onPress={nav.openCamera} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black, paddingHorizontal: space.lg },
  heading: {
    color: colors.white,
    fontSize: font.title,
    fontWeight: '900',
    marginBottom: space.md,
  },
  imageWrap: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  image: { width: '100%', height: '100%' },
  soundChip: {
    position: 'absolute',
    left: space.md,
    bottom: space.md,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  soundChipOn: { backgroundColor: colors.lime },
  soundChipOff: { backgroundColor: 'rgba(255,255,255,0.12)' },
  soundText: { color: colors.white, fontSize: font.body, fontWeight: '800' },
  note: {
    color: colors.gray,
    fontSize: font.body,
    textAlign: 'center',
    lineHeight: font.body * 1.6,
    paddingVertical: space.lg,
  },
});
