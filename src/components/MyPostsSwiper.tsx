import React, { useRef, useState } from 'react';
import { Animated, PanResponder, Platform, StyleSheet, Text, View } from 'react-native';
import { colors, font, space } from '../theme';
import { fonts } from '../lib/fonts';
import { Avatar, Remaining } from './ui';
import { ChekiCard } from './ChekiCard';
import { Post, User } from '../types';

const NATIVE = Platform.OS !== 'web';

// 他の人を見終わったあと、ホームに残る「自分の投稿（24時間以内）」を上下スワイプで全部見る。
export function MyPostsSwiper({ posts, me }: { posts: Post[]; me?: User }) {
  const [index, setIndex] = useState(0);
  const safeIndex = Math.min(index, Math.max(0, posts.length - 1));
  const current = posts[safeIndex];

  const ty = useRef(new Animated.Value(0)).current;
  const sizeRef = useRef({ w: 0, h: 0 });
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const idxRef = useRef(safeIndex);
  idxRef.current = safeIndex;
  const lenRef = useRef(posts.length);
  lenRef.current = posts.length;

  const go = (dir: number) => {
    const len = lenRef.current;
    const i = idxRef.current;
    const H = sizeRef.current.h || 560;
    const target = i + dir;
    if (target < 0 || target >= len) {
      Animated.spring(ty, { toValue: 0, useNativeDriver: NATIVE }).start();
      return;
    }
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
          {cardW > 0 && current && (
            <ChekiCard uri={current.imageUrl} caption={current.caption} width={cardW} date={current.createdAt} tiltSeed={current.id} />
          )}
          {current && (
            <View style={styles.metaRow}>
              <Avatar user={me} size={26} />
              <Text style={styles.metaName}>あなたの今</Text>
              <View style={{ marginLeft: 6 }}>
                <Remaining expiresAt={current.expiresAt} color={colors.warn} size={12} />
              </View>
            </View>
          )}
        </View>
      </Animated.View>

      {posts.length > 1 && (
        <Text style={styles.hint}>
          ↑↓ めくる・{safeIndex + 1}/{posts.length}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, alignSelf: 'stretch', overflow: 'hidden' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  metaName: { color: colors.text, fontSize: font.lead, fontWeight: '800', fontFamily: fonts.serif, letterSpacing: 0.3 },
  hint: { position: 'absolute', bottom: space.xs, alignSelf: 'center', color: colors.textFaint, fontSize: font.tiny, fontWeight: '700', fontFamily: fonts.ui },
});
