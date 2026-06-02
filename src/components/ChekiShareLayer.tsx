import React, { useRef, useState } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { colors } from '../theme';
import { captionFont, fonts } from '../lib/fonts';
import { Post } from '../types';
import { useStore } from '../store';
import { NAPSNAP_URL, shareCheki, ShareResult } from '../lib/share';

// 外部シェア用にチェキ画像を生成して共有する（ネイティブ）。
// 透かし＝フッタに「napsnap」＋投稿者の @ID（＝ディープリンクの手がかり）を焼き込む。
// Web は既存の canvas 実装（lib/share.shareCheki）に委譲する。
// 使い方：const { share, ShareLayer } = useChekiShare(); ボタンで share(post)、JSXに {ShareLayer} を置く。
export function useChekiShare() {
  const users = useStore((s) => s.users);
  const myId = useStore((s) => s.currentUserId);
  const [target, setTarget] = useState<Post | null>(null);
  const viewRef = useRef<View>(null);
  const resolveRef = useRef<((r: ShareResult) => void) | null>(null);

  const handleOf = (post: Post): string => {
    const u = users.find((x) => x.id === post.userId) ?? users.find((x) => x.id === myId);
    return u?.handle ? `@${u.handle}` : 'napsnap';
  };

  const share = (post: Post): Promise<ShareResult> => {
    if (Platform.OS === 'web') return shareCheki(post, handleOf(post));
    return new Promise<ShareResult>((resolve) => {
      resolveRef.current = resolve;
      setTarget(post);
    });
  };

  // オフスクリーンに描いたチェキを、写真の読み込み完了後にキャプチャして共有。
  const captureAndShare = async () => {
    const done = (r: ShareResult) => {
      resolveRef.current?.(r);
      resolveRef.current = null;
      setTarget(null);
    };
    try {
      // レイアウト確定を待ってからキャプチャ。
      await new Promise((r) => setTimeout(r, 60));
      const uri = await captureRef(viewRef, { format: 'png', quality: 1, result: 'tmpfile' });
      const can = await Sharing.isAvailableAsync();
      if (!can) return done('none');
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'napsnap' });
      done('shared');
    } catch {
      done('none');
    }
  };

  const ShareLayer = target ? (
    <View style={styles.offscreen} pointerEvents="none" collapsable={false}>
      <View ref={viewRef} collapsable={false}>
        <ShareChekiCard post={target} handle={handleOf(target)} onPhotoReady={captureAndShare} />
      </View>
    </View>
  ) : null;

  return { share, ShareLayer };
}

// シェア用チェキ（固定720px）。frame→写真→キャプション/日付→napsnap透かし。
function ShareChekiCard({ post, handle, onPhotoReady }: { post: Post; handle: string; onPhotoReady: () => void }) {
  const W = 720;
  const frame = Math.round(W * 0.035);
  const photoW = W - frame * 2;
  const photoH = Math.round(photoW * 1.12);
  const stripH = Math.round(W * 0.2);
  const f = captionFont(post.caption?.fontKey ?? 'hand');
  const fontSize = Math.max(28, Math.round(W * 0.06));
  const d = new Date(post.createdAt);
  const stamp = `${d.getMonth() + 1}.${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const uri = post.memoryUri ?? post.imageUrl;

  return (
    <View style={[styles.card, { width: W, padding: frame }]}>
      <Image
        source={{ uri }}
        style={{ width: photoW, height: photoH, backgroundColor: colors.surfaceMedia }}
        resizeMode="cover"
        onLoad={onPhotoReady}
        onError={onPhotoReady}
      />
      <View style={styles.cut} />
      <View style={[styles.strip, { minHeight: stripH }]}>
        {!!post.caption?.text && (
          <Text style={[styles.caption, { fontFamily: f.family, fontWeight: f.weight, fontSize }]} numberOfLines={1}>
            {post.caption.text}
          </Text>
        )}
        <Text style={styles.date}>{stamp}</Text>
      </View>
      {/* 透かし（ディープリンクの手がかり）：napsnap ・ @ID ＋ URL */}
      <View style={styles.footer}>
        <Text style={styles.brand}>nap<Text style={styles.brandAccent}>s</Text>nap</Text>
        <Text style={styles.handle}>{handle}</Text>
        <Text style={styles.url}>{NAPSNAP_URL.replace(/^https?:\/\//, '')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // 画面外に置いて見せずにレイアウト・キャプチャする。
  offscreen: { position: 'absolute', left: -10000, top: 0, opacity: 0 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 2 },
  cut: { height: 1, backgroundColor: 'rgba(0,0,0,0.12)', marginTop: 6 },
  strip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, paddingVertical: 8 },
  caption: { flex: 1, textAlign: 'center', color: '#0F0F0F' },
  date: { position: 'absolute', right: 4, bottom: 8, color: '#9C9C9C', fontSize: 20, fontFamily: fonts.handle },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 8, paddingBottom: 10 },
  brand: { fontSize: 30, fontFamily: fonts.brand, color: '#0F0F0F', includeFontPadding: false },
  brandAccent: { color: '#9BBF3B' },
  handle: { fontSize: 18, fontFamily: fonts.handle, color: '#5A5A5A' },
  url: { fontSize: 16, fontFamily: fonts.handle, color: '#9C9C9C' },
});
