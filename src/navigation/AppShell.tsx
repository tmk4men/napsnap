import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';
import { HomeScreen } from '../screens/HomeScreen';
import { KeptScreen } from '../screens/KeptScreen';
import { MeScreen } from '../screens/MeScreen';
import { CameraScreen } from '../screens/CameraScreen';
import { PreviewScreen } from '../screens/PreviewScreen';
import { FeedScreen } from '../screens/FeedScreen';
import { TabBar } from './TabBar';
import { Nav, TabKey } from './nav';
import { useStore } from '../store';
import { keptPosts } from '../selectors';

type Overlay = null | 'camera' | 'preview' | 'feed';

export function AppShell() {
  const [tab, setTab] = useState<TabKey>('home');
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [draftUri, setDraftUri] = useState<string | null>(null);
  const [draftAudio, setDraftAudio] = useState<string | undefined>(undefined);

  const s = useStore();
  const keptCount = useMemo(() => keptPosts(s).length, [s.reactions, s.posts, s.currentUserId]);

  const nav: Nav = {
    setTab: (t) => {
      setOverlay(null);
      setTab(t);
    },
    openCamera: () => setOverlay('camera'),
    openFeed: () => setOverlay('feed'),
    closeOverlay: () => {
      setOverlay(null);
      setDraftUri(null);
      setDraftAudio(undefined);
    },
    onCaptured: (uri, audioUri) => {
      setDraftUri(uri);
      setDraftAudio(audioUri);
      setOverlay('preview');
    },
    onPosted: () => {
      setDraftUri(null);
      setDraftAudio(undefined);
      setOverlay('feed'); // 投稿でパスがひらく → そのままフィードへ
    },
  };

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        {tab === 'home' && <HomeScreen nav={nav} />}
        {tab === 'kept' && <KeptScreen />}
        {tab === 'me' && <MeScreen nav={nav} />}
      </View>
      <TabBar active={tab} onChange={nav.setTab} keptCount={keptCount} />

      {overlay !== null && (
        <View style={StyleSheet.absoluteFill}>
          {overlay === 'camera' && <CameraScreen nav={nav} />}
          {overlay === 'preview' && draftUri && (
            <PreviewScreen uri={draftUri} audioUri={draftAudio} nav={nav} />
          )}
          {overlay === 'feed' && <FeedScreen nav={nav} />}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  content: { flex: 1 },
});
