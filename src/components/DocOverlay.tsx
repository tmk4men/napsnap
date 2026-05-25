import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, space } from '../theme';
import { fonts } from '../lib/fonts';
import { FadeIn } from './ui';
import { Backdrop } from './Backdrop';
import { CloseIcon } from './icons';
import { LegalDoc } from '../legal';

// プライバシーポリシー / 利用規約などの長文を読むためのオーバーレイ。
export function DocOverlay({ doc, onClose }: { doc: LegalDoc; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <FadeIn style={styles.container} dy={16} duration={220}>
      <Backdrop />
      <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
        <Text style={styles.title}>{doc.title}</Text>
        <Pressable onPress={onClose} style={styles.close} hitSlop={12}>
          <CloseIcon size={18} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: space.lg, paddingBottom: insets.bottom + space.xl }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.updated}>最終更新：{doc.updated}</Text>
        {doc.intro ? <Text style={styles.intro}>{doc.intro}</Text> : null}
        {doc.sections.map((s, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.heading}>{s.heading}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>
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
  title: { color: colors.text, fontSize: font.title, fontWeight: '800', fontFamily: fonts.serif, letterSpacing: 0.4 },
  close: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSunken },
  updated: { color: colors.textFaint, fontSize: font.small, fontWeight: '700', fontFamily: fonts.ui, marginBottom: space.md },
  intro: { color: colors.textDim, fontSize: font.body, lineHeight: font.body * 1.8, fontFamily: fonts.ui, marginBottom: space.lg },
  section: { marginBottom: space.lg },
  heading: { color: colors.text, fontSize: font.lead, fontWeight: '800', fontFamily: fonts.serif, letterSpacing: 0.2, marginBottom: space.xs },
  body: { color: colors.textDim, fontSize: font.body, lineHeight: font.body * 1.85, fontFamily: fonts.ui },
});
