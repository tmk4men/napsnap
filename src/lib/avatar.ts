import * as ImagePicker from 'expo-image-picker';

// プロフィール画像をライブラリから1枚選ぶ。Webでもボタン押下直後に呼べば動く。
// 返り値は選んだ画像のURI。キャンセル時・失敗時は null。
export async function pickAvatarImage(): Promise<string | null> {
  try {
    // ネイティブでは権限が要る（Webでは no-op 同然）。拒否でも一応続行を試みる。
    await ImagePicker.requestMediaLibraryPermissionsAsync();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.length) return null;
    return result.assets[0].uri;
  } catch {
    return null;
  }
}
