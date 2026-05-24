import React, { useMemo, useState } from 'react';
import {
  Image,
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
import { colors, font, radius, shadow, space } from '../theme';
import { copy } from '../copy';
import { Avatar, GhostButton, PrimaryButton } from '../components/ui';
import { ImageIcon, PencilIcon } from '../components/icons';
import { useStore } from '../store';
import { makeMockPeople } from '../seed';
import { PRESET_AVATARS } from '../lib/images';
import { pickAvatarImage } from '../lib/avatar';

const TINTS = ['#C7E6A6', '#AFD0E2', '#E6C7A6', '#CFBCE6', '#D7E2A6', '#E6AFBC', '#E6D28F', '#AFE2D4'];

export function AccountSetupScreen() {
  const insets = useSafeAreaInsets();
  const completeAccountSetup = useStore((s) => s.completeAccountSetup);
  const people = useMemo(() => makeMockPeople(), []);

  const [step, setStep] = useState<0 | 1>(0);
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [avatarUri, setAvatarUri] = useState<string>(PRESET_AVATARS[0]);
  const [followingIds, setFollowingIds] = useState<string[]>(() => people.map((p) => p.id));

  const sanitizeHandle = (t: string) => t.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 16);
  const previewUser = { id: 'preview', handle, displayName: name, avatarEmoji: '🟡', avatarColor: TINTS[0], avatarImageUri: avatarUri, createdAt: 0 };

  async function choosePhoto() {
    const uri = await pickAvatarImage();
    if (uri) setAvatarUri(uri);
  }

  function finish() {
    completeAccountSetup({
      displayName: name,
      handle,
      avatarEmoji: '🟡',
      avatarColor: TINTS[0],
      avatarImageUri: avatarUri,
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

          {/* 大きいアバタープレビュー＋写真を選ぶ */}
          <View style={styles.avatarStage}>
            <Pressable onPress={choosePhoto} style={styles.avatarPreviewWrap}>
              <Avatar user={previewUser} size={104} />
              <View style={styles.editBadge}>
                <PencilIcon size={13} color={colors.limeInk} />
              </View>
            </Pressable>
            <Pressable onPress={choosePhoto} style={({ pressed }) => [styles.choose, pressed && styles.chosePressed]}>
              <ImageIcon size={16} color={colors.text} />
              <Text style={styles.chooseText}>写真を選ぶ</Text>
            </Pressable>
          </View>

          {/* プリセット写真アバター */}
          <Text style={styles.presetLabel}>または、痕跡から選ぶ</Text>
          <View style={styles.presetRow}>
            {PRESET_AVATARS.map((uri) => {
              const active = uri === avatarUri;
              return (
                <Pressable
                  key={uri}
                  onPress={() => setAvatarUri(uri)}
                  style={[styles.presetWrap, active && styles.presetActive]}
                >
                  <Image source={{ uri }} style={styles.preset} resizeMode="cover" />
                </Pressable>
              );
            })}
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

        <View style={{ paddingBottom: insets.bottom + space.md, paddingTop: space.sm }}>
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
              style={({ pressed }) => [styles.person, pressed && styles.personPressed]}
            >
              <Avatar user={p} size={44} />
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
        <GhostButton label={copy.setupBack} onPress={() => setStep(0)} style={{ marginTop: space.xs }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.lg },
  brand: { color: colors.text, fontSize: font.body, fontWeight: '900', letterSpacing: 2, marginBottom: space.lg },
  title: { color: colors.text, fontSize: font.hero, fontWeight: '900', lineHeight: font.hero * 1.08, letterSpacing: -0.5 },
  sub: { color: colors.textDim, fontSize: font.body, marginTop: space.sm, lineHeight: font.body * 1.5 },

  avatarStage: { alignItems: 'center', marginTop: space.xl, gap: space.md },
  avatarPreviewWrap: { position: 'relative' },
  editBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.bg,
  },
  choose: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.hairline,
    boxShadow: shadow.chip,
  },
  chosePressed: { backgroundColor: colors.surfaceSunken, transform: [{ scale: 0.98 }] },
  chooseText: { color: colors.text, fontSize: font.body, fontWeight: '800' },

  presetLabel: { color: colors.textFaint, fontSize: font.small, fontWeight: '800', marginTop: space.xl, marginBottom: space.sm },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  presetWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 2,
  },
  presetActive: { borderColor: colors.lime },
  preset: { width: '100%', height: '100%', borderRadius: 24, backgroundColor: colors.surfaceSunken },

  fieldLabel: { color: colors.textDim, fontSize: font.small, fontWeight: '800', marginTop: space.lg, marginBottom: space.xs },
  input: {
    backgroundColor: colors.surfaceRaised,
    color: colors.text,
    fontSize: font.title,
    fontWeight: '800',
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  handleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  at: { color: colors.textDim, fontSize: font.lead, fontWeight: '800' },
  handleInput: { flex: 1, color: colors.text, fontSize: font.lead, fontWeight: '700', paddingVertical: 14, marginLeft: 4 },
  hint: { color: colors.textFaint, fontSize: font.small, marginTop: space.xs },

  person: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    padding: space.sm,
    marginBottom: space.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  personPressed: { backgroundColor: colors.surfaceSunken },
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
