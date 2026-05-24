import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { colors, font, radius, space } from '../theme';
import { User } from '../types';
import { ClockIcon } from './icons';
import { formatClock } from '../lib/time';

export function PrimaryButton({
  label,
  onPress,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primary,
        disabled && styles.primaryDisabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.primaryLabel, disabled && styles.primaryLabelDisabled]}>{label}</Text>
    </Pressable>
  );
}

export function GhostButton({
  label,
  onPress,
  tone = 'default',
  style,
}: {
  label: string;
  onPress: () => void;
  tone?: 'default' | 'danger';
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.ghost, pressed && styles.pressed, style]}>
      <Text style={[styles.ghostLabel, tone === 'danger' && { color: colors.warn }]}>{label}</Text>
    </Pressable>
  );
}

export function Pill({
  children,
  tone = 'default',
}: {
  children: React.ReactNode;
  tone?: 'default' | 'lime' | 'media';
}) {
  return (
    <View
      style={[
        styles.pill,
        tone === 'lime' && { backgroundColor: colors.lime },
        tone === 'media' && { backgroundColor: colors.mediaChip },
      ]}
    >
      <Text
        style={[
          styles.pillText,
          tone === 'lime' && { color: colors.limeInk },
          tone === 'media' && { color: colors.onMedia },
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

export function Avatar({ user, size = 38 }: { user?: User; size?: number }) {
  const bg = user?.avatarColor ?? colors.card;
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={{ fontSize: size * 0.5 }}>{user?.avatarEmoji ?? '🟡'}</Text>
    </View>
  );
}

// 時計マーク＋残り時間だけ（例: ⏱ 23:41）
export function Remaining({
  expiresAt,
  color = colors.text,
  size = 13,
}: {
  expiresAt: number;
  color?: string;
  size?: number;
}) {
  return (
    <View style={styles.remaining}>
      <ClockIcon size={size} color={color} />
      <Text style={[styles.remainingText, { color, fontSize: size }]}>{formatClock(expiresAt)}</Text>
    </View>
  );
}

export function Spinner() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.text} />
    </View>
  );
}

export function useTick(intervalMs = 1000) {
  const [, setN] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setN((n) => n + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}

export function useOnce(fn: () => void) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    fn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

const styles = StyleSheet.create({
  primary: {
    backgroundColor: colors.lime,
    borderRadius: radius.pill,
    paddingVertical: 18,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryDisabled: { backgroundColor: colors.card },
  primaryLabel: { color: colors.limeInk, fontSize: font.lead, fontWeight: '800' },
  primaryLabelDisabled: { color: colors.textFaint },
  ghost: { paddingVertical: 14, paddingHorizontal: space.lg, alignItems: 'center', justifyContent: 'center' },
  ghostLabel: { color: colors.textDim, fontSize: font.body, fontWeight: '700' },
  pressed: { opacity: 0.75 },
  pill: {
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  pillText: { color: colors.text, fontSize: font.small, fontWeight: '800' },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  remaining: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  remainingText: { fontWeight: '800' },
});
