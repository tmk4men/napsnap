import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, rule, space } from '../theme';
import { fonts } from '../lib/fonts';
import { FadeIn } from './ui';
import { Backdrop } from './Backdrop';
import { CloseIcon } from './icons';
import { useStore } from '../store';
import { NotifyKind } from '../types';
import { tr } from '../i18n';

// アクティビティ通知の種類ごとのオンオフ設定オーバーレイ。
// アクティビティ画面の歯車アイコンから開く。
export function NotifySettingsOverlay({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const notifyPrefs = useStore((s) => s.notifyPrefs);
  const setNotifyPref = useStore((s) => s.setNotifyPref);

  const rows: { kind: NotifyKind; label: string; sub: string }[] = [
    { kind: 'follow', label: tr('フォロー', 'Follows'), sub: tr('誰かにフォローされたとき', 'When someone follows you') },
    { kind: 'react', label: tr('リアクション', 'Reactions'), sub: tr('自分の投稿に反応がついたとき', 'When your post gets a reaction') },
    { kind: 'post', label: tr('投稿', 'Posts'), sub: tr('フォローしている人が投稿したとき', 'When someone you follow posts') },
    { kind: 'view', label: tr('閲覧', 'Views'), sub: tr('自分の投稿が見られたとき', 'When your post is viewed') },
    { kind: 'topic', label: tr('お題', 'Prompts'), sub: tr('お題が更新されたとき', 'When the prompt updates') },
  ];

  return (
    <FadeIn style={styles.container} dy={16} duration={220}>
      <Backdrop />
      <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
        <Text style={styles.title}>{tr('通知設定', 'Notifications')}</Text>
        <Pressable onPress={onClose} style={styles.close} hitSlop={12}>
          <CloseIcon size={18} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: space.lg, paddingBottom: insets.bottom + space.xl }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          受け取りたい通知だけオンにできます。
        </Text>
        {rows.map((r) => (
          <ToggleRow
            key={r.kind}
            label={r.label}
            sub={r.sub}
            on={notifyPrefs[r.kind]}
            onToggle={() => setNotifyPref(r.kind, !notifyPrefs[r.kind])}
          />
        ))}
      </ScrollView>
    </FadeIn>
  );
}

function ToggleRow({
  label,
  sub,
  on,
  onToggle,
}: {
  label: string;
  sub?: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable onPress={onToggle} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      <View style={[styles.switchTrack, on && styles.switchTrackOn]}>
        <View style={[styles.switchThumb, on && styles.switchThumbOn]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
    borderBottomWidth: rule.hair,
    borderBottomColor: colors.hairline,
  },
  title: { color: colors.text, fontSize: font.title, fontWeight: '800', fontFamily: fonts.serif, letterSpacing: -0.5 },
  close: {
    width: 36,
    height: 36,
    borderRadius: radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSunken,
  },
  intro: { color: colors.textDim, fontSize: font.body, fontFamily: fonts.ui, lineHeight: font.body * 1.6, marginBottom: space.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.md,
    borderBottomWidth: rule.hair,
    borderBottomColor: colors.hairline,
  },
  rowPressed: { backgroundColor: colors.surfaceSunken },
  rowLabel: { color: colors.text, fontSize: font.body, fontWeight: '700', fontFamily: fonts.ui },
  rowSub: { color: colors.textDim, fontSize: font.small, fontFamily: fonts.ui, marginTop: 2 },
  switchTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surfaceSunken,
    borderWidth: rule.hair,
    borderColor: colors.hairline,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  switchTrackOn: { backgroundColor: colors.lime, borderColor: colors.limeDust },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.bg,
    borderWidth: rule.hair,
    borderColor: colors.hairline,
  },
  switchThumbOn: { transform: [{ translateX: 18 }], backgroundColor: colors.limeInk, borderColor: colors.limeInk },
});
