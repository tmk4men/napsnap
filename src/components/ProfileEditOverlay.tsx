import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, space } from '../theme';
import { fonts } from '../lib/fonts';
import { FadeIn, PrimaryButton } from './ui';
import { CloseIcon } from './icons';
import { hasBanned } from '../lib/words';

const AD_SECONDS = 5;

// 名前/ID の変更フロー：2週間に2回まで、毎回「広告を見る」と変更できる（デモは擬似広告）。
export function ProfileEditOverlay({
  currentName,
  currentHandle,
  editsLeft,
  nextInDays,
  onSave,
  onClose,
}: {
  currentName: string;
  currentHandle: string;
  editsLeft: number;
  nextInDays: number;
  onSave: (name: string, handle: string) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const blocked = editsLeft <= 0;
  const [step, setStep] = useState<'ad' | 'form'>('ad');
  const [left, setLeft] = useState(AD_SECONDS);
  const [name, setName] = useState(currentName);
  const [handle, setHandle] = useState(currentHandle);

  useEffect(() => {
    if (step !== 'ad' || blocked) return;
    if (left <= 0) return;
    const id = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [step, left, blocked]);

  const sanitize = (t: string) => t.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 16);

  return (
    <FadeIn style={styles.container} dy={16}>
      <View style={[styles.bar, { paddingTop: insets.top + space.sm }]}>
        <Text style={styles.barTitle}>なまえ / ID を変える</Text>
        <Pressable onPress={onClose} style={styles.close} hitSlop={12}>
          <CloseIcon size={18} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.body}>
        {blocked ? (
          <View style={styles.center}>
            <Text style={styles.bigNote}>2週間に2回まで</Text>
            <Text style={styles.sub}>あと{nextInDays}日で、また変えられる。</Text>
          </View>
        ) : step === 'ad' ? (
          <View style={styles.center}>
            <View style={styles.adBox}>
              <Text style={styles.adTag}>広告</Text>
              <Text style={styles.adBody}>広告を見ると{'\n'}なまえ / ID を変えられます</Text>
            </View>
            <Text style={styles.sub}>あと{editsLeft}回、変えられる（2週間に2回）</Text>
            <View style={{ height: space.md }} />
            <PrimaryButton
              label={left > 0 ? `広告 ${left}秒…` : '変更へ進む'}
              disabled={left > 0}
              onPress={() => setStep('form')}
            />
          </View>
        ) : (
          <View>
            <Text style={styles.fieldLabel}>name</Text>
            <TextInput value={name} onChangeText={setName} maxLength={12} style={styles.input} placeholderTextColor="rgba(110,104,89,0.42)" />
            <Text style={styles.fieldLabel}>ID</Text>
            <View style={styles.handleWrap}>
              <Text style={styles.at}>@</Text>
              <TextInput
                value={handle}
                onChangeText={(t) => setHandle(sanitize(t))}
                autoCapitalize="none"
                maxLength={16}
                style={styles.handleInput}
                placeholderTextColor="rgba(110,104,89,0.42)"
              />
            </View>
            <View style={{ height: space.lg }} />
            {(hasBanned(name) || hasBanned(handle)) && (
              <Text style={styles.bannedNote}>使えない言葉が入ってるみたい。</Text>
            )}
            <PrimaryButton
              label="保存する"
              disabled={!name.trim() || !handle.trim() || hasBanned(name) || hasBanned(handle)}
              onPress={() => onSave(name, handle)}
            />
          </View>
        )}
      </View>
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.bg },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
    paddingBottom: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  barTitle: { color: colors.text, fontSize: font.lead, fontWeight: '800', fontFamily: fonts.display },
  close: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSunken },
  body: { flex: 1, padding: space.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bigNote: { color: colors.text, fontSize: font.title, fontWeight: '800', fontFamily: fonts.display },
  sub: { color: colors.textDim, fontSize: font.body, marginTop: space.sm, fontFamily: fonts.ui, textAlign: 'center' },
  adBox: {
    width: '100%',
    height: 200,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSunken,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.lg,
  },
  adTag: {
    position: 'absolute',
    top: 10,
    left: 12,
    color: colors.textFaint,
    fontSize: font.tiny,
    fontWeight: '800',
    fontFamily: fonts.ui,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  adBody: { color: colors.textDim, fontSize: font.body, fontWeight: '700', fontFamily: fonts.ui, textAlign: 'center', lineHeight: font.body * 1.6 },
  fieldLabel: { color: colors.textDim, fontSize: font.small, fontWeight: '700', fontFamily: fonts.ui, marginTop: space.md, marginBottom: space.xs },
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
  bannedNote: { color: colors.warn, fontSize: font.small, fontWeight: '700', fontFamily: fonts.ui, textAlign: 'center', marginBottom: space.sm },
});
