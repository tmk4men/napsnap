import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, font } from '../theme';
import { Spinner } from '../components/ui';
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
        <Spinner />
      </View>
    );
  }

  if (!onboarded || !currentUserId) return <AccountSetupScreen />;
  return <AppShell />;
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  brand: { color: colors.text, fontSize: font.title, fontWeight: '900', letterSpacing: 2, marginBottom: 20 },
});
