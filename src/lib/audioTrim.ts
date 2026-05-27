// 録音した音声ファイルを [startSec, endSec] に切り出す。
// 実装は audioTrim.web.ts と audioTrim.native.ts に分かれている。
// Metro は拡張子で適切な実装を選ぶ＝Webバンドルにネイティブモジュールの呼び出しは入らない。
// このベースファイルは TypeScript が型解決に使うだけで、実行時は呼ばれない。

export interface TrimResult {
  uri: string;
  durationMs: number;
  mimeType: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function trimAudio(_sourceUri: string, _startSec: number, _endSec: number): Promise<TrimResult> {
  throw new Error('audioTrim base implementation called — platform-specific file missing');
}
