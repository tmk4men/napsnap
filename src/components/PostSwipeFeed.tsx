import React, { useRef, useState } from 'react';
import { Animated, PanResponder, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, space } from '../theme';
import { fonts } from '../lib/fonts';
import { Avatar, Remaining } from './ui';
import { VerifiedBadge } from './icons';
import { ChekiCard } from './ChekiCard';
import { ModerationMenu, ModerationTarget } from './ModerationMenu';
import { Post, User } from '../types';
import { timeAgo } from '../lib/time';
import { useStore } from '../store';
import { isBrandUser } from '../selectors';

const NATIVE = Platform.OS !== 'web';

// 投稿カードを上下スワイプで見せる汎用フィード。お題タブの「知ってる人／知らん人」ページに使う。
// 縦スワイプの index 管理は外（親）で行う＝横ページャを跨いで連動可能。
export function PostSwipeFeed({
  posts,
  index,
  onIndexChange,
  cardW,
  resolveAuthor,
  onTapPost,
  empty,
}: {
  posts: Post[];
  index: number;
  onIndexChange: (i: number) => void;
  cardW: number;
  resolveAuthor: (userId: string) => User | undefined;
  onTapPost?: () => void;
  empty?: React.ReactNode;
}) {
  const myId = useStore((st) => st.currentUserId);
  const [moderating, setModerating] = useState<ModerationTarget | null>(null);

  const ty = useRef(new Animated.Value(0)).current;
  const sizeRef = useRef({ h: 0 });
  const idxRef = useRef(index);
  idxRef.current = index;
  const lenRef = useRef(posts.length);
  lenRef.current = posts.length;

  const go = (dir: number) => {
    const len = lenRef.current;
    if (len <= 1) {
      Animated.spring(ty, { toValue: 0, useNativeDriver: NATIVE }).start();
      return;
    }
    const i = idxRef.current;
    const H = sizeRef.current.h || 560;
    const target = (i + dir + len) % len;
    Animated.timing(ty, { toValue: dir > 0 ? -H : H, duration: 170, useNativeDriver: NATIVE }).start(() => {
      onIndexChange(target);
      idxRef.current = target;
      ty.setValue(dir > 0 ? H : -H);
      Animated.timing(ty, { toValue: 0, duration: 170, useNativeDriver: NATIVE }).start();
    });
  };

  const responder = useRef(
    PanResponder.create({
      // 縦移動が横移動より大きい時だけ反応＝親の横ページャと喧嘩しない。
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 10 && Math.abs(g.dy) > Math.abs(g.dx) * 1.5,
      onPanResponderMove: (_, g) => ty.setValue(g.dy * 0.5),
      onPanResponderRelease: (_, g) => {
        if (g.dy < -90) go(1);
        else if (g.dy > 90) go(-1);
        else Animated.spring(ty, { toValue: 0, useNativeDriver: NATIVE }).start();
      },
    })
  ).current;

  if (posts.length === 0) {
    return (
      <View
        style={styles.stage}
        onLayout={(e) => {
          sizeRef.current.h = e.nativeEvent.layout.height;
        }}
      >
        {empty}
      </View>
    );
  }

  const safeIndex = Math.min(index, posts.length - 1);
  const current = posts[safeIndex];
  const author = resolveAuthor(current.userId);

  return (
    <View
      style={styles.stage}
      onLayout={(e) => {
        sizeRef.current.h = e.nativeEvent.layout.height;
      }}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: ty }] }]} {...responder.panHandlers}>
        <Pressable style={styles.center} onPress={onTapPost}>
          {cardW > 0 && current && (
            <ChekiCard
              uri={current.imageUrl}
              caption={current.caption}
              width={cardW}
              date={current.createdAt}
              tiltSeed={current.id}
            />
          )}
          {author && (
            <View style={styles.metaRow}>
              {myId !== author.id && !isBrandUser(author) ? (
                <Pressable
                  onPress={() => setModerating({ userId: author.id, postId: current.id, name: author.displayName })}
                  hitSlop={8}
                >
                  <Avatar user={author} size={24} />
                </Pressable>
              ) : (
                <Avatar user={author} size={24} />
              )}
              <Text style={styles.metaName}>{author.displayName}</Text>
              {author.isOfficial && <VerifiedBadge size={13} />}
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaAgo}>{timeAgo(current.createdAt)}</Text>
              <View style={{ marginLeft: 6 }}>
                <Remaining expiresAt={current.expiresAt} color={colors.warn} size={12} />
              </View>
            </View>
          )}
        </Pressable>
      </Animated.View>
      {moderating && <ModerationMenu target={moderating} onClose={() => setModerating(null)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, overflow: 'hidden' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.sm, paddingBottom: 96 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaName: { color: colors.text, fontSize: font.body, fontWeight: '800', fontFamily: fonts.serif, letterSpacing: -0.5 },
  metaDot: { color: colors.textFaint, fontSize: font.small },
  metaAgo: { color: colors.textDim, fontSize: font.small, fontWeight: '500', fontFamily: fonts.handle },
});
