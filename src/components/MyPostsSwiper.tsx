import React, { useRef, useState } from 'react';
import { Animated, PanResponder, Platform, StyleSheet, Text, View } from 'react-native';
import { colors, font, rule, space } from '../theme';
import { fonts } from '../lib/fonts';
import { Avatar, Remaining, ShootButton } from './ui';
import { VerifiedBadge } from './icons';
import { ChekiCard } from './ChekiCard';
import { Post, User } from '../types';

const NATIVE = Platform.OS !== 'web';

// 他の人を見終わったあと、ホームに残る「自分の投稿（24時間以内）」を上下スワイプで全部見る。
// 自分の投稿の“次”に、napsnap公式の「写真を上げてみよう」カードを1枚はさむ（投稿を促す導線）。
export function MyPostsSwiper({
  posts,
  me,
  official,
  onShoot,
}: {
  posts: Post[];
  me?: User;
  official?: User;
  onShoot: () => void;
}) {
  const total = posts.length + 1; // 末尾に公式の促しカード
  const [index, setIndex] = useState(0);
  const safeIndex = Math.min(index, total - 1);
  const isPrompt = safeIndex >= posts.length; // 最後のスライド＝公式カード
  const current = posts[safeIndex];

  const ty = useRef(new Animated.Value(0)).current;
  const sizeRef = useRef({ w: 0, h: 0 });
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const idxRef = useRef(safeIndex);
  idxRef.current = safeIndex;
  const lenRef = useRef(total);
  lenRef.current = total;

  const go = (dir: number) => {
    const len = lenRef.current;
    if (len <= 1) {
      Animated.spring(ty, { toValue: 0, useNativeDriver: NATIVE }).start();
      return;
    }
    const i = idxRef.current;
    const H = sizeRef.current.h || 560;
    const target = (i + dir + len) % len; // 端を越えたら反対端へループ
    Animated.timing(ty, { toValue: dir > 0 ? -H : H, duration: 170, useNativeDriver: NATIVE }).start(() => {
      setIndex(target);
      idxRef.current = target;
      ty.setValue(dir > 0 ? H : -H);
      Animated.timing(ty, { toValue: 0, duration: 170, useNativeDriver: NATIVE }).start();
    });
  };

  const responder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 10 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => ty.setValue(g.dy * 0.5),
      onPanResponderRelease: (_, g) => {
        if (g.dy < -90) go(1);
        else if (g.dy > 90) go(-1);
        else Animated.spring(ty, { toValue: 0, useNativeDriver: NATIVE }).start();
      },
    })
  ).current;

  const cardW = Math.max(0, Math.min(stage.w - 16, Math.floor((stage.h - 110) / 1.31), 380));

  return (
    <View
      style={styles.stage}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        sizeRef.current = { w: width, h: height };
        setStage({ w: width, h: height });
      }}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: ty }] }]} {...responder.panHandlers}>
        <View style={styles.center}>
          {isPrompt ? (
            <View style={[styles.prompt, { width: Math.min(cardW, 320) }]}>
              <View style={styles.promptHead}>
                <Avatar user={official} size={24} />
                <Text style={styles.promptName}>napsnap</Text>
                <VerifiedBadge size={14} />
              </View>
              <Text style={styles.promptBig}>写真を{'\n'}上げてみよう</Text>
              <View style={styles.promptRule} />
              <ShootButton block label="撮る" onPress={onShoot} />
            </View>
          ) : (
            <>
              {cardW > 0 && current && (
                <ChekiCard uri={current.imageUrl} caption={current.caption} width={cardW} date={current.createdAt} tiltSeed={current.id} />
              )}
              {current && (
                <View style={styles.metaRow}>
                  <Avatar user={me} size={26} />
                  <Remaining expiresAt={current.expiresAt} color={colors.warn} size={12} />
                </View>
              )}
            </>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, alignSelf: 'stretch', overflow: 'hidden' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },

  // 公式の促しカード
  prompt: { alignItems: 'center', gap: space.md },
  promptHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  promptName: { color: colors.text, fontSize: font.body, fontWeight: '700', fontFamily: fonts.serif },
  promptBig: { color: colors.text, fontSize: 40, lineHeight: 50, letterSpacing: -1, textAlign: 'center', fontFamily: fonts.serif, fontWeight: '800' },
  promptRule: { width: 40, height: rule.thick, backgroundColor: colors.text },
});
