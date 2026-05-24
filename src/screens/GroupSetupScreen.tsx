import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, space } from '../theme';
import { PrimaryButton } from '../components/ui';
import { useStore } from '../store';

export function GroupSetupScreen() {
  const createGroup = useStore((s) => s.createGroup);
  const joinGroup = useStore((s) => s.joinGroup);
  const insets = useSafeAreaInsets();
  const [groupName, setGroupName] = useState('');
  const [code, setCode] = useState('');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + space.xl,
          paddingHorizontal: space.lg,
          paddingBottom: insets.bottom + space.xl,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.brand}>napsnap</Text>
        <Text style={styles.title}>少人数で{'\n'}はじめる</Text>
        <Text style={styles.sub}>公開はしない。3〜8人の友達グループの中だけ。</Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>新しくグループを作る</Text>
          <TextInput
            value={groupName}
            onChangeText={setGroupName}
            placeholder="グループ名（例: なかま）"
            placeholderTextColor={colors.grayDim}
            style={styles.input}
            maxLength={16}
          />
          <PrimaryButton label="グループを作る" onPress={() => createGroup(groupName)} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>招待コードで参加する</Text>
          <TextInput
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase())}
            placeholder="例: ABC123"
            placeholderTextColor={colors.grayDim}
            autoCapitalize="characters"
            style={[styles.input, { letterSpacing: 4, fontWeight: '800' }]}
            maxLength={6}
          />
          <PrimaryButton
            label="参加する"
            disabled={code.trim().length < 4}
            onPress={() => joinGroup(code)}
            style={{ opacity: code.trim().length < 4 ? 0.5 : 1 }}
          />
        </View>

        <Text style={styles.note}>
          ※ これはデモ版。作成・参加すると、体験用のモック友達（みほ・たくや・けん・さき）が同じグループに入った状態になる。
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  brand: { color: colors.lime, fontSize: font.body, fontWeight: '800', letterSpacing: 1 },
  title: {
    color: colors.white,
    fontSize: font.hero,
    fontWeight: '900',
    lineHeight: font.hero * 1.1,
    marginTop: space.md,
  },
  sub: { color: colors.gray, fontSize: font.body, marginTop: space.sm, marginBottom: space.xl },
  card: {
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    padding: space.lg,
    marginBottom: space.md,
    gap: space.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardLabel: { color: colors.white, fontSize: font.lead, fontWeight: '800' },
  input: {
    backgroundColor: colors.surface,
    color: colors.white,
    fontSize: font.lead,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 14,
  },
  note: {
    color: colors.grayDim,
    fontSize: font.small,
    lineHeight: font.small * 1.6,
    marginTop: space.md,
  },
});
