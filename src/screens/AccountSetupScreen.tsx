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
import { colors, font, radius, rule, space } from '../theme';
import { fonts } from '../lib/fonts';
import { copy } from '../copy';
import { Avatar, GhostButton, PrimaryButton } from '../components/ui';
import { Backdrop } from '../components/Backdrop';
import { ImageIcon, PencilIcon } from '../components/icons';
import { useStore } from '../store';
import { hasSupabase } from '../config';
import { makeMockPeople } from '../seed';
import { pickRawImage } from '../lib/avatar';
import { hasBanned } from '../lib/words';
import { CropModal } from '../components/CropModal';

export function AccountSetupScreen() {
  const insets = useSafeAreaInsets();
  const completeAccountSetup = useStore((s) => s.completeAccountSetup);
  // ライブ：フォロー候補は実在ユーザー（自分以外）。モック：従来のシード（IDが変わらないよう安定生成）。
  const storeUsers = useStore((s) => s.users);
  const myId = useStore((s) => s.currentUserId);
  const mockPeople = useMemo(() => makeMockPeople(), []);
  const livePeople = useMemo(() => storeUsers.filter((u) => u.id !== myId), [storeUsers, myId]);
  const people = hasSupabase ? livePeople : mockPeople;

  const [step, setStep] = useState<0 | 1>(0);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [avatarUri, setAvatarUri] = useState<string>('');
  const [cropUri, setCropUri] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<string[]>(() => people.map((p) => p.id));

  const sanitizeHandle = (t: string) => t.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 16);
  const previewUser = { id: 'preview', handle, displayName: name, avatarEmoji: '🟡', avatarColor: colors.avatarTint, avatarImageUri: avatarUri || undefined, createdAt: 0 };

  async function choosePhoto() {
    const uri = await pickRawImage();
    if (!uri) return;
    if (Platform.OS === 'web') setCropUri(uri);
    else setAvatarUri(uri);
  }

  async function finish() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await completeAccountSetup({
        displayName: name,
        handle,
        avatarEmoji: '🟡',
        avatarColor: colors.avatarTint,
        avatarImageUri: avatarUri || undefined,
        people,
        followingIds,
      });
      // 成功するとオンボ完了で画面が切り替わる（このコンポーネントは外れる）。
    } catch (e) {
      console.warn('setup failed', e);
      setSubmitting(false);
    }
  }

  if (step === 0) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.container, { paddingTop: insets.top + space.xl }]}
      >
        <Backdrop />
        <Text style={styles.brand}>napsnap</Text>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* 大きいアバタープレビュー＋写真を選ぶ */}
          <View style={styles.avatarStage}>
            <Pressable onPress={choosePhoto} style={styles.avatarPreviewWrap}>
              <Avatar user={previewUser} size={104} />
              <View style={styles.editBadge}>
                <PencilIcon size={13} color={colors.limeInkSoft} />
              </View>
            </Pressable>
            <Pressable onPress={choosePhoto} style={({ pressed }) => [styles.choose, pressed && styles.chosePressed]}>
              <ImageIcon size={16} color={colors.text} />
              <Text style={styles.chooseText}>{avatarUri ? '写真を変える' : '写真を選ぶ'}</Text>
            </Pressable>
          </View>

          <Text style={styles.fieldLabel}>name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={copy.setupNamePlaceholder}
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            maxLength={12}
          />

          <Text style={styles.fieldLabel}>ID</Text>
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
        </ScrollView>

        <View style={{ paddingBottom: insets.bottom + space.md, paddingTop: space.sm }}>
          {(hasBanned(name) || hasBanned(handle)) && (
            <Text style={styles.bannedNote}>使えない言葉が入ってるみたい。</Text>
          )}
          <PrimaryButton
            label={copy.setupNext}
            disabled={!name.trim() || hasBanned(name) || hasBanned(handle)}
            onPress={() => setStep(1)}
          />
        </View>

        {cropUri && (
          <CropModal
            uri={cropUri}
            onCancel={() => setCropUri(null)}
            onDone={(d) => {
              setAvatarUri(d);
              setCropUri(null);
            }}
          />
        )}
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + space.xl }]}>
      <Backdrop />
      <Text style={styles.brand}>napsnap</Text>
      <Text style={styles.title}>{copy.setupFollowTitle}</Text>
      <Text style={styles.followHint}>{copy.setupFollowSub}</Text>

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
        <PrimaryButton label={submitting ? '作成中…' : copy.setupStart} disabled={submitting} onPress={finish} />
        <GhostButton label={copy.setupBack} onPress={() => setStep(0)} style={{ marginTop: space.xs }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.lg },
  brand: { color: colors.text, fontSize: 34, letterSpacing: -1, marginBottom: space.md, fontFamily: fonts.brand },
  title: { color: colors.text, fontSize: font.hero, fontWeight: '800', lineHeight: 48, fontFamily: fonts.serif, letterSpacing: -1 },
  followHint: { color: colors.textDim, fontSize: font.body, marginTop: space.sm, fontFamily: fonts.ui },
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
    backgroundColor: colors.limeSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.bg,
  },
  choose: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    borderRadius: radius.xs,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.text,
  },
  chosePressed: { backgroundColor: colors.surfaceSunken },
  chooseText: { color: colors.text, fontSize: font.body, fontWeight: '700', fontFamily: fonts.ui },

  fieldLabel: { color: colors.textDim, fontSize: font.small, fontWeight: '700', fontFamily: fonts.ui, marginTop: space.lg, marginBottom: space.xs },
  input: {
    backgroundColor: colors.surfaceRaised,
    color: colors.text,
    fontSize: 22,
    fontWeight: '600',
    fontFamily: fonts.ui,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 15,
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
  at: { color: colors.textDim, fontSize: font.lead, fontWeight: '700', fontFamily: fonts.handle },
  handleInput: { flex: 1, color: colors.text, fontSize: 18, fontWeight: '500', fontFamily: fonts.handle, letterSpacing: 0.3, paddingVertical: 15, marginLeft: 4 },
  hint: { color: colors.textFaint, fontSize: font.small, marginTop: space.xs },
  bannedNote: { color: colors.warn, fontSize: font.small, fontWeight: '700', fontFamily: fonts.ui, textAlign: 'center', marginBottom: space.xs },

  // 罫線で区切った“名簿”。塗りカードにはしない。
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.sm,
    borderBottomWidth: rule.hair,
    borderBottomColor: colors.hairline,
  },
  personPressed: { backgroundColor: colors.surfaceSunken },
  personName: { color: colors.text, fontSize: font.body, fontWeight: '700', fontFamily: fonts.name },
  personHandle: { color: colors.textDim, fontSize: font.small, marginTop: 1, fontFamily: fonts.handle },
  followBtn: {
    borderRadius: radius.xs,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'transparent',
    borderWidth: rule.hair,
    borderColor: colors.text,
  },
  followBtnOn: { backgroundColor: colors.lime, borderColor: colors.limeDust },
  followText: { color: colors.text, fontSize: font.small, fontWeight: '700', fontFamily: fonts.ui },
  followTextOn: { color: colors.limeInk },
});
