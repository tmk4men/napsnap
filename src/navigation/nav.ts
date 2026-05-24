export type TabKey = 'home' | 'kept' | 'me';

// アプリ内ナビゲーション（URLルーティングは使わず、状態でオーバーレイを出し分ける）。
// これにより Web 書き出しが単一の index.html になり GitHub Pages に置きやすい。
export interface Nav {
  setTab: (t: TabKey) => void;
  openCamera: () => void;
  openFeed: () => void;
  closeOverlay: () => void;
  onCaptured: (uri: string, audioUri?: string) => void; // カメラ（写真＋2.5秒音声）→ プレビュー
  onPosted: () => void; // プレビューで投稿 → フィードへ
}
