import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { colors, font, space } from '../theme';
import { fonts } from '../lib/fonts';
import { Avatar, Remaining } from './ui';
import { ShareIcon, VerifiedBadge } from './icons';
import { ChekiCard } from './ChekiCard';
import { IssueCard } from './IssueCard';
import { OfficialCard } from './OfficialCard';
import { ReactionBar } from './ReactionBar';
import { Post, ReactionType, User } from '../types';
import { shareCheki } from '../lib/share';
import { postHasSound, resolvePostAudioSource } from '../lib/audio';
import { isBrandUser } from '../selectors';
import { timeAgo } from '../lib/time';

const NATIVE = Platform.OS !== 'web';

// ホーム中央の縦スワイプ・スワイパー。自分の投稿と、フォロー中の人の投稿を混ぜて
// 古い順に表示する。最後のスライドに公式の「写真を上げてみよう」カードを置き、
// 端を越えたら反対端へループする（別ページに飛ばさず、ここで全部見れるように）。
export function MyPostsSwiper({
  posts,
  me,
  official,
  users,
  passOpen,
  onReact,
  onMarkViewed,
  myReactionOf,
}: {
  posts: Post[];
  me?: User;
  official?: User;
  users: User[];
  passOpen: boolean;
  onReact: (postId: string, type: ReactionType) => void;
  onMarkViewed: (postId: string) => void;
  myReactionOf: (postId: string) => ReactionType | undefined;
}) {
  const total = posts.length + 1; // 末尾に公式の促しカード
  const [index, setIndex] = useState(0);
  const safeIndex = Math.min(index, total - 1);
  const isPrompt = safeIndex >= posts.length; // 最後のスライド＝公式カード
  const current = posts[safeIndex];
  const currentIsMine = !!current && !!me && current.userId === me.id;
  const author = !current ? undefined : currentIsMine ? me : users.find((u) => u.id === current.userId);

  const ty = useRef(new Animated.Value(0)).current;
  const sizeRef = useRef({ w: 0, h: 0 });
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const idxRef = useRef(safeIndex);
  idxRef.current = safeIndex;
  const lenRef = useRef(total);
  lenRef.current = total;

  // 表示中の他人投稿には自動で音声を流す（手動の音声ボタンは置かない）
  const audioSrc = useMemo(() => (!isPrompt && !currentIsMine ? resolvePostAudioSource(current) : null), [current?.id, currentIsMine, isPrompt]);
  const hasSound = !isPrompt && !currentIsMine && postHasSound(current) && passOpen;
  const player = useAudioPlayer(audioSrc ?? null);

  useEffect(() => {
    if (!audioSrc || !passOpen) return;
    try {
      player.loop = false;
      player.muted = false;
      player.seekTo(0);
      player.play();
    } catch {}
    return () => {
      try {
        player.pause();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioSrc, passOpen]);

  // 表示中の他人投稿に「見た」を記録（1スライド1回）
  useEffect(() => {
    if (!current || isPrompt || currentIsMine) return;
    if (!passOpen) return;
    onMarkViewed(current.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, currentIsMine, isPrompt, passOpen]);

  const replaySound = () => {
    if (!hasSound) return;
    try {
      player.seekTo(0);
      player.play();
    } catch {}
  };

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

  // 下部のリアクションバーの分だけカード高さを少し詰める（他人投稿だけ）
  const showReactions = !!current && !isPrompt && !currentIsMine && passOpen;
  const bottomReserve = showReactions ? 84 : 110;
  const cardW = Math.max(0, Math.min(stage.w - 16, Math.floor((stage.h - bottomReserve) / 1.31), 380));

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
            <OfficialCard official={official} message="写真を上げてみよう" width={Math.min(cardW, 320)} />
          ) : (
            <>
              {cardW > 0 && current && (
                <Pressable onPress={replaySound} disabled={!hasSound}>
                  {current.kind === 'issue' && current.issue ? (
                    <IssueCard
                      label={current.issue.label}
                      images={current.issue.images}
                      createdAt={current.createdAt}
                      width={cardW}
                      tiltSeed={current.id}
                    />
                  ) : (
                    <ChekiCard uri={current.imageUrl} caption={current.caption} width={cardW} date={current.createdAt} tiltSeed={current.id} />
                  )}
                </Pressable>
              )}
              {current && (
                <View style={styles.metaRow}>
                  <Avatar user={author} size={26} />
                  {!currentIsMine && (
                    <>
                      <Text style={styles.metaName}>{isBrandUser(author) ? 'napsnap' : author?.displayName ?? '友達'}</Text>
                      {author?.isOfficial && <VerifiedBadge size={14} />}
                      <Text style={styles.metaDot}>·</Text>
                      <Text style={styles.metaAgo}>{timeAgo(current.createdAt)}</Text>
                    </>
                  )}
                  {!isBrandUser(author) && (
                    <View style={{ marginLeft: 6 }}>
                      <Remaining expiresAt={current.expiresAt} color={colors.warn} size={12} />
                    </View>
                  )}
                  {currentIsMine && Platform.OS === 'web' && (
                    <Pressable onPress={() => shareCheki(current)} hitSlop={10} style={{ marginLeft: 4 }}>
                      <ShareIcon size={18} color={colors.textDim} />
                    </Pressable>
                  )}
                </View>
              )}
              {showReactions && current && (
                <View style={styles.reactWrap}>
                  <ReactionBar onReact={(t) => onReact(current.id, t)} selected={myReactionOf(current.id)} />
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
  metaName: { color: colors.text, fontSize: font.lead, fontWeight: '700', fontFamily: fonts.serif, letterSpacing: 0 },
  metaDot: { color: colors.textFaint, fontSize: font.small },
  metaAgo: { color: colors.textDim, fontSize: font.small, fontFamily: fonts.handle },
  reactWrap: { marginTop: space.xs },
});
