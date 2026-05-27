import React, { useMemo, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, rule, space, themeMode, toggleThemeMode } from '../theme';
import { fonts } from '../lib/fonts';
import { FadeIn, ShootButton, useTick } from '../components/ui';
import { Backdrop } from '../components/Backdrop';
import { MyPostsSwiper } from '../components/MyPostsSwiper';
import { ChekiCard } from '../components/ChekiCard';
import { OfficialCard } from '../components/OfficialCard';
import { ActivityOverlay } from '../components/ActivityOverlay';
import { MemoryViewer } from '../components/MemoryViewer';
import { HamburgerMenu } from '../components/HamburgerMenu';
import { DocOverlay } from '../components/DocOverlay';
import { SettingsOverlay } from '../components/SettingsOverlay';
import { BellIcon, ChevronRightIcon, MenuIcon, SearchIcon } from '../components/icons';
import { LegalDoc, PRIVACY_POLICY, TERMS_OF_SERVICE } from '../legal';
import { Nav } from '../navigation/nav';
import { useStore } from '../store';
import { activityItems, currentUser, followedActivePosts, isBrandUser, isPassOpen, memoryHighlights, myReaction, topicUnseen } from '../selectors';
import { isActive } from '../lib/time';
import { todaysTopic } from '../topics';
import { Post, ReactionType } from '../types';

export function HomeScreen({ nav }: { nav: Nav }) {
  const insets = useSafeAreaInsets();
  useTick();

  const s = useStore();
  const markActivitySeen = useStore((st) => st.markActivitySeen);
  const markTopicSeen = useStore((st) => st.markTopicSeen);
  const resetDemo = useStore((st) => st.resetDemo);
  const open = isPassOpen(s);
  const me = currentUser(s);
  const topic = todaysTopic();
  // 今日のお題をまだ見ていない＝通知あり。ただし通知設定でお題がオフなら出さない。
  const topicNew = topicUnseen(s) && s.notifyPrefs.topic;

  // 題字横の日付（号外のデートライン）。
  const now = new Date();
  const wd = ['日', '月', '火', '水', '木', '金', '土'][now.getDay()];
  const dateline = `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}（${wd}）`;

  const markViewed = useStore((st) => st.markViewed);
  const reactToPost = useStore((st) => st.reactToPost);

  // ホームに並べる投稿＝フォロー中の他人投稿（古い順）＋自分の投稿（古い順）の連結。
  // 別ページ（FeedScreen）に飛ばさず、ここでまとめて縦スワイプで全部見れるように。
  const others = useMemo(() => followedActivePosts(s), [s.posts, s.following, s.currentUserId]);
  const myActive = useMemo(
    () =>
      s.posts
        .filter((p) => p.userId === s.currentUserId && !p.topicKey && isActive(p.expiresAt))
        .sort((a, b) => a.expiresAt - b.expiresAt),
    [s.posts, s.currentUserId]
  );
  const feedPosts = useMemo(() => [...others, ...myActive], [others, myActive]);
  const followedLatest = others[0];

  const memory = useMemo(() => memoryHighlights(s)[0], [s.posts, s.currentUserId]);
  const activity = useMemo(() => activityItems(s), [s.posts, s.views, s.reactions, s.following, s.currentUserId, s.notifyPrefs]);
  const unread = activity.filter((i) => i.at > s.lastSeenActivityAt).length + (topicNew ? 1 : 0);

  // 未投稿（パス未取得）でフォロー中の人がいる → チェキをモザイク予告で1枚見せる
  const mediaMode = !open && !!followedLatest;
  const cardWMedia = (w: number, h: number) => Math.max(0, Math.min(w - 16, Math.floor((h - 56) / 1.31), 380));

  const [stage, setStage] = useState({ w: 0, h: 0 });
  const cardW = cardWMedia(stage.w, stage.h);

  const [showActivity, setShowActivity] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [doc, setDoc] = useState<LegalDoc | null>(null);
  const [viewingMemory, setViewingMemory] = useState<Post[] | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const openActivity = () => {
    setShowActivity(true);
    markActivitySeen();
    markTopicSeen(); // 通知を開いたら今日のお題も既読に
  };

  return (
    <View style={styles.container}>
      {/* 紙の空気感（放射グラデ＋フィルムグレイン） */}
      <Backdrop />

      {/* マストヘッド（題字＋デートライン＋欄外の操作） */}
      <View style={[styles.masthead, { paddingTop: insets.top + space.sm }]}>
        {/* 題字＋日付はベタ塗りの帯（ライト＝黒地に白／ダーク＝白地に黒）。 */}
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
        {/* 題字の下線＝二重罫（号外のマストヘッド） */}
        <View style={styles.ruleDoubleTop} />
        <View style={styles.ruleDoubleGap} />
        <View style={styles.ruleDoubleBot} />
        <View style={styles.utilityRow}>
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

      {/* 縮刷版（1年前の号 など、バックナンバー欄） */}
      {memory && (
        <FadeIn delay={70} dy={8}>
          <Pressable
            onPress={() => setViewingMemory([memory.post])}
            style={({ pressed }) => [styles.backnumber, pressed && { backgroundColor: colors.surfaceSunken }]}
          >
            <Image source={{ uri: memory.post.imageUrl }} style={styles.bnThumb} resizeMode="cover" />
            <View style={{ flex: 1, marginLeft: space.sm }}>
              <Text style={styles.bnKicker}>{memory.label}</Text>
            </View>
            <ChevronRightIcon size={18} color={colors.textFaint} />
          </Pressable>
        </FadeIn>
      )}

      {/* 中央：他人＋自分の投稿を混ぜた縦スワイプ。未投稿（パス未取得）は予告のモザイク1枚。 */}
      <View
        style={styles.stage}
        onLayout={(e) => setStage({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      >
        {open ? (
          <MyPostsSwiper
            posts={feedPosts}
            me={me}
            official={s.users.find(isBrandUser)}
            users={s.users}
            passOpen={open}
            onReact={(postId, type: ReactionType) => reactToPost(postId, type)}
            onMarkViewed={markViewed}
            myReactionOf={(postId) => myReaction(s, postId)}
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
          <OfficialCard official={s.users.find(isBrandUser)} message="ようこそ" width={Math.min(cardW, 320)} />
        ) : (
          <OfficialCard official={s.users.find(isBrandUser)} message="日常を投稿してみよう" width={Math.min(cardW, 320)} />
        )}
      </View>

      {/* 下部CTA：撮るボタンを常に出す。 */}
      <FadeIn delay={220} dy={12} style={{ paddingHorizontal: space.lg, paddingBottom: insets.bottom + space.md }}>
        <ShootButton block onPress={() => nav.openCamera()} />
      </FadeIn>

      {showActivity && (
        <ActivityOverlay
          items={activity}
          passOpen={open}
          topicPrompt={topic.prompt}
          onOpenTopic={() => {
            setShowActivity(false);
            nav.setTab('topic');
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
              ? [{ label: themeMode === 'dark' ? 'ライトモードにする' : 'ダークモードにする', onPress: toggleThemeMode }]
              : []),
            { label: 'セキュリティ', onPress: () => setShowSettings(true) },
            { label: 'プライバシーポリシー', onPress: () => setDoc(PRIVACY_POLICY) },
            { label: '利用規約', onPress: () => setDoc(TERMS_OF_SERVICE) },
            { label: 'デモを最初からやり直す', onPress: resetDemo, danger: true },
          ]}
        />
      )}
      {doc && <DocOverlay doc={doc} onClose={() => setDoc(null)} />}
      {showSettings && <SettingsOverlay onClose={() => setShowSettings(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  // マストヘッド
  masthead: { paddingHorizontal: space.lg },
  // 題字＋日付の帯。地＝インク色（ライト黒/ダーク白）、文字＝紙色（ライト白/ダーク黒）。
  titleBlock: { backgroundColor: colors.text, paddingHorizontal: space.md, paddingTop: 7, paddingBottom: 9 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  brand: { fontSize: 38, fontFamily: fonts.brand, color: colors.bg, letterSpacing: -1, includeFontPadding: false },
  // 「napsnap」の真ん中の s だけ薄い黄緑でワンポイント。白黒ベースの紙面に小さなアクセント。
  brandAccent: { color: '#D6E66B' },
  dateline: { alignItems: 'flex-end', paddingBottom: 4 },
  dateText: { color: colors.bg, fontSize: 11, fontFamily: fonts.handle, letterSpacing: 0.5, opacity: 0.85 },
  // 二重罫＝太罫＋紙の隙間＋細罫
  ruleDoubleTop: { height: rule.thick, backgroundColor: colors.text, marginTop: 4 },
  ruleDoubleGap: { height: 2 },
  ruleDoubleBot: { height: rule.hair, backgroundColor: colors.text },
  ruleThin: { height: rule.hair, backgroundColor: colors.hairline },
  utilityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingVertical: 7 },
  glyphs: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  glyphBtn: { alignItems: 'center', justifyContent: 'center' },
  glyphSep: { width: rule.hair, height: 16, backgroundColor: colors.hairline },
  bellBadge: {
    position: 'absolute',
    top: -6,
    right: -7,
    minWidth: 15,
    height: 15,
    backgroundColor: colors.warn, // 通知バッジは赤（白黒の中で唯一の差し色）
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: rule.hair,
    borderColor: colors.bg,
  },
  bellBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '700', fontFamily: fonts.handle },

  // 縮刷版（バックナンバー欄）
  backnumber: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: space.lg,
    marginTop: space.sm,
    paddingVertical: space.xs,
    borderTopWidth: rule.hair,
    borderBottomWidth: rule.hair,
    borderColor: colors.hairline,
  },
  bnThumb: { width: 46, height: 46, backgroundColor: colors.surfaceSunken, borderWidth: rule.hair, borderColor: colors.hairline },
  bnKicker: { color: colors.text, fontSize: font.body, fontWeight: '700', fontFamily: fonts.serif, letterSpacing: 0 },

  // 中央ステージ
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.md },
  heroWrap: { alignItems: 'center', gap: space.md },
});
