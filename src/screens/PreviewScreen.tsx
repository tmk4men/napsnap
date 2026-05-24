import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, space } from '../theme';
import { copy } from '../copy';
import { GhostButton, PrimaryButton } from '../components/ui';
import { ChekiCard } from '../components/ChekiCard';
import { SpeakerOnIcon, CloseIcon } from '../components/icons';
import { CAPTION_FONTS } from '../lib/fonts';
import { Nav } from '../navigation/nav';
import { useStore } from '../store';
import { PostCaption } from '../types';
import { topicByKey } from '../topics';
import { detectFaces, FaceResult } from '../lib/faceCheck';

const DEFAULT_CAPTION: PostCaption = { text: '', fontKey: 'hand', color: colors.text, x: 0.5, y: 0.85 };

export function PreviewScreen({
  uri,
  audioUri,
  topicKey,
  canRetake,
  nav,
}: {
  uri: string;
  audioUri?: string;
  topicKey?: string;
  canRetake: boolean;
  nav: Nav;
}) {
  const insets = useSafeAreaInsets();
  const addPost = useStore((s) => s.addPost);
  const player = useAudioPlayer(audioUri ?? null);
  const status = useAudioPlayerStatus(player);
  const topic = topicByKey(topicKey);

  const [caption, setCaption] = useState<PostCaption>(DEFAULT_CAPTION);
  const hasCaption = caption.text.trim().length > 0;
  const [stageW, setStageW] = useState(0);
  const cardW = Math.min(Math.max(0, stageW - 72), 300);

  // 投稿前の顔チェック（Web=MediaPipe / ネイティブは本番で端末側に差し替え）
  const [face, setFace] = useState<FaceResult | null>(null);
  useEffect(() => {
    let alive = true;
    setFace(null);
    detectFaces(uri).then((r) => {
      if (alive) setFace(r);
    });
    return () => {
      alive = false;
    };
  }, [uri]);
  const checking = face === null;
  const hasFace = !!face?.ok && face.faces > 0; // 顔ありで確定 → ブロック
  const checkFailed = !!face && !face.ok; // 判定できなかった → 出せるが注意書き
  const canPost = !checking && !hasFace;

  function postIt() {
    if (!canPost) return;
    try {
      player.pause();
    } catch {}
    addPost(uri, audioUri, hasCaption ? caption : undefined, topicKey);
    nav.onPosted();
  }

  function playClip() {
    if (!audioUri) return;
    try {
      player.seekTo(0);
      player.play();
    } catch {}
  }

  return (
    <View style={styles.container}>
      {/* 上部 */}
      <View style={[styles.top, { paddingTop: insets.top + space.sm }]}>
        <Pressable onPress={nav.closeOverlay} style={styles.iconBtn} hitSlop={12}>
          <CloseIcon size={18} color={colors.text} />
        </Pressable>
        <Text style={styles.heading}>{topic ? `お題：${topic.prompt}` : copy.previewTitle}</Text>
        <Pressable onPress={playClip} disabled={!audioUri} style={[styles.soundChip, status.playing && styles.soundChipOn]}>
          <SpeakerOnIcon size={15} color={status.playing ? colors.limeInk : colors.text} />
        </Pressable>
      </View>

      {/* チェキ（下余白の白に手書き文字を入れられる） */}
      <View style={styles.stage} onLayout={(e) => setStageW(e.nativeEvent.layout.width)}>
        {cardW > 0 && (
          <ChekiCard
            uri={uri}
            caption={caption}
            width={cardW}
            date={Date.now()}
            tilt={0}
            editable
            onChangeText={(t) => setCaption((c) => ({ ...c, text: t }))}
            placeholder="ひとこと（任意）"
          />
        )}
      </View>

      {/* 下部シート：書体・顔チェック・出す */}
      <View style={[styles.sheet, { paddingBottom: insets.bottom + space.md }]}>
        <View style={styles.grabber} />
        <View style={styles.fontRow}>
          {CAPTION_FONTS.map((opt) => (
            <Pressable
              key={opt.key}
              onPress={() => setCaption((c) => ({ ...c, fontKey: opt.key }))}
              style={[styles.fontChip, caption.fontKey === opt.key && styles.fontChipActive]}
            >
              <Text
                style={[styles.fontChipText, { fontFamily: opt.family }, caption.fontKey === opt.key && styles.fontChipTextActive]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {hasFace ? (
          <View style={styles.warn}>
            <View style={styles.warnDot} />
            <Text style={styles.warnText}>顔が写ってるかも。napsnapは顔なしで。</Text>
          </View>
        ) : checking ? (
          <Text style={styles.checking}>顔がないか確認中…</Text>
        ) : checkFailed ? (
          <Text style={styles.checking}>顔チェックできなかった（そのまま出せます）</Text>
        ) : null}

        {hasFace ? (
          /* 顔ブロックは出せない＝撮り直しは回数に数えず、何度でも */
          <PrimaryButton label="撮り直す" onPress={() => nav.openCamera(topicKey)} />
        ) : (
          <PrimaryButton label={checking ? '確認中…' : copy.post} onPress={postIt} disabled={!canPost} />
        )}
        {canRetake && !hasFace && (
          <GhostButton label="撮り直す（あと1回）" onPress={nav.retake} style={{ marginTop: space.xs }} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: { color: colors.text, fontSize: font.lead, fontWeight: '900', fontFamily: undefined },
  soundChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundChipOn: { backgroundColor: colors.lime, borderColor: 'rgba(24,26,13,0.10)' },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg },
  sheet: {
    backgroundColor: colors.bg,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    gap: space.xs,
  },
  grabber: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.line, alignSelf: 'center', marginBottom: space.sm },
  fontRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: space.xs },
  fontChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  fontChipActive: { backgroundColor: colors.limeSoft, borderColor: colors.limeLine },
  fontChipText: { color: colors.textDim, fontSize: font.body, fontWeight: '700' },
  fontChipTextActive: { color: colors.limeInkSoft },
  warn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(217,71,63,0.12)',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(217,71,63,0.4)',
    marginBottom: space.xs,
  },
  warnDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.warn },
  warnText: { color: colors.warn, fontSize: font.small, fontWeight: '800' },
  checking: { color: colors.textDim, fontSize: font.small, fontWeight: '700', textAlign: 'center', marginBottom: space.xs },
});
