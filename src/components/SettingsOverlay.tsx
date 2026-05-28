import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, rule, space } from '../theme';
import { fonts } from '../lib/fonts';
import { FadeIn } from './ui';
import { Backdrop } from './Backdrop';
import { CloseIcon } from './icons';
import { useStore } from '../store';
import { TopicVisibility } from '../types';
import { tr } from '../i18n';

// ハンバーガーメニュー内「セキュリティ」から開く設定オーバーレイ。
// いまは「お題の公開範囲」だけ。今後の設定項目はここに追加する想定。
export function SettingsOverlay({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const topicVisibility = useStore((s) => s.topicVisibility);
  const setTopicVisibility = useStore((s) => s.setTopicVisibility);

  return (
    <FadeIn style={styles.container} dy={16} duration={220}>
      <Backdrop />
      <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
        <Text style={styles.title}>{tr('セキュリティ', 'Security')}</Text>
        <Pressable onPress={onClose} style={styles.close} hitSlop={12}>
          <CloseIcon size={18} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: space.lg, paddingBottom: insets.bottom + space.xl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.heading}>{tr('お題の公開範囲', 'Prompt post visibility')}</Text>
          <Text style={styles.body}>
            {tr(
              'あなたが今後お題に出す投稿が、どこまで見える範囲かを選びます。すでに出した投稿には反映されません。',
              'Choose who can see your future prompt posts. This does not affect posts you have already made.'
            )}
          </Text>
          <RadioRow
            label={tr('全体公開', 'Public')}
            sub={tr('napsnap を使っている全ての人に見える（既定）', 'Visible to everyone on napsnap (default)')}
            on={topicVisibility === 'public'}
            onPress={() => setTopicVisibility('public')}
          />
          <RadioRow
            label={tr('フォロワーのみ', 'Followers only')}
            sub={tr('自分とフォロワーだけに見える', 'Visible only to you and your followers')}
            on={topicVisibility === 'followers'}
            onPress={() => setTopicVisibility('followers')}
          />
        </View>
      </ScrollView>
    </FadeIn>
  );
}

function RadioRow({
  label,
  sub,
  on,
  onPress,
}: {
  label: string;
  sub?: string;
  on: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={[styles.radioOuter, on && styles.radioOuterOn]}>
        {on && <View style={styles.radioInner} />}
      </View>
      <View style={{ flex: 1, marginLeft: space.sm }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
    </Pressable>
  );
}

// _ を type 検査の補助（未使用警告回避用に export しておく）
export type _Vis = TopicVisibility;

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
  section: { marginBottom: space.xl },
  heading: { color: colors.text, fontSize: font.lead, fontWeight: '800', fontFamily: fonts.serif, marginBottom: space.xs },
  body: { color: colors.textDim, fontSize: font.body, fontFamily: fonts.ui, lineHeight: font.body * 1.6, marginBottom: space.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.sm,
    borderBottomWidth: rule.hair,
    borderBottomColor: colors.hairline,
  },
  rowPressed: { backgroundColor: colors.surfaceSunken },
  rowLabel: { color: colors.text, fontSize: font.body, fontWeight: '700', fontFamily: fonts.ui },
  rowSub: { color: colors.textDim, fontSize: font.small, fontFamily: fonts.ui, marginTop: 2 },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: rule.thin,
    borderColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterOn: { backgroundColor: 'transparent' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.text },
});
