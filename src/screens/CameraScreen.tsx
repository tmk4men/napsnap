import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import {
  RecordingPresets,
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, space } from '../theme';
import { fonts } from '../lib/fonts';
import { copy } from '../copy';
import { BoltIcon, CameraIcon, CloseIcon, FlipCameraIcon, NoFaceIcon } from '../components/icons';
import { Waveform } from '../components/Waveform';
import { detectFacesInVideo, preloadDetector, preloadVideoDetector } from '../lib/faceCheck';
import { Nav } from '../navigation/nav';
import { demoCapture } from '../lib/images';
import { RECORD_SECONDS } from '../lib/audio';
import { topicByKey } from '../topics';

type Phase = 'live' | 'recording';

const WEB = Platform.OS === 'web';

// 2秒の環境音には十分な軽量設定（モノ・低ビットレート）。保存/配信を軽くする（#5）。
// プリセットを土台に共通フィールドだけ上書きし、端末ごとの enum 設定は壊さない。
const REC_OPTIONS: any = {
  ...RecordingPresets.LOW_QUALITY,
  sampleRate: 22050,
  numberOfChannels: 1,
  bitRate: 32000,
  web: { ...(RecordingPresets.LOW_QUALITY as any).web, bitsPerSecond: 32000 },
};

export function CameraScreen({ nav, topicKey }: { nav: Nav; topicKey?: string }) {
  const insets = useSafeAreaInsets();
  const topic = topicByKey(topicKey);
  const [permission, requestPermission] = useCameraPermissions();
  const [micGranted, setMicGranted] = useState(false);
  const camRef = useRef<CameraView | null>(null);
  const recorder = useAudioRecorder(REC_OPTIONS);

  const [phase, setPhase] = useState<Phase>('live');
  const [frozenUri, setFrozenUri] = useState<string | null>(null);
  const [withSound, setWithSound] = useState(true);
  const [facing, setFacing] = useState<CameraType>('back');
  const [torch, setTorch] = useState(false); // ライト（トーチ）on/off
  const [faceLive, setFaceLive] = useState(false); // ライブ映像に顔が写っている＝シャッター無効
  const progress = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // 顔検知モデルを先読みしてプレビューの待ちを減らす（静止画用＋ライブ用）
    preloadDetector();
    preloadVideoDetector();
    // 直前の録音でオーディオセッションが「録音モード」のまま残るとカメラ再起動が不調になることがある。
    // 起動時に再生モードへ戻してクリーンにする（投稿直後にカメラが真っ暗になる対策）。
    setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
  }, []);

  // 撮影前のライブ顔検知（Webのみ）。顔が写っている間はシャッターを無効にする。
  useEffect(() => {
    if (!WEB || !permission?.granted || phase !== 'live') {
      setFaceLive(false);
      return;
    }
    let alive = true;
    const id = setInterval(async () => {
      const g: any = globalThis;
      const video = g?.document?.querySelector?.('video');
      if (!video) return;
      const n = await detectFacesInVideo(video, (g.performance?.now?.() ?? Date.now()));
      if (alive) setFaceLive(n > 0);
    }, 450);
    return () => {
      alive = false;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permission?.granted, phase]);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) requestPermission();
  }, [permission]);

  useEffect(() => {
    (async () => {
      try {
        const cur = await getRecordingPermissionsAsync();
        if (cur.granted) return setMicGranted(true);
        if (cur.canAskAgain) {
          const r = await requestRecordingPermissionsAsync();
          setMicGranted(r.granted);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      try {
        if (recorder.isRecording) recorder.stop();
      } catch {}
    };
  }, []);

  const granted = !!permission?.granted;

  async function startCapture(photoUri: string) {
    if (phase !== 'live') return;
    setFrozenUri(photoUri);
    setPhase('recording');

    // 待ちの体感をなくす：固定画面に切り替えた瞬間にゲージと締切タイマーを走らせ、
    // 録音の準備（権限／audioMode／prepare）は裏で進める。準備が間に合った分だけ音が乗る。
    setWithSound(true);
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: RECORD_SECONDS * 1000,
      useNativeDriver: false,
    }).start();

    const rec = { active: false };
    (async () => {
      let micOk = micGranted;
      if (!micOk) {
        try {
          const r = await requestRecordingPermissionsAsync();
          micOk = r.granted;
          setMicGranted(r.granted);
        } catch {}
      }
      if (!micOk) {
        setWithSound(false);
        return;
      }
      try {
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await recorder.prepareToRecordAsync();
        recorder.record();
        rec.active = true;
      } catch {
        rec.active = false;
        setWithSound(false);
      }
    })();

    timeoutRef.current = setTimeout(async () => {
      let audioUri: string | undefined;
      if (rec.active) {
        try {
          await recorder.stop();
          audioUri = recorder.uri ?? undefined;
        } catch {}
      }
      try {
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      } catch {}
      nav.onCaptured(photoUri, audioUri);
    }, RECORD_SECONDS * 1000);
  }

  async function shoot() {
    if (phase !== 'live') return;
    if (faceLive) return; // 顔が写っている間は撮らせない
    let uri: string;
    try {
      const photo = await camRef.current?.takePictureAsync({ quality: 0.6 });
      uri = photo?.uri ?? demoCapture();
    } catch {
      uri = demoCapture();
    }
    startCapture(uri);
  }

  // ---- 録音フェーズ：静止画＋波形＋ゲージ ----
  if (phase === 'recording' && frozenUri) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: frozenUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <View style={styles.recShade} />
        <View style={styles.recCenter}>
          {withSound ? (
            <Waveform color={colors.lime} />
          ) : (
            <View style={styles.muteChip}>
              <Text style={styles.muteText}>{copy.noMic}</Text>
            </View>
          )}
        </View>
        {withSound && (
          <View style={[styles.recBottom, { paddingBottom: insets.bottom + space.xxl }]}>
            <View style={styles.barTrack}>
              <Animated.View
                style={[
                  styles.barFill,
                  { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
                ]}
              />
            </View>
          </View>
        )}
      </View>
    );
  }

  // ---- ライブフェーズ ----
  return (
    <View style={styles.container}>
      {granted ? (
        <CameraView ref={camRef} style={StyleSheet.absoluteFill} facing={facing} enableTorch={torch} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.noCam]}>
          <CameraIcon size={46} color={colors.onMediaDim} />
          <Text style={styles.noCamText}>カメラを許可すると{'\n'}撮影できる。</Text>
        </View>
      )}

      <View style={[styles.top, { paddingTop: insets.top + space.sm }]}>
        <Pressable onPress={nav.closeOverlay} style={styles.close} hitSlop={12}>
          <CloseIcon size={18} color={colors.onMedia} />
        </Pressable>
        {topic ? (
          <View style={styles.guidePill}>
            <View style={styles.guideDot} />
            <Text style={styles.guideText}>{`お題：${topic.prompt}`}</Text>
          </View>
        ) : (
          // 人を写さない合図。顔を検知したら赤に変わる（Web）。
          <View style={styles.noFaceChip}>
            <NoFaceIcon size={22} color={faceLive ? colors.warn : colors.onMedia} />
          </View>
        )}
        <View style={{ width: 36 }} />
      </View>

      <View pointerEvents="none" style={styles.frame} />

      <View style={[styles.bottom, { paddingBottom: insets.bottom + space.lg }]}>
        {faceLive && (
          <View style={styles.faceWarn}>
            <Text style={styles.faceWarnText}>顔が写ってる。napsnapは顔なしで。</Text>
          </View>
        )}
        <View style={styles.shutterRow}>
          <Pressable
            onPress={shoot}
            disabled={faceLive}
            style={({ pressed }) => [styles.shutterOuter, faceLive && styles.shutterDisabled, pressed && !faceLive && { transform: [{ scale: 0.94 }] }]}
          >
            <View style={styles.shutterInner}>
              <View style={styles.shutterCore} />
            </View>
          </Pressable>
          {/* シャッターの右に小さく：フラッシュ on/off と 内外カメラの切替（アイコンだけで「切替」と分かる）。 */}
          {granted && (
            <View style={styles.sideControls}>
              <Pressable onPress={() => setTorch((t) => !t)} style={styles.sideBtn} hitSlop={10}>
                <BoltIcon size={18} color={torch ? colors.lime : colors.onMedia} />
                <Text style={[styles.sideLabel, !torch && { color: colors.onMediaDim }]}>{torch ? 'ON' : 'OFF'}</Text>
              </Pressable>
              <Pressable
                onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
                style={styles.sideBtn}
                hitSlop={10}
              >
                <FlipCameraIcon size={22} color={colors.onMedia} />
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceMedia },
  noCam: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMedia },
  noCamEmoji: { fontSize: 56, marginBottom: space.md },
  noCamText: { color: colors.onMediaDim, fontSize: font.body, textAlign: 'center', lineHeight: 22 },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.mediaChip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: colors.onMedia, fontSize: 18, fontWeight: '700' },
  // シャッター右の小さな操作（フラッシュ／内外切替）
  sideControls: { position: 'absolute', right: space.xl, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  sideBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.xs,
    backgroundColor: colors.mediaChip,
    borderWidth: 1,
    borderColor: colors.mediaChipBorder,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  sideLabel: { color: colors.lime, fontSize: 9, fontWeight: '800' },
  // 人を写さない合図のチップ（上部中央）
  noFaceChip: {
    width: 40,
    height: 40,
    borderRadius: radius.xs,
    backgroundColor: colors.mediaChip,
    borderWidth: 1,
    borderColor: colors.mediaChipBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guidePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.mediaChip,
    borderRadius: radius.xs,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.mediaChipBorder,
  },
  guideDot: { width: 6, height: 6, borderRadius: 0, backgroundColor: colors.lime },
  guideText: { color: colors.onMedia, fontSize: font.small, fontWeight: '800' },
  frame: {
    position: 'absolute',
    top: '24%',
    bottom: '24%',
    left: '10%',
    right: '10%',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: space.md,
  },
  frameHint: { color: colors.onMediaDim, fontSize: font.small, fontWeight: '600' },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', gap: space.sm },
  shutterRow: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  shutterOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: colors.onMedia,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.onMedia,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterCore: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.lime },
  shutterDisabled: { opacity: 0.35 },
  faceWarn: { backgroundColor: colors.warn, borderRadius: radius.xs, paddingHorizontal: 14, paddingVertical: 8 },
  faceWarnText: { color: '#FFFFFF', fontSize: font.small, fontWeight: '800', fontFamily: fonts.ui },

  // 録音フェーズ
  recShade: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  recCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  muteChip: { backgroundColor: colors.mediaChip, borderRadius: radius.xs, paddingHorizontal: 16, paddingVertical: 10 },
  muteText: { color: colors.onMedia, fontSize: font.body, fontWeight: '800' },
  recBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', paddingHorizontal: space.xl },
  barTrack: { width: '100%', height: 6, borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.lime, borderRadius: 0 },
});
