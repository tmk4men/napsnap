import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, rule, space } from '../theme';
import { fonts } from '../lib/fonts';
import { FadeIn } from './ui';
import { Backdrop } from './Backdrop';
import { CloseIcon } from './icons';
import { hasSupabase } from '../config';
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
      setNote('このデモ環境ではアカウント連携は使えません（実機ビルドで有効）');
      return;
    }
    setBusy(provider);
    const ok = await be.linkProvider(provider);
    setBusy(null);
    if (ok) {
      setNote(`${label} と連携しました`);
      refresh();
    } else {
      setNote(`${label} の連携に失敗、またはキャンセルされました`);
    }
    setTimeout(() => setNote(null), 2600);
  }

  const linked = (p: string) => providers.includes(p);

  return (
    <FadeIn style={styles.container} dy={16} duration={220}>
      <Backdrop />
      <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
        <Text style={styles.title}>アカウント連携</Text>
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
            ? 'いまはこの端末だけのアカウントです。外部アカウントと連携すると、機種変更やアプリの入れ直しでも引き継げます。'
            : '外部アカウントと連携済みです。機種をまたいで引き継げます。'}
        </Text>

        <ProviderRow
          label="Apple で連携"
          done={linked('apple')}
          busy={busy === 'apple'}
          onPress={() => onLink('apple', 'Apple')}
        />
        <ProviderRow
          label="Google で連携"
          done={linked('google')}
          busy={busy === 'google'}
          onPress={() => onLink('google', 'Google')}
        />
        <ProviderRow label="LINE で連携" sub="準備中" disabled done={false} onPress={() => {}} />

        {note && <Text style={styles.note}>{note}</Text>}

        <Text style={styles.fine}>
          連携で取得するのは、引き継ぎに必要な最小限の識別情報だけです。投稿やプロフィールの内容を相手サービスに送ることはありません。
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
        <Text style={styles.doneTag}>連携済み</Text>
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
