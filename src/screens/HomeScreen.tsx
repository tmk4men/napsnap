import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, shadow, space } from '../theme';
import { fonts } from '../lib/fonts';
import { copy } from '../copy';
import { Avatar, GhostButton, PrimaryButton, Remaining, useTick } from '../components/ui';
import { CameraIcon } from '../components/icons';
import { Nav } from '../navigation/nav';
import { useStore } from '../store';
import { currentUser, feedQueue, isPassOpen, userById } from '../selectors';

export function HomeScreen({ nav }: { nav: Nav }) {
  const insets = useSafeAreaInsets();
  useTick();

  const s = useStore();
  const open = isPassOpen(s);
  const queue = useMemo(
    () => feedQueue(s),
    [s.posts, s.feedStates, s.following, s.currentUserId]
  );
  const count = queue.length;
  const latest = queue[0];
  const me = currentUser(s);
  const heroAuthor = userById(s.users, latest?.userId);

  // ロック中：相手画像をモザイク。オープン中で投稿あり：そのまま最新を出して「最初から誰かの投稿」を見せる。
  const mediaMode = !open && !!latest; // ぼかし
  const openHero = open && count > 0 && !!latest; // くっきり
  const showImage = mediaMode || openHero;
  const onPhoto = showImage;
  const textColor = onPhoto ? colors.onMedia : colors.text;
  const dimColor = onPhoto ? colors.onMediaDim : colors.textDim;
  const metaColor = onPhoto ? colors.onMedia : colors.text;

  return (
    <View style={[styles.container, showImage && { backgroundColor: colors.surfaceMedia }]}>
      {showImage && (
        <>
          <Image
            source={{ uri: latest.imageUrl }}
            style={StyleSheet.absoluteFill}
            blurRadius={mediaMode ? 28 : 0}
            resizeMode="cover"
          />
          <View style={styles.scrim} />
        </>
      )}

      {/* ヘッダー */}
      <View style={[styles.header, { paddingTop: insets.top + space.md }]}>
        <Text style={[styles.brand, { color: textColor }]}>napsnap</Text>
        <View style={styles.headerRight}>
          <Pressable
            onPress={nav.openCamera}
            style={[styles.camBtn, onPhoto ? styles.camBtnMedia : styles.camBtnLight]}
            hitSlop={10}
          >
            <CameraIcon size={20} color={textColor} />
          </Pressable>
          <Avatar user={me} size={36} />
        </View>
      </View>

      {/* 中央 */}
      <View style={styles.center}>
        {open ? (
          count > 0 ? (
            <>
              {heroAuthor && (
                <View style={styles.heroWho}>
                  <Avatar user={heroAuthor} size={32} />
                  <Text style={styles.heroWhoText}>{heroAuthor.displayName} たちの今</Text>
                </View>
              )}
              <Remaining expiresAt={s.accessPass!.expiresAt} color={metaColor} size={15} />
            </>
          ) : (
            <>
              <Text style={[styles.big, { color: textColor }]}>{copy.allSeenTitle}</Text>
              <View style={{ height: space.md }} />
              <Remaining expiresAt={s.accessPass!.expiresAt} color={metaColor} size={15} />
            </>
          )
        ) : latest ? (
          <>
            <View style={styles.lockChip}>
              <View style={styles.lockDot} />
              <Text style={styles.lockChipText}>{copy.revealChip}</Text>
            </View>
            <Text style={[styles.big, { color: textColor }]}>{copy.lockedHeadline}</Text>
            <Text style={[styles.sub, { color: dimColor }]}>{copy.lockedSub}</Text>
          </>
        ) : (
          <>
            <Text style={[styles.big, { color: textColor }]}>{copy.lockedEmpty}</Text>
          </>
        )}
      </View>

      {/* 下部CTA */}
      <View style={{ paddingHorizontal: space.lg, paddingBottom: insets.bottom + space.md }}>
        {open ? (
          count > 0 ? (
            <PrimaryButton label={copy.see} onPress={nav.openFeed} />
          ) : (
            <GhostButton label={copy.shoot} onPress={nav.openCamera} />
          )
        ) : (
          <PrimaryButton label={copy.shoot} onPress={nav.openCamera} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.34)' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.lg,
  },
  brand: { fontSize: 25, fontWeight: '700', letterSpacing: 0.5, fontFamily: fonts.brand },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  camBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  camBtnLight: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.hairline },
  camBtnMedia: { backgroundColor: colors.mediaChip, borderWidth: 1, borderColor: colors.mediaChipBorder },
  center: { flex: 1, justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: space.lg },
  heroWho: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginBottom: space.md },
  heroWhoText: { color: colors.onMedia, fontSize: font.body, fontWeight: '800' },
  big: { fontSize: font.display, fontWeight: '900', lineHeight: 58, fontFamily: fonts.display },
  sub: { fontSize: font.lead, marginTop: space.md, lineHeight: font.lead * 1.5 },
  lockChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.lime,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: space.lg,
    boxShadow: shadow.button,
  },
  lockDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.limeInk },
  lockChipText: { color: colors.limeInk, fontSize: font.small, fontWeight: '900', letterSpacing: 0.3 },
});
