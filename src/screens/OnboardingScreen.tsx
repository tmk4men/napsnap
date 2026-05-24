import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, space } from '../theme';
import { copy } from '../copy';
import { GhostButton, PrimaryButton } from '../components/ui';
import { useStore } from '../store';

export function OnboardingScreen() {
  const completeOnboarding = useStore((s) => s.completeOnboarding);
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0); // 0..2 = 説明, 3 = 名前入力
  const [name, setName] = useState('');

  const isInfo = step < copy.onboarding.length;

  if (isInfo) {
    const panel = copy.onboarding[step];
    return (
      <View style={[styles.container, { paddingTop: insets.top + space.xl }]}>
        <Text style={styles.brand}>napsnap</Text>
        <View style={styles.body}>
          <Text style={styles.title}>{panel.title}</Text>
          <Text style={styles.sub}>{panel.sub}</Text>
        </View>
        <View style={styles.dots}>
          {copy.onboarding.map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>
        <View style={{ paddingBottom: insets.bottom + space.lg }}>
          <PrimaryButton
            label={step === copy.onboarding.length - 1 ? 'はじめる' : '次へ'}
            onPress={() => setStep(step + 1)}
          />
          {step > 0 && <GhostButton label="戻る" onPress={() => setStep(step - 1)} />}
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { paddingTop: insets.top + space.xl }]}
    >
      <Text style={styles.brand}>napsnap</Text>
      <View style={styles.body}>
        <Text style={styles.title}>なまえだけ{'\n'}決めよう</Text>
        <Text style={styles.sub}>顔も写真もいらない。{'\n'}グループの中で呼ばれる名前だけ。</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="なまえ"
          placeholderTextColor={colors.grayDim}
          style={styles.input}
          maxLength={12}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={() => name.trim() && completeOnboarding(name)}
        />
      </View>
      <View style={{ paddingBottom: insets.bottom + space.lg }}>
        <PrimaryButton
          label="これではじめる"
          disabled={!name.trim()}
          onPress={() => completeOnboarding(name)}
        />
        <GhostButton label="戻る" onPress={() => setStep(step - 1)} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
    paddingHorizontal: space.lg,
  },
  brand: { color: colors.lime, fontSize: font.body, fontWeight: '800', letterSpacing: 1 },
  body: { flex: 1, justifyContent: 'center' },
  title: { color: colors.white, fontSize: font.hero, fontWeight: '900', lineHeight: font.hero * 1.1 },
  sub: { color: colors.gray, fontSize: font.lead, marginTop: space.md, lineHeight: font.lead * 1.5 },
  input: {
    marginTop: space.xl,
    backgroundColor: colors.surface,
    color: colors.white,
    fontSize: font.title,
    fontWeight: '800',
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
  },
  dots: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: space.lg },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.surface },
  dotActive: { backgroundColor: colors.lime, width: 22 },
});
