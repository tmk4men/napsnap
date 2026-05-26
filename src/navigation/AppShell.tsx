import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { colors } from '../theme';
import { HomeScreen } from '../screens/HomeScreen';
import { TopicScreen } from '../screens/TopicScreen';
import { KeptScreen } from '../screens/KeptScreen';
import { MeScreen } from '../screens/MeScreen';
import { CameraScreen } from '../screens/CameraScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { PreviewScreen } from '../screens/PreviewScreen';
import { FeedScreen } from '../screens/FeedScreen';
import { TabBar } from './TabBar';
import { Nav, TabKey } from './nav';
import { useStore } from '../store';
import { currentUser, keptPosts } from '../selectors';
import { FadeIn } from '../components/ui';
import { hasSupabase } from '../config';

type Overlay = null | 'camera' | 'preview' | 'feed' | 'search';

export function AppShell() {
  const [tab, setTab] = useState<TabKey>('home');
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [draftUri, setDraftUri] = useState<string | null>(null);
  const [draftAudio, setDraftAudio] = useState<string | undefined>(undefined);
  const [draftTopic, setDraftTopic] = useState<string | undefined>(undefined); // お題に出す時のキー
  const [retakeUsed, setRetakeUsed] = useState(false); // 撮り直しは1回だけ

  const s = useStore();
  const me = currentUser(s);
  const keptCount = useMemo(() => keptPosts(s).length, [s.reactions, s.posts, s.currentUserId]);

  // 取り込みのきっかけ（15秒の常時ポーリングは廃止）。
  // ・前面に戻った時は即取得 ・前面にいる間だけ90秒の緩い取り込み ・タブを開いた時（20秒間引き）
  const lastHydrate = useRef(0);
  const hydrate = (force = false) => {
    if (!hasSupabase) return;
    const now = Date.now();
    if (!force && now - lastHydrate.current < 20000) return; // 連打を間引く
    lastHydrate.current = now;
    useStore.getState().liveHydrate();
  };

  useEffect(() => {
    if (!hasSupabase) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (!timer) timer = setInterval(() => hydrate(true), 90000);
    };
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };
    start();
    // 前面復帰で即更新＆再開、背面では止める（無駄打ち防止）。
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') {
        hydrate(true);
        start();
      } else {
        stop();
      }
    });
    return () => {
      stop();
      sub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nav: Nav = {
    setTab: (t) => {
      setOverlay(null);
      setTab(t);
      hydrate(); // タブを開いたら最新化（20秒間引き）
    },
    openCamera: (topicKey) => {
      setRetakeUsed(false);
      setDraftUri(null);
      setDraftAudio(undefined);
      setDraftTopic(topicKey);
      setOverlay('camera');
    },
    retake: () => {
      setRetakeUsed(true);
      setOverlay('camera');
    },
    openFeed: () => {
      if (hasSupabase) useStore.getState().liveHydrate();
      setOverlay('feed');
    },
    openSearch: () => {
      if (hasSupabase) useStore.getState().liveHydrate();
      setOverlay('search');
    },
    closeOverlay: () => {
      setOverlay(null);
      setDraftUri(null);
      setDraftAudio(undefined);
      setDraftTopic(undefined);
      setRetakeUsed(false);
    },
    onCaptured: (uri, audioUri) => {
      setDraftUri(uri);
      setDraftAudio(audioUri);
      setOverlay('preview');
    },
    onPosted: () => {
      const wasTopic = !!draftTopic;
      setDraftUri(null);
      setDraftAudio(undefined);
      setDraftTopic(undefined);
      setRetakeUsed(false);
      if (hasSupabase) useStore.getState().liveHydrate(); // 投稿後に最新を取り込む
      if (wasTopic) {
        // お題は独立：パスは開かない。お題タブへ戻る。
        setOverlay(null);
        setTab('topic');
      } else {
        setOverlay('feed'); // 投稿でパスがひらく → そのままフィードへ
      }
    },
  };

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <FadeIn key={tab} style={styles.content} dy={6} duration={200}>
          {tab === 'home' && <HomeScreen nav={nav} />}
          {tab === 'topic' && <TopicScreen nav={nav} />}
          {tab === 'kept' && <KeptScreen nav={nav} />}
          {tab === 'me' && <MeScreen nav={nav} />}
        </FadeIn>
      </View>
      <TabBar active={tab} onChange={nav.setTab} keptCount={keptCount} me={me} />

      {overlay !== null && (
        <FadeIn key={overlay} style={StyleSheet.absoluteFill} dy={0} duration={200}>
          {overlay === 'camera' && <CameraScreen nav={nav} topicKey={draftTopic} />}
          {overlay === 'preview' && draftUri && (
            <PreviewScreen uri={draftUri} audioUri={draftAudio} topicKey={draftTopic} canRetake={!retakeUsed} nav={nav} />
          )}
          {overlay === 'feed' && <FeedScreen nav={nav} />}
          {overlay === 'search' && <SearchScreen onClose={nav.closeOverlay} />}
        </FadeIn>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1 },
});
