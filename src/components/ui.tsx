import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { colors, font, radius, shadow, space } from '../theme';
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
        !disabled && styles.primaryShadow,
        disabled && styles.primaryDisabled,
        pressed && !disabled && styles.primaryPressed,
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
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.ghost, pressed && styles.ghostPressed, style]}
    >
      <Text style={[styles.ghostLabel, tone === 'danger' && { color: colors.warn }]}>{label}</Text>
    </Pressable>
  );
}

export function Card({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
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
        tone === 'lime' && styles.pillLime,
        tone === 'media' && styles.pillMedia,
      ]}
    >
      {tone === 'lime' && <View style={styles.pillDot} />}
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

// プロフィール画像があれば写真、なければ頭文字。絵文字は最後のフォールバック。
export function Avatar({
  user,
  size = 38,
  ring = false,
}: {
  user?: User;
  size?: number;
  ring?: boolean;
}) {
  const wrap = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };
  const ringStyle = ring ? { borderWidth: 2, borderColor: colors.lime } : { borderWidth: 1, borderColor: colors.hairline };

  if (user?.avatarImageUri) {
    return (
      <Image
        source={{ uri: user.avatarImageUri }}
        style={[wrap, ringStyle, { backgroundColor: colors.surfaceSunken }]}
        resizeMode="cover"
      />
    );
  }

  const initial = (user?.displayName ?? '').trim().charAt(0);
  return (
    <View style={[styles.avatar, wrap, ringStyle, { backgroundColor: colors.surfaceSunken }]}>
      {initial ? (
        <Text style={{ fontSize: size * 0.42, fontWeight: '800', color: colors.textDim }}>{initial}</Text>
      ) : (
        <Text style={{ fontSize: size * 0.5 }}>{user?.avatarEmoji ?? '🟡'}</Text>
      )}
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
      <ActivityIndicator color={colors.textDim} />
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
    borderWidth: 1,
    borderColor: 'rgba(24,26,13,0.10)',
  },
  primaryShadow: { boxShadow: shadow.button },
  primaryDisabled: { backgroundColor: colors.surfaceSunken, borderColor: colors.hairline },
  primaryPressed: { transform: [{ scale: 0.985 }, { translateY: 1 }], boxShadow: shadow.cardPressed },
  primaryLabel: { color: colors.limeInk, fontSize: font.lead, fontWeight: '800', letterSpacing: 0.2 },
  primaryLabelDisabled: { color: colors.textFaint },

  ghost: {
    paddingVertical: 14,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  ghostPressed: { backgroundColor: colors.surfaceSunken, transform: [{ scale: 0.985 }] },
  ghostLabel: { color: colors.textDim, fontSize: font.body, fontWeight: '700' },

  card: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    boxShadow: shadow.card,
  },
  cardPressed: { backgroundColor: colors.surfaceSunken, boxShadow: shadow.cardPressed },

  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  pillLime: { backgroundColor: colors.limeSoft, borderColor: 'rgba(24,26,13,0.10)' },
  pillMedia: { backgroundColor: colors.mediaChip, borderColor: colors.mediaChipBorder },
  pillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.lime },
  pillText: { color: colors.text, fontSize: font.small, fontWeight: '800' },

  avatar: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  remaining: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  remainingText: { fontWeight: '800' },
});
