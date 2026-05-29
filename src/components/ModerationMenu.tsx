import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, rule, shadow, space } from '../theme';
import { fonts } from '../lib/fonts';
import { FadeIn } from './ui';
import { useStore } from '../store';
import { tr } from '../i18n';

// 投稿者アイコンのタップから開く通報／ブロックのシート（UGCポリシー必須機能）。
// 投稿カード（MyPostsSwiper / PostSwipeFeed）と検索結果から共用する。
export interface ModerationTarget {
  userId: string; // 通報/ブロック対象のユーザー
  postId?: string; // 投稿から開いたときはその投稿id（通報に添える）
  name?: string; // 表示名（確認文言に出す）
}

const REASONS: { key: string; label: string }[] = [
  { key: 'spam', label: tr('スパム・宣伝', 'Spam or ads') },
  { key: 'abuse', label: tr('不快・攻撃的', 'Abusive or hateful') },
  { key: 'sexual', label: tr('性的・わいせつ', 'Sexual content') },
  { key: 'impersonation', label: tr('なりすまし', 'Impersonation') },
  { key: 'other', label: tr('その他', 'Something else') },
];

type Step = 'menu' | 'reasons' | 'reported' | 'blockConfirm';

export function ModerationMenu({ target, onClose }: { target: ModerationTarget; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const reportContent = useStore((st) => st.reportContent);
  const blockUser = useStore((st) => st.blockUser);
  const [step, setStep] = useState<Step>('menu');

  const who = target.name?.trim() || tr('この人', 'this person');

  const submitReport = (reason: string) => {
    reportContent({ reason, postId: target.postId, targetUserId: target.userId });
    setStep('reported');
  };
  const confirmBlock = () => {
    blockUser(target.userId);
    onClose();
  };

  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <FadeIn style={[styles.sheet, { bottom: insets.bottom + space.md }]} dy={16} duration={180}>
        {step === 'menu' && (
          <>
            <Pressable
              onPress={() => setStep('reasons')}
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            >
              <Text style={styles.itemText}>{tr('通報する', 'Report')}</Text>
            </Pressable>
            <Pressable
              onPress={() => setStep('blockConfirm')}
              style={({ pressed }) => [styles.item, styles.divider, pressed && styles.itemPressed]}
            >
              <Text style={[styles.itemText, { color: colors.warn }]}>{tr('ブロックする', 'Block')}</Text>
            </Pressable>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.item, styles.divider, pressed && styles.itemPressed]}
            >
              <Text style={[styles.itemText, styles.cancelText]}>{tr('キャンセル', 'Cancel')}</Text>
            </Pressable>
          </>
        )}

        {step === 'reasons' && (
          <>
            <Text style={styles.heading}>{tr('通報の理由', 'Why are you reporting?')}</Text>
            {REASONS.map((r, i) => (
              <Pressable
                key={r.key}
                onPress={() => submitReport(r.key)}
                style={({ pressed }) => [styles.item, i > 0 && styles.divider, pressed && styles.itemPressed]}
              >
                <Text style={styles.itemText}>{r.label}</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.item, styles.divider, pressed && styles.itemPressed]}
            >
              <Text style={[styles.itemText, styles.cancelText]}>{tr('キャンセル', 'Cancel')}</Text>
            </Pressable>
          </>
        )}

        {step === 'reported' && (
          <>
            <Text style={styles.heading}>{tr('受け付けました', 'Thanks for the report')}</Text>
            <Text style={styles.sub}>
              {tr('内容を確認して対応します。', "We'll review this and take action.")}
            </Text>
            <Pressable
              onPress={() => setStep('blockConfirm')}
              style={({ pressed }) => [styles.item, styles.divider, pressed && styles.itemPressed]}
            >
              <Text style={[styles.itemText, { color: colors.warn }]}>
                {tr('この人もブロックする', 'Also block this person')}
              </Text>
            </Pressable>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.item, styles.divider, pressed && styles.itemPressed]}
            >
              <Text style={[styles.itemText, styles.cancelText]}>{tr('閉じる', 'Done')}</Text>
            </Pressable>
          </>
        )}

        {step === 'blockConfirm' && (
          <>
            <Text style={styles.heading}>{tr('ブロックしますか？', 'Block?')}</Text>
            <Text style={styles.sub}>
              {tr(
                `${who} の投稿は表示されなくなり、フォローも解除されます。`,
                `You won't see ${who}'s posts anymore, and you'll stop following them.`
              )}
            </Text>
            <Pressable
              onPress={confirmBlock}
              style={({ pressed }) => [styles.item, styles.divider, pressed && styles.itemPressed]}
            >
              <Text style={[styles.itemText, { color: colors.warn }]}>{tr('ブロックする', 'Block')}</Text>
            </Pressable>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.item, styles.divider, pressed && styles.itemPressed]}
            >
              <Text style={[styles.itemText, styles.cancelText]}>{tr('キャンセル', 'Cancel')}</Text>
            </Pressable>
          </>
        )}
      </FadeIn>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.10)' },
  sheet: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.xs,
    borderWidth: rule.hair,
    borderColor: colors.line,
    boxShadow: shadow.card,
    overflow: 'hidden',
  },
  heading: {
    paddingTop: space.md,
    paddingBottom: space.xs,
    textAlign: 'center',
    color: colors.text,
    fontSize: font.body,
    fontWeight: '800',
    fontFamily: fonts.serif,
    letterSpacing: 0.3,
  },
  sub: {
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
    textAlign: 'center',
    color: colors.textDim,
    fontSize: font.small,
    fontFamily: fonts.ui,
    lineHeight: 18,
  },
  item: { paddingVertical: 15, alignItems: 'center' },
  itemPressed: { backgroundColor: colors.surface },
  divider: { borderTopWidth: rule.hair, borderTopColor: colors.hairline },
  itemText: { color: colors.text, fontSize: font.body, fontWeight: '700', fontFamily: fonts.serif, letterSpacing: 0.3 },
  cancelText: { color: colors.textDim },
});
