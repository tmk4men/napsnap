import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, rule, space } from '../theme';
import { fonts } from '../lib/fonts';
import { FadeIn } from './ui';
import { Backdrop } from './Backdrop';
import { CloseIcon } from './icons';
import { tr } from '../i18n';
import { useStore } from '../store';

// ハンバーガーメニュー「アカウントを削除」から開く退会オーバーレイ。
// 破壊的操作なので、警告＋赤い確定ボタン＋二段階（チェック）で誤操作を防ぐ。
export function DeleteAccountOverlay({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const deleteAccount = useStore((s) => s.deleteAccount);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    if (!confirmed || busy) return;
    setBusy(true);
    setError(null);
    const ok = await deleteAccount();
    if (!ok) {
      setBusy(false);
      setError(tr('削除に失敗しました。通信環境を確認してもう一度お試しください。', 'Deletion failed. Check your connection and try again.'));
      return;
    }
    // 成功＝store が初期化され、RootNavigator が登録画面に戻る。オーバーレイは閉じるだけ。
    onClose();
  }

  return (
    <FadeIn style={styles.container} dy={16} duration={220}>
      <Backdrop />
      <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
        <Text style={styles.title}>{tr('アカウントを削除', 'Delete account')}</Text>
        <Pressable onPress={onClose} style={styles.close} hitSlop={12} disabled={busy}>
          <CloseIcon size={18} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: space.lg, paddingBottom: insets.bottom + space.xl }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lead}>{tr('アカウントを削除すると、次のものが完全に消えます。元には戻せません。', 'Deleting your account permanently removes the following. This cannot be undone.')}</Text>

        <View style={styles.bullets}>
          <Text style={styles.bullet}>{tr('・プロフィール（名前・@ID・アイコン）', '• Profile (name, @ID, icon)')}</Text>
          <Text style={styles.bullet}>{tr('・フォロー／フォロワーの関係', '• Following / follower relationships')}</Text>
          <Text style={styles.bullet}>{tr('・あなたの投稿・反応・足あと', '• Your posts, reactions, and views')}</Text>
          <Text style={styles.bullet}>{tr('・連携した外部アカウントとの紐付け', '• Links to external accounts')}</Text>
          <Text style={styles.bullet}>{tr('・この端末に残っている思い出', '• Memories stored on this device')}</Text>
        </View>

        <Pressable style={styles.checkRow} onPress={() => setConfirmed((v) => !v)} disabled={busy}>
          <View style={[styles.checkbox, confirmed && styles.checkboxOn]}>
            {confirmed && <Text style={styles.checkMark}>✓</Text>}
          </View>
          <Text style={styles.checkLabel}>{tr('上記を理解し、アカウントを削除します', 'I understand and want to delete my account')}</Text>
        </Pressable>

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          onPress={onDelete}
          disabled={!confirmed || busy}
          style={({ pressed }) => [
            styles.deleteBtn,
            (!confirmed || busy) && styles.deleteBtnOff,
            pressed && confirmed && !busy && { opacity: 0.85 },
          ]}
        >
          {busy ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.deleteBtnText}>{tr('アカウントを削除する', 'Delete my account')}</Text>
          )}
        </Pressable>

        <Pressable onPress={onClose} disabled={busy} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>{tr('やめる', 'Cancel')}</Text>
        </Pressable>
      </ScrollView>
    </FadeIn>
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
  close: { width: 36, height: 36, borderRadius: radius.xs, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSunken },
  lead: { color: colors.text, fontSize: font.body, fontFamily: fonts.ui, lineHeight: font.body * 1.6, marginBottom: space.md },
  bullets: { marginBottom: space.lg, gap: 6 },
  bullet: { color: colors.textDim, fontSize: font.body, fontFamily: fonts.ui, lineHeight: font.body * 1.5 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: space.lg },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.xs,
    borderWidth: rule.thin,
    borderColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space.sm,
  },
  checkboxOn: { backgroundColor: colors.text },
  checkMark: { color: colors.bg, fontSize: 15, fontWeight: '900' },
  checkLabel: { flex: 1, color: colors.text, fontSize: font.body, fontWeight: '700', fontFamily: fonts.ui },
  error: { color: colors.warn, fontSize: font.small, fontWeight: '700', fontFamily: fonts.ui, marginBottom: space.sm },
  deleteBtn: {
    backgroundColor: colors.warn,
    borderRadius: radius.xs,
    paddingVertical: space.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnOff: { backgroundColor: colors.surfaceSunken },
  deleteBtnText: { color: '#FFFFFF', fontSize: font.body, fontWeight: '800', fontFamily: fonts.ui, letterSpacing: 0.5 },
  cancelBtn: { alignItems: 'center', paddingVertical: space.md, marginTop: space.xs },
  cancelText: { color: colors.textDim, fontSize: font.body, fontWeight: '700', fontFamily: fonts.ui },
});
