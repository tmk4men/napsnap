// Web版：圧縮済み画像は data: URL なので、そのまま AsyncStorage に残れば永続する。
// 端末ファイルへの複製は不要（ファイルシステムも無い）。失敗概念も無いので素通し。
export async function persistMemoryImage(uri: string): Promise<string> {
  return uri;
}

// Web は data: URL がそのまま永続するので「ローカルの思い出か」は常に真として扱う。
export function isLocalMemoryUri(uri?: string): boolean {
  return !!uri && uri.startsWith('data:');
}

// Web ではリモートURLのローカル保存はできない（CORS/容量）。バックフィルは諦めて undefined。
export async function downloadMemoryImage(_url: string): Promise<string | undefined> {
  return undefined;
}

// 投稿削除時の後片付け。Web は data: URL を store ごと消すので、ファイル削除は不要＝素通し。
export function deleteMemoryImage(_uri?: string): void {}

// 退会／デモリセット時の後片付け。Web は何もしない。
export async function clearMemoryImages(): Promise<void> {}
