import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, rule, space } from '../theme';
import { fonts } from '../lib/fonts';
import { Avatar, FadeIn } from './ui';
import { CameraIcon, CloseIcon, GearIcon, NoteIcon, TraceMark, VerifiedBadge } from './icons';
import { timeAgo } from '../lib/time';
import { ActivityItem } from '../selectors';
import { User } from '../types';
import { useStore } from '../store';
import { NotifySettingsOverlay } from './NotifySettingsOverlay';
import { tr } from '../i18n';

// 同種・同対象の通知を1件にまとめた塊（Twitter風）。
interface Group {
  id: string;
  kind: ActivityItem['kind'];
  users: User[]; // 重複なし・新しい順
  at: number; // 最新時刻
  postImage?: string;
}

// 「アクティビティ」を種類×対象でまとめる。
// react/view は投稿ごと、post はユーザーごと、follow は全部を1件に集約する。
function groupActivity(items: ActivityItem[]): Group[] {
  const map = new Map<string, Group>();
  const order: string[] = [];
  for (const it of items) {
    const key =
      it.kind === 'react'
        ? `react_${it.postId}`
        : it.kind === 'view'
        ? `view_${it.postId}`
        : it.kind === 'post'
        ? `post_${it.user?.id}`
        : 'follow';
    let g = map.get(key);
    if (!g) {
      g = { id: key, kind: it.kind, users: [], at: it.at, postImage: it.postImage };
      map.set(key, g);
      order.push(key);
    }
    if (it.user && !g.users.some((u) => u.id === it.user!.id)) g.users.push(it.user);
    if (it.at > g.at) g.at = it.at;
    if (!g.postImage && it.postImage) g.postImage = it.postImage;
  }
  return order.map((k) => map.get(k)!).sort((a, b) => b.at - a.at);
}

// 「Aさん、Bさん他3人」形式の名前まとめ。
function names(users: User[]): string {
  const n = users.length;
  const a = users[0]?.displayName ?? tr('友達', 'Friend');
  if (n <= 1) return a;
  const b = users[1]?.displayName ?? tr('友達', 'Friend');
  if (n === 2) return tr(`${a}、${b}`, `${a} and ${b}`);
  return tr(`${a}、${b}他${n - 2}人`, `${a}, ${b} and ${n - 2} others`);
}

function lineFor(g: Group): string {
  const who = names(g.users);
  const n = g.users.length;
  if (g.kind === 'follow') return tr(`${who}にフォローされた`, `${who} followed you`);
  if (g.kind === 'post') return tr(`${who}が投稿した`, `${who} posted`);
  if (g.kind === 'react') return tr(`${who}があなたの投稿に反応`, `${who} reacted to your post`);
  // 足あとは人数で（「12人が見た」）。
  return tr(`${n}人が見た`, `${n} ${n === 1 ? 'person' : 'people'} saw your post`);
}

// 重なった小さなアバターの列＋余りは「+N」。1人だけのときは大きめ1枚。
function AvatarStack({ users }: { users: User[] }) {
  if (users.length <= 1) return <Avatar user={users[0]} size={40} />;
  const shown = users.slice(0, 3);
  const extra = users.length - shown.length;
  return (
    <View style={styles.stack}>
      {shown.map((u, i) => (
        <View key={u.id} style={[styles.stackItem, i > 0 && { marginLeft: -10 }]}>
          <Avatar user={u} size={30} />
        </View>
      ))}
      {extra > 0 && (
        <View style={styles.stackMore}>
          <Text style={styles.stackMoreText}>+{extra}</Text>
        </View>
      )}
    </View>
  );
}

// 通知一覧。自分の投稿への反応/足あと＋フォロー中の新着＋フォローを、Twitter風にまとめて表示。
export function ActivityOverlay({
  items,
  passOpen,
  topicPrompt,
  onOpenTopic,
  onClose,
  onShoot,
}: {
  items: ActivityItem[];
  passOpen: boolean;
  topicPrompt?: string;
  onOpenTopic?: () => void;
  onClose: () => void;
  onShoot: () => void;
}) {
  const insets = useSafeAreaInsets();
  const following = useStore((s) => s.following);
  const toggleFollow = useStore((s) => s.toggleFollow);
  const notifyTopic = useStore((s) => s.notifyPrefs.topic);
  const [showNotifySettings, setShowNotifySettings] = useState(false);
  const showTopic = !!topicPrompt && notifyTopic;
  const groups = useMemo(() => groupActivity(items), [items]);

  return (
    <FadeIn style={styles.container} dy={16} duration={220}>
      <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
        <Text style={styles.title}>{tr('通知', 'Notifications')}</Text>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => setShowNotifySettings(true)}
            style={styles.headerIconBtn}
            hitSlop={12}
          >
            <GearIcon size={20} color={colors.text} />
          </Pressable>
          <Pressable onPress={onClose} style={styles.headerIconBtn} hitSlop={12}>
            <CloseIcon size={18} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: insets.bottom + space.xl }} showsVerticalScrollIndicator={false}>
        {showTopic && (
          <Pressable onPress={onOpenTopic} style={({ pressed }) => [styles.topicNotice, pressed && { opacity: 0.92 }]}>
            <View style={styles.topicIcon}>
              <NoteIcon size={20} color={colors.limeInk} filled />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.topicLine}>
                {tr(`今日のお題は「${topicPrompt}」だよ。`, `Today's prompt is "${topicPrompt}".`)}
              </Text>
              <Text style={styles.topicSub}>{tr('投稿してみよう！', 'Give it a try!')}</Text>
            </View>
          </Pressable>
        )}

        {!passOpen && (
          <View style={styles.turn}>
            <View style={{ flex: 1 }}>
              <Text style={styles.turnTitle}>{tr('あなたの番', 'Your turn')}</Text>
              <Text style={styles.turnSub}>{tr('1枚出すと、みんなの今が見える。', 'Post one photo to see everyone\'s now.')}</Text>
            </View>
            <Pressable
              onPress={onShoot}
              style={({ pressed }) => [styles.shootIconBtn, pressed && { opacity: 0.9, transform: [{ translateY: 1 }] }]}
              hitSlop={8}
            >
              <CameraIcon size={22} color={colors.limeInk} />
            </Pressable>
          </View>
        )}

        {groups.length === 0 ? (
          <View style={styles.empty}>
            <TraceMark size={40} />
            <Text style={styles.emptyText}>{tr('まだ何もない', 'Nothing yet')}</Text>
          </View>
        ) : (
          groups.map((g) => {
            // フォローが1人だけのときはフォローバックボタンを出す（複数人はまとめ表示のみ）。
            const single = g.kind === 'follow' && g.users.length === 1 && !!g.users[0];
            const followingBack = single && following.includes(g.users[0].id);
            const verified = g.users.length === 1 && g.users[0]?.isOfficial;
            return (
              <View key={g.id} style={styles.row}>
                <AvatarStack users={g.users} />
                <View style={{ flex: 1, marginLeft: space.sm }}>
                  <View style={styles.lineRow}>
                    <Text style={styles.line} numberOfLines={2}>{lineFor(g)}</Text>
                    {verified && <VerifiedBadge size={13} />}
                  </View>
                  <Text style={styles.time}>{timeAgo(g.at)}</Text>
                </View>
                {single ? (
                  <Pressable
                    onPress={() => toggleFollow(g.users[0].id)}
                    style={({ pressed }) => [
                      styles.followBtn,
                      followingBack && styles.followingBtn,
                      pressed && { opacity: 0.85 },
                    ]}
                    hitSlop={6}
                  >
                    <Text style={[styles.followText, followingBack && styles.followingText]}>
                      {followingBack ? tr('フォロー中', 'Following') : tr('フォローバック', 'Follow back')}
                    </Text>
                  </Pressable>
                ) : g.postImage ? (
                  <Image source={{ uri: g.postImage }} style={styles.thumb} resizeMode="cover" />
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>

      {showNotifySettings && <NotifySettingsOverlay onClose={() => setShowNotifySettings(false)} />}
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
    paddingBottom: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  headerIconBtn: { width: 36, height: 36, borderRadius: radius.xs, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSunken },
  title: { color: colors.text, fontSize: font.lead, fontWeight: '900', fontFamily: fonts.display, letterSpacing: -0.5 },
  turn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xs,
    borderWidth: rule.hair,
    borderColor: colors.hairline,
    padding: space.md,
    marginBottom: space.md,
  },
  turnTitle: { color: colors.text, fontSize: font.lead, fontWeight: '900', fontFamily: fonts.display, letterSpacing: -0.5 },
  turnSub: { color: colors.textDim, fontSize: font.small, marginTop: 2, fontFamily: fonts.ui },
  shootIconBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.xs,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: rule.hair,
    borderColor: colors.limeDust,
  },
  empty: { alignItems: 'center', justifyContent: 'center', gap: space.sm, paddingVertical: space.xxl },
  emptyText: { color: colors.textDim, fontSize: font.body, fontWeight: '700', fontFamily: fonts.ui },
  topicNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.limeSoft,
    borderRadius: radius.xs,
    borderWidth: rule.hair,
    borderColor: colors.limeLine,
    padding: space.md,
    marginBottom: space.md,
  },
  topicIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.xs,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicLine: { color: colors.limeInkSoft, fontSize: font.body, fontWeight: '800', fontFamily: fonts.ui },
  topicSub: { color: colors.limeInkSoft, fontSize: font.small, fontWeight: '700', fontFamily: fonts.ui, marginTop: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: rule.hair, borderBottomColor: colors.hairline },
  // 重なりアバターの列
  stack: { flexDirection: 'row', alignItems: 'center', width: 40, height: 40 },
  stackItem: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.bg,
    overflow: 'hidden',
  },
  stackMore: {
    marginLeft: -10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surfaceSunken,
    borderWidth: 1.5,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackMoreText: { color: colors.textDim, fontSize: 10, fontWeight: '800', fontFamily: fonts.handle },
  lineRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  line: { color: colors.text, fontSize: font.body, fontWeight: '700', fontFamily: fonts.ui, flexShrink: 1 },
  time: { color: colors.textFaint, fontSize: font.small, marginTop: 1, fontFamily: fonts.handle },
  thumb: { width: 40, height: 40, borderRadius: radius.xs, backgroundColor: colors.surfaceSunken, marginLeft: space.sm },
  followBtn: {
    marginLeft: space.sm,
    borderRadius: radius.xs,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.lime,
    borderWidth: rule.hair,
    borderColor: colors.limeDust,
  },
  followText: { color: colors.limeInk, fontSize: font.small, fontWeight: '700', fontFamily: fonts.ui },
  followingBtn: { backgroundColor: colors.surfaceRaised, borderColor: colors.hairline },
  followingText: { color: colors.textDim },
});
