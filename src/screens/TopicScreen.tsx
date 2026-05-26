import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, rule, space } from '../theme';
import { fonts } from '../lib/fonts';
import { useTick } from '../components/ui';
import { Backdrop } from '../components/Backdrop';
import { OfficialCard } from '../components/OfficialCard';
import { TopicNote } from '../components/TopicNote';
import { ReactionBar } from '../components/ReactionBar';
import { PostSwipeFeed } from '../components/PostSwipeFeed';
import { PlusIcon } from '../components/icons';
import { Nav } from '../navigation/nav';
import { useStore } from '../store';
import { isBrandUser, myReaction, topicPostsKnown, topicPostsStrangers, userById } from '../selectors';
import { todaysTopic } from '../topics';
import { postHasSound, resolvePostAudioSource } from '../lib/audio';

type Section = 'known' | 'strangers';

export function TopicScreen({ nav }: { nav: Nav }) {
  const insets = useSafeAreaInsets();
  useTick(30000);
  const s = useStore();
  const reactToTopic = useStore((st) => st.reactToTopic);
  const markTopicSeen = useStore((st) => st.markTopicSeen);

  useEffect(() => {
    markTopicSeen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const topic = todaysTopic();
  // 知ってる人（自分＋フォロー）と知らん人を分けて取得＝お題タブを左右2ページで分離。
  const known = useMemo(() => topicPostsKnown(s, topic.key), [s.posts, s.following, s.currentUserId, topic.key]);
  const strangers = useMemo(
    () => topicPostsStrangers(s, topic.key),
    [s.posts, s.following, s.currentUserId, topic.key]
  );
  const official = s.users.find(isBrandUser);

  const [section, setSection] = useState<Section>('known');
  const [knownIdx, setKnownIdx] = useState(0);
  const [strangersIdx, setStrangersIdx] = useState(0);

  const safeKnownIdx = Math.min(knownIdx, Math.max(0, known.length - 1));
  const safeStrangersIdx = Math.min(strangersIdx, Math.max(0, strangers.length - 1));
  const current = section === 'known' ? known[safeKnownIdx] : strangers[safeStrangersIdx];
  const mine = current ? myReaction(s, current.id) : undefined;

  // 現在の投稿の音を、表示時に1回だけ再生。タップで聞き直せる。
  const audioSrc = useMemo(() => resolvePostAudioSource(current), [current?.id]);
  const hasSound = postHasSound(current);
  const player = useAudioPlayer(audioSrc ?? null);
  useEffect(() => {
    if (!audioSrc) return;
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
  }, [audioSrc]);
  const replaySound = () => {
    if (!hasSound) return;
    try {
      player.seekTo(0);
      player.play();
    } catch {}
  };

  // 横ページャ（pagingEnabled）。stageW を測ってから子の幅に流し込む。
  const [stageW, setStageW] = useState(0);
  const [stageH, setStageH] = useState(0);
  const pagerRef = useRef<ScrollView | null>(null);
  // お題タブを開いたら必ず「フォロー」側（x:0）から始まる。
  // Web の scroll restoration / 初回 onScroll に追い越されないよう、
  // 初期化完了フラグが立つまで onPagerScroll の section 変更を抑制する。
  const didInitPager = useRef(false);
  useEffect(() => {
    if (stageW <= 0) return;
    // 即時 + 次フレーム + 短いディレイで3度 scrollTo を打つ。web ブラウザの scroll restoration や
    // pagingEnabled レイアウト確定後の再配置に追い越されないため。
    const snapToStart = () => {
      pagerRef.current?.scrollTo({ x: 0, animated: false });
      setSection('known');
    };
    snapToStart();
    const raf = requestAnimationFrame(snapToStart);
    const t = setTimeout(() => {
      snapToStart();
      didInitPager.current = true;
    }, 80);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [stageW]);
  // タブをタップでスクロール、横スワイプで自動切替。
  const switchSection = (next: Section) => {
    if (next === section) return;
    setSection(next);
    pagerRef.current?.scrollTo({ x: next === 'strangers' ? stageW : 0, animated: true });
  };
  // Webでは momentum が無く onMomentumScrollEnd が発火しないので、onScroll で
  // 現在位置を常時監視してタブ表示を同期する（変化時のみ setState）。
  // ただし初期化が終わるまではユーザー操作ではないので無視する＝「開いた瞬間おすすめ」を防ぐ。
  const onPagerScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!didInitPager.current) return;
    const x = e.nativeEvent.contentOffset.x;
    const w = stageW || 1;
    const next: Section = x > w / 2 ? 'strangers' : 'known';
    if (next !== section) setSection(next);
  };

  // カードサイズはステージから計算（横ページャの中でも同じ計算）。
  const cardW = Math.max(0, Math.min(stageW - 72, Math.floor((stageH - 150) / 1.31), 300));
  const resolveAuthor = (userId: string) => userById(s.users, userId);

  return (
    <View style={[styles.container, { paddingTop: insets.top + space.sm }]}>
      <Backdrop />

      {/* 今日の見出し */}
      <View style={styles.noteWrap}>
        <TopicNote prompt={topic.prompt} />
      </View>

      {/* タブ（フォロー / おすすめ）：中央揃え */}
      <View style={styles.tabs}>
        <TabBtn label="フォロー" count={known.length} active={section === 'known'} onPress={() => switchSection('known')} />
        <TabBtn label="おすすめ" count={strangers.length} active={section === 'strangers'} onPress={() => switchSection('strangers')} />
      </View>

      {/* 横ページャ：左=知ってる人、右=知らん人 */}
      <View
        style={styles.pagerWrap}
        onLayout={(e) => {
          setStageW(e.nativeEvent.layout.width);
          setStageH(e.nativeEvent.layout.height);
        }}
      >
        <ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onPagerScroll}
          // 縦スワイプは子コンポーネント(PostSwipeFeed)が拾うので、ここは横だけに集中。
          scrollEventThrottle={16}
        >
          <View style={{ width: stageW, height: stageH }}>
            <PostSwipeFeed
              posts={known}
              index={safeKnownIdx}
              onIndexChange={setKnownIdx}
              cardW={cardW}
              resolveAuthor={resolveAuthor}
              onTapPost={replaySound}
              empty={
                <View style={styles.empty}>
                  <OfficialCard
                    official={official}
                    message="最初の一枚を出してみよう"
                    width={cardW}
                    mosaic
                  />
                </View>
              }
            />
          </View>
          <View style={{ width: stageW, height: stageH }}>
            <PostSwipeFeed
              posts={strangers}
              index={safeStrangersIdx}
              onIndexChange={setStrangersIdx}
              cardW={cardW}
              resolveAuthor={resolveAuthor}
              onTapPost={replaySound}
              empty={
                <View style={styles.empty}>
                  <OfficialCard
                    official={official}
                    message="今日はまだ誰もいない"
                    width={cardW}
                    mosaic
                  />
                </View>
              }
            />
          </View>
        </ScrollView>
      </View>

      {/* リアクション（現在表示中の投稿に対して。自分の投稿には出さない） */}
      {current && current.userId !== s.currentUserId && (
        <View style={[styles.reactFloat, { bottom: insets.bottom + space.lg }]} pointerEvents="box-none">
          <ReactionBar key={current.id} selected={mine} onReact={(t) => reactToTopic(current.id, t)} />
        </View>
      )}

      {/* このお題に出す＝右下のプラス */}
      <Pressable
        onPress={() => nav.openCamera(topic.key)}
        style={({ pressed }) => [
          styles.fab,
          { bottom: insets.bottom + space.lg },
          pressed && { transform: [{ scale: 0.94 }] },
        ]}
        hitSlop={8}
      >
        <PlusIcon size={28} color={colors.limeInk} />
      </Pressable>
    </View>
  );
}

function TabBtn({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.tabBtn} hitSlop={4}>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
        {label}
        {count > 0 && <Text style={styles.tabCount}>　{count}</Text>}
      </Text>
      <View style={[styles.tabUnderline, active && styles.tabUnderlineActive]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  noteWrap: { paddingHorizontal: space.lg, paddingTop: space.xs, paddingBottom: space.sm },
  // 2つのタブを中央揃えに（号外の節タイトル感：下線で表現）
  tabs: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: space.xl, paddingHorizontal: space.lg },
  tabBtn: { paddingVertical: space.xs, alignItems: 'center' },
  tabLabel: { color: colors.textFaint, fontSize: font.body, fontWeight: '700', fontFamily: fonts.serif, letterSpacing: 0 },
  tabLabelActive: { color: colors.text },
  tabCount: { color: colors.textFaint, fontSize: font.small, fontWeight: '500', fontFamily: fonts.handle },
  tabUnderline: { width: '100%', height: rule.thin, backgroundColor: 'transparent', marginTop: 4 },
  tabUnderlineActive: { backgroundColor: colors.text, height: rule.thick },
  pagerWrap: { flex: 1, overflow: 'hidden' },
  fab: {
    position: 'absolute',
    right: space.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: rule.hair,
    borderColor: colors.limeDust,
    boxShadow: '0 8px 20px rgba(0,0,0,0.20)',
  },
  reactFloat: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, paddingHorizontal: space.lg },
});

