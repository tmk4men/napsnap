import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

// プロフィール画像をライブラリから1枚選び、生のURIを返す。
// ネイティブは OS のトリミングUI（allowsEditing）で範囲を選べる。
// Web はトリミングUIが無いので、呼び出し側で CropModal を出して範囲を選ばせる。
export async function pickRawImage(): Promise<string | null> {
  try {
    await ImagePicker.requestMediaLibraryPermissionsAsync();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: Platform.OS !== 'web',
      aspect: [1, 1],
      quality: 0.9,
    });
    if (result.canceled || !result.assets?.length) return null;
    return result.assets[0].uri;
  } catch {
    return null;
  }
}
