import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { setAudioModeAsync } from 'expo-audio';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ResponsiveFrame } from './src/components/ResponsiveFrame';
import { RootNavigator } from './src/navigation/RootNavigator';
import { initAds } from './src/lib/ads';
import { loadWebFonts } from './src/lib/fonts';
import { themeMode } from './src/theme';

export default function App() {
  useEffect(() => {
    // こだわりの書体（Web）を読み込む
    loadWebFonts();
    // マナーモードでも痕跡の音が鳴るようにしておく
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    // AdMob SDK 初期化（ネイティブのみ。Web は no-op）。
    initAds();
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
