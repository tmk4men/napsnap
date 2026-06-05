import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, rule, space, themeMode, toggleThemeMode } from '../theme';
import { fonts } from '../lib/fonts';
import { FadeIn, useTick } from '../components/ui';
import { Backdrop } from '../components/Backdrop';
import { MyPostsSwiper } from '../components/MyPostsSwiper';
import { TopicPage, TopicSection } from '../components/TopicPage';
import { ChekiCard } from '../components/ChekiCard';
import { OfficialCard } from '../components/OfficialCard';
import { ActivityOverlay } from '../components/ActivityOverlay';
import { MemoryViewer } from '../components/MemoryViewer';
import { HamburgerMenu } from '../components/HamburgerMenu';
import { DocOverlay } from '../components/DocOverlay';
import { SettingsOverlay } from '../components/SettingsOverlay';
import { AccountLinkOverlay } from '../components/AccountLinkOverlay';
import { DeleteAccountOverlay } from '../components/DeleteAccountOverlay';
import { BellIcon, CameraIcon, MenuIcon, SearchIcon } from '../components/icons';
import { LegalDoc, PRIVACY_POLICY, TERMS_OF_SERVICE } from '../legal';
import { Nav } from '../navigation/nav';
import { useStore } from '../store';
import { ADS_ENABLED } from '../config';
import { activityItems, currentUser, followedActivePosts, isBrandUser, isPassOpen, myReaction, topicUnseen } from '../selectors';
import { isActive } from '../lib/time';
import { tr, lang } from '../i18n';
import { todaysTopic } from '../topics';
import { Post, ReactionType } from '../types';

// 横スワイプのページ：0=ホーム / 1=お題(フォロー) / 2=お題(おすすめ)
const PAGE_HOME = 0;
const PAGE_FOLLOW = 1;
const PAGE_FORYOU = 2;

export type HomeJump = { page: number; nonce: number };

export function HomeScreen({ nav, jump, onPageChange }: { nav: Nav; jump: HomeJump; onPageChange?: (p: number) => void }) {
  const insets = useSafeAreaInsets();
  useTick();

  const s = useStore();
  const markActivitySeen = useStore((st) => st.markActivitySeen);
  const markTopicSeen = useStore((st) => st.markTopicSeen);
  const open = isPassOpen(s);
  const me = currentUser(s);
  const topic = todaysTopic();
  // 今日のお題をまだ見ていない＝通知あり。ただし通知設定でお題がオフなら出さない。
  const topicNew = topicUnseen(s) && s.notifyPrefs.topic;

  // 題字横の日付（号外のデートライン）。
  const nowDate = new Date();
  const dateline =
    lang === 'en'
      ? nowDate.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
      : `${nowDate.getFullYear()}.${nowDate.getMonth() + 1}.${nowDate.getDate()}（${['日', '月', '火', '水', '木', '金', '土'][nowDate.getDay()]}）`;

  const markViewed = useStore((st) => st.markViewed);
  const reactToPost = useStore((st) => st.reactToPost);

  // ホームの「他人の投稿」は、見たぶんを次回以降は出さない（マウント時のビュー集合で固定）。
  const seenSnapshot = useRef<Set<string> | null>(null);
  if (seenSnapshot.current === null) {
    seenSnapshot.current = new Set(
      s.views.filter((v) => v.viewerId === s.currentUserId).map((v) => v.postId)
    );
  }

  const others = useMemo(
    () => followedActivePosts(s).filter((p) => !seenSnapshot.current!.has(p.id)),
    [s.posts, s.following, s.currentUserId]
  );
  const myActive = useMemo(
    () =>
      s.posts
        .filter((p) => p.userId === s.currentUserId && !p.topicKey && isActive(p.expiresAt))
        .sort((a, b) => b.createdAt - a.createdAt),
    [s.posts, s.currentUserId]
  );
  // 縦スワイプに広告を差し込む：他人＋自分の投稿を並べ、4枚ごとに広告スライド（kind='ad'）を挿入。
  const feedPosts = useMemo(() => {
    const base = [...others, ...myActive];
    const AD_EVERY = 4;
    if (!ADS_ENABLED || base.length < AD_EVERY) return base;
    const out: Post[] = [];
    base.forEach((p, i) => {
      out.push(p);
      if ((i + 1) % AD_EVERY === 0 && i < base.length - 1) {
        out.push({
          id: `ad_${i}`,
          userId: '',
          imageUrl: '',
          kind: 'ad',
          createdAt: 0,
          expiresAt: Number.MAX_SAFE_INTEGER,
        });
      }
    });
    return out;
  }, [others, myActive]);
  const followedLatest = others[0];

  const activity = useMemo(() => activityItems(s), [s.posts, s.views, s.reactions, s.following, s.currentUserId, s.notifyPrefs]);
  const unread = activity.filter((i) => i.at > s.lastSeenActivityAt).length + (topicNew ? 1 : 0);

  const mediaMode = !open && !!followedLatest;
  const cardWMedia = (w: number, h: number) => Math.max(0, Math.min(w - 16, Math.floor((h - 56) / 1.31), 380));

  const [stage, setStage] = useState({ w: 0, h: 0 });
  const cardW = cardWMedia(stage.w, stage.h);

  const [showActivity, setShowActivity] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [doc, setDoc] = useState<LegalDoc | null>(null);
  const [viewingMemory, setViewingMemory] = useState<Post[] | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const openActivity = () => {
    setShowActivity(true);
    markActivitySeen();
    markTopicSeen(); // 通知を開いたら今日のお題も既読に
  };

  // ── 横ページャ（ホーム⇄お題） ──
  const [page, setPage] = useState(jump.page);
  const [pager, setPager] = useState({ w: 0, h: 0 });
  const pagerRef = useRef<ScrollView | null>(null);
  const programmaticRef = useRef(false);
  const programmaticTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToPage = (p: number, animated: boolean) => {
    if (pager.w <= 0) return;
    programmaticRef.current = true;
    if (programmaticTimer.current) clearTimeout(programmaticTimer.current);
    programmaticTimer.current = setTimeout(() => {
      programmaticRef.current = false;
    }, 420);
    pagerRef.current?.scrollTo({ x: p * pager.w, animated });
    setPage(p);
    onPageChange?.(p);
  };

  // 外部からの移動指示（通知→お題 / お題に投稿後）と初回レイアウト時の位置合わせ。
  useEffect(() => {
    if (pager.w <= 0) return;
    scrollToPage(jump.page, jump.nonce > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jump.nonce, pager.w]);

  // ページの現在位置を監視（web は momentum が無いので onScroll で同期）。
  const onPagerScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (programmaticRef.current) return;
    const w = pager.w || 1;
    const next = Math.round(e.nativeEvent.contentOffset.x / w);
    if (next !== page) {
      setPage(next);
      onPageChange?.(next);
    }
  };

  const switchSection = (sec: TopicSection) => scrollToPage(sec === 'known' ? PAGE_FOLLOW : PAGE_FORYOU, true);

  // お題ページを開いたら「今日のお題」を既読に（通知ドットを消す）。
  useEffect(() => {
    if (page !== PAGE_HOME) markTopicSeen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // 右下の丸カメラ：ホームでは通常撮影、お題ページではそのお題に出す。
  const onFab = () => (page === PAGE_HOME ? nav.openCamera() : nav.openCamera(topic.key));

  return (
    <View style={styles.container}>
      <Backdrop />

      {/* マストヘッド（題字＋デートライン＋欄外の操作）。お題ページではお題名を左詰めで出す。 */}
      <View style={[styles.masthead, { paddingTop: insets.top + space.sm }]}>
        <View style={styles.titleBlock}>
          <View style={styles.titleRow}>
            <Text style={styles.brand}>
              nap<Text style={styles.brandAccent}>s</Text>nap
            </Text>
            <View style={styles.dateline}>
              <Text style={styles.dateText}>{dateline}</Text>
            </View>
          </View>
        </View>
        <View style={styles.ruleDoubleTop} />
        <View style={styles.ruleDoubleGap} />
        <View style={styles.ruleDoubleBot} />
        <View style={styles.utilityRow}>
          {/* 左：お題ページのときだけ「Topic: 空」を左詰めで表示 */}
          <View style={styles.utilityLeft}>
            {page !== PAGE_HOME && (
              <Text style={styles.topicLabel} numberOfLines={1}>
                {tr('Topic：', 'Topic: ')}
                <Text style={styles.topicLabelStrong}>{topic.prompt}</Text>
              </Text>
            )}
          </View>
          <View style={styles.glyphs}>
            <Pressable onPress={nav.openSearch} style={styles.glyphBtn} hitSlop={8}>
              <SearchIcon size={23} color={colors.text} />
            </Pressable>
            <View style={styles.glyphSep} />
            <Pressable onPress={openActivity} style={styles.glyphBtn} hitSlop={8}>
              <BellIcon size={23} color={colors.text} />
              {unread > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{unread}</Text>
                </View>
              )}
            </Pressable>
            <View style={styles.glyphSep} />
            <Pressable onPress={() => setShowMenu(true)} style={styles.glyphBtn} hitSlop={8}>
              <MenuIcon size={24} color={colors.text} />
            </Pressable>
          </View>
        </View>
        <View style={styles.ruleThin} />
      </View>

      {/* 本文：横スワイプで [ホーム] [お題・フォロー] [お題・おすすめ] */}
      <View
        style={styles.pagerWrap}
        onLayout={(e) => setPager({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      >
        <ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onPagerScroll}
          onMomentumScrollEnd={onPagerScroll}
          scrollEventThrottle={16}
        >
          {/* ── ページ0：ホーム ── */}
          <View style={{ width: pager.w, height: pager.h }}>
            <View
              style={styles.stage}
              onLayout={(e) => setStage({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
            >
              {open || myActive.length > 0 ? (
                <MyPostsSwiper
                  posts={open ? feedPosts : myActive}
                  me={me}
                  official={s.users.find(isBrandUser)}
                  users={s.users}
                  passOpen={open}
                  active={page === PAGE_HOME}
                  onReact={(postId, type: ReactionType) => reactToPost(postId, type)}
                  onMarkViewed={markViewed}
                  myReactionOf={(postId) => myReaction(s, postId)}
                  onOpenIssue={(p) => {
                    if (!p.issue) return;
                    const built: Post[] = p.issue.images.map((url, i) => {
                      const origId = p.issue!.sourcePostIds[i];
                      const orig = origId ? s.posts.find((x) => x.id === origId) : undefined;
                      return {
                        id: orig?.id ?? `${p.id}__view_${i}`,
                        userId: p.userId,
                        imageUrl: url,
                        memoryUri: p.issue!.memoryUris?.[i] ?? orig?.memoryUri,
                        caption: orig?.caption,
                        audioUrl: orig?.audioUrl,
                        audioSeed: orig?.audioSeed,
                        createdAt: orig?.createdAt ?? p.createdAt,
                        expiresAt: p.expiresAt,
                      };
                    });
                    setViewingMemory(built);
                  }}
                />
              ) : mediaMode && followedLatest ? (
                <FadeIn key={followedLatest.id} delay={130} dy={16} style={styles.heroWrap}>
                  {cardW > 0 && (
                    <ChekiCard
                      uri={followedLatest.imageUrl}
                      width={cardW}
                      tiltSeed={followedLatest.id}
                      blur
                      redactStrip
                    />
                  )}
                </FadeIn>
              ) : s.following.length === 0 ? (
                <OfficialCard official={s.users.find(isBrandUser)} message={tr('ようこそ', 'Welcome')} width={Math.min(cardW, 320)} />
              ) : (
                <OfficialCard official={s.users.find(isBrandUser)} message={tr('日常を投稿してみよう', 'Try posting your day')} width={Math.min(cardW, 320)} />
              )}
            </View>
          </View>

          {/* ── ページ1：お題（フォロー） ── */}
          <View style={{ width: pager.w, height: pager.h }}>
            <TopicPage section="known" active={page === PAGE_FOLLOW} onSwitchSection={switchSection} />
          </View>

          {/* ── ページ2：お題（おすすめ） ── */}
          <View style={{ width: pager.w, height: pager.h }}>
            <TopicPage section="strangers" active={page === PAGE_FORYOU} onSwitchSection={switchSection} />
          </View>
        </ScrollView>
      </View>

      {/* 右下の丸カメラFAB（横長ボタンは廃止）。お題ページではそのお題に出す。 */}
      <Pressable
        onPress={onFab}
        style={({ pressed }) => [
          styles.fab,
          { bottom: insets.bottom + space.lg },
          pressed && { transform: [{ scale: 0.94 }] },
        ]}
        hitSlop={8}
        accessibilityLabel={tr('撮る', 'Take a photo')}
      >
        <CameraIcon size={26} color={colors.limeInk} />
      </Pressable>

      {showActivity && (
        <ActivityOverlay
          items={activity}
          passOpen={open}
          topicPrompt={topic.prompt}
          onOpenTopic={() => {
            setShowActivity(false);
            scrollToPage(PAGE_FOLLOW, true);
          }}
          onClose={() => setShowActivity(false)}
          onShoot={() => {
            setShowActivity(false);
            nav.openCamera();
          }}
        />
      )}
      {viewingMemory && <MemoryViewer posts={viewingMemory} onClose={() => setViewingMemory(null)} />}
      {showMenu && (
        <HamburgerMenu
          onClose={() => setShowMenu(false)}
          items={[
            ...(Platform.OS === 'web'
              ? [{ label: themeMode === 'dark' ? tr('ライトモードにする', 'Switch to light mode') : tr('ダークモードにする', 'Switch to dark mode'), onPress: toggleThemeMode }]
              : []),
            { label: tr('アカウント連携', 'Link account'), onPress: () => setShowLink(true) },
            { label: tr('セキュリティ', 'Security'), onPress: () => setShowSettings(true) },
            { label: tr('プライバシーポリシー', 'Privacy Policy'), onPress: () => setDoc(PRIVACY_POLICY) },
            { label: tr('利用規約', 'Terms of Service'), onPress: () => setDoc(TERMS_OF_SERVICE) },
            { label: tr('アカウントを削除', 'Delete account'), onPress: () => setShowDelete(true), danger: true },
          ]}
        />
      )}
      {doc && <DocOverlay doc={doc} onClose={() => setDoc(null)} />}
      {showSettings && <SettingsOverlay onClose={() => setShowSettings(false)} />}
      {showLink && <AccountLinkOverlay onClose={() => setShowLink(false)} />}
      {showDelete && <DeleteAccountOverlay onClose={() => setShowDelete(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  // マストヘッド
  masthead: { paddingHorizontal: space.lg },
  titleBlock: { backgroundColor: colors.text, paddingHorizontal: space.md, paddingTop: 7, paddingBottom: 9 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  brand: { fontSize: 38, fontFamily: fonts.brand, color: colors.bg, letterSpacing: -1, includeFontPadding: false },
  brandAccent: { color: '#D6E66B' },
  dateline: { alignItems: 'flex-end', paddingBottom: 4 },
  dateText: { color: colors.bg, fontSize: 11, fontFamily: fonts.handle, letterSpacing: 0.5, opacity: 0.85 },
  ruleDoubleTop: { height: rule.thick, backgroundColor: colors.text, marginTop: 4 },
  ruleDoubleGap: { height: 2 },
  ruleDoubleBot: { height: rule.hair, backgroundColor: colors.text },
  ruleThin: { height: rule.hair, backgroundColor: colors.hairline },
  utilityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 7 },
  utilityLeft: { flex: 1, justifyContent: 'center', paddingRight: space.sm },
  // お題名（号外の節見出し風）。左詰め・明朝。
  topicLabel: { color: colors.textDim, fontSize: font.body, fontWeight: '700', fontFamily: fonts.serif, letterSpacing: 0 },
  topicLabelStrong: { color: colors.text, fontWeight: '900' },
  glyphs: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  glyphBtn: { alignItems: 'center', justifyContent: 'center' },
  glyphSep: { width: rule.hair, height: 16, backgroundColor: colors.hairline },
  bellBadge: {
    position: 'absolute',
    top: -6,
    right: -7,
    minWidth: 15,
    height: 15,
    backgroundColor: colors.warn,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: rule.hair,
    borderColor: colors.bg,
  },
  bellBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '700', fontFamily: fonts.handle },

  // 中央ステージ
  pagerWrap: { flex: 1, overflow: 'hidden' },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.md },
  heroWrap: { alignItems: 'center', gap: space.md },

  // 右下の丸カメラFAB
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
});
