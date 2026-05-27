// ネイティブ実装：ローカル Expo Module（modules/napsnap-audio-trim）に委譲。
// iOS は AVAssetExportSession、Android は MediaExtractor+MediaMuxer で切り出す。
// EAS Build か prebuild 後の dev client でないと autolink されないので、
// 失敗時は分かりやすいエラーに包む。
import { trimAudio as nativeTrim } from '../../modules/napsnap-audio-trim';
import type { TrimResult } from './audioTrim';

export async function trimAudio(sourceUri: string, startSec: number, endSec: number): Promise<TrimResult> {
  if (endSec <= startSec) throw new Error('trimAudio: endSec must be > startSec');
  try {
    return await nativeTrim(sourceUri, startSec, endSec);
  } catch (e: any) {
    throw new Error(`audio trim failed: ${e?.message ?? String(e)}`);
  }
}
