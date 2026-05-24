import React, { useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, font, radius, space } from '../theme';
import { CAPTION_FONTS, captionFont } from '../lib/fonts';
import { PostCaption } from '../types';

// 文字に使える色（3種）。
export const CAPTION_COLORS = [
  { key: 'white', color: '#FFFDF7' },
  { key: 'ink', color: '#1A1A14' },
  { key: 'lime', color: '#E4FF54' },
] as const;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const shadowFor = (color: string) => (color === '#1A1A14' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)');

// 表示用：写真の上の x,y（0..1, 中心）に文字を重ねる。サイズを測って中央合わせ。
export function CaptionView({ caption }: { caption: PostCaption }) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [txt, setTxt] = useState({ w: 0, h: 0 });
  if (!caption?.text) return null;
  const f = captionFont(caption.fontKey);
  const left = caption.x * box.w - txt.w / 2;
  const top = caption.y * box.h - txt.h / 2;
  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      <Text
        onLayout={(e) => setTxt({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
        style={[
          styles.text,
          {
            position: 'absolute',
            left: box.w ? left : -9999,
            top,
            fontFamily: f.family,
            fontWeight: f.weight,
            color: caption.color,
            textShadowColor: shadowFor(caption.color),
          },
        ]}
      >
        {caption.text}
      </Text>
    </View>
  );
}

// 編集用：文字入力＋フォント/色、そしてドラッグで自由に位置を移動。
export function CaptionEditor({
  value,
  onChange,
  onDone,
}: {
  value: PostCaption;
  onChange: (c: PostCaption) => void;
  onDone: () => void;
}) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [txt, setTxt] = useState({ w: 0, h: 0 });
  const boxRef = useRef({ w: 1, h: 1 });
  const valRef = useRef(value);
  valRef.current = value;
  const start = useRef({ x: 0.5, y: 0.5 });

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
      onPanResponderGrant: () => {
        start.current = { x: valRef.current.x, y: valRef.current.y };
      },
      onPanResponderMove: (_, g) => {
        const bw = boxRef.current.w || 1;
        const bh = boxRef.current.h || 1;
        onChange({
          ...valRef.current,
          x: clamp(start.current.x + g.dx / bw, 0.08, 0.92),
          y: clamp(start.current.y + g.dy / bh, 0.08, 0.92),
        });
      },
    })
  ).current;

  const f = captionFont(value.fontKey);
  const left = value.x * box.w - txt.w / 2;
  const top = value.y * box.h - txt.h / 2;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable style={styles.editScrim} onPress={onDone} />

      <View
        style={StyleSheet.absoluteFill}
        pointerEvents="box-none"
        onLayout={(e) => {
          const l = e.nativeEvent.layout;
          boxRef.current = { w: l.width, h: l.height };
          setBox({ w: l.width, h: l.height });
        }}
      >
        <View
          {...pan.panHandlers}
          onLayout={(e) => setTxt({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
          style={{ position: 'absolute', left: box.w ? left : -9999, top }}
        >
          <TextInput
            value={value.text}
            onChangeText={(t) => onChange({ ...valRef.current, text: t.slice(0, 60) })}
            placeholder="ここに文字"
            placeholderTextColor="rgba(255,255,255,0.6)"
            autoFocus
            multiline
            style={[
              styles.text,
              styles.input,
              { fontFamily: f.family, fontWeight: f.weight, color: value.color, textShadowColor: shadowFor(value.color) },
            ]}
          />
        </View>
      </View>

      <View style={styles.controls} pointerEvents="box-none">
        <View style={styles.controlRow}>
          {CAPTION_FONTS.map((opt) => (
            <Pressable
              key={opt.key}
              onPress={() => onChange({ ...valRef.current, fontKey: opt.key })}
              style={[styles.chip, value.fontKey === opt.key && styles.chipActive]}
            >
              <Text style={[styles.chipText, { fontFamily: opt.family }, value.fontKey === opt.key && styles.chipTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
          <View style={styles.sep} />
          {CAPTION_COLORS.map((c) => (
            <Pressable
              key={c.key}
              onPress={() => onChange({ ...valRef.current, color: c.color })}
              style={[styles.swatch, { backgroundColor: c.color }, value.color === c.color && styles.swatchActive]}
            />
          ))}
        </View>
        <Text style={styles.dragHint}>ドラッグで移動</Text>
        <Pressable onPress={onDone} style={styles.doneBtn}>
          <Text style={styles.doneText}>完了</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    textAlign: 'center',
    fontSize: 30,
    lineHeight: 38,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  input: { minWidth: 80, maxWidth: 320 },
  editScrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.25)' },
  controls: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', gap: space.sm, paddingBottom: space.md },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(18,17,14,0.6)',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.mediaChipBorder,
  },
  chip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm },
  chipActive: { backgroundColor: 'rgba(255,255,255,0.16)' },
  chipText: { color: colors.onMediaDim, fontSize: font.small, fontWeight: '700' },
  chipTextActive: { color: colors.onMedia },
  sep: { width: 1, height: 18, backgroundColor: 'rgba(255,255,255,0.2)' },
  swatch: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  swatchActive: { borderColor: colors.lime },
  dragHint: { color: colors.onMediaDim, fontSize: font.tiny, fontWeight: '700' },
  doneBtn: { backgroundColor: colors.lime, borderRadius: radius.pill, paddingHorizontal: 22, paddingVertical: 9 },
  doneText: { color: colors.limeInk, fontSize: font.body, fontWeight: '900' },
});
