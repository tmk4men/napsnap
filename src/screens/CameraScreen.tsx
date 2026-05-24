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
import { copy } from '../copy';
import { GhostButton } from '../components/ui';
import { Waveform } from '../components/Waveform';
import { Nav } from '../navigation/nav';
import { demoCapture } from '../lib/images';
import { RECORD_SECONDS } from '../lib/audio';

type Phase = 'live' | 'recording';

export function CameraScreen({ nav }: { nav: Nav }) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [micGranted, setMicGranted] = useState(false);
  const camRef = useRef<CameraView | null>(null);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const [phase, setPhase] = useState<Phase>('live');
  const [frozenUri, setFrozenUri] = useState<string | null>(null);
  const [withSound, setWithSound] = useState(true);
  const [facing, setFacing] = useState<CameraType>('back');
  const progress = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    let micOk = micGranted;
    if (!micOk) {
      try {
        const r = await requestRecordingPermissionsAsync();
        micOk = r.granted;
        setMicGranted(r.granted);
      } catch {}
    }
    setWithSound(micOk);

    let recording = false;
    if (micOk) {
      try {
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await recorder.prepareToRecordAsync();
        recorder.record();
        recording = true;
      } catch {
        recording = false;
        setWithSound(false);
      }
    }

    if (recording) {
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: RECORD_SECONDS * 1000,
        useNativeDriver: false,
      }).start();
      timeoutRef.current = setTimeout(async () => {
        let audioUri: string | undefined;
        try {
          await recorder.stop();
          audioUri = recorder.uri ?? undefined;
        } catch {}
        try {
          await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
        } catch {}
        nav.onCaptured(photoUri, audioUri);
      }, RECORD_SECONDS * 1000);
    } else {
      timeoutRef.current = setTimeout(() => nav.onCaptured(photoUri, undefined), 700);
    }
  }

  async function shoot() {
    if (phase !== 'live') return;
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
        <CameraView ref={camRef} style={StyleSheet.absoluteFill} facing={facing} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.noCam]}>
          <Text style={styles.noCamEmoji}>🪟</Text>
          <Text style={styles.noCamText}>カメラが使えない環境でも、{'\n'}デモ写真で体験できる。</Text>
        </View>
      )}

      <View style={[styles.top, { paddingTop: insets.top + space.sm }]}>
        <Pressable onPress={nav.closeOverlay} style={styles.close} hitSlop={12}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
        <View style={styles.guidePill}>
          <Text style={styles.guideText}>{copy.cameraGuide}</Text>
        </View>
        {granted ? (
          <Pressable
            onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
            style={styles.flip}
            hitSlop={12}
          >
            <Text style={styles.flipIcon}>⟲</Text>
            <Text style={styles.flipLabel}>{facing === 'back' ? '外' : '内'}</Text>
          </Pressable>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      <View pointerEvents="none" style={styles.frame}>
        <Text style={styles.frameHint}>{copy.cameraSoundHint}</Text>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + space.lg }]}>
        <Pressable onPress={shoot} style={styles.shutterOuter}>
          <View style={styles.shutterInner} />
        </Pressable>
        {granted && (
          <GhostButton label="カメラが使えない時はデモ写真で" onPress={() => startCapture(demoCapture())} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  noCam: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#101010' },
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
  flip: {
    minWidth: 44,
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 10,
    backgroundColor: colors.mediaChip,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  flipIcon: { color: colors.onMedia, fontSize: 18, fontWeight: '700' },
  flipLabel: { color: colors.lime, fontSize: font.small, fontWeight: '800' },
  guidePill: { backgroundColor: colors.mediaChip, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
  guideText: { color: colors.lime, fontSize: font.small, fontWeight: '800' },
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
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', gap: space.xs },
  shutterOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: colors.onMedia,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.lime },

  // 録音フェーズ
  recShade: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  recCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  muteChip: { backgroundColor: colors.mediaChip, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 10 },
  muteText: { color: colors.onMedia, fontSize: font.body, fontWeight: '800' },
  recBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', paddingHorizontal: space.xl },
  barTrack: { width: '100%', height: 6, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.lime, borderRadius: radius.pill },
});
