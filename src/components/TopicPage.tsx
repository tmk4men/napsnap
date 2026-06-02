import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, rule, space } from '../theme';
import { fonts } from '../lib/fonts';
import { OfficialCard } from './OfficialCard';
import { ReactionBar } from './ReactionBar';
import { PostSwipeFeed } from './PostSwipeFeed';
import { useStore } from '../store';
import { isBrandUser, myReaction, topicPostsKnown, topicPostsStrangers, userById } from '../selectors';
import { todaysTopic } from '../topics';
import { postHasSound, resolvePostAudioSource } from '../lib/audio';
import { tr } from '../i18n';

export type TopicSection = 'known' | 'strangers';

// ホームと統合したお題ページ（横スワイプの1枚）。フォロー(known)／おすすめ(strangers)の片方を担う。
// 音声は active（このページが見えている）ときだけ再生する。上部に小さなフォロー/おすすめ切替を置く。
export function TopicPage({
  section,
  active,
  onSwitchSection,
}: {
  section: TopicSection;
  active: boolean;
  onSwitchSection: (s: TopicSection) => void;
}) {
  const insets = useSafeAreaInsets();
  const s = useStore();
  const reactToTopic = useStore((st) => st.reactToTopic);

  const topic = todaysTopic();
  const known = useMemo(() => topicPostsKnown(s, topic.key), [s.posts, s.following, s.currentUserId, topic.key]);
  const strangers = useMemo(() => topicPostsStrangers(s, topic.key), [s.posts, s.following, s.currentUserId, topic.key]);
  const official = s.users.find(isBrandUser);
  const posts = section === 'known' ? known : strangers;

  const [idx, setIdx] = useState(0);
  const safeIdx = Math.min(idx, Math.max(0, posts.length - 1));
  const current = posts[safeIdx];
  const mine = current ? myReaction(s, current.id) : undefined;

  // このページが見えている間だけ、表示中の投稿の音を再生（自動再生はページ切替で止める）。
  const audioSrc = useMemo(() => resolvePostAudioSource(current), [current?.id]);
  const hasSound = postHasSound(current);
  const player = useAudioPlayer(audioSrc ?? null);
  useEffect(() => {
    if (!audioSrc || !active) return;
    try {
      player.loop = false;
      player.seekTo(0);
      player.play();
    } catch {}
    return () => {
      try {
        player.pause();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioSrc, active]);
  const replaySound = () => {
    if (!hasSound) return;
    try {
      player.seekTo(0);
      player.play();
    } catch {}
  };

  const [stage, setStage] = useState({ w: 0, h: 0 });
  const cardW = Math.max(0, Math.min(stage.w - 72, Math.floor((stage.h - 60) / 1.31), 300));
  const resolveAuthor = (userId: string) => userById(s.users, userId);

  return (
    <View style={styles.page}>
      {/* フォロー / おすすめ 切替（中央・下線） */}
      <View style={styles.tabs}>
        <TabBtn label={tr('フォロー', 'Following')} active={section === 'known'} onPress={() => onSwitchSection('known')} />
        <TabBtn label={tr('おすすめ', 'For you')} active={section === 'strangers'} onPress={() => onSwitchSection('strangers')} />
      </View>

      <View
        style={styles.stage}
        onLayout={(e) => setStage({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      >
        <PostSwipeFeed
          posts={posts}
          index={safeIdx}
          onIndexChange={setIdx}
          cardW={cardW}
          resolveAuthor={resolveAuthor}
          onTapPost={replaySound}
          empty={
            <View style={styles.empty}>
              <OfficialCard
                official={official}
                message={section === 'known' ? tr('最初の一枚を出してみよう', 'Post the first one') : tr('今日はまだ誰もいない', 'No one yet today')}
                width={cardW}
                mosaic
              />
            </View>
          }
        />
      </View>

      {/* リアクション（表示中の投稿に。自分の投稿には出さない） */}
      {current && current.userId !== s.currentUserId && (
        <View style={[styles.reactFloat, { bottom: insets.bottom + space.lg }]} pointerEvents="box-none">
          <ReactionBar key={current.id} selected={mine} onReact={(t) => reactToTopic(current.id, t)} />
        </View>
      )}
    </View>
  );
}

function TabBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.tabBtn} hitSlop={4}>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
      <View style={[styles.tabUnderline, active && styles.tabUnderlineActive]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  tabs: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: space.xl, paddingHorizontal: space.lg, paddingTop: space.xs },
  tabBtn: { paddingVertical: space.xs, alignItems: 'center' },
  tabLabel: { color: colors.textFaint, fontSize: font.body, fontWeight: '700', fontFamily: fonts.serif, letterSpacing: 0 },
  tabLabelActive: { color: colors.text },
  tabUnderline: { width: '100%', height: rule.thin, backgroundColor: 'transparent', marginTop: 4 },
  tabUnderlineActive: { backgroundColor: colors.text, height: rule.thick },
  stage: { flex: 1, overflow: 'hidden' },
  reactFloat: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, paddingHorizontal: space.lg },
});
