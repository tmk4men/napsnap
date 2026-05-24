import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { colors, font, radius } from '../theme';
import { SpeakerOffIcon, SpeakerOnIcon } from './icons';

// タップで1つずつ再生する共有プレイヤー（自分タブ用）。単一プレイヤーを使い回す。
export function useClipPlayer() {
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [activeId, setActiveId] = useState<string | null>(null);

  const play = (id: string, source: string) => {
    try {
      if (activeId === id && status.playing) {
        player.pause();
        setActiveId(null);
        return;
      }
      player.replace(source);
      player.seekTo(0);
      player.play();
      setActiveId(id);
    } catch {}
  };

  return { play, playingId: status.playing ? activeId : null };
}

export function SoundBadge({
  hasSound,
  playing,
  onPress,
  label = '2s',
}: {
  hasSound: boolean;
  playing?: boolean;
  onPress?: () => void;
  label?: string;
}) {
  return (
    <Pressable
      onPress={hasSound ? onPress : undefined}
      style={[styles.badge, playing && styles.badgePlaying, !hasSound && styles.badgeMuted]}
    >
      {hasSound ? (
        <SpeakerOnIcon size={14} color={playing ? colors.limeInk : colors.text} />
      ) : (
        <SpeakerOffIcon size={14} color={colors.textDim} />
      )}
      <Text style={[styles.text, playing && { color: colors.limeInk }, !hasSound && { color: colors.textDim }]}>
        {!hasSound ? '音なし' : playing ? '再生中' : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  badgePlaying: { backgroundColor: colors.lime, borderColor: 'rgba(24,26,13,0.10)' },
  badgeMuted: { backgroundColor: colors.surface },
  text: { color: colors.text, fontSize: font.tiny, fontWeight: '800' },
});
