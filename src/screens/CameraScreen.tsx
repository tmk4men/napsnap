import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, space } from '../theme';
import { copy } from '../copy';
import { GhostButton } from '../components/ui';
import { Nav } from '../navigation/nav';
import { demoCapture } from '../lib/images';

export function CameraScreen({ nav }: { nav: Nav }) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const camRef = useRef<CameraView | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  const granted = !!permission?.granted;

  async function shoot() {
    if (busy) return;
    setBusy(true);
    try {
      const photo = await camRef.current?.takePictureAsync({ quality: 0.6 });
      if (photo?.uri) {
        nav.onCaptured(photo.uri);
        return;
      }
      nav.onCaptured(demoCapture());
    } catch {
      // Web で権限拒否などで撮れない場合はデモ写真にフォールバック
      nav.onCaptured(demoCapture());
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      {granted ? (
        <CameraView ref={camRef} style={StyleSheet.absoluteFill} facing="back" />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.noCam]}>
          <Text style={styles.noCamEmoji}>🪟</Text>
          <Text style={styles.noCamText}>
            カメラが使えない環境でも、{'\n'}デモ写真で体験できる。
          </Text>
        </View>
      )}

      {/* 上部：閉じる＋文化的な制約コピー */}
      <View style={[styles.top, { paddingTop: insets.top + space.sm }]}>
        <Pressable onPress={nav.closeOverlay} style={styles.close} hitSlop={12}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
        <View style={styles.guidePill}>
          <Text style={styles.guideText}>{copy.cameraGuide}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* 中央のうっすらガイド枠 */}
      <View pointerEvents="none" style={styles.frame}>
        <Text style={styles.frameHint}>人じゃなく、生活を。</Text>
      </View>

      {/* 下部：シャッター */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + space.lg }]}>
        <Pressable onPress={shoot} disabled={busy} style={styles.shutterOuter}>
          <View style={[styles.shutterInner, busy && { opacity: 0.4 }]} />
        </Pressable>
        {granted && (
          <GhostButton label="カメラが使えない時はデモ写真で" onPress={() => nav.onCaptured(demoCapture())} />
        )}
        {!granted && permission && !permission.canAskAgain && Platform.OS !== 'web' && (
          <Text style={styles.permNote}>設定でカメラを許可すると実際に撮影できる</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  noCam: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#101010' },
  noCamEmoji: { fontSize: 56, marginBottom: space.md },
  noCamText: { color: colors.gray, fontSize: font.body, textAlign: 'center', lineHeight: 22 },
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: colors.white, fontSize: 18, fontWeight: '700' },
  guidePill: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
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
  frameHint: { color: 'rgba(255,255,255,0.6)', fontSize: font.small, fontWeight: '600' },
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: space.xs,
  },
  shutterOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.lime },
  permNote: { color: colors.gray, fontSize: font.small, marginTop: space.xs },
});
