import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, space } from '../theme';
import { copy, PASS_HOURS } from '../copy';
import { GhostButton, PrimaryButton } from '../components/ui';
import { Nav } from '../navigation/nav';
import { useStore } from '../store';

export function PreviewScreen({ uri, nav }: { uri: string; nav: Nav }) {
  const insets = useSafeAreaInsets();
  const addPost = useStore((s) => s.addPost);

  function post() {
    addPost(uri);
    nav.onPosted();
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + space.md }]}>
      <Text style={styles.heading}>この1枚を出す？</Text>
      <View style={styles.imageWrap}>
        <Image source={{ uri }} style={styles.image} resizeMode="cover" />
      </View>
      <Text style={styles.note}>
        出すと、{PASS_HOURS}時間だけ友達の痕跡がひらく。{'\n'}投稿は24時間で消える。
      </Text>
      <View style={{ paddingBottom: insets.bottom + space.md, gap: space.xs }}>
        <PrimaryButton label={copy.post} onPress={post} />
        <GhostButton label={copy.retake} onPress={nav.openCamera} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black, paddingHorizontal: space.lg },
  heading: {
    color: colors.white,
    fontSize: font.title,
    fontWeight: '900',
    marginBottom: space.md,
  },
  imageWrap: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  image: { width: '100%', height: '100%' },
  note: {
    color: colors.gray,
    fontSize: font.body,
    textAlign: 'center',
    lineHeight: font.body * 1.6,
    paddingVertical: space.lg,
  },
});
