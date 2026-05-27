import { requireNativeModule } from 'expo-modules-core';

// requireNativeModule は Web で実行すると失敗するので、遅延評価で取得する。
// 呼び出し側は Platform.OS で分岐してネイティブのときだけ呼ぶ前提。
let _native: any = null;
function getNative() {
  if (!_native) _native = requireNativeModule('AudioTrimModule');
  return _native;
}

export interface TrimAudioResult {
  uri: string;
  durationMs: number;
  mimeType: string;
}

export async function trimAudio(
  sourceUri: string,
  startSec: number,
  endSec: number
): Promise<TrimAudioResult> {
  return await getNative().trimAudio(sourceUri, startSec, endSec);
}

export default { trimAudio };
