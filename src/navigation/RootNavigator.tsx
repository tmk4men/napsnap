import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, font, space } from '../theme';
import { fonts } from '../lib/fonts';
import { AccountSetupScreen } from '../screens/AccountSetupScreen';
import { AppShell } from './AppShell';
import { useStore } from '../store';

export function RootNavigator() {
  const [hydrated, setHydrated] = useState(useStore.persist.hasHydrated());

  useEffect(() => {
    const unsub = useStore.persist.onFinishHydration(() => setHydrated(true));
    if (useStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  // 復帰時、フォロー中の投稿が全部期限切れなら作り直して常に体験できるようにする
  useEffect(() => {
    if (hydrated) useStore.getState().refreshFollowPostsIfStale();
  }, [hydrated]);

  const onboarded = useStore((s) => s.onboarded);
  const currentUserId = useStore((s) => s.currentUserId);

  if (!hydrated) {
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
