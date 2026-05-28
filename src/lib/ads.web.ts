// AdMob ラッパ（Web スタブ）。Web デモでは広告は実行しない。
// Metro は Platform 別ファイル（`.web.ts` / `.native.ts`）を自動で選ぶので、
// Web バンドルには `react-native-google-mobile-ads` 本体が含まれない。

export const adUnitIds = { banner: '', native: '', rewarded: '' };
export const usingTestAds = true;

export async function initAds(): Promise<void> {
  /* no-op on web */
}

// Web デモでは「視聴完了したことにして」即時 true を返す（体験を止めない）。
export async function showRewardedAd(): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return true;
}
