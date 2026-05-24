import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { setAudioModeAsync } from 'expo-audio';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ResponsiveFrame } from './src/components/ResponsiveFrame';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  useEffect(() => {
    // マナーモードでも痕跡の音が鳴るようにしておく
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <ResponsiveFrame>
        <RootNavigator />
      </ResponsiveFrame>
    </SafeAreaProvider>
  );
}
