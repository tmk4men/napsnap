import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, space } from '../theme';
import { copy } from '../copy';
import { GhostButton, PrimaryButton } from '../components/ui';
import { useStore } from '../store';
import { makeMockPeople } from '../seed';

const AVATARS: { emoji: string; color: string }[] = [
  { emoji: '🟡', color: '#DFFF2F' },
  { emoji: '🌿', color: '#C7E6A6' },
  { emoji: '🪟', color: '#AFD0E2' },
  { emoji: '🍵', color: '#D7E2A6' },
  { emoji: '🛏️', color: '#E6C7A6' },
  { emoji: '🌙', color: '#CFBCE6' },
  { emoji: '🧦', color: '#E6AFBC' },
  { emoji: '🥡', color: '#E6D28F' },
];

export function AccountSetupScreen() {
  const insets = useSafeAreaInsets();
  const completeAccountSetup = useStore((s) => s.completeAccountSetup);
  const people = useMemo(() => makeMockPeople(), []);

  const [step, setStep] = useState<0 | 1>(0);
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [avatar, setAvatar] = useState(0);
  const [followingIds, setFollowingIds] = useState<string[]>(() => people.map((p) => p.id));

  const sanitizeHandle = (t: string) => t.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 16);

  function finish() {
    completeAccountSetup({
      displayName: name,
      handle,
      avatarEmoji: AVATARS[avatar].emoji,
      avatarColor: AVATARS[avatar].color,
      people,
      followingIds,
    });
  }

  if (step === 0) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.container, { paddingTop: insets.top + space.xl }]}
      >
        <Text style={styles.brand}>napsnap</Text>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>{copy.setupNameTitle}</Text>
          <Text style={styles.sub}>{copy.setupNameSub}</Text>

          {/* アイコン選択 */}
          <View style={styles.avatarRow}>
            {AVATARS.map((a, i) => (
              <Pressable
                key={i}
                onPress={() => setAvatar(i)}
                style={[
                  styles.avatarPick,
                  { backgroundColor: a.color },
                  i === avatar && styles.avatarPickActive,
                ]}
              >
                <Text style={{ fontSize: 24 }}>{a.emoji}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.fieldLabel}>なまえ</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={copy.setupNamePlaceholder}
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            maxLength={12}
          />

          <Text style={styles.fieldLabel}>ユーザーID</Text>
          <View style={styles.handleWrap}>
            <Text style={styles.at}>@</Text>
            <TextInput
              value={handle}
              onChangeText={(t) => setHandle(sanitizeHandle(t))}
              placeholder="username"
              placeholderTextColor={colors.textFaint}
              autoCapitalize="none"
              style={styles.handleInput}
              maxLength={16}
            />
          </View>
          <Text style={styles.hint}>半角英数と _ のみ。あとから変えられる。</Text>
        </ScrollView>

        <View style={{ paddingBottom: insets.bottom + space.md }}>
          <PrimaryButton label={copy.setupNext} disabled={!name.trim()} onPress={() => setStep(1)} />
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + space.xl }]}>
      <Text style={styles.brand}>napsnap</Text>
      <Text style={styles.title}>{copy.setupFollowTitle}</Text>
      <Text style={styles.sub}>{copy.setupFollowSub}</Text>

      <ScrollView style={{ flex: 1, marginTop: space.lg }} showsVerticalScrollIndicator={false}>
        {people.map((p) => {
          const on = followingIds.includes(p.id);
          return (
            <Pressable
              key={p.id}
              onPress={() =>
                setFollowingIds((cur) =>
                  cur.includes(p.id) ? cur.filter((x) => x !== p.id) : [...cur, p.id]
                )
              }
              style={styles.person}
            >
              <View style={[styles.personAvatar, { backgroundColor: p.avatarColor }]}>
                <Text style={{ fontSize: 22 }}>{p.avatarEmoji}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: space.md }}>
                <Text style={styles.personName}>{p.displayName}</Text>
                <Text style={styles.personHandle}>@{p.handle}</Text>
              </View>
              <View style={[styles.followBtn, on && styles.followBtnOn]}>
                <Text style={[styles.followText, on && styles.followTextOn]}>
                  {on ? 'フォロー中' : 'フォロー'}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ paddingBottom: insets.bottom + space.md }}>
        <PrimaryButton label={copy.setupStart} onPress={finish} />
        <GhostButton label={copy.setupBack} onPress={() => setStep(0)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.lg },
  brand: { color: colors.text, fontSize: font.body, fontWeight: '900', letterSpacing: 1, marginBottom: space.lg },
  title: { color: colors.text, fontSize: font.hero, fontWeight: '900', lineHeight: font.hero * 1.08 },
  sub: { color: colors.textDim, fontSize: font.body, marginTop: space.sm },
  avatarRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: space.xl },
  avatarPick: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  avatarPickActive: { borderColor: colors.text },
  fieldLabel: { color: colors.textDim, fontSize: font.small, fontWeight: '800', marginTop: space.lg, marginBottom: space.xs },
  input: {
    backgroundColor: colors.card,
    color: colors.text,
    fontSize: font.title,
    fontWeight: '800',
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 14,
  },
  handleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
  },
  at: { color: colors.textDim, fontSize: font.lead, fontWeight: '800' },
  handleInput: { flex: 1, color: colors.text, fontSize: font.lead, fontWeight: '700', paddingVertical: 14, marginLeft: 4 },
  hint: { color: colors.textFaint, fontSize: font.small, marginTop: space.xs },
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: space.sm,
    marginBottom: space.sm,
  },
  personAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  personName: { color: colors.text, fontSize: font.body, fontWeight: '800' },
  personHandle: { color: colors.textDim, fontSize: font.small, marginTop: 1 },
  followBtn: {
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.text,
  },
  followBtnOn: { backgroundColor: colors.lime, borderColor: colors.lime },
  followText: { color: colors.text, fontSize: font.small, fontWeight: '800' },
  followTextOn: { color: colors.limeInk },
});
