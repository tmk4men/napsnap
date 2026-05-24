import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const AVATAR_SIZE = 256;

// プロフィール画像をライブラリから1枚選ぶ。
// Web では picker が blob: URL を返し、これは reload で失効する（localStorage に残せない）。
// そのため Web では正方形にトリミング＋縮小して data URL 化し、再読込後も残るようにする。
export async function pickAvatarImage(): Promise<string | null> {
  try {
    await ImagePicker.requestMediaLibraryPermissionsAsync();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: Platform.OS !== 'web', // Web はトリミングUI非対応
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.length) return null;
    const asset = result.assets[0];

    if (Platform.OS === 'web') {
      const persistable = await toSquareDataUrl(asset.uri, AVATAR_SIZE);
      return persistable ?? asset.uri;
    }
    return asset.uri;
  } catch {
    return null;
  }
}

// Web 専用：画像URIを中央正方形クロップ→size×sizeに縮小し、JPEGのdata URLにする。
function toSquareDataUrl(srcUri: string, size: number): Promise<string | null> {
  return new Promise((resolve) => {
    const g: any = globalThis;
    if (!g?.document || !g?.Image) return resolve(null);
    try {
      const img = new g.Image();
      img.onload = () => {
        try {
          const canvas = g.document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(null);
          const s = Math.min(img.width, img.height);
          const sx = (img.width - s) / 2;
          const sy = (img.height - s) / 2;
          ctx.drawImage(img, sx, sy, s, s, 0, 0, size, size);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = srcUri;
    } catch {
      resolve(null);
    }
  });
}
