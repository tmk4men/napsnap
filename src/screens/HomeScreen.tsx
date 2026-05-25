import React, { useMemo, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, rule, space, themeMode, toggleThemeMode } from '../theme';
import { fonts } from '../lib/fonts';
import { copy } from '../copy';
import { Avatar, FadeIn, GhostButton, PrimaryButton, Remaining, ShootButton, useTick } from '../components/ui';
import { Backdrop } from '../components/Backdrop';
import { MyPostsSwiper } from '../components/MyPostsSwiper';
import { ChekiCard } from '../components/ChekiCard';
import { ActivityOverlay } from '../components/ActivityOverlay';
import { MemoryViewer } from '../components/MemoryViewer';
import { HamburgerMenu } from '../components/HamburgerMenu';
import { DocOverlay } from '../components/DocOverlay';
import { BellIcon, CameraIcon, ChevronRightIcon, MenuIcon, SearchIcon, VerifiedBadge } from '../components/icons';
import { LegalDoc, PRIVACY_POLICY, TERMS_OF_SERVICE } from '../legal';
import { Nav } from '../navigation/nav';
import { useStore } from '../store';
import { activityItems, currentUser, feedQueue, isPassOpen, memoryHighlights, topicUnseen, userById } from '../selectors';
import { isActive, timeAgo } from '../lib/time';
import { todaysTopic } from '../topics';
import { Post } from '../types';

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
  const topicNew = topicUnseen(s); // 今日のお題をまだ見ていない＝通知あり

  // 題字横の日付（号外のデートライン）。
  const now = new Date();
  const wd = ['日', '月', '火', '水', '木', '金', '土'][now.getDay()];
  const dateline = `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}（${wd}）`;

  const queue = useMemo(() => feedQueue(s), [s.posts, s.feedStates, s.following, s.currentUserId]);
  const myActive = useMemo(
    () =>
      s.posts
        .filter((p) => p.userId === s.currentUserId && !p.topicKey && isActive(p.expiresAt))
        .sort((a, b) => a.expiresAt - b.expiresAt),
    [s.posts, s.currentUserId]
  );
  const memory = useMemo(() => memoryHighlights(s)[0], [s.posts, s.currentUserId]);
  const activity = useMemo(() => activityItems(s), [s.posts, s.views, s.reactions, s.following, s.currentUserId]);
  const unread = activity.filter((i) => i.at > s.lastSeenActivityAt).length + (topicNew ? 1 : 0);

  const count = queue.length;
  const followedLatest = queue[0]; // 残りが短い順の先頭
  // ヒーロー：自分／フォロー中の中で「残りが短い」投稿を出す
  const heroPost = [myActive[0], followedLatest].filter((p): p is Post => !!p).sort((a, b) => a.expiresAt - b.expiresAt)[0];
  const heroIsMine = !!heroPost && heroPost.userId === s.currentUserId;

  // 他の人を見終わったら（残り0）、自分の24時間以内の投稿だけがホームに残り、上下スワイプで全部見れる。
  const showMine = open && count === 0 && myActive.length > 0;
  const mediaMode = !open && !!followedLatest; // 未投稿：チェキをモザイク予告
  const openHero = open && !showMine && !!heroPost; // 投稿済み＆まだ他の人がいる：くっきり1枚
  const showCard = mediaMode || openHero;

  const displayPost = mediaMode ? followedLatest : openHero ? heroPost : undefined;
  const displayAuthor = displayPost ? (displayPost.userId === s.currentUserId ? me : userById(s.users, displayPost.userId)) : undefined;
  const reactionsOf = (id: string) => s.reactions.filter((r) => r.postId === id).length;

  const [stage, setStage] = useState({ w: 0, h: 0 });
  // チェキを“できるだけ大きく”：横幅と、縦に収まる高さの両方から最大サイズを決める。
  const cardW = Math.max(0, Math.min(stage.w - 16, Math.floor((stage.h - 56) / 1.31), 380));

  const [showActivity, setShowActivity] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [doc, setDoc] = useState<LegalDoc | null>(null);
  const [viewingMemory, setViewingMemory] = useState<Post[] | null>(null);
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
        <View style={styles.titleRow}>
          <Text style={styles.brand}>napsnap</Text>
          <View style={styles.dateline}>
            <Text style={styles.dateText}>{dateline}</Text>
          </View>
        </View>
        <View style={styles.ruleHeavy} />
        <View style={styles.utilityRow}>
          <View style={styles.glyphs}>
            <Pressable onPress={nav.openSearch} style={styles.glyphBtn} hitSlop={8}>
              <SearchIcon size={20} color={colors.text} />
            </Pressable>
            <View style={styles.glyphSep} />
            <Pressable onPress={() => nav.openCamera()} style={styles.glyphBtn} hitSlop={8}>
              <CameraIcon size={21} color={colors.text} />
            </Pressable>
            <View style={styles.glyphSep} />
            <Pressable onPress={openActivity} style={styles.glyphBtn} hitSlop={8}>
              <BellIcon size={20} color={colors.text} />
              {unread > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{unread}</Text>
                </View>
              )}
            </Pressable>
            <View style={styles.glyphSep} />
            <Pressable onPress={() => setShowMenu(true)} style={styles.glyphBtn} hitSlop={8}>
              <MenuIcon size={21} color={colors.text} />
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

      {/* 中央：チェキのヒーロー or メッセージ */}
      <View
        style={styles.stage}
        onLayout={(e) => setStage({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      >
        {showMine ? (
          <MyPostsSwiper posts={myActive} me={me} official={s.users.find((u) => u.isOfficial)} onShoot={() => nav.openCamera()} />
        ) : showCard && displayPost ? (
          <FadeIn key={displayPost.id} delay={130} dy={16} style={styles.heroWrap}>
            {cardW > 0 && (
              <ChekiCard
                uri={displayPost.imageUrl}
                caption={openHero ? displayPost.caption : undefined}
                width={cardW}
                date={openHero ? displayPost.createdAt : undefined}
                tiltSeed={displayPost.id}
                blur={mediaMode}
                redactStrip={mediaMode}
              />
            )}
            <View style={styles.metaRow}>
              <Avatar user={displayAuthor} size={26} blur={mediaMode} />
              {openHero ? (
                <>
                  {!heroIsMine && (
                    <Text style={styles.metaName}>
                      {displayAuthor?.isOfficial ? 'napsnap' : `${displayAuthor?.displayName} たちの今`}
                    </Text>
                  )}
                  {displayAuthor?.isOfficial && <VerifiedBadge size={15} />}
                  {!displayAuthor?.isOfficial && (
                    <View style={{ marginLeft: 6 }}>
                      <Remaining expiresAt={displayPost.expiresAt} color={colors.warn} size={12} />
                    </View>
                  )}
                </>
              ) : (
                <>
                  {reactionsOf(displayPost.id) > 0 && (
                    <Text style={styles.metaName}>{reactionsOf(displayPost.id)}人が反応</Text>
                  )}
                  {/* ロック中でも、この投稿があと何時間で消えるかを赤で出す（早く撮ろう） */}
                  {!displayAuthor?.isOfficial && (
                    <View style={{ marginLeft: 6 }}>
                      <Remaining expiresAt={displayPost.expiresAt} color={colors.warn} size={12} />
                    </View>
                  )}
                </>
              )}
            </View>
          </FadeIn>
        ) : open ? (
          <View style={styles.msg}>
            <Text style={styles.big}>{copy.allSeenTitle}</Text>
            <View style={{ height: space.md }} />
            <Remaining expiresAt={s.accessPass!.expiresAt} color={colors.text} size={15} />
          </View>
        ) : s.following.length === 0 ? (
          <View style={styles.msg}>
            <Text style={styles.big}>{copy.noFollowing}</Text>
            <Text style={styles.sub}>自分タブから、見たい人をフォロー。</Text>
          </View>
        ) : (
          <View style={styles.msg}>
            <Text style={styles.big}>{copy.lockedEmpty}</Text>
            <Text style={styles.sub}>誰かが出したら、通知に届く。</Text>
          </View>
        )}
      </View>

      {/* 下部CTA */}
      <FadeIn delay={220} dy={12} style={{ paddingHorizontal: space.lg, paddingBottom: insets.bottom + space.md }}>
        {open ? (
          count > 0 ? (
            <PrimaryButton label={copy.see} onPress={nav.openFeed} />
          ) : (
            <GhostButton label={copy.shoot} onPress={() => nav.openCamera()} />
          )
        ) : (
          <ShootButton block label={copy.revealChip} onPress={() => nav.openCamera()} />
        )}
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
            { label: 'プライバシーポリシー', onPress: () => setDoc(PRIVACY_POLICY) },
            { label: '利用規約', onPress: () => setDoc(TERMS_OF_SERVICE) },
            { label: 'デモを最初からやり直す', onPress: resetDemo, danger: true },
          ]}
        />
      )}
      {doc && <DocOverlay doc={doc} onClose={() => setDoc(null)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  // マストヘッド
  masthead: { paddingHorizontal: space.lg },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: 6 },
  brand: { fontSize: 38, fontFamily: fonts.brand, color: colors.text, letterSpacing: -1, includeFontPadding: false },
  dateline: { alignItems: 'flex-end', paddingBottom: 4 },
  dateText: { color: colors.textDim, fontSize: 11, fontFamily: fonts.handle, letterSpacing: 0.5 },
  ruleHeavy: { height: rule.thick, backgroundColor: colors.text },
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
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: rule.hair,
    borderColor: colors.bg,
  },
  bellBadgeText: { color: colors.limeInk, fontSize: 9, fontWeight: '700', fontFamily: fonts.handle },

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
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  metaName: { color: colors.text, fontSize: font.lead, fontWeight: '700', fontFamily: fonts.serif, letterSpacing: 0 },
  msg: { alignItems: 'flex-start', alignSelf: 'stretch' },
  big: { fontSize: 44, fontWeight: '800', lineHeight: 52, fontFamily: fonts.serif, color: colors.text, letterSpacing: -1 },
  sub: { fontSize: font.lead, marginTop: space.md, lineHeight: font.lead * 1.6, fontFamily: fonts.ui, color: colors.textDim },
});
