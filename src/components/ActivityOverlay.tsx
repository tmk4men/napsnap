import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, rule, space } from '../theme';
import { fonts } from '../lib/fonts';
import { Avatar, FadeIn } from './ui';
import { CameraIcon, CloseIcon, GearIcon, NoteIcon, TraceMark, VerifiedBadge } from './icons';
import { timeAgo } from '../lib/time';
import { ActivityItem } from '../selectors';
import { useStore } from '../store';
import { NotifySettingsOverlay } from './NotifySettingsOverlay';
import { tr } from '../i18n';

function lineFor(item: ActivityItem): string {
  const name = item.user?.displayName ?? tr('友達', 'Friend');
  if (item.kind === 'follow') return tr(`${name} にフォローされた`, `${name} followed you`);
  if (item.kind === 'post') return tr(`${name} が投稿した`, `${name} posted`);
  if (item.kind === 'react') return tr(`${name} が反応した`, `${name} reacted`);
  if (item.kind === 'view') return tr(`${name} が見た`, `${name} saw your post`);
  return tr(`${name} が痕跡を残した`, `${name} left a trace`);
}

// 通知（アクティビティ）一覧。自分の投稿への反応/足跡＋フォロー中の新着。
// バックエンドが無いデモなので、ストアのデータから組み立てた擬似通知。
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
  return (
    <FadeIn style={styles.container} dy={16} duration={220}>
      <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
        <Text style={styles.title}>{tr('アクティビティ', 'Activity')}</Text>
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

        {items.length === 0 ? (
          <View style={styles.empty}>
            <TraceMark size={40} />
            <Text style={styles.emptyText}>{tr('まだ何もない', 'Nothing yet')}</Text>
          </View>
        ) : (
          items.map((it) => {
            const isFollow = it.kind === 'follow' && !!it.user;
            const followingBack = isFollow && following.includes(it.user!.id);
            return (
              <View key={it.id} style={styles.row}>
                <Avatar user={it.user} size={40} />
                <View style={{ flex: 1, marginLeft: space.sm }}>
                  <View style={styles.lineRow}>
                    <Text style={styles.line}>{lineFor(it)}</Text>
                    {it.user?.isOfficial && <VerifiedBadge size={13} />}
                  </View>
                  <Text style={styles.time}>{timeAgo(it.at)}</Text>
                </View>
                {isFollow ? (
                  <Pressable
                    onPress={() => toggleFollow(it.user!.id)}
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
                ) : it.postImage ? (
                  <Image source={{ uri: it.postImage }} style={styles.thumb} resizeMode="cover" />
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
  lineRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  line: { color: colors.text, fontSize: font.body, fontWeight: '700', fontFamily: fonts.ui },
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
