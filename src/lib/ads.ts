// AdMob ラッパ（ネイティブ実装）。Web は ads.web.ts が選ばれる。
// テスト広告 ID（Google 公式の常時テスト用）。Play 提出前に PROD 定数を埋めて差し替える。
import { Platform } from 'react-native';
import mobileAds, { AdEventType, RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads';

const TEST_BANNER_ANDROID = 'ca-app-pub-3940256099942544/6300978111';
const TEST_BANNER_IOS = 'ca-app-pub-3940256099942544/2934735716';
const TEST_NATIVE_ANDROID = 'ca-app-pub-3940256099942544/2247696110';
const TEST_NATIVE_IOS = 'ca-app-pub-3940256099942544/3986624511';
const TEST_REWARDED_ANDROID = 'ca-app-pub-3940256099942544/5224354917';
const TEST_REWARDED_IOS = 'ca-app-pub-3940256099942544/1712485313';

function pickByPlatform(android: string, ios: string): string {
  return Platform.OS === 'ios' ? ios : android;
}

// プロダクション用 ID。空文字なら未設定＝テスト ID を使う。Play / App Store 提出時に埋める。
const PROD_BANNER_ANDROID = '';
const PROD_BANNER_IOS = '';
const PROD_NATIVE_ANDROID = '';
const PROD_NATIVE_IOS = '';
const PROD_REWARDED_ANDROID = '';
const PROD_REWARDED_IOS = '';

export const adUnitIds = {
  banner: pickByPlatform(PROD_BANNER_ANDROID || TEST_BANNER_ANDROID, PROD_BANNER_IOS || TEST_BANNER_IOS),
  native: pickByPlatform(PROD_NATIVE_ANDROID || TEST_NATIVE_ANDROID, PROD_NATIVE_IOS || TEST_NATIVE_IOS),
  rewarded: pickByPlatform(PROD_REWARDED_ANDROID || TEST_REWARDED_ANDROID, PROD_REWARDED_IOS || TEST_REWARDED_IOS),
};

export const usingTestAds =
  !PROD_BANNER_ANDROID || !PROD_BANNER_IOS || !PROD_NATIVE_ANDROID || !PROD_NATIVE_IOS || !PROD_REWARDED_ANDROID || !PROD_REWARDED_IOS;

export async function initAds(): Promise<void> {
  try {
    await mobileAds().initialize();
  } catch (e) {
    console.warn('[ads] initialize failed', e);
  }
}

// 報酬型広告の表示。Promise<boolean>＝報酬獲得したか。
// アバター画像変更ゲート（[[napsnap-avatar-ad-gate]]）で使う想定。
export async function showRewardedAd(): Promise<boolean> {
  try {
    const ad = RewardedAd.createForAdRequest(adUnitIds.rewarded, {
      requestNonPersonalizedAdsOnly: false,
    });
    return await new Promise<boolean>((resolve) => {
      let gotReward = false;
      const offLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        ad.show();
      });
      const offReward = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        gotReward = true;
      });
      const offClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
        offLoaded?.();
        offReward?.();
        offClosed?.();
        resolve(gotReward);
      });
      const offError = ad.addAdEventListener(AdEventType.ERROR, () => {
        offLoaded?.();
        offReward?.();
        offClosed?.();
        offError?.();
        resolve(false);
      });
      ad.load();
    });
  } catch (e) {
    console.warn('[ads] showRewardedAd failed', e);
    return false;
  }
}
