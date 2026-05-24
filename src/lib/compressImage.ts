import { Platform } from 'react-native';

// 投稿前に画像を縮小＋再エンコードして「保存も配信も軽く」する（サーバー費用対策 #1）。
// napsnap は“生活の痕跡”＋チェキで小さく出す前提なので、強めに縮小しても体感は落ちない。
// 現状は Web デモが対象（canvas で完結・追加依存なし）。ネイティブは将来 expo-image-manipulator に差し替え予定。

const MAX_EDGE = 1080; // 長辺の上限
const QUALITY = 0.72; // WebP/JPEG の品質

// 失敗時は必ず元の uri を返す（投稿フローを止めない）。
export async function compressForStore(uri: string): Promise<string> {
  if (Platform.OS !== 'web') return uri; // ネイティブは今は素通し（TODO: expo-image-manipulator）
  const g: any = globalThis;
  const doc = g?.document;
  if (!doc || typeof g.Image === 'undefined') return uri;

  try {
    const img: HTMLImageElement = await loadImage(uri);
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) return uri;

    const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
    const tw = Math.max(1, Math.round(w * scale));
    const th = Math.max(1, Math.round(h * scale));

    const canvas = doc.createElement('canvas');
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext('2d');
    if (!ctx) return uri;
    ctx.drawImage(img, 0, 0, tw, th);

    // WebP 優先、ダメなら JPEG。toDataURL が tainted で失敗したら元のまま。
    let out = canvas.toDataURL('image/webp', QUALITY);
    if (!out || !out.startsWith('data:image/webp')) {
      out = canvas.toDataURL('image/jpeg', QUALITY);
    }
    // 圧縮で逆に増える稀なケースは元を使う
    if (out && out.length > 0 && (uri.startsWith('data:') ? out.length < uri.length : true)) {
      return out;
    }
    return uri;
  } catch {
    return uri;
  }
}

function loadImage(uri: string): Promise<HTMLImageElement> {
  const g: any = globalThis;
  return new Promise((resolve, reject) => {
    const img: HTMLImageElement = new g.Image();
    // リモート画像でも canvas を汚染させないため（CORS 不可なら catch で元に戻る）
    if (!uri.startsWith('data:') && !uri.startsWith('blob:')) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = uri;
  });
}
