import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ResponsiveFrame } from './src/components/ResponsiveFrame';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <ResponsiveFrame>
        <RootNavigator />
      </ResponsiveFrame>
    </SafeAreaProvider>
  );
}
