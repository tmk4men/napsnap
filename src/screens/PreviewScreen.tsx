import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, rule, space } from '../theme';
import { copy } from '../copy';
import { tr } from '../i18n';
import { GhostButton, PrimaryButton } from '../components/ui';
import { Backdrop } from '../components/Backdrop';
import { ChekiCard } from '../components/ChekiCard';
import { CloseIcon, PostArrowIcon } from '../components/icons';
import { fonts } from '../lib/fonts';
import { Nav } from '../navigation/nav';
import { useStore } from '../store';
import { PostCaption } from '../types';
import { topicByKey } from '../topics';
import { detectFaces, FaceResult } from '../lib/faceCheck';
import { compressForStore } from '../lib/compressImage';
import { hasBanned } from '../lib/words';

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
  const topic = topicByKey(topicKey);

  const [caption, setCaption] = useState<PostCaption>(DEFAULT_CAPTION);
  const hasCaption = caption.text.trim().length > 0;
  const banned = hasBanned(caption.text); // 禁止ワードが入っていたら出せない
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
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

  // 撮影直後の音を1回だけ自動再生。録ったその瞬間の音を投稿前に確認させる。
  useEffect(() => {
    if (!audioUri) return;
    try {
      player.loop = false;
      player.seekTo(0);
      player.play();
    } catch {}
    return () => {
      try {
        player.pause();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUri]);
  const checking = face === null;
  const hasFace = !!face?.ok && face.faces > 0; // 顔ありで確定 → ブロック
  const checkFailed = !!face && !face.ok; // 判定できなかった → 出せるが注意書き
  const canPost = !checking && !hasFace && !banned && !posting;

  async function postIt() {
    if (!canPost) return;
    setPosting(true);
    setPostError(null);
    try {
      player.pause();
    } catch {}
    try {
      // 保存・配信を軽くするため、出す直前に画像を縮小＋再エンコード（失敗時は元のまま）
      const finalUri = await compressForStore(uri);
      await addPost(finalUri, audioUri, hasCaption ? caption : undefined, topicKey);
      nav.onPosted();
    } catch (e) {
      // 失敗時は画面を閉じず、もう一度押せるようにする。原因が分かるよう短く表示。
      // Supabase は Error ではなく { message, code, details, hint } の素オブジェクトを投げてくる
      // ので個別に拾う。読みづらい [object Object] にしない。
      let msg: string;
      if (e instanceof Error) {
        msg = e.message;
      } else if (e && typeof e === 'object') {
        const o = e as Record<string, unknown>;
        msg = (o.message as string) || (o.error_description as string) || (o.error as string) || JSON.stringify(o);
      } else {
        msg = String(e);
      }
      console.warn('postIt failed', e);
      setPostError(tr(`送れなかった：${msg.slice(0, 160)}`, `Couldn't post: ${msg.slice(0, 160)}`));
      setPosting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Backdrop />
      {/* 上部 */}
      <View style={[styles.top, { paddingTop: insets.top + space.sm }]}>
        <Pressable onPress={nav.closeOverlay} style={styles.iconBtn} hitSlop={12}>
          <CloseIcon size={18} color={colors.text} />
        </Pressable>
        <Text style={styles.heading}>{topic ? tr(`お題：${topic.prompt}`, `Prompt: ${topic.prompt}`) : copy.previewTitle}</Text>
        <View style={styles.topSpacer} />
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
            placeholder=""
          />
        )}
      </View>

      {/* 下部シート：顔チェック・出す */}
      <View style={[styles.sheet, { paddingBottom: insets.bottom + space.md }]}>
        <View style={styles.grabber} />

        {banned ? (
          <View style={styles.warn}>
            <View style={styles.warnDot} />
            <Text style={styles.warnText}>{tr('使えない言葉が入ってるみたい。', 'That contains a word that can\'t be used.')}</Text>
          </View>
        ) : hasFace ? (
          <View style={styles.warn}>
            <View style={styles.warnDot} />
            <Text style={styles.warnText}>{tr('顔が写ってるかも。napsnapは顔なしで。', 'A face may be showing. napsnap is face-free.')}</Text>
          </View>
        ) : checking ? (
          <Text style={styles.checking}>{tr('顔がないか確認中…', 'Checking for faces…')}</Text>
        ) : checkFailed ? (
          <Text style={styles.checking}>{tr('顔チェックできなかった（そのまま出せます）', "Couldn't check for faces (you can still post)")}</Text>
        ) : null}

        {hasFace ? (
          /* 顔ブロックは出せない＝撮り直しは回数に数えず、何度でも */
          <PrimaryButton label={tr('撮り直す', 'Retake')} onPress={() => nav.openCamera(topicKey)} />
        ) : (
          /* 投稿ボタン：矢印アイコンだけのミニマル。投稿中は下に小さく状態表示。 */
          <Pressable
            onPress={postIt}
            disabled={!canPost}
            style={({ pressed }) => [styles.postBtn, !canPost && styles.postBtnDisabled, pressed && canPost && styles.postBtnPressed]}
          >
            <PostArrowIcon size={28} color={canPost ? colors.limeInk : colors.textFaint} />
          </Pressable>
        )}
        {posting && <Text style={styles.postingHint}>{tr('送信中…', 'Posting…')}</Text>}
        {postError && <Text style={styles.postErrorText}>{postError}</Text>}
        {canRetake && !hasFace && (
          <GhostButton label={tr('撮り直す（あと1回）', 'Retake (1 left)')} onPress={nav.retake} style={{ marginTop: space.xs }} />
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
    borderRadius: radius.xs,
    backgroundColor: colors.surfaceRaised,
    borderWidth: rule.hair,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: { color: colors.text, fontSize: font.lead, fontWeight: '800', fontFamily: fonts.serif, letterSpacing: -0.5 },
  // 左の閉じるボタンと釣り合いを取るための見えないダミー
  topSpacer: { width: 36, height: 36 },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg },
  sheet: {
    backgroundColor: colors.bg,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    gap: space.xs,
  },
  grabber: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.line, alignSelf: 'center', marginBottom: space.sm },
  warn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.limeSoft,
    borderRadius: radius.xs,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: rule.hair,
    borderColor: colors.limeLine,
    marginBottom: space.xs,
  },
  warnDot: { width: 7, height: 7, borderRadius: 0, backgroundColor: colors.warn },
  warnText: { color: colors.warn, fontSize: font.small, fontWeight: '800' },
  checking: { color: colors.textDim, fontSize: font.small, fontWeight: '700', textAlign: 'center', marginBottom: space.xs },
  // 投稿ボタン（矢印SVG・PrimaryButtonと同じ寸法感）
  postBtn: {
    height: 56,
    borderRadius: radius.xs,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: rule.hair,
    borderColor: colors.limeDust,
  },
  postBtnDisabled: { backgroundColor: colors.surfaceSunken, borderColor: colors.hairline },
  postBtnPressed: { transform: [{ translateY: 1 }], opacity: 0.92 },
  postingHint: { color: colors.textDim, fontSize: font.small, fontWeight: '700', fontFamily: fonts.ui, textAlign: 'center', marginTop: space.xs },
  postErrorText: { color: colors.warn, fontSize: font.small, fontWeight: '700', fontFamily: fonts.ui, textAlign: 'center', marginTop: space.xs },
});
