import { Image, Platform } from 'react-native';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

// 投稿前に画像を縮小＋再エンコードして「保存も配信も軽く」する（サーバー費用対策 #1）。
// napsnap は“生活の痕跡”＋チェキで小さく出す前提なので、強めに縮小しても体感は落ちない。
// Web=canvas で WebP/JPEG、ネイティブ=expo-image-manipulator で JPEG
// （iOS は WebP エンコード非対応のため、ネイティブは確実に通る JPEG にする）。

const MAX_EDGE = 1080; // 長辺の上限
const QUALITY = 0.72; // 0.0〜1.0（1=無圧縮）

// 失敗時は必ず元の uri を返す（投稿フローを止めない）。
export async function compressForStore(uri: string): Promise<string> {
  return Platform.OS === 'web' ? compressWeb(uri) : compressNative(uri);
}

// ---- ネイティブ：expo-image-manipulator で長辺1080に縮小＋JPEG再エンコード ----
async function compressNative(uri: string): Promise<string> {
  try {
    const { width, height } = await getSize(uri);
    const ctx = ImageManipulator.manipulate(uri);
    if (width && height) {
      const scale = Math.min(1, MAX_EDGE / Math.max(width, height)); // 拡大はしない（縮小のみ）
      if (scale < 1) {
        ctx.resize({ width: Math.round(width * scale), height: Math.round(height * scale) });
      }
    }
    const image = await ctx.renderAsync();
    const result = await image.saveAsync({ compress: QUALITY, format: SaveFormat.JPEG });
    return result.uri || uri;
  } catch {
    return uri;
  }
}

// 端末の画像の元サイズを取得（縮小率の計算用）。取れなければ 0 を返して素通し。
function getSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      () => resolve({ width: 0, height: 0 })
    );
  });
}

// ---- Web：canvas で完結（追加依存なし）----
async function compressWeb(uri: string): Promise<string> {
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
