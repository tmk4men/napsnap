import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, font, rule, space } from '../theme';
import { fonts } from '../lib/fonts';
import { MediaImage } from './MediaImage';

// 「号外」を1枚のカードに収める。新聞の小さな縮刷版＝マストヘッド＋写真グリッド＋デートライン。
// MyPostsSwiper の中で ChekiCard と同じ幅で並ぶ。

function tiltFor(seed?: string): number {
  if (!seed) return 0;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return ((h % 100) / 100) * 1.8 - 0.9; // ChekiCard より控えめ
}

function fmtRange(images: number, createdAt: number): string {
  const d = new Date(createdAt);
  // 今週の日曜から土曜の範囲を出す（同月内の想定）
  const sunday = new Date(d);
  sunday.setHours(0, 0, 0, 0);
  sunday.setDate(sunday.getDate() - sunday.getDay());
  const saturday = new Date(sunday);
  saturday.setDate(saturday.getDate() + 6);
  const fmt = (x: Date) => `${x.getMonth() + 1}.${x.getDate()}`;
  return `${fmt(sunday)} – ${fmt(saturday)}　全${images}枚`;
}

export function IssueCard({
  label,
  images,
  createdAt,
  width,
  tiltSeed,
}: {
  label: string;
  images: string[];
  createdAt: number;
  width: number;
  tiltSeed?: string;
}) {
  const frame = Math.round(width * 0.035);
  const inner = width - frame * 2;
  const rot = tiltFor(tiltSeed);

  // 3列グリッド。最大6枚見せて、7枚以上は最後の枠に "+N" 表示。
  const VISIBLE = 6;
  const visible = images.slice(0, VISIBLE);
  const extra = Math.max(0, images.length - VISIBLE);
  const gap = 4;
  const cellW = Math.floor((inner - gap * 2) / 3);
  const cellH = cellW; // 正方形セル

  return (
    <View style={[styles.card, { width, padding: frame, transform: [{ rotate: `${rot}deg` }] }]}>
      {/* マストヘッド */}
      <View style={styles.mastheadBlock}>
        <Text style={styles.kicker}>napsnap 号外</Text>
        <Text style={styles.issueLabel}>{label}</Text>
      </View>
      <View style={styles.ruleDoubleTop} />
      <View style={styles.ruleDoubleGap} />
      <View style={styles.ruleDoubleBot} />

      {/* 写真グリッド */}
      <View style={[styles.grid, { width: inner, marginTop: space.sm, gap }]}>
        {visible.map((uri, i) => {
          const isLast = i === visible.length - 1;
          const showExtra = isLast && extra > 0;
          return (
            <View key={i} style={[styles.cell, { width: cellW, height: cellH }]}>
              <MediaImage uri={uri} />
              {showExtra && (
                <View style={styles.extraScrim} pointerEvents="none">
                  <Text style={styles.extraText}>+{extra}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* デートライン */}
      <View style={styles.ruleThin} />
      <Text style={styles.dateline}>{fmtRange(images.length, createdAt)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 2,
    borderWidth: rule.hair,
    borderColor: colors.hairline,
    boxShadow: '0 6px 18px rgba(0,0,0,0.10)',
  },
  mastheadBlock: { alignItems: 'center', paddingVertical: 4 },
  kicker: {
    color: colors.textDim,
    fontSize: font.tiny,
    fontFamily: fonts.handle,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  issueLabel: {
    color: colors.text,
    fontSize: 22,
    fontFamily: fonts.serif,
    fontWeight: '900',
    letterSpacing: 0,
    marginTop: 2,
  },
  ruleDoubleTop: { height: rule.thick, backgroundColor: colors.text, marginTop: 4 },
  ruleDoubleGap: { height: 2 },
  ruleDoubleBot: { height: rule.hair, backgroundColor: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { overflow: 'hidden', backgroundColor: colors.surfaceSunken, borderWidth: rule.hair, borderColor: colors.hairline },
  extraScrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  extraText: { color: '#FFFFFF', fontSize: 20, fontFamily: fonts.serif, fontWeight: '900' },
  ruleThin: { height: rule.hair, backgroundColor: colors.hairline, marginTop: space.sm },
  dateline: {
    color: colors.textDim,
    fontSize: 11,
    fontFamily: fonts.handle,
    letterSpacing: 0.8,
    textAlign: 'right',
    marginTop: 4,
  },
});
