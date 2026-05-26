// Web（GitHub Pages デモ）は push 非対応のため no-op。push.ts と同じ形だけ揃える。
// Metro は web で push.ts ではなくこちらを使う＝expo-notifications を web バンドルに含めない。
export async function registerPush(): Promise<void> {}

export function setupPushHandlers(_onActivate: () => void): () => void {
  return () => {};
}
