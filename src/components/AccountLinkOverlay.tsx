import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, rule, space } from '../theme';
import { fonts } from '../lib/fonts';
import { FadeIn } from './ui';
import { Backdrop } from './Backdrop';
import { CloseIcon } from './icons';
import { hasSupabase } from '../config';
import { tr } from '../i18n';
import * as be from '../lib/backend';

// ハンバーガーメニュー「アカウント連携」から開く。
// 入口は匿名のまま、ここで任意に Apple / Google（/ LINE）へ昇格＝端末をまたいで引き継げるように。
export function AccountLinkOverlay({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [providers, setProviders] = useState<string[]>([]);
  const [isAnon, setIsAnon] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function refresh() {
    if (!hasSupabase) return;
    try {
      const st = await be.authStatus();
      setProviders(st.providers);
      setIsAnon(st.isAnonymous);
    } catch {}
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onLink(provider: be.LinkProvider, label: string) {
    if (!hasSupabase) {
      setNote(tr('このデモ環境ではアカウント連携は使えません（実機ビルドで有効）', 'Account linking is unavailable in this demo (works in the native build)'));
      return;
    }
    setBusy(provider);
    const ok = await be.linkProvider(provider);
    setBusy(null);
    if (ok) {
      setNote(tr(`${label} と連携しました`, `Linked with ${label}`));
      refresh();
    } else {
      setNote(tr(`${label} の連携に失敗、またはキャンセルされました`, `Couldn't link ${label}, or it was canceled`));
    }
    setTimeout(() => setNote(null), 2600);
  }

  const linked = (p: string) => providers.includes(p);

  return (
    <FadeIn style={styles.container} dy={16} duration={220}>
      <Backdrop />
      <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
        <Text style={styles.title}>{tr('アカウント連携', 'Link account')}</Text>
        <Pressable onPress={onClose} style={styles.close} hitSlop={12}>
          <CloseIcon size={18} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: space.lg, paddingBottom: insets.bottom + space.xl }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lead}>
          {isAnon
            ? tr('外部アカウントと連携すると、機種変更やアプリの入れ直しでも引き継げます。', 'Link an external account to keep your account across device changes and reinstalls.')
            : tr('外部アカウントと連携済みです。機種をまたいで引き継げます。', 'Your account is linked. It carries over across devices.')}
        </Text>

        <ProviderRow label={tr('Apple で連携', 'Link with Apple')} sub={tr('準備中', 'Coming soon')} disabled done={false} onPress={() => {}} />
        <ProviderRow
          label={tr('Google で連携', 'Link with Google')}
          done={linked('google')}
          busy={busy === 'google'}
          onPress={() => onLink('google', 'Google')}
        />
        <ProviderRow label={tr('LINE で連携', 'Link with LINE')} sub={tr('準備中', 'Coming soon')} disabled done={false} onPress={() => {}} />

        {note && <Text style={styles.note}>{note}</Text>}

        <Text style={styles.fine}>
          {tr(
            '連携で取得するのは、引き継ぎに必要な最小限の識別情報だけです。投稿やプロフィールの内容を相手サービスに送ることはありません。',
            'Linking only uses the minimal identity info needed to carry over your account. Your posts and profile are never sent to the provider.'
          )}
        </Text>
      </ScrollView>
    </FadeIn>
  );
}

function ProviderRow({
  label,
  sub,
  done,
  busy,
  disabled,
  onPress,
}: {
  label: string;
  sub?: string;
  done: boolean;
  busy?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy || done}
      style={({ pressed }) => [styles.row, (disabled || done) && styles.rowOff, pressed && !disabled && !done && styles.rowPressed]}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      {busy ? (
        <ActivityIndicator size="small" color={colors.text} />
      ) : done ? (
        <Text style={styles.doneTag}>{tr('連携済み', 'Linked')}</Text>
      ) : (
        <Text style={styles.chevron}>›</Text>
      )}
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
  close: { width: 36, height: 36, borderRadius: radius.xs, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSunken },
  lead: { color: colors.textDim, fontSize: font.body, fontFamily: fonts.ui, lineHeight: font.body * 1.6, marginBottom: space.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    borderWidth: rule.thin,
    borderColor: colors.text,
    borderRadius: radius.xs,
    marginBottom: space.sm,
  },
  rowOff: { borderColor: colors.hairline },
  rowPressed: { backgroundColor: colors.surfaceSunken },
  rowLabel: { color: colors.text, fontSize: font.body, fontWeight: '700', fontFamily: fonts.ui },
  rowSub: { color: colors.textFaint, fontSize: font.small, fontFamily: fonts.ui, marginTop: 2 },
  doneTag: { color: colors.textDim, fontSize: font.small, fontWeight: '700', fontFamily: fonts.ui },
  chevron: { color: colors.textFaint, fontSize: 22, fontWeight: '300' },
  note: { color: colors.text, fontSize: font.small, fontWeight: '700', fontFamily: fonts.ui, marginTop: space.sm },
  fine: { color: colors.textFaint, fontSize: font.tiny, fontFamily: fonts.ui, lineHeight: font.tiny * 1.7, marginTop: space.lg },
});
