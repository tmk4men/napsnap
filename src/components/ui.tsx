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
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.ghost, pressed && styles.pressed, style]}
    >
      <Text style={[styles.ghostLabel, tone === 'danger' && { color: colors.warn }]}>{label}</Text>
    </Pressable>
  );
}

export function Pill({
  children,
  tone = 'default',
}: {
  children: React.ReactNode;
  tone?: 'default' | 'lime' | 'dark';
}) {
  return (
    <View
      style={[
        styles.pill,
        tone === 'lime' && { backgroundColor: colors.lime },
        tone === 'dark' && { backgroundColor: 'rgba(0,0,0,0.55)' },
      ]}
    >
      <Text style={[styles.pillText, tone === 'lime' && { color: colors.black }]}>{children}</Text>
    </View>
  );
}

export function Avatar({ user, size = 38 }: { user?: User; size?: number }) {
  const bg = user?.avatarColor ?? colors.grayDim;
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
      ]}
    >
      <Text style={{ fontSize: size * 0.5 }}>{user?.avatarEmoji ?? '🟡'}</Text>
    </View>
  );
}

export function Spinner() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.lime} />
    </View>
  );
}

// 1秒ごとに再レンダリングして残り時間表示を生かす
export function useTick(intervalMs = 1000) {
  const [, setN] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setN((n) => n + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}

// 一度だけ実行する副作用（StrictModeでも実害ない範囲）
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
  primaryDisabled: { backgroundColor: colors.surface },
  primaryLabel: { color: colors.black, fontSize: font.lead, fontWeight: '800' },
  primaryLabelDisabled: { color: colors.grayDim },
  ghost: {
    paddingVertical: 14,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostLabel: { color: colors.gray, fontSize: font.body, fontWeight: '600' },
  pressed: { opacity: 0.7 },
  pill: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  pillText: { color: colors.white, fontSize: font.small, fontWeight: '700' },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
