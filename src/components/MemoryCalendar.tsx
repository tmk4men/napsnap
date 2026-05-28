import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, rule, shadow, space } from '../theme';
import { fonts } from '../lib/fonts';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import { Post } from '../types';
import { lang } from '../i18n';

const WEEKDAYS = lang === 'en' ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : ['日', '月', '火', '水', '木', '金', '土'];

function dayStart(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// 自分の思い出を月カレンダーで見返す。投稿のある日は赤い朱印が押される（軽い達成感）。
// タップでその日の投稿へ。
export function MemoryCalendar({ posts, onPressDay }: { posts: Post[]; onPressDay: (dayPosts: Post[]) => void }) {
  const today = new Date();
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });

  const byDay = useMemo(() => {
    const map = new Map<number, Post[]>();
    for (const p of posts) {
      const k = dayStart(p.createdAt);
      const arr = map.get(k) ?? [];
      arr.push(p);
      map.set(k, arr);
    }
    return map;
  }, [posts]);

  const todayKey = dayStart(today.getTime());
  const first = new Date(view.y, view.m, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const shift = (delta: number) => {
    const m = view.m + delta;
    setView({ y: view.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 });
  };

  return (
    <View style={styles.wrap}>
      {/* 紙の質感（うっすら印刷罫線の繊維だけ。光沢は載せない） */}
      <View pointerEvents="none" style={styles.paperLines} />

      <View style={styles.header}>
        <Pressable onPress={() => shift(-1)} hitSlop={10} style={styles.nav}>
          <ChevronLeftIcon size={18} color={colors.textDim} />
        </Pressable>
        <Text style={styles.title}>
          {lang === 'en'
            ? new Date(view.y, view.m, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            : `${view.y}年 ${view.m + 1}月`}
        </Text>
        <Pressable onPress={() => shift(1)} hitSlop={10} style={styles.nav}>
          <ChevronRightIcon size={18} color={colors.textDim} />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={styles.weekday}>
            {w}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((d, i) => {
          if (d === null) return <View key={`b${i}`} style={styles.cell} />;
          const key = new Date(view.y, view.m, d).setHours(0, 0, 0, 0);
          const dayPosts = byDay.get(key);
          const has = !!dayPosts?.length;
          const isToday = key === todayKey;
          return (
            <Pressable
              key={d}
              disabled={!has}
              onPress={() => has && onPressDay(dayPosts!)}
              style={styles.cell}
            >
              <View style={[styles.dayInner, isToday && styles.dayToday, has && styles.dayHas]}>
                <Text style={[styles.dayNum, isToday && styles.dayNumToday, has && styles.dayNumHas]}>{d}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surfaceRaised, // 貼り込んだ紙（生成りより少し明るい）
    borderRadius: radius.xs,
    borderWidth: rule.hair,
    borderColor: colors.hairline,
    padding: space.md,
    boxShadow: shadow.card,
    overflow: 'hidden',
  },
  paperLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    experimental_backgroundImage:
      'repeating-linear-gradient(0deg, rgba(70,58,34,0.035) 0px, rgba(70,58,34,0.035) 1px, transparent 1px, transparent 26px)',
  } as any,
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm },
  nav: { width: 32, height: 32, borderRadius: radius.xs, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSunken },
  title: { color: colors.text, fontSize: font.lead, fontWeight: '900', fontFamily: fonts.display, letterSpacing: -0.5 },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekday: { flex: 1, textAlign: 'center', color: colors.textFaint, fontSize: font.tiny, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 2 },
  dayInner: { width: 32, height: 32, borderRadius: radius.xs, alignItems: 'center', justifyContent: 'center' },
  // 朱印：赤いベタ＋内側に白の細枠＋わずかな傾きで「ハンコを押した」感。
  dayHas: {
    backgroundColor: colors.warn,
    borderWidth: 1.5,
    borderColor: colors.bg,
    transform: [{ rotate: '-4deg' }],
  },
  dayToday: { borderWidth: rule.thin, borderColor: colors.text },
  dayNum: { color: colors.textDim, fontSize: font.small, fontWeight: '500', fontFamily: fonts.handle },
  // 朱印の中の日付＝白の明朝で「印に彫った」風味。
  dayNumHas: { color: '#FFFFFF', fontWeight: '800', fontFamily: fonts.serif },
  dayNumToday: { color: colors.text },
});
