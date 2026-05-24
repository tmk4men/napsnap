import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, space } from '../theme';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import { Post } from '../types';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

function dayStart(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// 自分の思い出を月カレンダーで見返す。投稿のある日はライムのドット付き、タップでその日の投稿へ。
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
      <View style={styles.header}>
        <Pressable onPress={() => shift(-1)} hitSlop={10} style={styles.nav}>
          <ChevronLeftIcon size={18} color={colors.textDim} />
        </Pressable>
        <Text style={styles.title}>
          {view.y}年 {view.m + 1}月
        </Text>
        <Pressable onPress={() => shift(1)} hitSlop={10} style={styles.nav}>
          <ChevronRightIcon size={18} color={colors.textDim} />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((w, i) => (
          <Text key={w} style={[styles.weekday, i === 0 && { color: '#C98B7A' }, i === 6 && { color: '#7A93C9' }]}>
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
                <Text style={[styles.dayNum, has && styles.dayNumHas, isToday && styles.dayNumToday]}>{d}</Text>
              </View>
              {has && <View style={styles.dot} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: space.md,
    boxShadow: '0 10px 28px rgba(44,36,22,0.10)',
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm },
  nav: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSunken },
  title: { color: colors.text, fontSize: font.lead, fontWeight: '900' },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekday: { flex: 1, textAlign: 'center', color: colors.textFaint, fontSize: font.tiny, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 2 },
  dayInner: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  dayHas: { backgroundColor: colors.limeSoft },
  dayToday: { borderWidth: 1.5, borderColor: colors.text },
  dayNum: { color: colors.textDim, fontSize: font.small, fontWeight: '700' },
  dayNumHas: { color: colors.text, fontWeight: '900' },
  dayNumToday: { color: colors.text },
  dot: { position: 'absolute', bottom: 3, width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.limeDust },
});
