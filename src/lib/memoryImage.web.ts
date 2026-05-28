// Web版：圧縮済み画像は data: URL なので、そのまま AsyncStorage に残れば永続する。
// 端末ファイルへの複製は不要（ファイルシステムも無い）。失敗概念も無いので素通し。
export async function persistMemoryImage(uri: string): Promise<string> {
  return uri;
}

// 退会／デモリセット時の後片付け。Web は何もしない。
export async function clearMemoryImages(): Promise<void> {}
