import { Platform, Share } from 'react-native';

// napsnap の Web デモ公開URL（自分のIDと一緒に他サイトへ貼る用）。
export const NAPSNAP_URL = 'https://tmk4men.github.io/napsnap/';

// 他サイトに貼る招待文。自分の@IDと「一緒にやろう」の誘い文句。
export function buildInvite(handle: string): { message: string; full: string } {
  const id = handle ? `@${handle}` : '';
  const message =
    `napsnap やってる。顔を出さない、24時間で消える日常SNS。\n` +
    (id ? `${id} をさがして、一緒にやろう。\n` : '一緒にやろう。\n') +
    NAPSNAP_URL;
  return { message, full: message };
}

export type ShareResult = 'shared' | 'copied' | 'none';

// 招待文を共有する。Web は OS 共有シート（無ければクリップボードにコピー）、
// ネイティブは標準の共有シート。
export async function shareInvite(handle: string): Promise<ShareResult> {
  const { message } = buildInvite(handle);

  if (Platform.OS === 'web') {
    const navAny: any = (globalThis as any).navigator;
    if (navAny?.share) {
      try {
        await navAny.share({ title: 'napsnap', text: message, url: NAPSNAP_URL });
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
