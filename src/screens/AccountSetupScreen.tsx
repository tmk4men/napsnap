import React, { useEffect, useMemo, useState } from 'react';
import * as be from '../lib/backend';
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
import { fonts } from '../lib/fonts';
import { copy } from '../copy';
import { Avatar, PrimaryButton } from '../components/ui';
import { Backdrop } from '../components/Backdrop';
import { PencilIcon } from '../components/icons';
import { useStore } from '../store';
import { hasSupabase } from '../config';
import { makeMockPeople } from '../seed';
import { pickRawImage } from '../lib/avatar';
import { hasBanned } from '../lib/words';
import { CropModal } from '../components/CropModal';

// オンボは「名前＋ID＋（任意）写真」だけの1ページ。フォロー選択は廃止（ノイズになるため）。
// ライブは公式だけ自動フォロー、モックは全モックを自動フォロー（デモが空にならないように）。
export function AccountSetupScreen() {
  const insets = useSafeAreaInsets();
  const completeAccountSetup = useStore((s) => s.completeAccountSetup);
  const mockPeople = useMemo(() => makeMockPeople(), []);

  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [avatarUri, setAvatarUri] = useState<string>('');
  const [cropUri, setCropUri] = useState<string | null>(null);
  // IDの重複チェック（ライブのみ）。500ms デバウンスで使用済か問い合わせる。
  const [handleStatus, setHandleStatus] = useState<'idle' | 'checking' | 'taken' | 'free'>('idle');

  useEffect(() => {
    if (!hasSupabase) {
      setHandleStatus('idle');
      return;
    }
    const trimmed = handle.trim();
    if (!trimmed) {
      setHandleStatus('idle');
      return;
    }
    setHandleStatus('checking');
    const t = setTimeout(async () => {
      try {
        const taken = await be.isHandleTaken(trimmed);
        setHandleStatus(taken ? 'taken' : 'free');
      } catch {
        setHandleStatus('idle');
      }
    }, 500);
    return () => clearTimeout(t);
  }, [handle]);

  const sanitizeHandle = (t: string) => t.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 16);
  const previewUser = {
    id: 'preview',
    handle,
    displayName: name,
    avatarEmoji: '🟡',
    avatarColor: colors.avatarTint,
    avatarImageUri: avatarUri || undefined,
    createdAt: 0,
  };

  async function choosePhoto() {
    const uri = await pickRawImage();
    if (!uri) return;
    if (Platform.OS === 'web') setCropUri(uri);
    else setAvatarUri(uri);
  }

  async function finish() {
    if (submitting) return;
    if (!name.trim() || !handle.trim() || hasBanned(name) || hasBanned(handle)) return;
    if (handleStatus === 'taken' || handleStatus === 'checking') return;
    setSubmitting(true);
    try {
      await completeAccountSetup({
        displayName: name,
        handle,
        avatarEmoji: '🟡',
        avatarColor: colors.avatarTint,
        avatarImageUri: avatarUri || undefined,
        // ライブ：完全に空からスタート（公式は liveCompleteSetup 側で自動フォロー）。
        // モック：デモが空にならないよう全モックを自動フォロー。
        people: hasSupabase ? [] : mockPeople,
        followingIds: hasSupabase ? [] : mockPeople.map((p) => p.id),
      });
      // 成功するとオンボ完了で画面が切り替わる（このコンポーネントは外れる）。
    } catch (e) {
      console.warn('setup failed', e);
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { paddingTop: insets.top + space.xl }]}
    >
      <Backdrop />
      <Text style={styles.brand}>napsnap</Text>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* アバタープレビュー：隅の鉛筆バッジをタップでフォトピッカー（テキストボタンは廃止） */}
        <View style={styles.avatarStage}>
          <Pressable onPress={choosePhoto} style={styles.avatarPreviewWrap}>
            <Avatar user={previewUser} size={104} />
            <View style={styles.editBadge}>
              <PencilIcon size={13} color={colors.limeInkSoft} />
            </View>
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
        {/* ID重複チェックの状態（ライブのみ・デバウンス）。 */}
        {handle.trim().length > 0 && (
          <Text
            style={[
              styles.handleHint,
              handleStatus === 'taken' && { color: colors.warn },
              handleStatus === 'free' && { color: colors.textDim },
            ]}
          >
            {handleStatus === 'checking' && '確認中…'}
            {handleStatus === 'taken' && 'この ID は使われてる'}
            {handleStatus === 'free' && 'この ID 使える'}
          </Text>
        )}
      </ScrollView>

      <View style={{ paddingBottom: insets.bottom + space.md, paddingTop: space.sm }}>
        {(hasBanned(name) || hasBanned(handle)) && (
          <Text style={styles.bannedNote}>使えない言葉が入ってるみたい。</Text>
        )}
        <PrimaryButton
          label={submitting ? '作成中…' : copy.setupStart}
          disabled={
            submitting ||
            !name.trim() ||
            !handle.trim() ||
            hasBanned(name) ||
            hasBanned(handle) ||
            handleStatus === 'taken' ||
            handleStatus === 'checking'
          }
          onPress={finish}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.lg },
  brand: { color: colors.text, fontSize: 34, letterSpacing: -1, marginBottom: space.md, fontFamily: fonts.brand },

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
  bannedNote: { color: colors.warn, fontSize: font.small, fontWeight: '700', fontFamily: fonts.ui, textAlign: 'center', marginBottom: space.xs },
  handleHint: { color: colors.textFaint, fontSize: font.small, fontWeight: '500', fontFamily: fonts.ui, marginTop: space.xs },
});
