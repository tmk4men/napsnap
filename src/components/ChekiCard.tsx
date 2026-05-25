import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, rule } from '../theme';
import { captionFont } from '../lib/fonts';
import { fonts } from '../lib/fonts';
import { MediaImage } from './MediaImage';
import { PostCaption } from '../types';

// 号外に貼り込んだ「写真の切り抜き」。紙白の上に細罫で囲んだ写真＋下にキャプション（写真説明）。
// 全投稿の見た目をこれに統一。少し傾けて紙面に貼った“切り抜き”の質感。光沢・やわ影は使わない。

function fmtStamp(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}.${d.getDate()}`;
}

// id から決まる微妙な傾き（-1.4〜1.4度）。毎回同じ向きで安定させる。
function tiltFor(seed?: string): number {
  if (!seed) return 0;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return ((h % 100) / 100) * 2.8 - 1.4;
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
  date?: number; // 下に出す日付（省略で非表示）
  tiltSeed?: string;
  tilt?: number; // 明示の傾き（editor は 0）
  editable?: boolean;
  onChangeText?: (t: string) => void;
  placeholder?: string;
  redactStrip?: boolean; // ロック中：一言を伏せる
}) {
  const frame = Math.round(width * 0.035);
  const photoW = width - frame * 2;
  const photoH = Math.round(photoW * 1.12);
  const stripH = Math.round(width * 0.2);
  const rot = tilt ?? tiltFor(tiltSeed);

  const f = captionFont(caption?.fontKey ?? 'hand');
  const text = caption?.text ?? '';
  const fontSize = Math.max(15, Math.round(width * 0.06));

  return (
    <View style={[styles.card, { width, padding: frame, paddingBottom: 0, transform: [{ rotate: `${rot}deg` }] }]}>
      <View style={[styles.photo, { width: photoW, height: photoH }]}>
        <MediaImage uri={uri} blurRadius={blur ? 30 : 0} />
      </View>
      <View style={styles.cutRule} />
      <View style={[styles.strip, { height: stripH, paddingHorizontal: 2 }]}>
        {editable ? (
          <TextInput
            value={text}
            onChangeText={(t) => onChangeText?.(t.slice(0, 15))}
            placeholder={placeholder}
            placeholderTextColor={colors.textFaint}
            style={[styles.caption, { fontFamily: f.family, fontWeight: f.weight, fontSize }]}
            maxLength={15}
            autoFocus
            cursorColor={colors.lime}
            selectionColor={colors.lime}
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
    backgroundColor: colors.surfaceRaised, // 紙白の切り抜き
    borderRadius: 2,
    borderWidth: rule.hair,
    borderColor: colors.hairline,
    boxShadow: '2px 3px 0 rgba(23,21,15,0.10)', // 紙に貼った硬い小オフセット（やわ影にしない）
  },
  photo: {
    borderRadius: 1,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMedia,
    borderWidth: rule.hair,
    borderColor: colors.hairline,
  },
  cutRule: { height: rule.hair, backgroundColor: colors.hairline, marginTop: 4 },
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
    right: 2,
    bottom: 6,
    color: colors.textFaint,
    fontSize: 11,
    fontFamily: fonts.handle,
    letterSpacing: 0.5,
  },
  redact: { flex: 1, alignSelf: 'center', height: 10, backgroundColor: colors.text, opacity: 0.85, marginHorizontal: 24 },
});
