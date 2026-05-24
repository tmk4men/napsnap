import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, space } from '../theme';
import { copy } from '../copy';
import { GhostButton, PrimaryButton } from '../components/ui';
import { SpeakerOnIcon } from '../components/icons';
import { Nav } from '../navigation/nav';
import { useStore } from '../store';

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
      <Text style={styles.heading}>{copy.previewTitle}</Text>
      <View style={styles.imageWrap}>
        <Image source={{ uri }} style={styles.image} resizeMode="cover" />
        <Pressable
          onPress={playClip}
          disabled={!audioUri}
          style={[styles.soundChip, status.playing && styles.soundChipOn, !audioUri && styles.soundChipOff]}
        >
          <SpeakerOnIcon size={16} color={status.playing ? colors.limeInk : colors.onMedia} />
          <Text style={[styles.soundText, status.playing && { color: colors.limeInk }]}>
            {!audioUri ? copy.noMic : status.playing ? copy.previewPlaying : copy.previewPlay}
          </Text>
        </Pressable>
      </View>
      <Text style={styles.note}>{copy.previewNote}</Text>
      <View style={{ paddingBottom: insets.bottom + space.md, gap: space.xs }}>
        <PrimaryButton label={copy.post} onPress={post} />
        {canRetake && <GhostButton label={copy.retake} onPress={nav.retake} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.lg },
  heading: { color: colors.text, fontSize: font.title, fontWeight: '900', marginBottom: space.md },
  imageWrap: { flex: 1, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.card },
  image: { width: '100%', height: '100%' },
  soundChip: {
    position: 'absolute',
    left: space.md,
    bottom: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.mediaChip,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  soundChipOn: { backgroundColor: colors.lime },
  soundChipOff: { backgroundColor: colors.mediaChip },
  soundText: { color: colors.onMedia, fontSize: font.body, fontWeight: '800' },
  note: { color: colors.textDim, fontSize: font.body, textAlign: 'center', lineHeight: font.body * 1.6, paddingVertical: space.lg },
});
