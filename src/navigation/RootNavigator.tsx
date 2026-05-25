import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, font, space } from '../theme';
import { fonts } from '../lib/fonts';
import { AccountSetupScreen } from '../screens/AccountSetupScreen';
import { AppShell } from './AppShell';
import { useStore } from '../store';
import { hasSupabase } from '../config';

export function RootNavigator() {
  const [hydrated, setHydrated] = useState(useStore.persist.hasHydrated());
  // ライブ：Supabase から初期データを取り終えるまで待つ（モック時は即 ready）。
  const [liveReady, setLiveReady] = useState(!hasSupabase);

  useEffect(() => {
    const unsub = useStore.persist.onFinishHydration(() => setHydrated(true));
    if (useStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (hasSupabase) {
      // ライブ：匿名セッション確保＋サーバから全取得（オンボ済みかもここで確定）。
      useStore.getState().liveHydrate().finally(() => setLiveReady(true));
    } else {
      // モック：復帰時、期限切れを掃除してから、無ければ作り直す。
      useStore.getState().ensureOfficialFollowed();
      useStore.getState().pruneExpired();
      useStore.getState().refreshFollowPostsIfStale();
      useStore.getState().refreshTopicPostsIfStale();
      useStore.getState().refreshOfficialPostsIfStale();
    }
  }, [hydrated]);

  const onboarded = useStore((s) => s.onboarded);
  const currentUserId = useStore((s) => s.currentUserId);

  if (!hydrated || !liveReady) {
    return (
      <View style={styles.splash}>
        <Text style={styles.brand}>napsnap</Text>
        <View style={styles.bar} />
        <ActivityIndicator color={colors.textFaint} style={{ marginTop: space.xl }} />
      </View>
    );
  }

  if (!onboarded || !currentUserId) return <AccountSetupScreen />;
  return <AppShell />;
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  brand: { color: colors.text, fontSize: 46, fontWeight: '700', fontFamily: fonts.brand },
  bar: { width: 28, height: 5, borderRadius: 3, backgroundColor: colors.lime, marginTop: space.sm },
});
