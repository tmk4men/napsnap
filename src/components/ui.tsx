import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { colors, font, radius, rule, shadow, space } from '../theme';
import { fonts } from '../lib/fonts';
import { User } from '../types';
import { CameraIcon, ClockIcon, UserIcon } from './icons';
import { formatClock } from '../lib/time';
import { isBrandUser } from '../selectors';

// 主ボタン＝号外の「校了」印。朱のベタ角箱・光沢なし・直角。文字は紙色のゴシック。
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
        pressed && !disabled && styles.primaryPressed,
        style,
      ]}
    >
      <Text style={[styles.primaryLabel, disabled && styles.primaryLabelDisabled]}>{label}</Text>
    </Pressable>
  );
}

// 「撮る」＝紙面を起こす赤い版。block=全幅の朱バー / 既定=朱の角箱。光沢なし・直角。
export function ShootButton({
  onPress,
  block = false,
  label,
  style,
}: {
  onPress: () => void;
  block?: boolean;
  label?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        block ? styles.shootBlock : styles.shootRound,
        pressed && styles.shootPressed,
        style,
      ]}
    >
      <View style={styles.shootRow}>
        <CameraIcon size={block ? 22 : 23} color={colors.limeInk} />
        {label ? <Text style={styles.shootLabel}>{label}</Text> : null}
      </View>
    </Pressable>
  );
}

// 副ボタン＝インクの細罫で囲った角箱（地は塗らない）。
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

// タグ＝丸ピルではなく、直角の「組み見出し」。朱トーンは朱の細罫＋小さな朱の四角。
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
          tone === 'lime' && { color: colors.limeInkSoft },
          tone === 'media' && { color: colors.onMedia },
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

// プロフィール画像があれば写真、なければ頭文字。絵文字は最後のフォールバック。
// ring=true のときは外側に朱の輪＋内側に紙の隙間（顔なしSNSの“登録写真”的な縁取り）。
function AvatarInner({ user, size, border, blur }: { user?: User; size: number; border: object; blur?: boolean }) {
  // 角版（証明写真風）。顔なしSNS＝“登録写真の台帳”の質感。丸ではなく直角＋細罫で囲う。
  const wrap = { width: size, height: size, borderRadius: radius.xs };
  // napsnap公式（ブランド本人）：ブランドフォントで「N」を反転表示。他の認証アカウントは
  // ここを通らず通常のアバターを使う。
  if (isBrandUser(user)) {
    return (
      <View style={[styles.avatar, wrap, border, { backgroundColor: colors.text }]}>
        <Text
          style={{
            color: colors.bg,
            fontSize: Math.round(size * 0.62),
            fontFamily: fonts.brand,
            includeFontPadding: false,
            lineHeight: Math.round(size * 0.78),
            letterSpacing: -1,
          }}
        >
          N
        </Text>
      </View>
    );
  }
  if (user?.avatarImageUri) {
    return (
      <Image
        source={{ uri: user.avatarImageUri }}
        style={[wrap, border, { backgroundColor: colors.surfaceSunken }]}
        resizeMode="cover"
        blurRadius={blur ? 10 : undefined}
      />
    );
  }
  const initial = (user?.displayName ?? '').trim().charAt(0);
  const hasInitial = !!initial;
  return (
    <View style={[styles.avatar, wrap, border, { backgroundColor: hasInitial ? colors.surfaceSunken : colors.avatarFallback }]}>
      {blur ? null : hasInitial ? (
        <Text style={{ fontSize: size * 0.42, fontWeight: '700', color: colors.textDim, fontFamily: fonts.ui }}>{initial}</Text>
      ) : (
        <UserIcon size={size * 0.5} color={colors.avatarFallbackIcon} />
      )}
    </View>
  );
}

export function Avatar({
  user,
  size = 38,
  ring = false,
  blur = false,
}: {
  user?: User;
  size?: number;
  ring?: boolean;
  blur?: boolean;
}) {
  if (ring) {
    // 選択中＝角版の枠（証明写真の縁）。塗り＋紙色の隙間で囲う。
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: radius.xs,
            backgroundColor: colors.lime,
            alignItems: 'center',
            justifyContent: 'center',
          },
          size >= 40 && styles.avatarShadow,
        ]}
      >
        <AvatarInner user={user} size={size - 4} border={{ borderWidth: 2, borderColor: colors.bg }} blur={blur} />
      </View>
    );
  }
  return (
    <View style={size >= 40 ? styles.avatarShadow : undefined}>
      <AvatarInner user={user} size={size} border={{ borderWidth: 1, borderColor: colors.hairline }} blur={blur} />
    </View>
  );
}

// 締切までの残り。数字は等幅（活字で組んだ“締切時刻”）。例: ⏱ 23:41
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

// マウント時にふわっと（フェード＋少し上へ）。key を変えると再生される。
// delay を変えると“ずらして現れる”演出（紙面が刷り上がるステージング）に使える。
export function FadeIn({
  children,
  style,
  dy = 10,
  duration = 240,
  delay = 0,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  dy?: number;
  duration?: number;
  delay?: number;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration, delay, useNativeDriver: true }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Animated.View
      style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [dy, 0] }) }] }]}
    >
      {children}
    </Animated.View>
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
    borderRadius: radius.xs,
    paddingVertical: 17,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: rule.hair,
    borderColor: colors.limeDust,
  },
  primaryDisabled: { backgroundColor: colors.surfaceSunken, borderColor: colors.hairline },
  primaryPressed: { transform: [{ translateY: 1 }], opacity: 0.92 },
  primaryLabel: { color: colors.limeInk, fontSize: font.lead, fontWeight: '700', fontFamily: fonts.ui, letterSpacing: 2 },
  primaryLabelDisabled: { color: colors.textFaint },

  shootBlock: {
    backgroundColor: colors.lime,
    borderRadius: radius.xs,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: rule.hair,
    borderColor: colors.limeDust,
  },
  shootRound: {
    width: 56,
    height: 56,
    borderRadius: radius.xs,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: rule.hair,
    borderColor: colors.limeDust,
  },
  shootPressed: { transform: [{ translateY: 1 }], opacity: 0.92 },
  shootRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  shootLabel: { color: colors.limeInk, fontSize: font.lead, fontWeight: '700', fontFamily: fonts.ui, letterSpacing: 2 },

  ghost: {
    paddingVertical: 14,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.xs,
    backgroundColor: 'transparent',
    borderWidth: rule.thin,
    borderColor: colors.text,
  },
  ghostPressed: { backgroundColor: colors.surfaceSunken },
  ghostLabel: { color: colors.text, fontSize: font.body, fontWeight: '700', fontFamily: fonts.ui, letterSpacing: 1 },

  card: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xs,
    borderWidth: rule.hair,
    borderColor: colors.hairline,
    boxShadow: shadow.card,
  },
  cardPressed: { backgroundColor: colors.surfaceSunken, boxShadow: shadow.cardPressed },

  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
    borderRadius: radius.xs,
    paddingHorizontal: 9,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    borderWidth: rule.hair,
    borderColor: colors.hairline,
  },
  pillLime: { backgroundColor: colors.limeSoft, borderColor: colors.limeLine },
  pillMedia: { backgroundColor: colors.mediaChip, borderColor: colors.mediaChipBorder },
  pillDot: { width: 6, height: 6, borderRadius: 0, backgroundColor: colors.lime },
  pillText: { color: colors.text, fontSize: font.small, fontWeight: '700', fontFamily: fonts.ui, letterSpacing: 0.5 },

  avatar: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarShadow: { borderRadius: radius.xs, boxShadow: shadow.avatar },
  remaining: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  remainingText: { fontWeight: '500', fontFamily: fonts.handle, letterSpacing: 0.5 },
});
