import { Platform, Share } from 'react-native';

// napsnap の Web デモ公開URL（自分のIDと一緒に他サイトへ貼る用）。
export const NAPSNAP_URL = 'https://tmk4men.github.io/napsnap/';

// 他サイトに貼る招待文。本文（URLなし）と URL を分けて持つ。
export function buildInvite(handle: string): { body: string; url: string; message: string } {
  const id = handle ? `@${handle}` : '';
  const body =
    `napsnap やってる。顔を出さない、24時間で消える日常SNS。\n` +
    (id ? `${id} をさがして、一緒にやろう。` : '一緒にやろう。');
  // クリップボード/ネイティブ用：本文＋URL を1回だけ。
  const message = `${body}\n${NAPSNAP_URL}`;
  return { body, url: NAPSNAP_URL, message };
}

export type ShareResult = 'shared' | 'copied' | 'none';

// 招待文を共有する。Web は OS 共有シート（無ければクリップボードにコピー）、
// ネイティブは標準の共有シート。
export async function shareInvite(handle: string): Promise<ShareResult> {
  const { body, url, message } = buildInvite(handle);

  if (Platform.OS === 'web') {
    const navAny: any = (globalThis as any).navigator;
    if (navAny?.share) {
      try {
        // text には URL を入れない（url と二重になり LINE 等でリンクが2つ出るため）。
        await navAny.share({ title: 'napsnap', text: body, url });
        return 'shared';
      } catch {
        // ユーザーがキャンセル／失敗。クリップボードにフォールバック。
      }
    }
    try {
      if (navAny?.clipboard?.writeText) {
        await navAny.clipboard.writeText(message);
        return 'copied';
      }
    } catch {}
    return 'none';
  }

  try {
    await Share.share({ message });
    return 'shared';
  } catch {
    return 'none';
  }
}
