// プッシュ通知（ネイティブ）。段階2＝常時ポーリングの置き換え。
// 端末のExpo pushトークンを取得してサーバーに保存し、通知の受信/タップで最新を取り込む。
// ※ Web では push.web.ts（no-op）が使われる（GitHub Pages デモは push 非対応）。
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as be from './backend';

// 前面で通知が来た時の表示挙動（SDK56＝shouldShowBanner/List）。
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// 端末の push トークンを取得 → サーバー（push_tokens）に保存。許可が無ければ何もしない。
export async function registerPush(): Promise<void> {
  try {
    let status = (await Notifications.getPermissionsAsync()).status;
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return;
    // projectId は EAS の設定（app.json の extra.eas.projectId / EAS ビルド時に注入）。
    // 未設定だとトークン取得に失敗するので、その時は静かに諦める（devビルド前提）。
    const projectId =
      (Constants as any)?.expoConfig?.extra?.eas?.projectId ?? (Constants as any)?.easConfig?.projectId;
    const tokenResp = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    if (tokenResp?.data) await be.upsertPushToken(tokenResp.data, Platform.OS);
  } catch (e) {
    console.warn('registerPush failed', e);
  }
}

// 通知の受信/タップで最新を取り込む。返り値で解除する。
export function setupPushHandlers(onActivate: () => void): () => void {
  const a = Notifications.addNotificationReceivedListener(() => onActivate());
  const b = Notifications.addNotificationResponseReceivedListener(() => onActivate());
  return () => {
    a.remove();
    b.remove();
  };
}
