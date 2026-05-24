import React, { useEffect, useReducer, useRef } from 'react';
import { Image, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, shadow, space } from '../theme';
import { fonts } from '../lib/fonts';

const V = 300; // トリミング枠の一辺
const OUT = 256; // 出力サイズ
const MAX_ZOOM = 3;

const clampNum = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

// プロフィール画像の「どの範囲を使うか」をドラッグ＋ズームで選ぶ（Web用、canvasで切り出してdata URL化）。
export function CropModal({
  uri,
  onCancel,
  onDone,
}: {
  uri: string;
  onCancel: () => void;
  onDone: (dataUrl: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [, force] = useReducer((x) => x + 1, 0);

  const tx = useRef(0);
  const ty = useRef(0);
  const zoom = useRef(1);
  const start = useRef({ tx: 0, ty: 0 });
  const dims = useRef({ baseScale: 1, imgW: 1, imgH: 1, ready: false });

  function clamp() {
    const { baseScale, imgW, imgH } = dims.current;
    const s = baseScale * zoom.current;
    const maxX = Math.max(0, (imgW * s - V) / 2);
    const maxY = Math.max(0, (imgH * s - V) / 2);
    tx.current = clampNum(tx.current, -maxX, maxX);
    ty.current = clampNum(ty.current, -maxY, maxY);
  }

  useEffect(() => {
    let alive = true;
    Image.getSize(
      uri,
      (w, h) => {
        if (!alive) return;
        dims.current = { imgW: w, imgH: h, baseScale: V / Math.min(w, h), ready: true };
        clamp();
        force();
      },
      () => {}
    );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uri]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        start.current = { tx: tx.current, ty: ty.current };
      },
      onPanResponderMove: (_, g) => {
        tx.current = start.current.tx + g.dx;
        ty.current = start.current.ty + g.dy;
        clamp();
        force();
      },
    })
  ).current;

  const setZoomFromX = (x: number) => {
    const r = clampNum(x / V, 0, 1);
    zoom.current = 1 + r * (MAX_ZOOM - 1);
    clamp();
    force();
  };
  const slider = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => setZoomFromX(e.nativeEvent.locationX),
      onPanResponderMove: (e) => setZoomFromX(e.nativeEvent.locationX),
    })
  ).current;

  function confirm() {
    const { baseScale, imgW, imgH, ready } = dims.current;
    if (!ready) return onCancel();
    const s = baseScale * zoom.current;
    const srcSize = V / s;
    const srcLeft = imgW / 2 - (V / 2 + tx.current) / s;
    const srcTop = imgH / 2 - (V / 2 + ty.current) / s;
    const g: any = globalThis;
    if (!g?.document) return onDone(uri);
    const img = new g.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const c = g.document.createElement('canvas');
        c.width = OUT;
        c.height = OUT;
        const ctx = c.getContext('2d');
        if (!ctx) return onDone(uri);
        ctx.drawImage(img, srcLeft, srcTop, srcSize, srcSize, 0, 0, OUT, OUT);
        onDone(c.toDataURL('image/jpeg', 0.88));
      } catch {
        onDone(uri);
      }
    };
    img.onerror = () => onDone(uri);
    img.src = uri;
  }

  const { baseScale, imgW, imgH } = dims.current;
  const s = baseScale * zoom.current;
  const elW = imgW * s;
  const elH = imgH * s;
  const thumbLeft = ((zoom.current - 1) / (MAX_ZOOM - 1)) * V;

  return (
    <View style={[styles.container, { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.lg }]}>
      <Text style={styles.title}>範囲を選ぶ</Text>
      <Text style={styles.hint}>ドラッグで移動・スライダーで拡大</Text>

      <View style={styles.stage}>
        <View style={styles.viewport} {...pan.panHandlers}>
          {dims.current.ready && (
            <Image
              source={{ uri }}
              style={{ position: 'absolute', width: elW, height: elH, left: (V - elW) / 2 + tx.current, top: (V - elH) / 2 + ty.current }}
            />
          )}
        </View>
        {/* 円形ガイド（アバターは丸く表示される） */}
        <View style={styles.circleGuide} pointerEvents="none" />
      </View>

      {/* ズームスライダー */}
      <View style={styles.sliderWrap} {...slider.panHandlers}>
        <View style={styles.track} />
        <View style={[styles.thumb, { left: clampNum(thumbLeft, 0, V) }]} />
      </View>

      <View style={styles.actions}>
        <Pressable onPress={onCancel} style={({ pressed }) => [styles.btn, styles.cancel, pressed && { opacity: 0.8 }]}>
          <Text style={styles.cancelText}>キャンセル</Text>
        </Pressable>
        <Pressable onPress={confirm} style={({ pressed }) => [styles.btn, styles.ok, pressed && { opacity: 0.85 }]}>
          <Text style={styles.okText}>決定</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surfaceMedia,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  title: { color: colors.onMedia, fontSize: font.title, fontWeight: '900', fontFamily: fonts.display },
  hint: { color: colors.onMediaDim, fontSize: font.small, marginTop: 4, marginBottom: space.lg },
  stage: { width: V, height: V, alignItems: 'center', justifyContent: 'center' },
  viewport: {
    width: V,
    height: V,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderRadius: V / 2,
  },
  circleGuide: {
    position: 'absolute',
    width: V,
    height: V,
    borderRadius: V / 2,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  sliderWrap: { width: V, height: 40, justifyContent: 'center', marginTop: space.xl },
  track: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
  thumb: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.lime,
    marginLeft: -11,
    borderWidth: 2,
    borderColor: colors.surfaceMedia,
  },
  actions: { flexDirection: 'row', gap: space.md, marginTop: space.xl },
  btn: { borderRadius: radius.pill, paddingHorizontal: 28, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  cancel: { backgroundColor: colors.mediaChip, borderWidth: 1, borderColor: colors.mediaChipBorder },
  cancelText: { color: colors.onMedia, fontSize: font.body, fontWeight: '800' },
  ok: { backgroundColor: colors.lime, boxShadow: shadow.button },
  okText: { color: colors.limeInk, fontSize: font.body, fontWeight: '900' },
});
