import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../theme';
import { captionFont } from '../lib/fonts';
import { MediaImage } from './MediaImage';
import { PostCaption } from '../types';

// チェキ（インスタント写真）風の枠。白フチ＋下の白余白に手書きの一言と日付。
// 全投稿の見た目をこれに統一する。クリーム紙の上に少し傾けて置く＝アルバム感。

function fmtStamp(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}.${d.getDate()}`;
}

// id から決まる微妙な傾き（-2〜2度）。毎回同じ向きで安定させる。
function tiltFor(seed?: string): number {
  if (!seed) return 0;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return ((h % 100) / 100) * 4 - 2;
}

export function ChekiCard({
  uri,
  caption,
  blur = false,
  width,
  date,
  tiltSeed,
  tilt,
  editable = false,
  onChangeText,
  placeholder = 'ひとこと（任意）',
  redactStrip = false,
}: {
  uri?: string;
  caption?: PostCaption;
  blur?: boolean;
  width: number;
  date?: number; // 下余白に出す日付（省略で非表示）
  tiltSeed?: string;
  tilt?: number; // 明示の傾き（editor は 0）
  editable?: boolean;
  onChangeText?: (t: string) => void;
  placeholder?: string;
  redactStrip?: boolean; // ロック中：一言を伏せる
}) {
  const frame = Math.round(width * 0.045);
  const photoW = width - frame * 2;
  const photoH = Math.round(photoW * 1.12);
  const stripH = Math.round(width * 0.2);
  const rot = tilt ?? tiltFor(tiltSeed);

  const f = captionFont(caption?.fontKey ?? 'hand');
  const text = caption?.text ?? '';
  const fontSize = Math.max(16, Math.round(width * 0.066));

  return (
    <View style={[styles.card, { width, padding: frame, paddingBottom: 0, transform: [{ rotate: `${rot}deg` }] }]}>
      <View style={[styles.photo, { width: photoW, height: photoH }]}>
        <MediaImage uri={uri} blurRadius={blur ? 30 : 0} />
      </View>
      <View style={[styles.strip, { height: stripH, paddingHorizontal: frame * 0.4 }]}>
        {editable ? (
          <TextInput
            value={text}
            onChangeText={(t) => onChangeText?.(t.slice(0, 15))}
            placeholder={placeholder}
            placeholderTextColor={colors.textFaint}
            style={[styles.caption, { fontFamily: f.family, fontWeight: f.weight, fontSize }]}
            maxLength={15}
          />
        ) : redactStrip ? (
          <View style={styles.redact} />
        ) : text ? (
          <Text numberOfLines={1} style={[styles.caption, { fontFamily: f.family, fontWeight: f.weight, fontSize }]}>
            {text}
          </Text>
        ) : (
          <View />
        )}
        {date != null && <Text style={styles.date}>{fmtStamp(date)}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FDFBF4', // インスタント写真の温かい白
    borderRadius: 4,
    boxShadow: '0 16px 34px rgba(44,36,22,0.20), 0 4px 10px rgba(44,36,22,0.10)',
  },
  photo: {
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMedia,
  },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    flex: 1,
    textAlign: 'center',
    color: colors.text,
    paddingVertical: 0,
  },
  date: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    color: colors.textFaint,
    fontSize: 11,
    fontWeight: '700',
  },
  redact: { flex: 1, alignSelf: 'center', height: 12, borderRadius: 6, backgroundColor: colors.surfaceSunken, marginHorizontal: 24 },
});
