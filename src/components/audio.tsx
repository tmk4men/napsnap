import React, { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { colors, font, radius } from '../theme';

// タップで1つずつ再生する共有プレイヤー（残した/自分タブ用）。
// 単一プレイヤーを使い回し、再生中のIDを返す。
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
    } catch {
      // 再生失敗時は黙って無視（デモ用途）
    }
  };

  return { play, playingId: status.playing ? activeId : null };
}

// 音の有無／再生状態を示す小さなバッジ（押すと再生）
export function SoundBadge({
  hasSound,
  playing,
  onPress,
  label,
}: {
  hasSound: boolean;
  playing?: boolean;
  onPress?: () => void;
  label?: string;
}) {
  const text = !hasSound ? '🔇 音なし' : playing ? '◼ 再生中' : `🔊 ${label ?? '2.5s'}`;
  return (
    <Pressable
      onPress={hasSound ? onPress : undefined}
      style={[styles.badge, playing && styles.badgePlaying, !hasSound && styles.badgeMuted]}
    >
      <Text style={[styles.text, playing && { color: colors.black }]}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  badgePlaying: { backgroundColor: colors.lime },
  badgeMuted: { backgroundColor: 'rgba(255,255,255,0.08)' },
  text: { color: colors.white, fontSize: font.tiny, fontWeight: '800' },
});
