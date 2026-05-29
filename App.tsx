import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { setAudioModeAsync } from 'expo-audio';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ResponsiveFrame } from './src/components/ResponsiveFrame';
import { RootNavigator } from './src/navigation/RootNavigator';
import { initAds } from './src/lib/ads';
import { loadWebFonts } from './src/lib/fonts';
import { themeMode } from './src/theme';
import { ADS_ENABLED } from './src/config';

export default function App() {
  useEffect(() => {
    // こだわりの書体（Web）を読み込む
    loadWebFonts();
    // マナーモードでも痕跡の音が鳴るようにしておく
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    // AdMob SDK 初期化（ネイティブのみ。Web は no-op）。広告オフの間は呼ばない＝広告IDも収集しない。
    if (ADS_ENABLED) initAds();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <ResponsiveFrame>
        <RootNavigator />
      </ResponsiveFrame>
    </SafeAreaProvider>
  );
}
