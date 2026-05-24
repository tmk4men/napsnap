import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, font, radius, space } from '../theme';
import { CAPTION_FONTS, captionFont } from '../lib/fonts';
import { PostCaption } from '../types';

// 文字に使える色（3種）。値＝文字色 / dark＝暗い縁取りが要るか。
export const CAPTION_COLORS = [
  { key: 'white', color: '#FFFDF7', dark: false },
  { key: 'ink', color: '#1A1A14', dark: true },
  { key: 'lime', color: '#E4FF54', dark: false },
] as const;

function posJustify(pos: PostCaption['pos']) {
  return pos === 'top' ? 'flex-start' : pos === 'bottom' ? 'flex-end' : 'center';
}

// 表示用：写真の上に文字を重ねる。読みやすさのため影/縁取りを付ける。
export function CaptionView({ caption, scale = 1 }: { caption: PostCaption; scale?: number }) {
  if (!caption?.text) return null;
  const f = captionFont(caption.fontKey);
  const isDark = caption.color === '#1A1A14';
  return (
    <View style={[styles.layer, { justifyContent: posJustify(caption.pos) }]} pointerEvents="none">
      <Text
        style={[
          styles.text,
          {
            fontFamily: f.family,
            fontWeight: f.weight,
            color: caption.color,
            fontSize: 30 * scale,
            lineHeight: 38 * scale,
            textShadowColor: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)',
          },
        ]}
      >
        {caption.text}
      </Text>
    </View>
  );
}

// 編集用：写真の上で文字入力＋フォント/色/位置を選ぶ。
export function CaptionEditor({
  value,
  onChange,
  onDone,
}: {
  value: PostCaption;
  onChange: (c: PostCaption) => void;
  onDone: () => void;
}) {
  const f = captionFont(value.fontKey);
  const isDark = value.color === '#1A1A14';
  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable style={styles.editScrim} onPress={onDone} />

      <View style={[styles.layer, { justifyContent: posJustify(value.pos) }]} pointerEvents="box-none">
        <TextInput
          value={value.text}
          onChangeText={(t) => onChange({ ...value, text: t.slice(0, 60) })}
          placeholder="ここに文字"
          placeholderTextColor="rgba(255,255,255,0.6)"
          autoFocus
          multiline
          style={[
            styles.text,
            styles.input,
            {
              fontFamily: f.family,
              fontWeight: f.weight,
              color: value.color,
              textShadowColor: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)',
            },
          ]}
        />
      </View>

      {/* コントロール */}
      <View style={styles.controls} pointerEvents="box-none">
        <View style={styles.controlRow}>
          {CAPTION_FONTS.map((opt) => (
            <Pressable
              key={opt.key}
              onPress={() => onChange({ ...value, fontKey: opt.key })}
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
              onPress={() => onChange({ ...value, color: c.color })}
              style={[styles.swatch, { backgroundColor: c.color }, value.color === c.color && styles.swatchActive]}
            />
          ))}
          <View style={styles.sep} />
          {(['top', 'center', 'bottom'] as const).map((p) => (
            <Pressable
              key={p}
              onPress={() => onChange({ ...value, pos: p })}
              style={[styles.posBtn, value.pos === p && styles.posBtnActive]}
            >
              <View style={[styles.posMark, p === 'top' && { top: 4 }, p === 'center' && { top: 9 }, p === 'bottom' && { bottom: 4 }]} />
            </Pressable>
          ))}
        </View>
        <Pressable onPress={onDone} style={styles.doneBtn}>
          <Text style={styles.doneText}>完了</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, paddingHorizontal: space.lg, paddingVertical: space.xxl, alignItems: 'center' },
  text: {
    textAlign: 'center',
    fontSize: 30,
    lineHeight: 38,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  input: { minWidth: 120, maxWidth: '100%' },
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
  posBtn: { width: 22, height: 26, borderRadius: 5, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)', alignItems: 'center' },
  posBtnActive: { borderColor: colors.lime },
  posMark: { position: 'absolute', width: 12, height: 3, borderRadius: 2, backgroundColor: colors.onMedia },
  doneBtn: { backgroundColor: colors.lime, borderRadius: radius.pill, paddingHorizontal: 22, paddingVertical: 9 },
  doneText: { color: colors.limeInk, fontSize: font.body, fontWeight: '900' },
});
